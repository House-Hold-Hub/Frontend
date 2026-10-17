import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { errorBody, jsonResponse } from '../test/fakeFetch';
import { routedApi, user } from '../test/apiRoutes';
import { handOffBearer } from './bearerFragment';
import { VerifyEmailChangePage } from './VerifyEmailChangePage';

const BEARER = 'primary-email-change-bearer-1a2b3c';
const VERIFY = 'POST /auth/email/change/verify';
const ME = 'GET /auth/me';

function renderPage(routes: Parameters<typeof routedApi>[0], verifier: string | null = BEARER) {
  const fake = routedApi(routes);
  render(
    <StrictMode>
      <VerifyEmailChangePage api={fake.api} bearer={handOffBearer(verifier)} />
    </StrictMode>,
  );
  return fake;
}

describe('VerifyEmailChangePage', () => {
  it('confirms the change once and shows the new primary address from the rotated session', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const { calls, requests } = renderPage({
      [VERIFY]: jsonResponse(204),
      [ME]: jsonResponse(200, user({ email: 'new@example.test' })),
    });

    expect(
      await screen.findByText(
        'Your primary email address is now new@example.test. You have been signed out on your other devices.',
      ),
    ).toHaveAttribute('role', 'status');
    expect(requests()).toEqual(['GET /auth/csrf', VERIFY, ME]);
    expect(JSON.parse(calls[1].body ?? '')).toEqual({ verifier: BEARER });
    expect(calls[1].headers.get('X-CSRFToken')).toBe('csrf-1');
    for (const call of calls) expect(call.url).not.toContain(BEARER);
    expect(setItem).not.toHaveBeenCalled();
  });

  it('still reports success when the session cannot be re-read', async () => {
    renderPage({ [VERIFY]: jsonResponse(204), [ME]: jsonResponse(500, errorBody('INTERNAL_ERROR')) });

    expect(await screen.findByText(/Your primary email address has been changed\./)).toBeInTheDocument();
  });

  it.each([
    ['400', jsonResponse(400, errorBody('VALIDATION_ERROR'))],
    ['409', jsonResponse(409, errorBody('CONFLICT'))],
  ])('on %s explains there is no matching pending change and links to request it again', async (_status, reply) => {
    renderPage({ [VERIFY]: reply });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'does not match an email change requested in this browser session',
    );
    expect(screen.getByRole('link', { name: 'Request the change again' })).toHaveAttribute('href', '/account/email');
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });

  it('on 401 sends the user to log in and request the change again', async () => {
    renderPage({ [VERIFY]: jsonResponse(401, errorBody('AUTHENTICATION_ERROR')) });

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('You are not logged in.');
    expect(alert).toHaveTextContent('request the email change again');
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
  });

  it('on 403 asks for a fresh login and a new change request', async () => {
    const { requests } = renderPage({ [VERIFY]: jsonResponse(403, errorBody('AUTHORIZATION_ERROR')) });

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('confirmed shortly after logging in');
    expect(alert).toHaveTextContent('request the email change again');
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
    expect(requests().filter((r) => r === VERIFY)).toHaveLength(1);
  });

  it('lets the user retry the same link after a rate limit', async () => {
    const { requests } = renderPage({
      [VERIFY]: [jsonResponse(429, errorBody('RATE_LIMITED')), jsonResponse(204)],
      [ME]: jsonResponse(200, user({ email: 'new@example.test' })),
    });

    await userEvent.click(await screen.findByRole('button', { name: 'Try again' }));

    expect(await screen.findByText(/is now new@example\.test/)).toBeInTheDocument();
    expect(requests().filter((r) => r === VERIFY)).toHaveLength(2);
  });

  it('explains an incomplete link without calling the API', () => {
    const { calls } = renderPage({}, null);

    expect(screen.getByRole('alert')).toHaveTextContent('This confirmation link is incomplete.');
    expect(calls).toHaveLength(0);
  });
});
