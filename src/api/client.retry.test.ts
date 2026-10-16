import { describe, expect, it, vi } from 'vitest';
import { createApiClient } from './client';
import { createFakeFetch, errorBody, jsonResponse, withCsrf, type Handler } from '../test/fakeFetch';

const HOUSEHOLD = '3f0c2d1e-0000-4000-8000-000000000001';
const PAGE = 'http://localhost:3000';

function setup(handler: Handler, retry?: { maxRetries?: number }) {
  const sleep = vi.fn((ms: number) => {
    void ms;
    return Promise.resolve();
  });
  const fake = createFakeFetch(withCsrf(handler));
  const client = createApiClient({ fetch: fake.fetch, pageOrigin: PAGE, sleep, random: () => 0, retry });
  return { ...fake, client, sleep };
}

const read = (client: ReturnType<typeof setup>['client']) =>
  client.request('get', '/households/{household_id}', { pathParams: { household_id: HOUSEHOLD } });

describe('retry policy', () => {
  it('retries safe reads on 503 with exponential backoff, then succeeds', async () => {
    const replies = [503, 502, 200];
    const { client, calls, sleep } = setup(() => {
      const status = replies.shift() ?? 200;
      return jsonResponse(status, status === 200 ? { id: 'x' } : errorBody('INTERNAL_ERROR'));
    });

    await expect(read(client)).resolves.toEqual({ id: 'x' });

    expect(calls).toHaveLength(3);
    expect(sleep.mock.calls.map(([ms]) => ms)).toEqual([100, 200]); // jitter floor: half the ceiling
  });

  it('retries safe reads after a network failure and gives up after maxRetries', async () => {
    const { client, calls } = setup(() => new TypeError('Failed to fetch'));

    await expect(read(client)).rejects.toMatchObject({ kind: 'network' });

    expect(calls).toHaveLength(3);
  });

  it('honours retry.maxRetries = 0', async () => {
    const { client, calls } = setup(() => jsonResponse(503, errorBody('INTERNAL_ERROR')), { maxRetries: 0 });

    await expect(read(client)).rejects.toMatchObject({ kind: 'server', status: 503 });

    expect(calls).toHaveLength(1);
  });

  it.each([400, 401, 403, 404, 409, 429, 500])('does not retry a read that returned %i', async (status) => {
    const { client, calls } = setup(() => jsonResponse(status, errorBody('NOT_FOUND')));

    await read(client).catch(() => undefined);

    expect(calls).toHaveLength(1);
  });

  it('retries the idempotent CSRF bootstrap read like any other GET', async () => {
    let attempts = 0;
    const fake = createFakeFetch((call) => {
      if (call.path === '/auth/csrf') {
        attempts += 1;
        return attempts < 3 ? new TypeError('offline') : jsonResponse(200, { csrf_token: 'ok' });
      }
      return jsonResponse(200, {});
    });
    const client = createApiClient({ fetch: fake.fetch, pageOrigin: PAGE, sleep: () => Promise.resolve() });

    await client.request('post', '/households', { body: { name: 'A', currency_code: 'EUR' } });

    expect(attempts).toBe(3);
    expect(fake.calls.at(-1)?.headers.get('X-CSRFToken')).toBe('ok');
  });

  it('never retries an unsafe request answered with a retryable status', async () => {
    const { client, calls } = setup((call) =>
      call.method === 'POST' ? jsonResponse(503, errorBody('INTERNAL_ERROR')) : jsonResponse(200, {}),
    );

    await client.request('post', '/households', { body: { name: 'A', currency_code: 'EUR' } }).catch(() => undefined);

    expect(calls.filter((c) => c.method === 'POST')).toHaveLength(1);
  });

  it('never retries PATCH, DELETE or POST after a network failure', async () => {
    const { client, calls, sleep } = setup((call) => (call.method === 'GET' ? jsonResponse(200, {}) : new TypeError('Failed to fetch')));
    const ids = { household_id: HOUSEHOLD, task_id: 't' };

    await client.request('post', '/households', { body: { name: 'A', currency_code: 'EUR' } }).catch(() => undefined);
    await client.request('patch', '/households/{household_id}/tasks/{task_id}/complete', { pathParams: ids, body: { completed: true } }).catch(() => undefined);
    await client.request('delete', '/households/{household_id}/tasks/{task_id}', { pathParams: ids }).catch(() => undefined);

    expect(calls.filter((c) => c.method !== 'GET').map((c) => c.method)).toEqual(['POST', 'PATCH', 'DELETE']);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('does not retry once the caller aborted', async () => {
    const controller = new AbortController();
    const { client, calls } = setup(() => {
      controller.abort();
      return Object.assign(new Error('aborted'), { name: 'AbortError' });
    });

    await expect(
      client.request('get', '/households/{household_id}', { pathParams: { household_id: HOUSEHOLD }, signal: controller.signal }),
    ).rejects.toMatchObject({ kind: 'aborted' });

    expect(calls).toHaveLength(1);
  });
});
