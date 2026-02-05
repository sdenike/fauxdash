import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import { getDb } from '@/db'
import crypto from 'crypto'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getDb()
    // Get admin user email
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(session.user?.email) as any
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex')
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Store verification token
    db.prepare(`
      INSERT OR REPLACE INTO settings (key, value)
      VALUES ('smtpVerificationToken', ?), ('smtpVerificationExpiry', ?)
    `).run(token, expiry.toISOString())

    // Generate verification URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const verificationUrl = `${baseUrl}/api/settings/smtp-verify?token=${token}`

    // Send test email with verification link
    const result = await sendEmail(user.id, {
      to: user.email,
      subject: 'Verify Your SMTP Configuration - Faux|Dash',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Faux|Dash</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">SMTP Configuration Test</p>
          </div>

          <div style="background: #f9fafb; padding: 40px 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1a202c; margin-top: 0;">✅ SMTP Test Successful!</h2>

            <p style="color: #4a5568; font-size: 16px;">
              Your SMTP configuration is working correctly. This test email was sent successfully from your Faux|Dash instance.
            </p>

            <div style="background: #fff; border-left: 4px solid #48bb78; padding: 15px; margin: 25px 0; border-radius: 4px;">
              <p style="margin: 0; color: #2d3748; font-weight: 500;">
                <strong>Important:</strong> To activate SMTP for password resets and notifications, you must verify this email address.
              </p>
            </div>

            <p style="color: #4a5568; font-size: 16px;">
              Click the button below to verify and activate SMTP:
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                Verify & Activate SMTP
              </a>
            </div>

            <p style="color: #718096; font-size: 14px; margin-top: 30px;">
              Or copy and paste this link into your browser:
            </p>
            <p style="color: #4299e1; font-size: 13px; word-break: break-all; background: #fff; padding: 10px; border-radius: 4px; border: 1px solid #e2e8f0;">
              ${verificationUrl}
            </p>

            <p style="color: #a0aec0; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              This verification link will expire in 24 hours. If you didn't request this test, you can safely ignore this email.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
SMTP Test Successful!

Your SMTP configuration is working correctly. This test email was sent successfully from your Faux|Dash instance.

To activate SMTP for password resets and notifications, please verify this email address by visiting:

${verificationUrl}

This verification link will expire in 24 hours. If you didn't request this test, you can safely ignore this email.

--
Faux|Dash
      `.trim()
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
