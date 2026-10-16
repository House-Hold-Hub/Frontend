import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { createApiClient } from './client';
import { ApiError } from './errors';
import type { OptionsOf, PathsFor } from './types';
import { createFakeFetch, errorBody, jsonResponse, noSleep, withCsrf, type Handler } from '../test/fakeFetch';

const HOUSEHOLD = '3f0c2d1e-0000-4000-8000-000000000001';
const OTHER_HOUSEHOLD = '9a9a9a9a-0000-4000-8000-00000000beef';
const PAGE = 'http://localhost:3000';

function setup(handler: Handler, onSessionLost?: () => void) {
  const fake = createFakeFetch(withCsrf(handler));
  const client = createApiClient({ fetch: fake.fetch, pageOrigin: PAGE, sleep: noSleep, onSessionLost });
  return { ...fake, client };
}

const getTasks = (client: ReturnType<typeof setup>['client'], household = HOUSEHOLD) =>
  client.request('get', '/households/{household_id}/tasks', { pathParams: { household_id: household } });

describe('401 handling', () => {
  it('treats 401 on a protected operation as loss of the session', async () => {
    const onSessionLost = vi.fn();
    const { client } = setup(() => jsonResponse(401, errorBody('AUTHENTICATION_ERROR')), onSessionLost);

    const error = await getTasks(client).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ kind: 'session-expired', status: 401, code: 'AUTHENTICATION_ERROR' });
    expect(onSessionLost).toHaveBeenCalledTimes(1);
    expect(onSessionLost).toHaveBeenCalledWith(); // no URL, no payload
  });

  it('signals session loss once for a burst of concurrent 401s, and again after recovery', async () => {
    let status = 401;
    const onSessionLost = vi.fn();
    const { client } = setup(
      () => (status === 401 ? jsonResponse(401, errorBody('AUTHENTICATION_ERROR')) : jsonResponse(200, {})),
      onSessionLost,
    );

    await Promise.allSettled([getTasks(client), getTasks(client), getTasks(client)]);
    expect(onSessionLost).toHaveBeenCalledTimes(1);

    status = 200;
    await getTasks(client);
    status = 401;
    await getTasks(client).catch(() => undefined);
    expect(onSessionLost).toHaveBeenCalledTimes(2);
  });

  it('does not re-arm onSessionLost while the outage lasts, even though the CSRF bootstrap succeeds', async () => {
    const onSessionLost = vi.fn();
    const { client, calls } = setup(
      (call) => (call.path === '/auth/csrf' ? jsonResponse(200, { csrf_token: 'x' }) : jsonResponse(401, errorBody('AUTHENTICATION_ERROR'))),
      onSessionLost,
    );

    await client.request('get', '/auth/me').catch(() => undefined);
    for (let i = 0; i < 3; i += 1) {
      await client.request('post', '/households', { body: { name: 'A', currency_code: 'EUR' } }).catch(() => undefined);
    }

    expect(calls.filter((c) => c.path === '/auth/csrf').length).toBeGreaterThan(1);
    expect(onSessionLost).toHaveBeenCalledTimes(1);
  });

  it('re-arms onSessionLost only after a request that proves a session exists again', async () => {
    const onSessionLost = vi.fn();
    const { client } = setup((call) => {
      if (call.path === '/auth/login') return jsonResponse(200, { ok: true });
      return jsonResponse(call.path === '/auth/forgot-password' ? 200 : 401, errorBody('AUTHENTICATION_ERROR'));
    }, onSessionLost);

    await client.request('get', '/auth/me').catch(() => undefined);
    await client.request('post', '/auth/forgot-password', { body: { email: 'a@example.test' } }).catch(() => undefined);
    await client.request('get', '/auth/me').catch(() => undefined);
    expect(onSessionLost).toHaveBeenCalledTimes(1);

    await client.request('post', '/auth/login', { body: { email: 'a@example.test', password: 'pw' } });
    await client.request('get', '/auth/me').catch(() => undefined);
    expect(onSessionLost).toHaveBeenCalledTimes(2);
  });

  it('drops the CSRF token on session loss', async () => {
    let expired = false;
    const { client, calls } = setup((call) => {
      if (call.path === '/auth/me') {
        expired = true;
        return jsonResponse(401, errorBody('AUTHENTICATION_ERROR'));
      }
      return jsonResponse(expired ? 401 : 200, expired ? errorBody('AUTHENTICATION_ERROR') : {});
    });

    await client.request('post', '/households', { body: { name: 'A', currency_code: 'EUR' } }); // token csrf-1
    await client.request('get', '/auth/me').catch(() => undefined);
    await client.request('post', '/households', { body: { name: 'A', currency_code: 'EUR' } }).catch(() => undefined);

    expect(calls.filter((c) => c.method === 'POST')[1].headers.get('X-CSRFToken')).toBe('csrf-2');
  });

  it('does not treat rejected login credentials (public 401) as session loss', async () => {
    const onSessionLost = vi.fn();
    const { client } = setup(() => jsonResponse(401, errorBody('AUTHENTICATION_ERROR')), onSessionLost);

    const error = await client
      .request('post', '/auth/login', { body: { email: 'a@example.test', password: 'pw' } })
      .catch((e: unknown) => e);

    expect(error).toMatchObject({ kind: 'unauthorized', status: 401 });
    expect(onSessionLost).not.toHaveBeenCalled();
  });

  it('keeps the original error even if the session-lost handler throws', async () => {
    const { client } = setup(
      () => jsonResponse(401, errorBody('AUTHENTICATION_ERROR')),
      () => {
        throw new Error('handler bug');
      },
    );

    await expect(getTasks(client)).rejects.toMatchObject({ kind: 'session-expired' });
  });
});

describe('403 and 404 handling', () => {
  it('maps 403 to forbidden without ending the session', async () => {
    const onSessionLost = vi.fn();
    const { client } = setup(() => jsonResponse(403, errorBody('AUTHORIZATION_ERROR')), onSessionLost);

    await expect(getTasks(client)).rejects.toMatchObject({ kind: 'forbidden', status: 403, code: 'AUTHORIZATION_ERROR' });
    expect(onSessionLost).not.toHaveBeenCalled();
  });

  it('maps 404 to not-found without ending the session', async () => {
    const onSessionLost = vi.fn();
    const { client } = setup(() => jsonResponse(404, errorBody('NOT_FOUND')), onSessionLost);

    await expect(getTasks(client)).rejects.toMatchObject({ kind: 'not-found', status: 404, code: 'NOT_FOUND' });
    expect(onSessionLost).not.toHaveBeenCalled();
  });

  it('gives identical errors for a nonexistent and an out-of-scope household, with no server detail', async () => {
    const { client } = setup((call) =>
      jsonResponse(
        404,
        errorBody(
          'NOT_FOUND',
          call.path.includes(OTHER_HOUSEHOLD)
            ? `Household ${OTHER_HOUSEHOLD} belongs to another family ("Smith")`
            : 'No such household',
        ),
      ),
    );

    const outOfScope = (await getTasks(client, OTHER_HOUSEHOLD).catch((e: unknown) => e)) as ApiError;
    const missing = (await getTasks(client, HOUSEHOLD).catch((e: unknown) => e)) as ApiError;

    expect(outOfScope.message).toBe(missing.message);
    expect(JSON.stringify(outOfScope)).toBe(JSON.stringify(missing));
    for (const text of [outOfScope.message, JSON.stringify(outOfScope), String(outOfScope)]) {
      expect(text).not.toContain(OTHER_HOUSEHOLD);
      expect(text).not.toContain('Smith');
    }
  });
});

describe('other responses', () => {
  it.each([
    [400, 'VALIDATION_ERROR', 'validation'],
    [409, 'CONFLICT', 'conflict'],
    [429, 'RATE_LIMITED', 'rate-limited'],
    [500, 'INTERNAL_ERROR', 'server'],
  ])('maps %i to %s', async (status, code, kind) => {
    const { client } = setup(() => jsonResponse(status, errorBody(code)));
    await expect(getTasks(client)).rejects.toMatchObject({ kind, status, code });
  });

  it('exposes field messages for 400 only and never the free-form server message', async () => {
    const { client } = setup(() =>
      jsonResponse(400, errorBody('VALIDATION_ERROR', 'Echoed secret hunter2', { name: ['Required.'] })),
    );

    const error = (await client
      .request('post', '/households', { body: { name: '', currency_code: 'EUR' } })
      .catch((e: unknown) => e)) as ApiError;

    expect(error.fields).toEqual({ name: ['Required.'] });
    expect(error.message).not.toContain('hunter2');
    expect(JSON.stringify(error)).not.toContain('Required');

    const conflict = setup(() => jsonResponse(409, errorBody('CONFLICT', 'x', { name: ['dup'] })));
    const other = (await conflict.client
      .request('post', '/households', { body: { name: 'A', currency_code: 'EUR' } })
      .catch((e: unknown) => e)) as ApiError;
    expect(other.fields).toBeNull();
  });

  it('survives non-JSON and malformed error bodies', async () => {
    const { client } = setup(() => new Response('<html>Bad gateway</html>', { status: 500 }));
    await expect(getTasks(client)).rejects.toMatchObject({ kind: 'server', code: null });

    const odd = setup(() => jsonResponse(404, { code: 'MADE_UP', message: 5 }));
    await expect(getTasks(odd.client)).rejects.toMatchObject({ kind: 'not-found', code: null });
  });

  it('returns undefined for 204 and the parsed body for 200', async () => {
    const { client } = setup((call) => (call.method === 'DELETE' ? jsonResponse(204) : jsonResponse(200, { data: [] })));

    await expect(getTasks(client)).resolves.toEqual({ data: [] });
    await expect(
      client.request('delete', '/households/{household_id}/tasks/{task_id}', {
        pathParams: { household_id: HOUSEHOLD, task_id: 't1' },
      }),
    ).resolves.toBeUndefined();
  });

  it('reports a malformed success body as a protocol error', async () => {
    const { client } = setup(() => new Response('not json', { status: 200 }));
    await expect(getTasks(client)).rejects.toMatchObject({ kind: 'protocol', status: 200 });
  });

  it('reports transport failures without the underlying (URL-bearing) message', async () => {
    const { client } = setup(
      () => new TypeError(`Failed to fetch /api/v1/households/${HOUSEHOLD}/tasks#frag`),
    );

    const error = (await client.request('get', '/auth/me').catch((e: unknown) => e)) as ApiError;

    expect(error).toMatchObject({ kind: 'network', status: null });
    expect(error.message).not.toContain(HOUSEHOLD);
    expect(error.cause).toBeUndefined();
  });

  it('rejects a 200 with an empty body as a protocol error, but accepts 204', async () => {
    const empty = setup(() => new Response('', { status: 200 }));
    await expect(getTasks(empty.client)).rejects.toMatchObject({ kind: 'protocol', status: 200 });

    const noContent = setup(() => jsonResponse(204));
    await expect(
      noContent.client.request('delete', '/households/{household_id}/tasks/{task_id}', {
        pathParams: { household_id: HOUSEHOLD, task_id: 't1' },
      }),
    ).resolves.toBeUndefined();
  });

  it('honours an already-aborted signal and aborts without retrying', async () => {
    const controller = new AbortController();
    controller.abort();
    const { client, calls } = setup(() => jsonResponse(200, {}));

    await expect(client.request('get', '/auth/me', { signal: controller.signal })).rejects.toMatchObject({ kind: 'aborted' });
    expect(calls).toHaveLength(0);
  });
});

describe('cancellation before the CSRF bootstrap', () => {
  it('sends nothing, not even the bootstrap, for an already-aborted unsafe request', async () => {
    const controller = new AbortController();
    controller.abort();
    const { client, calls } = setup(() => jsonResponse(200, {}));

    await expect(
      client.request('post', '/households', { body: { name: 'A', currency_code: 'EUR' }, signal: controller.signal }),
    ).rejects.toMatchObject({ kind: 'aborted' });

    expect(calls).toHaveLength(0);
  });

  it('stops waiting for a pending bootstrap when its own signal aborts, without cancelling others', async () => {
    let release!: (response: Response) => void;
    const gate = new Promise<Response>((resolve) => (release = resolve));
    const fake = createFakeFetch((call) => (call.path === '/auth/csrf' ? gate : jsonResponse(200, {})));
    const client = createApiClient({ fetch: fake.fetch, pageOrigin: PAGE, sleep: noSleep });
    const controller = new AbortController();

    const aborted = client.request('post', '/households', { body: { name: 'A', currency_code: 'EUR' }, signal: controller.signal });
    const other = client.request('post', '/households', { body: { name: 'B', currency_code: 'EUR' } });
    await Promise.resolve();
    controller.abort();
    await expect(aborted).rejects.toMatchObject({ kind: 'aborted' });

    release(jsonResponse(200, { csrf_token: 'shared' }));
    await expect(other).resolves.toEqual({});
    expect(fake.calls.filter((c) => c.path === '/auth/csrf')).toHaveLength(1);
    expect(fake.calls.filter((c) => c.method === 'POST')).toHaveLength(1);
  });
});

describe('navigation-only OAuth operations', () => {
  it('are not callable through the fetch pipeline', async () => {
    const { client, calls } = setup(() => jsonResponse(302));
    const request = client.request as (method: string, path: string) => Promise<unknown>;

    await expect(request('get', '/auth/google')).rejects.toBeInstanceOf(TypeError);
    await expect(request('get', '/auth/google/callback')).rejects.toBeInstanceOf(TypeError);

    expect(calls).toHaveLength(0);
    expectTypeOf<PathsFor<'get'>>().not.toEqualTypeOf<'/auth/google'>();
    void (() => {
      // @ts-expect-error - 302 hand-off, excluded from the client's typed surface
      void client.request('get', '/auth/google');
    });
  });
});

describe('request option types', () => {
  it('keep a required query object required', () => {
    expectTypeOf<OptionsOf<'/auth/google/callback', 'get'>>().toHaveProperty('query').not.toBeNullable();
    expectTypeOf<OptionsOf<'/households/{household_id}/tasks', 'get'>['query']>().toBeNullable();
  });
});

describe('request building', () => {
  it('percent-encodes path parameters and serialises only defined query values', async () => {
    const { client, calls } = setup(() => jsonResponse(200, { data: [] }));

    await client.request('get', '/households/{household_id}/tasks', {
      pathParams: { household_id: 'a/b?c#d' },
      query: { page: 2, limit: 10, completed: false, due_before: undefined },
    });

    expect(calls[0].path).toBe('/households/a%2Fb%3Fc%23d/tasks?page=2&limit=10&completed=false');
  });

  it('rejects a missing path parameter without echoing values', async () => {
    const { client, calls } = setup(() => jsonResponse(200, {}));

    const error = await client
      .request('get', '/households/{household_id}/tasks', { pathParams: {} as { household_id: string } })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(TypeError);
    expect(calls).toHaveLength(0);
  });

  it('is checked against the generated contract types', () => {
    const { client } = setup(() => jsonResponse(200, {}));
    void (() => {
      // @ts-expect-error - not a path of the OpenAPI contract
      void client.request('get', '/not-in-contract');
      // @ts-expect-error - /auth/me has no POST operation
      void client.request('post', '/auth/me');
      // @ts-expect-error - household_id is a required path parameter
      void client.request('get', '/households/{household_id}', {});
    });
  });
});
