import { isApiError, type ApiClient } from '../api';
import styles from './Auth.module.css';
import type { BearerHandoff } from './bearerFragment';
import { CHANGE_EMAIL_PATH, HOME_PATH, LOGIN_PATH } from './paths';
import { fetchCurrentUser } from './session';
import { useBearerExchange, type ExchangeResult } from './useBearerExchange';

type Outcome =
  | { kind: 'changed'; email: string | null }
  /** 400 or 409: the link is invalid, expired, or matches no pending change of this session. */
  | { kind: 'no-pending-change' }
  /** 401: no session in this browser. */
  | { kind: 'signed-out' }
  /** 403: the session's login is no longer recent enough. */
  | { kind: 'reauthenticate' }
  | { kind: 'rate-limited' }
  | { kind: 'unavailable' };

/**
 * `verifyPrimaryEmailChange` (authenticated, verified). It only succeeds in the
 * session that requested the change while its login is still recent (ADR-011,
 * ADR-016), so 401 and 403 cannot be fixed by retrying the same link: the
 * user logs in again and requests the change again.
 */
async function verifyEmailChange(api: ApiClient, verifier: string): Promise<ExchangeResult<Outcome>> {
  try {
    await api.request('post', '/auth/email/change/verify', { body: { verifier } });
  } catch (error) {
    const kind = isApiError(error) ? error.kind : 'unexpected';
    if (kind === 'validation' || kind === 'conflict') return { outcome: { kind: 'no-pending-change' }, retryable: false };
    if (kind === 'session-expired') return { outcome: { kind: 'signed-out' }, retryable: false };
    if (kind === 'forbidden') return { outcome: { kind: 'reauthenticate' }, retryable: false };
    if (kind === 'rate-limited') return { outcome: { kind: 'rate-limited' }, retryable: true };
    return { outcome: { kind: 'unavailable' }, retryable: true };
  }
  // The session was rotated and every other session revoked: re-read it.
  const user = await fetchCurrentUser(api);
  return { outcome: { kind: 'changed', email: user?.email ?? null }, retryable: false };
}

export function VerifyEmailChangePage({ api, bearer }: { api: ApiClient; bearer: BearerHandoff }) {
  const { state, retry } = useBearerExchange(api, bearer, verifyEmailChange);

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Confirm your new email</h1>
      {state.kind === 'missing' ? (
        <p className={styles.message} role="alert">
          This confirmation link is incomplete. Open the link from your email again.
        </p>
      ) : null}
      {state.kind === 'pending' ? (
        <p className={styles.message} role="status">
          Confirming your new email address…
        </p>
      ) : null}
      {state.kind === 'done' ? <Result outcome={state.outcome} canRetry={state.canRetry} retry={retry} /> : null}
    </main>
  );
}

const REQUEST_AGAIN = 'Log in again, then request the email change again and open the new link in the same browser.';

function Result({ outcome, canRetry, retry }: { outcome: Outcome; canRetry: boolean; retry: () => void }) {
  switch (outcome.kind) {
    case 'changed':
      return (
        <>
          <p className={styles.message} role="status">
            {outcome.email === null
              ? 'Your primary email address has been changed.'
              : `Your primary email address is now ${outcome.email}.`}{' '}
            You have been signed out on your other devices.
          </p>
          <p className={styles.actions}>
            <a className={styles.link} href={HOME_PATH}>
              Continue to HouseHoldHub
            </a>
          </p>
        </>
      );
    case 'no-pending-change':
      return (
        <>
          <p className={styles.message} role="alert">
            This link is invalid or has expired, or it does not match an email change requested in this browser
            session.
          </p>
          <p className={styles.actions}>
            <a className={styles.link} href={CHANGE_EMAIL_PATH}>
              Request the change again
            </a>
          </p>
        </>
      );
    case 'signed-out':
    case 'reauthenticate':
      return (
        <>
          <p className={styles.message} role="alert">
            {outcome.kind === 'signed-out'
              ? 'You are not logged in. The change can only be confirmed in the browser session that requested it.'
              : 'For your security, the change must be confirmed shortly after logging in, in the session that requested it.'}{' '}
            {REQUEST_AGAIN}
          </p>
          <p className={styles.actions}>
            <a className={styles.link} href={LOGIN_PATH}>
              Log in
            </a>
          </p>
        </>
      );
    case 'rate-limited':
    case 'unavailable':
      return (
        <>
          <p className={styles.message} role="alert">
            {outcome.kind === 'rate-limited'
              ? 'Too many attempts. Wait a moment, then try again.'
              : 'We could not confirm the change right now. Try again in a moment.'}
          </p>
          {canRetry ? (
            <p className={styles.actions}>
              <button className={styles.button} type="button" onClick={retry}>
                Try again
              </button>
            </p>
          ) : null}
        </>
      );
  }
}
