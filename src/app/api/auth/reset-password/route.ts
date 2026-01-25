import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { users, passwordResetTokens } from '@/db/schema'
import { eq, and, gt } from 'drizzle-orm'
import * as argon2 from 'argon2'
import { validatePassword } from '@/lib/validation/password'
import { checkRateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Rate limiting
  const clientIp = getClientIp(request)
  const rateLimitResult = checkRateLimit(clientIp, RATE_LIMITS.passwordReset)

  if (!rateLimitResult.success) {
    return rateLimitResponse(rateLimitResult)
  }

  const body = await request.json()
  const { token, newPassword } = body

  if (!token || !newPassword) {
    return NextResponse.json(
      { error: 'Token and new password are required' },
      { status: 400 }
    )
  }

  // Validate password complexity
  const validation = validatePassword(newPassword)
  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors[0] },
      { status: 400 }
    )
  }

  // Validate token format (should be 64 hex characters)
  if (!/^[a-f0-9]{64}$/i.test(token)) {
    return NextResponse.json(
      { error: 'Invalid token format' },
      { status: 400 }
    )
  }

  const db = getDb()

  try {
    // Find valid, unused token that hasn't expired
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, false),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      )
      .limit(1)

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link. Please request a new password reset.' },
        { status: 400 }
      )
    }

    // Get the user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, resetToken.userId))
      .limit(1)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Hash new password
    const hashedPassword = await argon2.hash(newPassword)

    // Update user's password
    await db
      .update(users)
      .set({
        passwordHash: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))

    // Mark token as used
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, resetToken.id))

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
    })
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    )
  }
}

// GET endpoint to validate token before showing the form
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json(
      { valid: false, error: 'Token is required' },
      { status: 400 }
    )
  }

  // Validate token format
  if (!/^[a-f0-9]{64}$/i.test(token)) {
    return NextResponse.json({
      valid: false,
      error: 'Invalid token format',
    })
  }

  const db = getDb()

  try {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, false),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      )
      .limit(1)

    if (!resetToken) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid or expired reset link',
      })
    }

    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error('Token validation error:', error)
    return NextResponse.json(
      { valid: false, error: 'An error occurred' },
      { status: 500 }
    )
  }
}
