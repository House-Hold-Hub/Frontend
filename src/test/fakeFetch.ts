import { vi } from 'vitest';

/**
 * Simulated HTTP layer for API-client tests. Backend#8 does not expose the
 * real CSRF bootstrap yet, so tests run against this fake instead of any
 * production stub endpoint.
 */

export interface RecordedCall {
  method: string;
  url: string;
  /** Path after the `/api/v1` prefix, including any query string. */
  path: string;
  headers: Headers;
  body: string | null;
  init: RequestInit;
}

export type Reply = Response | Error;
export type Handler = (call: RecordedCall, index: number) => Reply | Promise<Reply>;

export function jsonResponse(status: number, body?: unknown, headers: Record<string, string> = {}): Response {
  if (status === 204) return new Response(null, { status });
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

export function errorBody(code: string, message = 'Something happened.', fields?: Record<string, string[]>) {
  return { code, message, ...(fields ? { fields } : {}) };
}

export function createFakeFetch(handler: Handler) {
  const calls: RecordedCall[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input);
    const call: RecordedCall = {
      method: init.method ?? 'GET',
      url,
      path: url.replace(/^.*?\/api\/v1/, ''),
      headers: new Headers(init.headers),
      body: typeof init.body === 'string' ? init.body : null,
      init,
    };
    calls.push(call);
    const reply = await handler(call, calls.length - 1);
    if (reply instanceof Error) throw reply;
    return reply;
  });
  return { fetch: fetchMock as unknown as typeof fetch, calls, fetchMock };
}

/** Handler that serves `/auth/csrf` with successive tokens and delegates the rest. */
export function withCsrf(rest: Handler, tokens: string[] = ['csrf-1', 'csrf-2', 'csrf-3', 'csrf-4']): Handler {
  let issued = 0;
  return (call, index) => {
    if (call.method === 'GET' && call.path === '/auth/csrf') {
      const token = tokens[Math.min(issued, tokens.length - 1)];
      issued += 1;
      return jsonResponse(200, { csrf_token: token }, { 'Cache-Control': 'no-store' });
    }
    return rest(call, index);
  };
}

export const noSleep = () => Promise.resolve();
