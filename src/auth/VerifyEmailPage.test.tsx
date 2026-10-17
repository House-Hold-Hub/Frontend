import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { errorBody, jsonResponse } from '../test/fakeFetch';
import { delivery, routedApi, user } from '../test/apiRoutes';
import { handOffBearer } from './bearerFragment';
import { VerifyEmailPage } from './VerifyEmailPage';

const BEARER = 'initial-verification-bearer-9f8e7d';
const VERIFY = 'POST /auth/email/verify';
const ME = 'GET /auth/me';
const RESEND = 'POST /auth/email/resend-verification';

function renderPage(routes: Parameters<typeof routedApi>[0], verifier: string | null = BEARER) {
  const fake = routedApi(routes);
  render(
    <StrictMode>
      <VerifyEmailPage api={fake.api} bearer={handOffBearer(verifier)} />
    </StrictMode>,
  );
  return fake;
}

describe('VerifyEmailPage', () => {
  it('sends the verifier once, only in the JSON body with X-CSRFToken, then re-reads the session', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const consoleSpies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((m) => vi.spyOn(console, m));
    const { calls, requests } = renderPage({ [VERIFY]: jsonResponse(204), [ME]: jsonResponse(200, user()) });

    expect(await screen.findByText('Your email address is verified.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continue to HouseHoldHub' })).toHaveAttribute('href', '/');

    expect(requests()).toEqual(['GET /auth/csrf', VERIFY, ME]);
    const post = calls[1];
    expect(JSON.parse(post.body ?? '')).toEqual({ verifier: BEARER });
    expect(post.headers.get('X-CSRFToken')).toBe('csrf-1');
    expect(post.headers.get('Content-Type')).toBe('application/json');
    for (const call of calls) expect(call.url).not.toContain(BEARER);
    expect(setItem).not.toHaveBeenCalled();
    for (const spy of consoleSpies) expect(spy).not.toHaveBeenCalled();
  });

  it('asks an anonymous user to log in after verifying, since the bearer is not a login', async () => {
    renderPage({ [VERIFY]: jsonResponse(204), [ME]: jsonResponse(401, errorBody('AUTHENTICATION_ERROR')) });

    expect(await screen.findByText('Your email address is verified. Log in to continue.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
  });

  it('asks for a login when the browser holds a different, still unverified account', async () => {
    renderPage({ [VERIFY]: jsonResponse(204), [ME]: jsonResponse(200, user({ email_verified: false })) });

    expect(await screen.findByText('Your email address is verified. Log in to continue.')).toBeInTheDocument();
  });

  it('reports an invalid or expired link and offers a resend with its delivery status', async () => {
    const { requests } = renderPage({
      [VERIFY]: jsonResponse(400, errorBody('VALIDATION_ERROR', 'Invalid.', { verifier: ['Invalid.'] })),
      [RESEND]: jsonResponse(200, delivery('provider_accepted')),
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('This verification link is invalid or has expired.');
    await userEvent.click(screen.getByRole('button', { name: 'Send a new verification email' }));

    expect(await screen.findByText('We sent a new verification email. It can take a few minutes to arrive.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Send a new verification email' })).not.toBeInTheDocument();
    expect(requests().filter((r) => r === VERIFY)).toHaveLength(1);
  });

  it('keeps a failed resend recoverable instead of reporting success', async () => {
    renderPage({
      [VERIFY]: jsonResponse(400, errorBody('VALIDATION_ERROR')),
      [RESEND]: [jsonResponse(200, delivery('failed')), jsonResponse(200, delivery('provider_accepted'))],
    });

    await userEvent.click(await screen.findByRole('button', { name: 'Send a new verification email' }));
    expect(await screen.findByText('We could not send a new verification email. Try again in a moment.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Send a new verification email' }));
    expect(await screen.findByText('We sent a new verification email. It can take a few minutes to arrive.')).toBeInTheDocument();
  });

  it('sends a signed-out user to log in before resending', async () => {
    renderPage({
      [VERIFY]: jsonResponse(400, errorBody('VALIDATION_ERROR')),
      [RESEND]: jsonResponse(401, errorBody('AUTHENTICATION_ERROR')),
    });

    await userEvent.click(await screen.findByRole('button', { name: 'Send a new verification email' }));

    expect(await screen.findByText(/to request a new verification email/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
  });

  it('reports an already verified address', async () => {
    renderPage({ [VERIFY]: jsonResponse(409, errorBody('CONFLICT')) });

    expect(await screen.findByText('This email address is already verified.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });

  it('lets the user retry the same link after a rate limit', async () => {
    const { calls, requests } = renderPage({
      [VERIFY]: [jsonResponse(429, errorBody('RATE_LIMITED'), { 'Retry-After': '30' }), jsonResponse(204)],
      [ME]: jsonResponse(200, user()),
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('Too many attempts.');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Your email address is verified.')).toBeInTheDocument();
    const posts = calls.filter((c) => `${c.method} ${c.path}` === VERIFY);
    expect(posts.map((c) => JSON.parse(c.body ?? ''))).toEqual([{ verifier: BEARER }, { verifier: BEARER }]);
    expect(requests().at(-1)).toBe(ME);
  });

  it('explains an incomplete link without calling the API', async () => {
    const { calls } = renderPage({}, null);

    expect(screen.getByRole('alert')).toHaveTextContent('This verification link is incomplete.');
    await Promise.resolve();
    expect(calls).toHaveLength(0);
  });
});
