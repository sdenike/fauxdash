import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import { buildEmailHtml } from '@/lib/email-template'
import { getDb } from '@/db'
import { users, settings } from '@/db/schema'
import { eq, isNull } from 'drizzle-orm'
import crypto from 'crypto'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getDb()

    // Get admin user email
    const [user] = await db.select().from(users).where(eq(users.email, session.user?.email || ''))
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex')
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Store verification token - delete old ones first, then insert new
    await db.delete(settings).where(eq(settings.key, 'smtpVerificationToken'))
    await db.delete(settings).where(eq(settings.key, 'smtpVerificationExpiry'))

    await db.insert(settings).values([
      { key: 'smtpVerificationToken', value: token, userId: null },
      { key: 'smtpVerificationExpiry', value: expiry.toISOString(), userId: null }
    ])

    // Generate verification URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const verificationUrl = `${baseUrl}/api/settings/smtp-verify?token=${token}`

    // Read site title for subject line
    const globalSettings = await db.select().from(settings).where(isNull(settings.userId))
    const settingsObj: Record<string, string> = {}
    globalSettings.forEach((s: any) => { settingsObj[s.key] = s.value || '' })
    const siteTitle = settingsObj.siteTitle || 'Faux|Dash'

    // Build email using shared template
    const html = await buildEmailHtml({
      title: 'Test Email',
      body: `
        <p>Your email setup is working correctly!</p>
        <p>To activate SMTP for password resets and notifications, click the button below to verify your configuration.</p>
        <p style="margin-top: 24px; font-size: 12px; color: #71717a;">This verification link will expire in 24 hours. If you didn't request this test, you can safely ignore this email.</p>
      `,
      buttonText: 'Verify & Activate SMTP',
      buttonUrl: verificationUrl,
    })

    // Send test email with verification link
    const result = await sendEmail(user.id, {
      to: user.email,
      subject: `Verify Your SMTP Configuration - ${siteTitle}`,
      html,
      text: `SMTP Test Successful!\n\nYour email setup is working correctly.\n\nTo activate SMTP for password resets and notifications, please verify by visiting:\n${verificationUrl}\n\nThis verification link will expire in 24 hours.\n\n--\n${siteTitle}`,
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test email sent to ${user.email}. Please check your inbox and click the verification link to activate SMTP.`
      })
    } else {
      return NextResponse.json({
        error: result.error || 'Failed to send test email'
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('SMTP test email error:', error)
    return NextResponse.json({
      error: error.message || 'Failed to send test email'
    }, { status: 500 })
  }
}
