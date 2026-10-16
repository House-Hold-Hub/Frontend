import { describe, expect, it } from 'vitest';
import { createApiClient } from './client';
import { ApiError } from './errors';
import { createFakeFetch, errorBody, jsonResponse, noSleep, withCsrf } from '../test/fakeFetch';

const HOUSEHOLD = '3f0c2d1e-0000-4000-8000-000000000001';
const TASK = '3f0c2d1e-0000-4000-8000-000000000002';
const PAGE = 'http://localhost:3000';

function setup(rest = () => jsonResponse(200, { ok: true }) as Response | Error) {
  const fake = createFakeFetch(withCsrf(rest));
  const client = createApiClient({ fetch: fake.fetch, pageOrigin: PAGE, sleep: noSleep });
  return { ...fake, client };
}

const login = (client: ReturnType<typeof setup>['client']) =>
  client.request('post', '/auth/login', { body: { email: 'a@example.test', password: 'pw' } });

describe('CSRF bootstrap and X-CSRFToken', () => {
  it('does not bootstrap or send the header for safe requests', async () => {
    const { client, calls } = setup();

    await client.request('get', '/auth/me');

    expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual(['GET /auth/me']);
    expect(calls[0].headers.has('X-CSRFToken')).toBe(false);
  });

  it('bootstraps via getCsrfToken and sends X-CSRFToken on a public unsafe request', async () => {
    const { client, calls } = setup();

    await login(client);

    expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual(['GET /auth/csrf', 'POST /auth/login']);
    expect(calls[1].headers.get('X-CSRFToken')).toBe('csrf-1');
    expect(calls[1].headers.get('Content-Type')).toBe('application/json');
  });

  it('sends the header on every unsafe method of protected operations and reuses one token', async () => {
    const { client, calls } = setup();

    await client.request('post', '/households', { body: { name: 'Home', currency_code: 'EUR' } });
    await client.request('patch', '/households/{household_id}/tasks/{task_id}/complete', {
      pathParams: { household_id: HOUSEHOLD, task_id: TASK },
      body: { completed: true },
    });
    await client.request('delete', '/households/{household_id}/tasks/{task_id}', {
      pathParams: { household_id: HOUSEHOLD, task_id: TASK },
    });

    expect(calls.filter((c) => c.path === '/auth/csrf')).toHaveLength(1);
    const unsafe = calls.filter((c) => c.method !== 'GET');
    expect(unsafe).toHaveLength(3);
    for (const call of unsafe) expect(call.headers.get('X-CSRFToken')).toBe('csrf-1');
  });

  it('bootstraps the token once for concurrent unsafe requests', async () => {
    const { client, calls } = setup();

    await Promise.all([login(client), login(client), login(client)]);

    expect(calls.filter((c) => c.path === '/auth/csrf')).toHaveLength(1);
    expect(calls.filter((c) => c.method === 'POST').every((c) => c.headers.get('X-CSRFToken') === 'csrf-1')).toBe(true);
  });

  it('requests the bootstrap uncached, same-origin and without credentials in the URL', async () => {
    const { client, calls } = setup();

    await login(client);

    const bootstrap = calls[0];
    expect(bootstrap.init.cache).toBe('no-store');
    expect(bootstrap.init.credentials).toBe('same-origin');
    expect(bootstrap.url).toBe('/api/v1/auth/csrf');
  });

  it.each([
    ['login', '/auth/login' as const],
    ['logout', '/auth/logout' as const],
    ['password reset', '/auth/reset-password' as const],
  ])('discards the token after a successful %s transition and re-bootstraps', async (_name, route) => {
    const { client, calls } = setup();

    await client.request('post', route, { body: undefined as never });
    await client.request('post', '/households', { body: { name: 'Home', currency_code: 'EUR' } });

    const posts = calls.filter((c) => c.method === 'POST');
    expect(posts[0].headers.get('X-CSRFToken')).toBe('csrf-1');
    expect(posts[1].headers.get('X-CSRFToken')).toBe('csrf-2');
    expect(calls.filter((c) => c.path === '/auth/csrf')).toHaveLength(2);
  });

  it('keeps the token across successful non-auth writes', async () => {
    const { client, calls } = setup();

    await client.request('post', '/households', { body: { name: 'A', currency_code: 'EUR' } });
    await client.request('post', '/households', { body: { name: 'B', currency_code: 'EUR' } });

    expect(calls.filter((c) => c.path === '/auth/csrf')).toHaveLength(1);
  });

  it('does not cache a token that was bootstrapped across an auth transition', async () => {
    let release!: (response: Response) => void;
    const gate = new Promise<Response>((resolve) => (release = resolve));
    let issued = 0;
    const fake = createFakeFetch((call) => {
      if (call.path === '/auth/csrf') {
        issued += 1;
        return issued === 1 ? gate : jsonResponse(200, { csrf_token: 'fresh' });
      }
      return jsonResponse(200, {});
    });
    const client = createApiClient({ fetch: fake.fetch, pageOrigin: PAGE, sleep: noSleep });

    const first = client.request('post', '/auth/forgot-password', { body: { email: 'a@example.test' } });
    await Promise.resolve();
    client.invalidateCsrfToken(); // a transition happens while the bootstrap is in flight
    release(jsonResponse(200, { csrf_token: 'stale' }));
    await first;
    await client.request('post', '/households', { body: { name: 'A', currency_code: 'EUR' } });

    const posts = fake.calls.filter((c) => c.method === 'POST');
    expect(posts[0].headers.get('X-CSRFToken')).toBe('stale');
    expect(posts[1].headers.get('X-CSRFToken')).toBe('fresh');
  });

  it('sends nothing unsafe when the bootstrap fails', async () => {
    const fake = createFakeFetch((call) =>
      call.path === '/auth/csrf' ? jsonResponse(500, errorBody('INTERNAL_ERROR')) : jsonResponse(200, {}),
    );
    const client = createApiClient({ fetch: fake.fetch, pageOrigin: PAGE, sleep: noSleep, retry: { maxRetries: 0 } });

    await expect(login(client)).rejects.toMatchObject({ kind: 'server' });

    expect(fake.calls.some((c) => c.method === 'POST')).toBe(false);
  });

  it('treats a bootstrap response without csrf_token as a protocol error', async () => {
    const fake = createFakeFetch((call) => (call.path === '/auth/csrf' ? jsonResponse(200, {}) : jsonResponse(200, {})));
    const client = createApiClient({ fetch: fake.fetch, pageOrigin: PAGE, sleep: noSleep });

    const error = await login(client).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ kind: 'protocol' });
    expect(fake.calls.some((c) => c.method === 'POST')).toBe(false);
  });

  it('never replays a write after 403, but refreshes the token for the next one', async () => {
    let denied = true;
    const { client, calls } = setup(() => {
      if (denied) {
        denied = false;
        return jsonResponse(403, errorBody('AUTHORIZATION_ERROR'));
      }
      return jsonResponse(200, {});
    });

    await expect(client.request('post', '/households', { body: { name: 'A', currency_code: 'EUR' } })).rejects.toMatchObject({
      kind: 'forbidden',
    });
    expect(calls.filter((c) => c.method === 'POST')).toHaveLength(1);

    await client.request('post', '/households', { body: { name: 'A', currency_code: 'EUR' } });
    expect(calls.filter((c) => c.method === 'POST')[1].headers.get('X-CSRFToken')).toBe('csrf-2');
  });

  it('never sends cookies or authorization headers itself', async () => {
    const { client, calls } = setup();

    await login(client);
    await client.request('get', '/auth/me');

    for (const call of calls) {
      expect(call.headers.has('Cookie')).toBe(false);
      expect(call.headers.has('Authorization')).toBe(false);
      expect(call.init.referrerPolicy).toBe('no-referrer');
      expect(call.init.redirect).toBe('error');
    }
  });
});
