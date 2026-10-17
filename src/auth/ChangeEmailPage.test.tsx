import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { errorBody, jsonResponse } from '../test/fakeFetch';
import { delivery, routedApi } from '../test/apiRoutes';
import { ChangeEmailPage } from './ChangeEmailPage';

const CHANGE = 'POST /auth/email/change';

async function requestChange(routes: Parameters<typeof routedApi>[0], email = 'new@example.test') {
  const fake = routedApi(routes);
  render(<ChangeEmailPage api={fake.api} />);
  await userEvent.type(screen.getByLabelText('New email address'), email);
  await userEvent.click(screen.getByRole('button', { name: 'Send confirmation link' }));
  return fake;
}

describe('ChangeEmailPage', () => {
  it('requests the change with X-CSRFToken and reports the delivery status', async () => {
    const { calls } = await requestChange({ [CHANGE]: jsonResponse(202, delivery('provider_accepted')) }, ' new@example.test ');

    expect(await screen.findByRole('status')).toHaveTextContent(
      'We sent a confirmation link to new@example.test. The email is on its way.',
    );
    expect(screen.getByText(/Open the link in this browser soon/)).toBeInTheDocument();
    const post = calls.find((c) => `${c.method} ${c.path}` === CHANGE);
    expect(JSON.parse(post?.body ?? '')).toEqual({ new_email: 'new@example.test' });
    expect(post?.headers.get('X-CSRFToken')).toBe('csrf-1');
  });

  it('offers a retry when the provider did not accept the email', async () => {
    await requestChange({ [CHANGE]: jsonResponse(202, delivery('failed')) });

    expect(await screen.findByRole('status')).toHaveTextContent('We could not send the email.');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByLabelText('New email address')).toHaveValue('new@example.test');
  });

  it('marks the field invalid on 400', async () => {
    await requestChange({ [CHANGE]: jsonResponse(400, errorBody('VALIDATION_ERROR', 'Bad.', { new_email: ['Bad.'] })) });

    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a valid email address.');
    expect(screen.getByLabelText('New email address')).toHaveAttribute('aria-invalid', 'true');
  });

  it('explains an unusable address on 409', async () => {
    await requestChange({ [CHANGE]: jsonResponse(409, errorBody('CONFLICT')) });

    expect(await screen.findByRole('alert')).toHaveTextContent('This address cannot be used.');
  });

  it.each([
    ['401', jsonResponse(401, errorBody('AUTHENTICATION_ERROR')), 'You are not logged in.'],
    ['403', jsonResponse(403, errorBody('AUTHORIZATION_ERROR')), 'requires a recent login'],
  ])('on %s sends the user to log in again', async (_status, reply, text) => {
    await requestChange({ [CHANGE]: reply });

    expect(await screen.findByRole('alert')).toHaveTextContent(text);
    expect(screen.getByRole('link', { name: 'Log in again' })).toHaveAttribute('href', '/login');
  });

  it('reports a rate limit', async () => {
    await requestChange({ [CHANGE]: jsonResponse(429, errorBody('RATE_LIMITED')) });

    expect(await screen.findByRole('alert')).toHaveTextContent('Too many requests.');
  });
});
