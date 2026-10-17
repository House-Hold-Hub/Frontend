import { isApiError, type ApiClient } from '../api';
import styles from './Auth.module.css';
import type { BearerHandoff } from './bearerFragment';
import { HOME_PATH, LOGIN_PATH } from './paths';
import { ResendVerification } from './ResendVerification';
import { fetchCurrentUser } from './session';
import { useBearerExchange, type ExchangeResult } from './useBearerExchange';

type Outcome =
  /** Verified, and this browser holds a verified session (the restricted one was upgraded). */
  | { kind: 'verified-signed-in' }
  /** Verified; the bearer is not a login, so the user signs in normally. */
  | { kind: 'verified-signed-out' }
  | { kind: 'invalid' }
  | { kind: 'already-verified' }
  | { kind: 'rate-limited' }
  | { kind: 'unavailable' };

/** `verifyEmail` (public): 204, 400 invalid/expired, 409 already verified, 429. */
async function verifyEmail(api: ApiClient, verifier: string): Promise<ExchangeResult<Outcome>> {
  try {
    await api.request('post', '/auth/email/verify', { body: { verifier } });
  } catch (error) {
    const kind = isApiError(error) ? error.kind : 'unexpected';
    if (kind === 'validation') return { outcome: { kind: 'invalid' }, retryable: false };
    if (kind === 'conflict') return { outcome: { kind: 'already-verified' }, retryable: false };
    if (kind === 'rate-limited') return { outcome: { kind: 'rate-limited' }, retryable: true };
    return { outcome: { kind: 'unavailable' }, retryable: true };
  }
  // The server may have upgraded and rotated a matching restricted session in
  // this browser; otherwise there is no session. Ask rather than assume.
  const user = await fetchCurrentUser(api);
  return {
    outcome: user?.email_verified ? { kind: 'verified-signed-in' } : { kind: 'verified-signed-out' },
    retryable: false,
  };
}

export function VerifyEmailPage({ api, bearer }: { api: ApiClient; bearer: BearerHandoff }) {
  const { state, retry } = useBearerExchange(api, bearer, verifyEmail);

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Verify your email</h1>
      {state.kind === 'missing' ? (
        <p className={styles.message} role="alert">
          This verification link is incomplete. Open the link from your email again, or request a new one.
        </p>
      ) : null}
      {state.kind === 'pending' ? (
        <p className={styles.message} role="status">
          Verifying your email address…
        </p>
      ) : null}
      {state.kind === 'done' ? <Result outcome={state.outcome} api={api} canRetry={state.canRetry} retry={retry} /> : null}
    </main>
  );
}

function Result({
  outcome,
  api,
  canRetry,
  retry,
}: {
  outcome: Outcome;
  api: ApiClient;
  canRetry: boolean;
  retry: () => void;
}) {
  switch (outcome.kind) {
    case 'verified-signed-in':
      return (
        <>
          <p className={styles.message} role="status">
            Your email address is verified.
          </p>
          <p className={styles.actions}>
            <a className={styles.link} href={HOME_PATH}>
              Continue to HouseHoldHub
            </a>
          </p>
        </>
      );
    case 'verified-signed-out':
      return (
        <>
          <p className={styles.message} role="status">
            Your email address is verified. Log in to continue.
          </p>
          <p className={styles.actions}>
            <a className={styles.link} href={LOGIN_PATH}>
              Log in
            </a>
          </p>
        </>
      );
    case 'already-verified':
      return (
        <>
          <p className={styles.message} role="status">
            This email address is already verified.
          </p>
          <p className={styles.actions}>
            <a className={styles.link} href={LOGIN_PATH}>
              Log in
            </a>
          </p>
        </>
      );
    case 'invalid':
      return (
        <>
          <p className={styles.message} role="alert">
            This verification link is invalid or has expired. Each link works once and only for a limited time.
          </p>
          <ResendVerification api={api} />
        </>
      );
    case 'rate-limited':
    case 'unavailable':
      return (
        <>
          <p className={styles.message} role="alert">
            {outcome.kind === 'rate-limited'
              ? 'Too many attempts. Wait a few minutes, then try again.'
              : 'We could not verify your email right now. Try again in a moment.'}
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
