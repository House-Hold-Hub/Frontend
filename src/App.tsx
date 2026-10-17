import { useState } from 'react';
import styles from './App.module.css';
import { ApiConfigError, createConfiguredApiClient, type ApiClient } from './api';
import { handOffBearer, type BearerHandoff } from './auth/bearerFragment';
import { ChangeEmailPage } from './auth/ChangeEmailPage';
import { CHANGE_EMAIL_PATH, normalizePath, VERIFY_EMAIL_CHANGE_PATH, VERIFY_EMAIL_PATH } from './auth/paths';
import { VerifyEmailChangePage } from './auth/VerifyEmailChangePage';
import { VerifyEmailPage } from './auth/VerifyEmailPage';
import { apiBaseUrl } from './config';

const NO_BEARER = handOffBearer(null);

const API_ROUTES: ReadonlySet<string> = new Set([VERIFY_EMAIL_PATH, VERIFY_EMAIL_CHANGE_PATH, CHANGE_EMAIL_PATH]);

export interface AppProps {
  /** Defaults to `location.pathname`. Navigation is full-page until protected routing lands (Frontend#7). */
  path?: string;
  /** The bearer `main.tsx` took from the fragment before rendering. */
  bearer?: BearerHandoff;
  api?: ApiClient;
}

export function App({ path = window.location.pathname, bearer = NO_BEARER, api }: AppProps) {
  const route = normalizePath(path);
  if (API_ROUTES.has(route)) return <ApiRoute route={route} bearer={bearer} api={api} />;

  return (
    <main className={styles.root}>
      <h1 className={styles.title}>HouseHoldHub</h1>
      <p className={styles.meta}>API: {apiBaseUrl || 'not configured'}</p>
    </main>
  );
}

function ApiRoute({ route, bearer, api }: { route: string; bearer: BearerHandoff; api?: ApiClient }) {
  // Created only on routes that call the API, once per page load.
  const [client] = useState(() => api ?? configuredClientOrError());
  if (client instanceof ApiConfigError) {
    return (
      <main className={styles.root}>
        <h1 className={styles.title}>HouseHoldHub</h1>
        <p className={styles.meta} role="alert">
          This page cannot reach the HouseHoldHub API because the app is misconfigured.
        </p>
      </main>
    );
  }
  if (route === VERIFY_EMAIL_PATH) return <VerifyEmailPage api={client} bearer={bearer} />;
  if (route === VERIFY_EMAIL_CHANGE_PATH) return <VerifyEmailChangePage api={client} bearer={bearer} />;
  return <ChangeEmailPage api={client} />;
}

function configuredClientOrError(): ApiClient | ApiConfigError {
  try {
    return createConfiguredApiClient();
  } catch (error) {
    if (error instanceof ApiConfigError) return error;
    throw error;
  }
}
