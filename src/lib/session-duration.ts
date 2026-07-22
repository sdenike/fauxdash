/**
 * Per-login session duration for NextAuth v4 (server side).
 *
 * Why this exists: setting `token.exp` inside the jwt callback does nothing —
 * next-auth's default encode() unconditionally stamps `exp = now + maxAge`
 * (jwt/index.js: `.setExpirationTime(now() + maxAge)`), where maxAge comes from
 * session.maxAge. The only sanctioned per-token seam is a custom jwt.encode,
 * which receives { token, secret, maxAge } and may override maxAge.
 */
import { encode as defaultEncode } from 'next-auth/jwt';
import type { JWTOptions } from 'next-auth/jwt';
import { clampRememberDays, DEFAULT_REMEMBER_DAYS } from './session-constants';

export {
  ALLOWED_REMEMBER_DAYS,
  DEFAULT_REMEMBER_DAYS,
  SESSION_ABSOLUTE_MAX_SECONDS,
  REMEMBER_COOKIE_NAME,
  clampRememberDays,
} from './session-constants';

/** JWT lifetime in seconds derived from the token's rememberDays claim. */
export function rememberMaxAgeSeconds(
  token: { rememberDays?: unknown } | null | undefined
): number {
  return clampRememberDays(token?.rememberDays) * 24 * 60 * 60;
}

/**
 * Drop-in for authOptions.jwt.encode. The rememberDays claim survives the
 * round-trip, so rolling refreshes (core/routes/session.js re-encodes on each
 * session read) keep extending by the user's chosen duration — an idle timeout
 * of exactly what they picked, not session.maxAge.
 */
export const sessionEncode: JWTOptions['encode'] = (params) =>
  defaultEncode({
    ...params,
    maxAge: rememberMaxAgeSeconds(params.token as { rememberDays?: unknown } | null),
  });
