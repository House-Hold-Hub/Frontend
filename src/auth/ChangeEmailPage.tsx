import { useId, useState, type FormEvent } from 'react';
import { isApiError, type ApiClient } from '../api';
import styles from './Auth.module.css';
import { describeDelivery, type DeliveryStatus } from './delivery';
import { LOGIN_PATH } from './paths';

type State =
  | { kind: 'editing' }
  | { kind: 'sending' }
  | { kind: 'sent'; status: DeliveryStatus; message: string; canRetry: boolean }
  | { kind: 'invalid' }
  | { kind: 'signed-out' }
  | { kind: 'reauthenticate' }
  | { kind: 'unusable' }
  | { kind: 'failed'; message: string };

/**
 * `requestPrimaryEmailChange`: needs a recently reauthenticated session
 * (ADR-011, ADR-016). The current address stays primary until the link sent
 * to the new one is opened in this same session while the login is still
 * recent, which is why the success text tells the user to open it promptly
 * in this browser.
 *
 * The response text names the address captured at submit time, never the live
 * field value, which the user may edit while the request is in flight.
 */
export function ChangeEmailPage({ api }: { api: ApiClient }) {
  const [state, setState] = useState<State>({ kind: 'editing' });
  const [newEmail, setNewEmail] = useState('');
  const inputId = useId();
  const errorId = useId();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitted = newEmail.trim();
    setState({ kind: 'sending' });
    try {
      const { delivery } = await api.request('post', '/auth/email/change', { body: { new_email: submitted } });
      setState({
        kind: 'sent',
        status: delivery.status,
        ...describeDelivery(delivery.status, `a confirmation link to ${submitted}`),
      });
    } catch (error) {
      const kind = isApiError(error) ? error.kind : 'unexpected';
      if (kind === 'validation') setState({ kind: 'invalid' });
      else if (kind === 'session-expired') setState({ kind: 'signed-out' });
      else if (kind === 'forbidden') setState({ kind: 'reauthenticate' });
      else if (kind === 'conflict') setState({ kind: 'unusable' });
      else if (kind === 'rate-limited')
        setState({ kind: 'failed', message: 'Too many requests. Wait a few minutes, then try again.' });
      else setState({ kind: 'failed', message: 'We could not request the change right now. Try again in a moment.' });
    }
  }

  if (state.kind === 'sent') {
    return (
      <main className={styles.page}>
        <h1 className={styles.title}>Change your email</h1>
        <p className={styles.message} role="status">
          {state.message}
        </p>
        <p className={styles.message}>
          Your current address stays in use until you confirm the new one.
          {state.status === 'failed'
            ? null
            : ' When the link arrives, open it in this browser soon: it only works in this session, shortly after you log in.'}
        </p>
        {state.canRetry ? (
          <p className={styles.actions}>
            <button className={styles.button} type="button" onClick={() => setState({ kind: 'editing' })}>
              Try again
            </button>
          </p>
        ) : null}
      </main>
    );
  }

  const fieldError =
    state.kind === 'invalid'
      ? 'Enter a valid email address.'
      : state.kind === 'unusable'
        ? 'This address cannot be used. It may already be your email or belong to another account.'
        : null;

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Change your email</h1>
      <form className={styles.form} onSubmit={(event) => void submit(event)} noValidate>
        <label htmlFor={inputId}>New email address</label>
        <input
          className={styles.input}
          id={inputId}
          type="email"
          autoComplete="email"
          required
          value={newEmail}
          onChange={(event) => setNewEmail(event.target.value)}
          aria-invalid={fieldError !== null}
          aria-describedby={fieldError === null ? undefined : errorId}
        />
        {fieldError === null ? null : (
          <p className={styles.message} id={errorId} role="alert">
            {fieldError}
          </p>
        )}
        <button className={styles.button} type="submit" disabled={state.kind === 'sending' || newEmail.trim() === ''}>
          Send confirmation link
        </button>
      </form>
      {state.kind === 'signed-out' || state.kind === 'reauthenticate' ? (
        <p className={styles.message} role="alert">
          {state.kind === 'signed-out'
            ? 'You are not logged in.'
            : 'For your security, changing your email requires a recent login.'}{' '}
          <a className={styles.link} href={LOGIN_PATH}>
            Log in again
          </a>
          , then request the change.
        </p>
      ) : null}
      {state.kind === 'failed' ? (
        <p className={styles.message} role="alert">
          {state.message}
        </p>
      ) : null}
    </main>
  );
}
