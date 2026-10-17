import { createApiClient } from '../api';
import { createFakeFetch, jsonResponse, noSleep, withCsrf, type Reply } from './fakeFetch';

export const PAGE_ORIGIN = 'http://localhost:3000';

/**
 * Fake API keyed by `"METHOD /path"`. Each key holds the replies for its
 * successive calls (the last one repeats); `/auth/csrf` is served by `withCsrf`.
 * An unrouted call answers 599 so a test fails loudly instead of hanging.
 */
export function routedApi(routes: Record<string, Reply | Reply[]>) {
  const served: Record<string, number> = {};
  const fake = createFakeFetch(
    withCsrf((call) => {
      const key = `${call.method} ${call.path}`;
      const replies = routes[key];
      if (replies === undefined) return jsonResponse(599, { code: 'INTERNAL_ERROR', message: `unrouted ${key}` });
      const list = Array.isArray(replies) ? replies : [replies];
      const index = served[key] ?? 0;
      served[key] = index + 1;
      // Responses are single-use, so hand out a copy.
      const reply = list[Math.min(index, list.length - 1)];
      return reply instanceof Response ? reply.clone() : reply;
    }),
  );
  const api = createApiClient({ fetch: fake.fetch, pageOrigin: PAGE_ORIGIN, sleep: noSleep });
  return { ...fake, api, requests: () => fake.calls.map((c) => `${c.method} ${c.path}`) };
}

export function delivery(status: 'pending' | 'provider_accepted' | 'failed' | 'unknown') {
  return {
    delivery: {
      id: '7a1f0c2d-0000-4000-8000-000000000001',
      purpose: 'email_verification',
      status,
      created_at: '2026-10-17T10:00:00Z',
      last_attempt_at: '2026-10-17T10:00:00Z',
      provider_accepted_at: status === 'provider_accepted' ? '2026-10-17T10:00:01Z' : null,
    },
  };
}

export function user(overrides: { email?: string; email_verified?: boolean } = {}) {
  return {
    id: '7a1f0c2d-0000-4000-8000-0000000000aa',
    email: 'pat@example.test',
    name: 'Pat',
    email_verified: true,
    google_linked: false,
    created_at: '2026-10-01T10:00:00Z',
    ...overrides,
  };
}
