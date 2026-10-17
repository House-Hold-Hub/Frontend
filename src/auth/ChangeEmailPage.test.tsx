import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createApiClient } from '../api';
import { createFakeFetch, errorBody, jsonResponse, noSleep, withCsrf } from '../test/fakeFetch';
import { delivery, PAGE_ORIGIN, routedApi } from '../test/apiRoutes';
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
      'We sent a confirmation link to new@example.test. It can take a few minutes to arrive.',
    );
    expect(screen.getByText(/open it in this browser soon/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
    const post = calls.find((c) => `${c.method} ${c.path}` === CHANGE);
    expect(JSON.parse(post?.body ?? '')).toEqual({ new_email: 'new@example.test' });
    expect(post?.headers.get('X-CSRFToken')).toBe('csrf-1');
  });

  it.each([
    ['pending', 'We are still sending a confirmation link to new@example.test.', true],
    ['unknown', 'We could not confirm whether a confirmation link to new@example.test was sent.', true],
    ['failed', 'We could not send a confirmation link to new@example.test.', false],
  ] as const)(
    'on a %s delivery does not claim the link was sent and offers a retry',
    async (status, text, linkMayArrive) => {
      await requestChange({ [CHANGE]: jsonResponse(202, delivery(status)) });

      const message = await screen.findByRole('status');
      expect(message).toHaveTextContent(text);
      expect(message).not.toHaveTextContent('We sent');
      expect(screen.queryByText(/open it in this browser soon/) !== null).toBe(linkMayArrive);

      await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
      expect(screen.getByLabelText('New email address')).toHaveValue('new@example.test');
    },
  );

  it('names the address that was submitted even if the field is edited while the request is pending', async () => {
    let answer: (reply: Response) => void = () => {};
    const fake = createFakeFetch(
      withCsrf(() => new Promise<Response>((resolve) => (answer = resolve))),
    );
    render(<ChangeEmailPage api={createApiClient({ fetch: fake.fetch, pageOrigin: PAGE_ORIGIN, sleep: noSleep })} />);
    const field = screen.getByLabelText('New email address');

    await userEvent.type(field, 'first@example.test');
    await userEvent.click(screen.getByRole('button', { name: 'Send confirmation link' }));
    await vi.waitFor(() => expect(fake.calls.map((c) => `${c.method} ${c.path}`)).toContain(CHANGE));
    await userEvent.clear(field);
    await userEvent.type(field, 'second@example.test');
    answer(jsonResponse(202, delivery('provider_accepted')));

    const message = await screen.findByRole('status');
    expect(message).toHaveTextContent('We sent a confirmation link to first@example.test.');
    expect(message).not.toHaveTextContent('second@example.test');
    expect(JSON.parse(fake.calls.at(-1)?.body ?? '')).toEqual({ new_email: 'first@example.test' });
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
