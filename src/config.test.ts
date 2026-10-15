import { describe, expect, it, vi } from 'vitest';

async function loadConfig() {
  vi.resetModules();
  return import('./config');
}

describe('config', () => {
  it('defaults apiBaseUrl to an empty string when VITE_API_BASE_URL is unset', async () => {
    vi.stubEnv('VITE_API_BASE_URL', undefined);

    const { apiBaseUrl } = await loadConfig();

    expect(apiBaseUrl).toBe('');
  });

  it('reads apiBaseUrl from VITE_API_BASE_URL', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test');

    const { apiBaseUrl } = await loadConfig();

    expect(apiBaseUrl).toBe('https://api.example.test');
  });
});
