import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// apiBaseUrl is read once at module load, so each case stubs the env and re-imports App.
async function renderApp() {
  vi.resetModules();
  const { App } = await import('./App');
  return render(<App />);
}

describe('App', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_BASE_URL', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('exposes the app name as the page heading inside the main landmark', async () => {
    await renderApp();

    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'HouseHoldHub' })).toBeInTheDocument();
    expect(main).toContainElement(screen.getByRole('heading', { level: 1 }));
  });

  it('tells the user the API is not configured when no base URL is set', async () => {
    await renderApp();

    expect(screen.getByText('API: not configured')).toBeInTheDocument();
  });

  it('shows the configured API base URL', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test');

    await renderApp();

    expect(screen.getByText('API: https://api.example.test')).toBeInTheDocument();
    expect(screen.queryByText(/not configured/i)).not.toBeInTheDocument();
  });
});
