import { API_BASE_PATH, resolveApiOrigin } from './baseUrl';
import {
  isErrorCode,
  sanitizeDiagnosticEvent,
  type DiagnosticEvent,
  type DiagnosticsSink,
} from './diagnostics';
import { ApiError, type ApiErrorKind } from './errors';
import type {
  ApiPath,
  ErrorCode,
  HttpMethod,
  NavigationOnlyOperation,
  OperationKey,
  OptionsOf,
  PathsFor,
  ResponseOf,
} from './types';

/**
 * Session/CSRF-aware HTTP client for the HouseHoldHub API.
 *
 * Contract and policy sources: `Documentation/api/openapi.yaml` (types come
 * from `src/contract/`), ADR-011, ADR-014 and `security/security-model.md`.
 *
 * - Auth is the HttpOnly session cookie, sent `same-origin`. The client never
 *   reads, stores or logs cookies.
 * - Every unsafe request, public ones included, carries `X-CSRFToken` taken
 *   from `getCsrfToken` (`GET /auth/csrf`). The token lives in memory only.
 * - Retries are limited to GET (the only safe, idempotent method used by the
 *   contract). Unsafe requests are sent exactly once.
 * - Errors and diagnostics carry the OpenAPI path template, never a URL.
 */

const CSRF_ROUTE = '/auth/csrf' satisfies ApiPath;
const CSRF_HEADER = 'X-CSRFToken';

/**
 * Operations declared `security: []` in the contract. A 401 here means the
 * credentials in the request were rejected (login), not that a session ended.
 */
const PUBLIC_OPERATIONS: ReadonlySet<string> = new Set<OperationKey>([
  'get /auth/csrf',
  'post /auth/signup',
  'post /auth/login',
  'post /auth/email/verify',
  'post /auth/forgot-password',
  'post /auth/reset-password',
  'post /invitations/exchange',
]);

/** Public operations whose success proves a (new) session exists. */
const SESSION_ESTABLISHING: ReadonlySet<string> = new Set<OperationKey>(['post /auth/login', 'post /auth/signup']);

/**
 * Operations that answer with a 302 for the *browser* to follow (OAuth
 * hand-off). They are top-level navigations, not fetch calls, and are excluded
 * from `request` at the type level and refused at runtime.
 */
const NAVIGATION_ONLY_OPERATIONS: ReadonlySet<string> = new Set<NavigationOnlyOperation>([
  'get /auth/google',
  'get /auth/google/callback',
]);

const RETRYABLE_STATUS: ReadonlySet<number> = new Set([502, 503, 504]);

export interface RetryPolicy {
  /** Extra attempts after the first, for GET only. Default 2. */
  maxRetries?: number;
  /** First backoff delay; doubles per retry, with jitter. Default 200 ms. */
  baseDelayMs?: number;
  maxDelayMs?: number;
}

export interface ApiClientConfig {
  /** Raw `VITE_API_BASE_URL`: '' (same origin) or this page's own origin. */
  baseUrl?: string;
  /** Defaults to `location.origin`. */
  pageOrigin?: string;
  fetch?: typeof fetch;
  /** Called (at most once per outage) when a protected request returns 401. */
  onSessionLost?: () => void;
  diagnostics?: DiagnosticsSink;
  retry?: RetryPolicy;
  /** Test seams. */
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
  random?: () => number;
}

type OptionsArgs<M extends HttpMethod, P extends PathsFor<M>> = Record<never, never> extends OptionsOf<P, M>
  ? [options?: OptionsOf<P, M>]
  : [options: OptionsOf<P, M>];

export interface ApiClient {
  request<M extends HttpMethod, P extends PathsFor<M>>(
    method: M,
    path: P,
    ...args: OptionsArgs<M, P>
  ): Promise<ResponseOf<P, M>>;
  /** Drops the cached CSRF token; the next unsafe request bootstraps a new one. */
  invalidateCsrfToken(): void;
}

interface LooseOptions {
  pathParams?: Record<string, unknown>;
  query?: Record<string, unknown>;
  body?: unknown;
  signal?: AbortSignal;
}

const PARSE_FAILED = Symbol('parse-failed');

function defaultSleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(done, ms);
    function done() {
      clearTimeout(timer);
      signal?.removeEventListener('abort', done);
      resolve();
    }
    signal?.addEventListener('abort', done, { once: true });
  });
}

function abortable<T>(promise: Promise<T>, signal: AbortSignal | undefined, onAbort: () => Error): Promise<T> {
  if (!signal) return promise;
  return new Promise<T>((resolve, reject) => {
    const abort = () => reject(onAbort());
    if (signal.aborted) return abort();
    signal.addEventListener('abort', abort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
  });
}

function fillPath(template: string, params: Record<string, unknown> | undefined): string {
  return template.replace(/\{([^}]+)\}/g, (_m, name: string) => {
    const value = params?.[name];
    if (value === undefined || value === null || value === '') {
      // Name only: the template is public, the values are not.
      throw new TypeError(`Missing path parameter "${name}"`);
    }
    return encodeURIComponent(String(value));
  });
}

function buildQuery(query: Record<string, unknown> | undefined): string {
  if (!query) return '';
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    for (const item of Array.isArray(value) ? value : [value]) search.append(key, String(item));
  }
  const text = search.toString();
  return text === '' ? '' : `?${text}`;
}

function kindForStatus(status: number, isPublic: boolean): ApiErrorKind {
  if (status === 400) return 'validation';
  if (status === 401) return isPublic ? 'unauthorized' : 'session-expired';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not-found';
  if (status === 409) return 'conflict';
  if (status === 429) return 'rate-limited';
  if (status >= 500) return 'server';
  return 'unexpected';
}

function readFields(value: unknown): Record<string, string[]> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const out: Record<string, string[]> = {};
  for (const [key, messages] of Object.entries(value)) {
    if (Array.isArray(messages) && messages.every((m) => typeof m === 'string')) {
      out[key] = messages as string[];
    }
  }
  return out;
}

export function createApiClient(config: ApiClientConfig = {}): ApiClient {
  const pageOrigin =
    config.pageOrigin ?? (typeof location === 'undefined' ? undefined : location.origin);
  // Throws ApiConfigError (without echoing the value) on a bad VITE_API_BASE_URL.
  const origin = resolveApiOrigin(config.baseUrl ?? '', pageOrigin);
  const prefix = `${origin}${API_BASE_PATH}`;

  const fetchImpl: typeof fetch = config.fetch ?? ((input, init) => globalThis.fetch(input, init));
  const sleep = config.sleep ?? defaultSleep;
  const random = config.random ?? Math.random;
  const maxRetries = config.retry?.maxRetries ?? 2;
  const baseDelayMs = config.retry?.baseDelayMs ?? 200;
  const maxDelayMs = config.retry?.maxDelayMs ?? 2000;

  function emit(event: DiagnosticEvent) {
    if (!config.diagnostics) return;
    try {
      config.diagnostics(sanitizeDiagnosticEvent(event));
    } catch {
      // A broken sink must never change request behaviour.
    }
  }

  // ---- CSRF state (memory only) -------------------------------------------
  let csrfToken: string | null = null;
  let csrfInFlight: Promise<string> | null = null;
  let csrfGeneration = 0;

  function invalidateCsrfToken(method?: HttpMethod, route?: string) {
    csrfGeneration += 1;
    csrfToken = null;
    csrfInFlight = null;
    emit({ type: 'csrf-invalidated', method, route });
  }

  async function bootstrapCsrf(): Promise<string> {
    emit({ type: 'csrf-bootstrap', method: 'get', route: CSRF_ROUTE });
    const body = await execute('get', CSRF_ROUTE, {}, undefined);
    const token = (body as { csrf_token?: unknown } | undefined)?.csrf_token;
    if (typeof token !== 'string' || token === '') {
      throw fail('get', CSRF_ROUTE, 'protocol', 200, null);
    }
    return token;
  }

  function ensureCsrfToken(): Promise<string> {
    if (csrfToken !== null) return Promise.resolve(csrfToken);
    if (csrfInFlight === null) {
      const generation = csrfGeneration;
      const pending: Promise<string> = bootstrapCsrf()
        .then((token) => {
          // An auth transition during the bootstrap makes this token stale.
          if (generation === csrfGeneration) csrfToken = token;
          return token;
        })
        .finally(() => {
          if (csrfInFlight === pending) csrfInFlight = null;
        });
      csrfInFlight = pending;
    }
    return csrfInFlight;
  }

  // ---- session-loss signalling --------------------------------------------
  let sessionLostSignalled = false;

  function signalSessionLost(method: HttpMethod, route: string) {
    invalidateCsrfToken(method, route);
    if (sessionLostSignalled) return;
    sessionLostSignalled = true;
    emit({ type: 'session-lost', method, route });
    try {
      config.onSessionLost?.();
    } catch {
      // Handler failures must not mask the ApiError the caller receives.
    }
  }

  // ---- request pipeline ---------------------------------------------------
  async function readBody(response: Response): Promise<unknown> {
    try {
      const text = await response.text();
      return text === '' ? undefined : (JSON.parse(text) as unknown);
    } catch {
      return PARSE_FAILED;
    }
  }

  function backoff(retryNumber: number): number {
    const ceiling = Math.min(maxDelayMs, baseDelayMs * 2 ** (retryNumber - 1));
    return Math.round(ceiling / 2 + (random() * ceiling) / 2);
  }

  function fail(
    method: HttpMethod,
    route: string,
    kind: ApiErrorKind,
    status: number | null,
    code: ErrorCode | null,
    fields?: Record<string, string[]> | null,
  ): ApiError {
    emit({
      type: 'error',
      method,
      route,
      status: status ?? undefined,
      errorKind: kind,
      errorCode: code ?? undefined,
    });
    return new ApiError({ kind, status, code, method, route, fields });
  }

  async function execute(
    method: HttpMethod,
    route: string,
    options: LooseOptions,
    csrf: string | undefined,
  ): Promise<unknown> {
    const isUnsafe = method !== 'get';
    const isPublic = PUBLIC_OPERATIONS.has(`${method} ${route}`);
    const url = `${prefix}${fillPath(route, options.pathParams)}${buildQuery(options.query)}`;

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (isUnsafe && csrf !== undefined) headers[CSRF_HEADER] = csrf;

    const init: RequestInit = {
      method: method.toUpperCase(),
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      credentials: 'same-origin',
      cache: 'no-store',
      redirect: 'error',
      referrerPolicy: 'no-referrer',
      signal: options.signal,
    };

    // Only safe, idempotent reads are ever repeated.
    const attempts = isUnsafe ? 1 : maxRetries + 1;

    for (let attempt = 1; ; attempt += 1) {
      if (options.signal?.aborted) throw fail(method, route, 'aborted', null, null);

      let response: Response;
      try {
        response = await fetchImpl(url, init);
      } catch {
        // The thrown value can embed the URL in some runtimes: discard it.
        if (options.signal?.aborted) throw fail(method, route, 'aborted', null, null);
        if (attempt < attempts) {
          emit({ type: 'retry', method, route, attempt });
          await sleep(backoff(attempt), options.signal);
          continue;
        }
        throw fail(method, route, 'network', null, null);
      }

      if (RETRYABLE_STATUS.has(response.status) && attempt < attempts) {
        emit({ type: 'retry', method, route, status: response.status, attempt });
        await sleep(backoff(attempt), options.signal);
        continue;
      }

      emit({ type: 'request', method, route, status: response.status, attempt });
      const body = await readBody(response);

      if (response.ok) {
        if (!isPublic || SESSION_ESTABLISHING.has(`${method} ${route}`)) sessionLostSignalled = false;
        // Login, signup, logout, password/email changes... rotate the session
        // and with it the CSRF secret: never reuse the pre-transition token.
        if (isUnsafe && route.startsWith('/auth/')) invalidateCsrfToken(method, route);
        if (response.status === 204 || response.status === 205) return undefined;
        // Only 204/205 are bodyless; a JSON success status must carry JSON.
        if (body === PARSE_FAILED || body === undefined) throw fail(method, route, 'protocol', response.status, null);
        return body;
      }

      const kind = kindForStatus(response.status, isPublic);
      const errorBody = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
      const code = isErrorCode(errorBody.code) ? errorBody.code : null;
      if (kind === 'session-expired') signalSessionLost(method, route);
      // A 403 on an unsafe call may be a stale CSRF secret. Never replay the
      // write; just make sure the next one starts from a fresh token.
      if (kind === 'forbidden' && isUnsafe) invalidateCsrfToken(method, route);
      throw fail(method, route, kind, response.status, code, kind === 'validation' ? readFields(errorBody.fields) : null);
    }
  }

  async function request(method: HttpMethod, route: string, options: LooseOptions = {}): Promise<unknown> {
    if (NAVIGATION_ONLY_OPERATIONS.has(`${method} ${route}`)) {
      throw new TypeError('This operation is a browser navigation, not an API call.');
    }
    const { signal } = options;
    if (signal?.aborted) throw fail(method, route, 'aborted', null, null);
    // The bootstrap is shared by concurrent callers, so no single caller's
    // signal may cancel it; each caller just stops waiting when its own aborts.
    const csrf =
      method === 'get'
        ? undefined
        : await abortable(ensureCsrfToken(), signal, () => fail(method, route, 'aborted', null, null));
    return execute(method, route, options, csrf);
  }

  return {
    request: request as ApiClient['request'],
    invalidateCsrfToken: () => invalidateCsrfToken(),
  };
}
