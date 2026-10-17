import { render, screen } from '@testing-library/react';
import { handOffBearer } from './auth/bearerFragment';
import { jsonResponse } from './test/fakeFetch';
import { routedApi, user } from './test/apiRoutes';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// apiBaseUrl is read once at module load, so each case stubs the env and re-imports App.
async function renderApp(props: Partial<import('./App').AppProps> = {}) {
  vi.resetModules();
  const { App } = await import('./App');
  return render(<App {...props} />);
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

  it('renders the email verification landing page and exchanges the bearer', async () => {
    const { api, requests } = routedApi({
      'POST /auth/email/verify': jsonResponse(204),
      'GET /auth/me': jsonResponse(200, user()),
    });

    await renderApp({ path: '/verify-email', bearer: handOffBearer('bearer-1'), api });

    expect(screen.getByRole('heading', { level: 1, name: 'Verify your email' })).toBeInTheDocument();
    expect(await screen.findByText('Your email address is verified.')).toBeInTheDocument();
    expect(requests()).toContain('POST /auth/email/verify');
  });

  it('renders the primary-email change landing page', async () => {
    const { api } = routedApi({});

    await renderApp({ path: '/verify-email-change/', api });

    expect(screen.getByRole('heading', { level: 1, name: 'Confirm your new email' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('This confirmation link is incomplete.');
  });

  it('renders the email change request page', async () => {
    const { api } = routedApi({});

    await renderApp({ path: '/account/email', api });

    expect(screen.getByRole('heading', { level: 1, name: 'Change your email' })).toBeInTheDocument();
  });

  it('shows an error instead of a blank page when the API base URL is unusable', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test');

    await renderApp({ path: '/verify-email', bearer: handOffBearer('bearer-1') });

    expect(screen.getByRole('alert')).toHaveTextContent('the app is misconfigured');
  });
});
