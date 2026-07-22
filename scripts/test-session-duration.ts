/**
 * Tests for remember-me session duration (scripts/test-session-duration.ts).
 * Run: npx tsx scripts/test-session-duration.ts
 *
 * No test framework in this repo — plain node:assert, exits non-zero on failure.
 */
import assert from 'node:assert/strict';
import { encode as defaultEncode, decode as defaultDecode } from 'next-auth/jwt';
import {
  ALLOWED_REMEMBER_DAYS,
  DEFAULT_REMEMBER_DAYS,
  SESSION_ABSOLUTE_MAX_SECONDS,
  clampRememberDays,
  rememberMaxAgeSeconds,
  sessionEncode,
} from '../src/lib/session-duration';

const SECRET = 'test-secret-0123456789-0123456789-0123456789';
const DAY = 24 * 60 * 60;
const now = () => Math.floor(Date.now() / 1000);
// generous tolerance for slow CI
const approx = (actual: number, expected: number, tolerance = 120) =>
  Math.abs(actual - expected) <= tolerance;

async function main() {
  // ---------------------------------------------------------------------------
  // Baseline: documents the original bug. Setting token.exp in the jwt callback
  // does NOT control the JWT lifetime — next-auth's default encode() clobbers it
  // with now + maxAge (session.maxAge). This is why "remember me for a year"
  // died after 2 days.
  // ---------------------------------------------------------------------------
  {
    const jwtWithCustomExp = { sub: '1', isAdmin: false, exp: now() + 30 * DAY };
    const encoded = await defaultEncode({ token: jwtWithCustomExp, secret: SECRET, maxAge: 2 * DAY });
    const decoded = await defaultDecode({ token: encoded, secret: SECRET });
    assert.ok(decoded?.exp, 'decoded token has exp');
    assert.ok(
      approx(decoded!.exp as number, now() + 2 * DAY),
      `BASELINE: default encode clobbers token.exp with maxAge (got exp in ${((decoded!.exp as number) - now()) / DAY} days)`
    );
    console.log('PASS baseline: default encode ignores token.exp (the original bug)');
  }

  // ---------------------------------------------------------------------------
  // clampRememberDays: only whitelisted durations survive; garbage → default.
  // ---------------------------------------------------------------------------
  {
    assert.equal(clampRememberDays('7'), 7);
    assert.equal(clampRememberDays(7), 7);
    assert.equal(clampRememberDays('30'), 30);
    assert.equal(clampRememberDays('90'), 90);
    assert.equal(clampRememberDays('365'), 365);
    assert.equal(clampRememberDays('2'), 2);
    assert.equal(clampRememberDays('999'), DEFAULT_REMEMBER_DAYS, 'non-whitelisted rejected');
    assert.equal(clampRememberDays('-5'), DEFAULT_REMEMBER_DAYS);
    assert.equal(clampRememberDays('abc'), DEFAULT_REMEMBER_DAYS);
    assert.equal(clampRememberDays(undefined), DEFAULT_REMEMBER_DAYS);
    assert.equal(clampRememberDays(null), DEFAULT_REMEMBER_DAYS);
    assert.equal(clampRememberDays(''), DEFAULT_REMEMBER_DAYS);
    console.log('PASS clampRememberDays');
  }

  // ---------------------------------------------------------------------------
  // rememberMaxAgeSeconds: derives seconds from the token claim.
  // ---------------------------------------------------------------------------
  {
    assert.equal(rememberMaxAgeSeconds({ rememberDays: 30 }), 30 * DAY);
    assert.equal(rememberMaxAgeSeconds({}), DEFAULT_REMEMBER_DAYS * DAY);
    assert.equal(rememberMaxAgeSeconds(null), DEFAULT_REMEMBER_DAYS * DAY);
    assert.equal(rememberMaxAgeSeconds({ rememberDays: 99999 }), DEFAULT_REMEMBER_DAYS * DAY);
    console.log('PASS rememberMaxAgeSeconds');
  }

  // ---------------------------------------------------------------------------
  // sessionEncode: the fix. Per-token maxAge from rememberDays claim wins over
  // the framework-supplied session.maxAge param.
  // ---------------------------------------------------------------------------
  {
    // remember 365 days — framework passes its default maxAge, ours must win
    const encoded = await sessionEncode({
      token: { sub: '1', isAdmin: false, rememberDays: 365 },
      secret: SECRET,
      maxAge: SESSION_ABSOLUTE_MAX_SECONDS,
    } as any);
    const decoded = await defaultDecode({ token: encoded, secret: SECRET });
    assert.ok(
      approx(decoded!.exp as number, now() + 365 * DAY),
      `remember-365 token expires in ~365 days (got ${((decoded!.exp as number) - now()) / DAY})`
    );
    assert.equal(decoded!.rememberDays, 365, 'claim survives round-trip for rolling refresh');
  }
  {
    // no remember choice — falls back to the 2-day default
    const encoded = await sessionEncode({
      token: { sub: '1', isAdmin: false },
      secret: SECRET,
      maxAge: SESSION_ABSOLUTE_MAX_SECONDS,
    } as any);
    const decoded = await defaultDecode({ token: encoded, secret: SECRET });
    assert.ok(
      approx(decoded!.exp as number, now() + DEFAULT_REMEMBER_DAYS * DAY),
      `no-remember token expires in ~${DEFAULT_REMEMBER_DAYS} days (got ${((decoded!.exp as number) - now()) / DAY})`
    );
    console.log('PASS sessionEncode per-token expiry');
  }

  // ---------------------------------------------------------------------------
  // Enforcement: an expired token is rejected by decode (this is what logs the
  // user out after their chosen duration, even though the cookie lives longer).
  // ---------------------------------------------------------------------------
  {
    // -1h: decisively past v4 decode's clockTolerance of 15s (jwt/index.js)
    const encoded = await defaultEncode({ token: { sub: '1', isAdmin: false }, secret: SECRET, maxAge: -3600 });
    await assert.rejects(
      () => defaultDecode({ token: encoded, secret: SECRET }),
      /exp|expired/i,
      'expired JWT must be rejected by decode'
    );
    console.log('PASS expired-token rejection');
  }

  // ---------------------------------------------------------------------------
  // Sanity: config invariants the fix relies on.
  // ---------------------------------------------------------------------------
  {
    assert.equal(SESSION_ABSOLUTE_MAX_SECONDS, 365 * DAY, 'cookie ceiling covers the longest choice');
    assert.ok(ALLOWED_REMEMBER_DAYS.includes(DEFAULT_REMEMBER_DAYS), 'default is an allowed value');
    const max = Math.max(...ALLOWED_REMEMBER_DAYS);
    assert.ok(max * DAY <= SESSION_ABSOLUTE_MAX_SECONDS, 'no choice exceeds the cookie ceiling');
    console.log('PASS config invariants');
  }

  console.log('\nALL TESTS PASSED');
}

main().catch((err) => {
  console.error('\nTEST FAILURE:', err.message);
  process.exit(1);
});
