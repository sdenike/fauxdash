/**
 * Session duration constants shared by server (auth) and client (login page).
 * Pure module — must stay free of server-only imports.
 */

/** Durations (days) offered by the login UI. Anything else is rejected. */
export const ALLOWED_REMEMBER_DAYS = [2, 7, 30, 90, 365] as const;

/** Applied when "remember me" is unchecked or the value is invalid. */
export const DEFAULT_REMEMBER_DAYS = 2;

/**
 * Session cookie ceiling. The cookie must outlive the longest remember choice;
 * the JWT's own exp (set per-login in sessionEncode) is what actually ends the
 * session — an expired JWT fails decode regardless of cookie lifetime.
 */
export const SESSION_ABSOLUTE_MAX_SECONDS = 365 * 24 * 60 * 60;

/**
 * Short-lived cookie carrying the remember choice across the OIDC redirect
 * round-trip (set by the login page, read in the jwt callback, expires in 10 min).
 */
export const REMEMBER_COOKIE_NAME = 'fauxdash-remember-duration';

export function clampRememberDays(input: unknown): number {
  const days = typeof input === 'number' ? input : parseInt(String(input ?? ''), 10);
  return (ALLOWED_REMEMBER_DAYS as readonly number[]).includes(days)
    ? days
    : DEFAULT_REMEMBER_DAYS;
}
