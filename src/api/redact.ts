import { isErrorCode } from './diagnostics';

/**
 * Generic scrubber for anything that might be handed to a logger, telemetry
 * or error-reporting SDK (for example from a `beforeSend` hook). The API
 * client's own diagnostics do not rely on it: they are allowlisted
 * (see `diagnostics.ts`). This is the second layer, for free-form values.
 *
 * Policy (security model, "Logging, telemetry, and error handling"):
 * complete URLs, query strings, fragments, cookies, CSRF values, bearer
 * verifiers, passwords and request bodies never leave the client.
 */

export const REDACTED = '[REDACTED]';
export const REDACTED_URL = '[REDACTED_URL]';
const MAX_DEPTH = 6;

const SENSITIVE_KEY =
  /pass|token|csrf|cookie|session|auth|bearer|verifier|secret|credential|code|state|body|url|uri|href|link|fragment|hash|query|search|email|header/i;

const ABSOLUTE_URL = /\b[a-z][a-z0-9+.-]*:\/\/[^\s"'<>)]+/gi;
// A path/word that carries a query string or a fragment.
const QUERY_OR_FRAGMENT = /\S*[?#]\S+/g;
const BEARER = /\bBearer\s+[^\s"',;]+/gi;
const NAMED_SECRET =
  /\b(x-?csrf-?token|csrf[-_ ]?token|csrftoken|csrf|sessionid|set-cookie|cookie|authorization|verifier|password|passwd|token|secret)(["']?\s*[:=]\s*["']?)[^\s"',;&]+/gi;

export function redactString(input: string): string {
  return input
    .replace(ABSOLUTE_URL, REDACTED_URL)
    .replace(BEARER, `Bearer ${REDACTED}`)
    .replace(NAMED_SECRET, (_m, name: string, sep: string) => `${name}${sep}${REDACTED}`)
    .replace(QUERY_OR_FRAGMENT, REDACTED_URL);
}

function isPlainObject(value: object): value is Record<string, unknown> {
  const proto: unknown = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Returns a structurally-cloned, scrubbed copy. Values under sensitive keys
 * are replaced wholesale; strings are pattern-scrubbed; anything that is not
 * a plain object/array/Error (Request, Headers, URL, FormData...) is dropped.
 */
export function redactSensitive(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return redactString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value !== 'object') return REDACTED; // functions, symbols, bigint
  if (depth >= MAX_DEPTH || seen.has(value)) return REDACTED;
  seen.add(value);

  if (value instanceof Error) {
    const toJSON = (value as { toJSON?: unknown }).toJSON;
    if (typeof toJSON === 'function') {
      return redactSensitive((toJSON as () => unknown).call(value), depth + 1, seen);
    }
    return {
      name: redactString(value.name),
      message: redactString(value.message),
      ...(value.stack ? { stack: redactString(value.stack) } : {}),
    };
  }
  if (Array.isArray(value)) return value.map((item) => redactSensitive(item, depth + 1, seen));
  if (!isPlainObject(value)) return REDACTED;

  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (key === 'code' && isErrorCode(item)) {
      out[key] = item; // contract error enum, not an OAuth/join `code`
    } else {
      out[key] = SENSITIVE_KEY.test(key) ? REDACTED : redactSensitive(item, depth + 1, seen);
    }
  }
  return out;
}
