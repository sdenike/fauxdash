import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { users, passwordResetTokens } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { randomBytes } from 'crypto'
import { sendEmail, isSmtpConfigured } from '@/lib/email'
import { buildEmailHtml } from '@/lib/email-template'
import { getGlobalSettings } from '@/lib/settings-cache'
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

    // Read site title for subject line
    const settingsObj = await getGlobalSettings()
    const siteTitle = settingsObj.siteTitle || 'Faux|Dash'

    // Build email using shared template
    const html = await buildEmailHtml({
      title: 'Password Reset',
      body: `
        <p>You requested a password reset for your account.</p>
        <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
        <p style="margin-top: 24px; font-size: 12px; color: #71717a;">If you didn't request this, you can safely ignore this email.</p>
      `,
      buttonText: 'Reset Password',
      buttonUrl: resetUrl,
    })

    // Send email
    const result = await sendEmail(undefined, {
      to: user.email,
      subject: `Password Reset Request - ${siteTitle}`,
      text: `You requested a password reset for your ${siteTitle} account.\n\nClick the link below to reset your password:\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, you can safely ignore this email.\n\n--\n${siteTitle}`,
      html,
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
