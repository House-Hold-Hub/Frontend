import { describe, expect, it, vi } from 'vitest';
import { createFakeFetch, jsonResponse } from '../test/fakeFetch';

async function loadIndex() {
  vi.resetModules();
  return import('./index');
}

describe('createConfiguredApiClient', () => {
  it('uses same-origin relative URLs when VITE_API_BASE_URL is unset', async () => {
    vi.stubEnv('VITE_API_BASE_URL', undefined);
    const { createConfiguredApiClient } = await loadIndex();
    const fake = createFakeFetch(() => jsonResponse(200, {}));

    await createConfiguredApiClient({ fetch: fake.fetch }).request('get', '/auth/me');

    expect(fake.calls[0].url).toBe('/api/v1/auth/me');
  });

  it("accepts the page's own origin", async () => {
    vi.stubEnv('VITE_API_BASE_URL', location.origin);
    const { createConfiguredApiClient } = await loadIndex();
    const fake = createFakeFetch(() => jsonResponse(200, {}));

    await createConfiguredApiClient({ fetch: fake.fetch }).request('get', '/auth/me');

    expect(fake.calls[0].url).toBe(`${location.origin}/api/v1/auth/me`);
  });

  it('refuses the documented cross-origin example value without breaking module import', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8000');
    const { createConfiguredApiClient } = await loadIndex();

    expect(() => createConfiguredApiClient()).toThrow(/not usable \(cross-origin\)/);
  });
});
