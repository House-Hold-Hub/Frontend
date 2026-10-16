import { describe, expect, it } from 'vitest';
import { API_BASE_PATH, resolveApiOrigin } from './baseUrl';
import { ApiConfigError } from './errors';
import { createApiClient } from './client';
import { createFakeFetch, jsonResponse } from '../test/fakeFetch';

const PAGE = 'https://app.example.test';

function reasonOf(raw: string, page = PAGE) {
  try {
    resolveApiOrigin(raw, page);
  } catch (error) {
    expect(error).toBeInstanceOf(ApiConfigError);
    return (error as ApiConfigError).reason;
  }
  return null;
}

describe('resolveApiOrigin', () => {
  it('keeps the contract server path fixed', () => {
    expect(API_BASE_PATH).toBe('/api/v1');
  });

  it('treats an empty value as the same-origin default', () => {
    expect(resolveApiOrigin('', PAGE)).toBe('');
    expect(resolveApiOrigin('   ', PAGE)).toBe('');
  });

  it('accepts the page own origin, with or without a trailing slash', () => {
    expect(resolveApiOrigin(PAGE, PAGE)).toBe(PAGE);
    expect(resolveApiOrigin(`${PAGE}/`, PAGE)).toBe(PAGE);
  });

  it.each([
    ['not a url', 'invalid'],
    ['ftp://app.example.test', 'invalid'],
    ['https://user:pw@app.example.test', 'credentials'],
    ['https://app.example.test/?a=1', 'query-or-fragment'],
    ['https://app.example.test/#frag', 'query-or-fragment'],
    ['https://app.example.test#', 'query-or-fragment'],
    ['https://app.example.test/api/v1', 'path'],
    ['https://api.example.test', 'cross-origin'],
    ['http://app.example.test', 'cross-origin'],
  ])('rejects %s (%s)', (raw, reason) => {
    expect(reasonOf(raw)).toBe(reason);
  });

  it('rejects an absolute URL when the page origin is unknown', () => {
    expect(() => resolveApiOrigin('https://app.example.test', undefined)).toThrow(ApiConfigError);
  });

  it('never echoes the configured value, which may contain credentials', () => {
    const raw = 'https://admin:hunter2@app.example.test/?token=abc#frag';
    try {
      resolveApiOrigin(raw, PAGE);
      expect.unreachable();
    } catch (error) {
      const text = `${String(error)} ${JSON.stringify(error)} ${(error as Error).message}`;
      for (const secret of ['hunter2', 'admin', 'token=abc', 'frag', 'example.test']) {
        expect(text).not.toContain(secret);
      }
    }
  });
});

describe('createApiClient base URL handling', () => {
  it('builds relative same-origin URLs by default', async () => {
    const fake = createFakeFetch(() => jsonResponse(200, { ok: true }));
    const client = createApiClient({ fetch: fake.fetch, pageOrigin: PAGE });

    await client.request('get', '/auth/me');

    expect(fake.calls[0].url).toBe('/api/v1/auth/me');
    expect(fake.calls[0].init.credentials).toBe('same-origin');
  });

  it('prefixes the page own origin when configured explicitly', async () => {
    const fake = createFakeFetch(() => jsonResponse(200, {}));
    const client = createApiClient({ baseUrl: PAGE, fetch: fake.fetch, pageOrigin: PAGE });

    await client.request('get', '/auth/me');

    expect(fake.calls[0].url).toBe(`${PAGE}/api/v1/auth/me`);
  });

  it('refuses a cross-origin deployment at construction time', () => {
    expect(() => createApiClient({ baseUrl: 'https://api.example.test', pageOrigin: PAGE })).toThrow(ApiConfigError);
  });
});
