import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db'
import { settings } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const db = getDb()
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return new NextResponse(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Invalid Verification Link</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .container { background: white; padding: 40px; border-radius: 10px; max-width: 500px; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
            h1 { color: #e53e3e; margin: 0 0 20px 0; }
            p { color: #4a5568; line-height: 1.6; }
            a { color: #667eea; text-decoration: none; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Invalid Link</h1>
            <p>This verification link is invalid or malformed.</p>
            <p><a href="/admin/settings">Return to Settings</a></p>
          </div>
        </body>
        </html>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      })
    }

    // Get stored token and expiry
    const [storedToken] = await db.select().from(settings).where(eq(settings.key, 'smtpVerificationToken'))
    const [storedExpiry] = await db.select().from(settings).where(eq(settings.key, 'smtpVerificationExpiry'))

    if (!storedToken || !storedExpiry) {
      return new NextResponse(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>No Verification Pending</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .container { background: white; padding: 40px; border-radius: 10px; max-width: 500px; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
            h1 { color: #ed8936; margin: 0 0 20px 0; }
            p { color: #4a5568; line-height: 1.6; }
            a { color: #667eea; text-decoration: none; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>⚠️ No Verification Pending</h1>
            <p>There is no SMTP verification pending. Please send a new test email from the settings page.</p>
            <p><a href="/admin/settings">Go to Settings</a></p>
          </div>
        </body>
        </html>
      `, {
        status: 404,
        headers: { 'Content-Type': 'text/html' }
      })
    }

    // Check if token matches
    if (storedToken.value !== token) {
      return new NextResponse(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Invalid Token</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .container { background: white; padding: 40px; border-radius: 10px; max-width: 500px; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
            h1 { color: #e53e3e; margin: 0 0 20px 0; }
            p { color: #4a5568; line-height: 1.6; }
            a { color: #667eea; text-decoration: none; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Invalid Token</h1>
            <p>This verification token is invalid or has already been used.</p>
            <p><a href="/admin/settings">Return to Settings</a></p>
          </div>
        </body>
        </html>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      })
    }

    // Check if token has expired
    const expiry = new Date(storedExpiry.value!)
    if (expiry < new Date()) {
      return new NextResponse(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Link Expired</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .container { background: white; padding: 40px; border-radius: 10px; max-width: 500px; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
            h1 { color: #ed8936; margin: 0 0 20px 0; }
            p { color: #4a5568; line-height: 1.6; }
            a { color: #667eea; text-decoration: none; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>⏰ Link Expired</h1>
            <p>This verification link has expired. Please send a new test email from the settings page.</p>
            <p><a href="/admin/settings">Go to Settings</a></p>
          </div>
        </body>
        </html>
      `, {
        status: 410,
        headers: { 'Content-Type': 'text/html' }
      })
    }

    // Mark SMTP as verified - delete old value first, then insert
    await db.delete(settings).where(eq(settings.key, 'smtpVerified'))
    await db.insert(settings).values({ key: 'smtpVerified', value: 'true', userId: null })

    // Clean up verification tokens
    await db.delete(settings).where(eq(settings.key, 'smtpVerificationToken'))
    await db.delete(settings).where(eq(settings.key, 'smtpVerificationExpiry'))

    // Return success page
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>SMTP Verified Successfully</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          .container { background: white; padding: 40px; border-radius: 10px; max-width: 500px; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
          h1 { color: #48bb78; margin: 0 0 20px 0; font-size: 32px; }
          p { color: #4a5568; line-height: 1.6; margin: 15px 0; }
          .success-icon { font-size: 64px; margin-bottom: 20px; }
          a { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">✅</div>
          <h1>SMTP Verified!</h1>
          <p>Your SMTP configuration has been successfully verified and activated.</p>
          <p>Password reset emails and notifications will now be sent using your SMTP settings.</p>
          <a href="/admin/settings">Return to Settings</a>
        </div>
      </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    })
  } catch (error: any) {
    console.error('SMTP verification error:', error)
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Verification Error</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          .container { background: white; padding: 40px; border-radius: 10px; max-width: 500px; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
          h1 { color: #e53e3e; margin: 0 0 20px 0; }
          p { color: #4a5568; line-height: 1.6; }
          a { color: #667eea; text-decoration: none; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>❌ Verification Error</h1>
          <p>An error occurred during verification. Please try again or contact support.</p>
          <p><a href="/admin/settings">Return to Settings</a></p>
        </div>
      </body>
      </html>
    `, {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    })
  }
}
