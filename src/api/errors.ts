import type { ErrorCode, HttpMethod } from './types';

/**
 * Errors never carry a URL, query, fragment, request body, header or server
 * message. `route` is the OpenAPI path *template* (for example
 * `/households/{household_id}/tasks`), so identifiers cannot leak either.
 */

export type ApiErrorKind =
  /** 400 */
  | 'validation'
  /** 401 on a protected operation: the session is gone. */
  | 'session-expired'
  /** 401 on a public operation (for example rejected credentials). */
  | 'unauthorized'
  /** 403: addressable resource, action not permitted. */
  | 'forbidden'
  /** 404: nonexistent *or* outside the caller's household scope, indistinguishable by design. */
  | 'not-found'
  /** 409 */
  | 'conflict'
  /** 429 */
  | 'rate-limited'
  /** 5xx */
  | 'server'
  /** Any other unexpected status. */
  | 'unexpected'
  /** Transport failure: no HTTP response. */
  | 'network'
  /** The caller aborted. */
  | 'aborted'
  /** A response violated the contract (bad JSON, missing csrf_token...). */
  | 'protocol';

export const SAFE_ERROR_MESSAGES: Record<ApiErrorKind, string> = {
  validation: 'The request was rejected as invalid.',
  'session-expired': 'The session has ended. Sign in again.',
  unauthorized: 'Authentication was rejected.',
  forbidden: 'This action is not permitted.',
  'not-found': 'The requested resource is not available.',
  conflict: 'The request conflicts with the current state.',
  'rate-limited': 'Too many requests. Try again later.',
  server: 'The server could not complete the request.',
  unexpected: 'The request failed unexpectedly.',
  network: 'The server could not be reached.',
  aborted: 'The request was cancelled.',
  protocol: 'The server response was not understood.',
};

export interface ApiErrorInit {
  kind: ApiErrorKind;
  status: number | null;
  code: ErrorCode | null;
  method: HttpMethod;
  route: string;
  fields?: Record<string, string[]> | null;
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;
  /** Contract error code, when the server sent a well-formed `ErrorResponse`. */
  readonly code: ErrorCode | null;
  readonly method: HttpMethod;
  readonly route: string;
  /** Per-field validation messages. Only ever populated for `validation`. */
  readonly fields: Record<string, string[]> | null;

  constructor(init: ApiErrorInit) {
    // The server-provided `message` is intentionally dropped: only fixed text.
    super(SAFE_ERROR_MESSAGES[init.kind]);
    this.name = 'ApiError';
    this.kind = init.kind;
    this.status = init.status;
    this.code = init.code;
    this.method = init.method;
    this.route = init.route;
    this.fields = init.kind === 'validation' ? (init.fields ?? null) : null;
  }

  /** Safe serialization for loggers and error reporters. Excludes `fields`. */
  toJSON() {
    return {
      name: this.name,
      kind: this.kind,
      status: this.status,
      code: this.code,
      method: this.method,
      route: this.route,
    };
  }
}

/** Thrown when `VITE_API_BASE_URL` is unusable. Never echoes the offending value. */
export class ApiConfigError extends Error {
  readonly reason: 'invalid' | 'credentials' | 'query-or-fragment' | 'path' | 'cross-origin';

  constructor(reason: ApiConfigError['reason']) {
    super(`VITE_API_BASE_URL is not usable (${reason}).`);
    this.name = 'ApiConfigError';
    this.reason = reason;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
