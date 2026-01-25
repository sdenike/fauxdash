import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { users, passwordResetTokens } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { randomBytes } from 'crypto'
import { sendEmail, isSmtpConfigured } from '@/lib/email'
import { checkRateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Rate limiting
  const clientIp = getClientIp(request)
  const rateLimitResult = checkRateLimit(clientIp, RATE_LIMITS.passwordReset)

  if (!rateLimitResult.success) {
    return rateLimitResponse(rateLimitResult)
  }

  const body = await request.json()
  const { email } = body

  if (!email) {
    return NextResponse.json(
      { error: 'Email is required' },
      { status: 400 }
    )
  }

  // Always return the same message for security (don't reveal if email exists)
  const successMessage = 'If an account exists with this email, a password reset link has been sent.'

  // Check if SMTP is configured
  const smtpConfigured = await isSmtpConfigured()
  if (!smtpConfigured) {
    return NextResponse.json(
      { error: 'Password reset is not available. Please contact an administrator.' },
      { status: 503 }
    )
  }

  const db = getDb()

  try {
    // Find user by email (normalize to lowercase)
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1)

    if (!user) {
      // Return success even if user doesn't exist (for security)
      return NextResponse.json({ message: successMessage })
    }

    // Check if user has a password (not OIDC-only)
    if (!user.passwordHash) {
      // User is OIDC-only, can't reset password
      // Still return success for security
      return NextResponse.json({ message: successMessage })
    }

    // Generate secure token
    const token = randomBytes(32).toString('hex')

    // Token expires in 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    // Save token to database
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt,
    })

    // Build reset URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/reset-password?token=${token}`

    // Send email
    const result = await sendEmail(undefined, {
      to: user.email,
      subject: 'Password Reset Request - Faux|Dash',
      text: `You requested a password reset for your Faux|Dash account.\n\nClick the link below to reset your password:\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, you can safely ignore this email.`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e293b;">Password Reset Request</h2>
          <p>You requested a password reset for your Faux|Dash account.</p>
          <p>Click the button below to reset your password:</p>
          <p style="margin: 24px 0;">
            <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </p>
          <p style="color: #64748b; font-size: 14px;">This link will expire in 1 hour.</p>
          <p style="color: #64748b; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 12px;">Faux|Dash</p>
        </div>
      `,
    })

    if (!result.success) {
      console.error('Failed to send password reset email:', result.error)
      // Still return success message for security
    }

    return NextResponse.json({ message: successMessage })
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
