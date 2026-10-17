import { isApiError, type ApiClient } from '../api';
import type { ResponseOf } from '../api/types';

export type CurrentUser = ResponseOf<'/auth/me', 'get'>;

/**
 * Re-reads the session after a lifecycle call that may have rotated it.
 * The server is authoritative: `null` means there is no session, `undefined`
 * that it could not be determined (network or server failure).
 */
export async function fetchCurrentUser(api: ApiClient): Promise<CurrentUser | null | undefined> {
  try {
    return await api.request('get', '/auth/me');
  } catch (error) {
    if (isApiError(error) && error.kind === 'session-expired') return null;
    return undefined;
  }
}
