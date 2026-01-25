/**
 * Simple in-memory rate limiting for API routes
 * For production with multiple instances, use Redis-based rate limiting
 */

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
