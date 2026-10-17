/**
 * Browser routes of the email lifecycle. The two landing paths are the ones the
 * backend puts in the emails it sends (`<origin><path>#verifier=<bearer>`), so
 * they must stay in step with Backend `FRONTEND_EMAIL_VERIFICATION_PATH` and
 * `FRONTEND_PRIMARY_EMAIL_CHANGE_PATH`.
 */
export const VERIFY_EMAIL_PATH = '/verify-email';
export const VERIFY_EMAIL_CHANGE_PATH = '/verify-email-change';
export const CHANGE_EMAIL_PATH = '/account/email';

/** Planned login page (Frontend#6). Until it exists the link lands on the home page. */
export const LOGIN_PATH = '/login';
export const HOME_PATH = '/';

/** Strips one trailing slash so `/verify-email/` matches `/verify-email`. */
export function normalizePath(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}
