import { ApiConfigError } from './errors';

/** The OpenAPI `servers[0].url`: the API lives under this path on the page's own origin. */
export const API_BASE_PATH = '/api/v1';

/**
 * Validates `VITE_API_BASE_URL` and returns the origin prefix to put before
 * `API_BASE_PATH` ('' means "the page's own origin").
 *
 * The default topology is same-origin (ADR-011, security model): the session
 * cookie is HttpOnly and the client never reads cookies, so a cross-origin
 * deployment would need an explicit CORS/credential review first and is
 * refused here rather than half-working.
 *
 * Errors never include the raw value: it may carry credentials by mistake.
 */
export function resolveApiOrigin(raw: string, pageOrigin: string | undefined): string {
  const value = raw.trim();
  if (value === '') return '';

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ApiConfigError('invalid');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new ApiConfigError('invalid');
  if (url.username !== '' || url.password !== '') throw new ApiConfigError('credentials');
  if (url.search !== '' || url.hash !== '' || value.includes('#') || value.includes('?')) {
    throw new ApiConfigError('query-or-fragment');
  }
  // The path is fixed by the contract; a prefix here would silently diverge from it.
  if (url.pathname !== '/') throw new ApiConfigError('path');
  if (url.origin !== pageOrigin) throw new ApiConfigError('cross-origin');
  return url.origin;
}
