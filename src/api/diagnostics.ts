import type { ApiErrorKind } from './errors';
import type { ErrorCode, HttpMethod } from './types';

/**
 * The only shape the API client ever emits to a diagnostics sink. It is an
 * allowlist: no URL, query, fragment, header, cookie, CSRF value, body or
 * server message has a field to travel in, and `sanitizeDiagnosticEvent`
 * re-validates every field so a future code change cannot widen it by accident.
 */
export type DiagnosticEventType =
  | 'request'
  | 'retry'
  | 'csrf-bootstrap'
  | 'csrf-invalidated'
  | 'session-lost'
  | 'error';

export interface DiagnosticEvent {
  type: DiagnosticEventType;
  method?: HttpMethod;
  /** OpenAPI path template, e.g. `/households/{household_id}`. Never a filled-in URL. */
  route?: string;
  status?: number;
  attempt?: number;
  errorKind?: ApiErrorKind;
  errorCode?: ErrorCode;
}

export type DiagnosticsSink = (event: DiagnosticEvent) => void;

const TYPES: ReadonlySet<string> = new Set<DiagnosticEventType>([
  'request',
  'retry',
  'csrf-bootstrap',
  'csrf-invalidated',
  'session-lost',
  'error',
]);
const METHODS: ReadonlySet<string> = new Set<HttpMethod>(['get', 'post', 'put', 'patch', 'delete']);
const KINDS: ReadonlySet<string> = new Set<ApiErrorKind>([
  'validation',
  'session-expired',
  'unauthorized',
  'forbidden',
  'not-found',
  'conflict',
  'rate-limited',
  'server',
  'unexpected',
  'network',
  'aborted',
  'protocol',
]);
const CODES: ReadonlySet<string> = new Set<ErrorCode>([
  'VALIDATION_ERROR',
  'AUTHENTICATION_ERROR',
  'AUTHORIZATION_ERROR',
  'NOT_FOUND',
  'CONFLICT',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
]);
// Path templates only: segments and `{param}` placeholders. No `?`, `#`, `:`, `=`, `.`, `@`.
const ROUTE = /^\/[A-Za-z0-9_\-/{}]*$/;

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === 'string' && CODES.has(value);
}

function isSmallInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < 1000;
}

export function sanitizeDiagnosticEvent(event: DiagnosticEvent): DiagnosticEvent {
  const out: DiagnosticEvent = {
    type: TYPES.has(event.type) ? event.type : 'error',
  };
  if (event.method !== undefined && METHODS.has(event.method)) out.method = event.method;
  if (event.route !== undefined && ROUTE.test(event.route)) out.route = event.route;
  if (isSmallInt(event.status)) out.status = event.status;
  if (isSmallInt(event.attempt)) out.attempt = event.attempt;
  if (event.errorKind !== undefined && KINDS.has(event.errorKind)) out.errorKind = event.errorKind;
  if (event.errorCode !== undefined && CODES.has(event.errorCode)) out.errorCode = event.errorCode;
  return out;
}
