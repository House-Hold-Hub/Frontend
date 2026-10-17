import { normalizePath, VERIFY_EMAIL_CHANGE_PATH, VERIFY_EMAIL_PATH } from './paths';

/**
 * One-time email bearers arrive as `#verifier=<bearer>` (security model,
 * "Other bearer credentials"; ADR-013 transport rules). The fragment is never
 * sent to the server, but it stays in the address bar, in history and in any
 * script's view of `location` until it is removed, so it is taken out before
 * React renders anything.
 *
 * The value is returned to the caller and kept in memory only: it is never
 * written to localStorage, sessionStorage, history state, logs or telemetry.
 */
const BEARER_LANDING_PATHS: ReadonlySet<string> = new Set([VERIFY_EMAIL_PATH, VERIFY_EMAIL_CHANGE_PATH]);

export function isBearerLandingPath(pathname: string): boolean {
  return BEARER_LANDING_PATHS.has(normalizePath(pathname));
}

/**
 * Removes the fragment from the current history entry and returns the
 * `verifier` it carried, or null when there is none. Only bearer landing paths
 * are touched; elsewhere the fragment is left alone.
 */
export function takeBearerFromFragment(
  location: Pick<Location, 'pathname' | 'search' | 'hash'>,
  history: Pick<History, 'replaceState' | 'state'>,
): string | null {
  if (!isBearerLandingPath(location.pathname)) return null;
  const fragment = location.hash.startsWith('#') ? location.hash.slice(1) : location.hash;
  if (fragment === '') return null;

  // Strip first, whatever the fragment holds: a malformed one is still a secret.
  history.replaceState(history.state, '', `${location.pathname}${location.search}`);

  const verifier = new URLSearchParams(fragment).get('verifier');
  return verifier === null || verifier === '' ? null : verifier;
}

/**
 * Carries a taken bearer from bootstrap to the page that exchanges it. `take`
 * hands the value out once and drops the holder's reference, so the raw
 * verifier is not retained after the exchange (security model).
 */
export interface BearerHandoff {
  /** Whether a verifier was present on landing. Stays true after `take`. */
  readonly present: boolean;
  take(): string | null;
}

export function handOffBearer(verifier: string | null): BearerHandoff {
  const present = verifier !== null;
  let held = verifier;
  return {
    present,
    take() {
      const value = held;
      held = null;
      return value;
    },
  };
}
