import { useState } from 'react';
import { isApiError, type ApiClient } from '../api';
import styles from './Auth.module.css';
import { describeDelivery } from './delivery';
import { LOGIN_PATH } from './paths';

type State =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent'; message: string; canRetry: boolean }
  | { kind: 'signed-out' }
  | { kind: 'already-verified' }
  | { kind: 'failed'; message: string };

/**
 * `resendEmailVerification` for the current unverified session. It reports
 * the delivery outcome the server returns, so a failed send stays a
 * recoverable state instead of a false success.
 */
export function ResendVerification({ api }: { api: ApiClient }) {
  const [state, setState] = useState<State>({ kind: 'idle' });

  async function resend() {
    setState({ kind: 'sending' });
    try {
      const { delivery } = await api.request('post', '/auth/email/resend-verification');
      setState({ kind: 'sent', ...describeDelivery(delivery.status, 'a new verification email') });
    } catch (error) {
      const kind = isApiError(error) ? error.kind : 'unexpected';
      if (kind === 'session-expired') setState({ kind: 'signed-out' });
      else if (kind === 'conflict') setState({ kind: 'already-verified' });
      else if (kind === 'rate-limited')
        setState({ kind: 'failed', message: 'Too many requests. Wait a few minutes, then try again.' });
      else setState({ kind: 'failed', message: 'We could not request a new email. Try again in a moment.' });
    }
  }

  if (state.kind === 'signed-out') {
    return (
      <p className={styles.message} role="status">
        <a className={styles.link} href={LOGIN_PATH}>
          Log in
        </a>{' '}
        to request a new verification email.
      </p>
    );
  }
  if (state.kind === 'already-verified') {
    return (
      <p className={styles.message} role="status">
        Your email address is already verified.
      </p>
    );
  }

  const canSend = state.kind === 'idle' || state.kind === 'failed' || (state.kind === 'sent' && state.canRetry);
  return (
    <div>
      {canSend || state.kind === 'sending' ? (
        <p className={styles.actions}>
          <button
            className={styles.button}
            type="button"
            onClick={() => void resend()}
            disabled={state.kind === 'sending'}
          >
            Send a new verification email
          </button>
        </p>
      ) : null}
      <p className={styles.message} role="status">
        {state.kind === 'sending' ? 'Sending…' : null}
        {state.kind === 'sent' || state.kind === 'failed' ? state.message : null}
      </p>
    </div>
  );
}
