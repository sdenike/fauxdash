/**
 * Rate limiting for API routes.
 * checkRateLimit: in-memory, per process (resets on restart).
 * checkRateLimitShared: Redis-backed when Redis is enabled so limits survive
 * restarts and are shared across instances; falls back to the in-memory
 * limiter when Redis is disabled, down or slow (never fails open).
 */
import { createHash } from 'crypto'
import { getRedis } from '@/lib/redis'

interface RateLimitEntry {
  count: number
  resetAt: number
}

interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyPrefix?: string // Prefix for the rate limit key
}

// In-memory store (use Redis for distributed systems)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries periodically
const CLEANUP_INTERVAL = 60 * 1000 // 1 minute
let lastCleanup = Date.now()

function cleanupExpiredEntries() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return

  lastCleanup = now
  rateLimitStore.forEach((entry, key) => {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  })
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
  retryAfter?: number // Seconds until retry is allowed
}

/**
 * Check and update rate limit for a given key
 */
export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  cleanupExpiredEntries()

  const fullKey = options.keyPrefix ? `${options.keyPrefix}:${key}` : key
  const now = Date.now()

  let entry = rateLimitStore.get(fullKey)

  // If no entry or entry expired, create new one
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 1,
      resetAt: now + options.windowMs,
    }
    rateLimitStore.set(fullKey, entry)
    return {
      success: true,
      remaining: options.maxRequests - 1,
      resetAt: entry.resetAt,
    }
  }

  // Increment count
  entry.count++

  // Check if over limit
  if (entry.count > options.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter,
    }
  }

  return {
    success: true,
    remaining: options.maxRequests - entry.count,
    resetAt: entry.resetAt,
  }
}

const REDIS_TIMEOUT_MS = 500

// Atomic fixed-window counter: INCR, set expiry on first hit, return count and remaining TTL.
export const REDIS_WINDOW_SCRIPT = `
local c = redis.call('INCR', KEYS[1])
if c == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
local ttl = redis.call('PTTL', KEYS[1])
if ttl < 0 then redis.call('PEXPIRE', KEYS[1], ARGV[1]); ttl = tonumber(ARGV[1]) end
return {c, ttl}
`

/**
 * Like checkRateLimit, but backed by Redis when available. The key is hashed so
 * identifiers such as email addresses are not stored in Redis in clear text.
 */
export async function checkRateLimitShared(
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const redis = getRedis()
  if (!redis) return checkRateLimit(key, options)

  const fullKey = `fauxdash:rl:${options.keyPrefix ?? 'default'}:${createHash('sha256').update(key).digest('hex')}`
  try {
    const reply = await Promise.race([
      redis.eval(REDIS_WINDOW_SCRIPT, 1, fullKey, String(options.windowMs)) as Promise<[number, number]>,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('redis rate-limit timeout')), REDIS_TIMEOUT_MS)
      ),
    ])
    const [count, ttlMs] = reply
    const resetAt = Date.now() + ttlMs
    if (count > options.maxRequests) {
      return { success: false, remaining: 0, resetAt, retryAfter: Math.max(1, Math.ceil(ttlMs / 1000)) }
    }
    return { success: true, remaining: options.maxRequests - count, resetAt }
  } catch (error) {
    console.error('Redis rate limit unavailable, using in-memory limiter:', (error as Error).message)
    return checkRateLimit(key, options)
  }
}

/**
 * Rate limit presets for common use cases
 */
export const RATE_LIMITS = {
  // Login attempts: 5 per minute per IP
  login: {
    windowMs: 60 * 1000,
    maxRequests: 5,
    keyPrefix: 'login',
  },
  // Password reset requests: 3 per hour per IP
  passwordReset: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 3,
    keyPrefix: 'password-reset',
  },
  // Password change: 5 per hour per user
  passwordChange: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 5,
    keyPrefix: 'password-change',
  },
  // General API: 100 per minute per IP
  api: {
    windowMs: 60 * 1000,
    maxRequests: 100,
    keyPrefix: 'api',
  },
  // SMTP test: 5 per minute per user
  smtpTest: {
    windowMs: 60 * 1000,
    maxRequests: 5,
    keyPrefix: 'smtp-test',
  },
} as const

/**
 * Get client IP from request headers
 */
export function getClientIp(request: Request): string {
  // Try various headers that might contain the real IP
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback to a default (shouldn't happen in production)
  return 'unknown'
}

/**
 * Create rate limit error response
 */
export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: 'Too many requests. Please try again later.',
      retryAfter: result.retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(result.retryAfter || 60),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
      },
    }
  )
}
