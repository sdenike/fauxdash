import nodemailer from 'nodemailer'
import { getDb } from '@/db'
import { settings, users } from '@/db/schema'
import { eq, isNull } from 'drizzle-orm'

interface SmtpConfig {
  provider: 'none' | 'custom' | 'google'
  host: string
  port: number
  username: string
  password: string
  encryption: 'none' | 'tls' | 'ssl'
  fromEmail: string
  fromName: string
}

interface EmailOptions {
  to: string
  subject: string
  text?: string
  html?: string
}

// Get the first admin user's ID for system emails (like password reset)
async function getAdminUserId(): Promise<number | null> {
  const db = getDb()
  const adminUsers = await db
    .select()
    .from(users)
    .where(eq(users.isAdmin, true))
    .limit(1)

  return adminUsers.length > 0 ? adminUsers[0].id : null
}

async function getSmtpConfig(userId?: number): Promise<SmtpConfig | null> {
  const db = getDb()

  // SMTP settings are stored globally (userId = null)
  const globalSettings = await db
    .select()
    .from(settings)
    .where(isNull(settings.userId))

  const settingsObj: Record<string, string> = {}
  globalSettings.forEach((setting: any) => {
    settingsObj[setting.key] = setting.value || ''
  })

  const provider = settingsObj.smtpProvider || process.env.SMTP_PROVIDER || 'none'

  if (provider === 'none') {
    return null
  }

  // For Google, use preset host/port
  if (provider === 'google') {
    return {
      provider: 'google',
      host: 'smtp.gmail.com',
      port: 587,
      username: settingsObj.smtpUsername || process.env.SMTP_USERNAME || '',
      password: settingsObj.smtpPassword || process.env.SMTP_PASSWORD || '',
      encryption: 'tls',
      fromEmail: settingsObj.smtpFromEmail || settingsObj.smtpUsername || process.env.SMTP_FROM_EMAIL || '',
      fromName: settingsObj.smtpFromName || process.env.SMTP_FROM_NAME || 'Faux|Dash',
    }
  }

  // Custom SMTP
  return {
    provider: 'custom',
    host: settingsObj.smtpHost || process.env.SMTP_HOST || '',
    port: parseInt(settingsObj.smtpPort || process.env.SMTP_PORT || '587'),
    username: settingsObj.smtpUsername || process.env.SMTP_USERNAME || '',
    password: settingsObj.smtpPassword || process.env.SMTP_PASSWORD || '',
    encryption: (settingsObj.smtpEncryption || process.env.SMTP_ENCRYPTION || 'tls') as 'none' | 'tls' | 'ssl',
    fromEmail: settingsObj.smtpFromEmail || process.env.SMTP_FROM_EMAIL || '',
    fromName: settingsObj.smtpFromName || process.env.SMTP_FROM_NAME || 'Faux|Dash',
  }
}

export async function isSmtpConfigured(userId?: number): Promise<boolean> {
  const config = await getSmtpConfig(userId)
  if (!config) return false

  // Check if minimum required fields are set
  return !!(config.host && config.username && config.password && config.fromEmail)
}

export async function sendEmail(userId: number | undefined, options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  const config = await getSmtpConfig(userId)

  if (!config) {
    return { success: false, error: 'SMTP is not configured' }
  }

  if (!config.host || !config.username || !config.password) {
    return { success: false, error: 'SMTP configuration is incomplete' }
  }

  try {
    const transportOptions: nodemailer.TransportOptions = {
      host: config.host,
      port: config.port,
      secure: config.encryption === 'ssl',
      auth: {
        user: config.username,
        pass: config.password,
      },
    } as any

    // Add TLS options for non-ssl connections
    if (config.encryption === 'tls') {
      (transportOptions as any).requireTLS = true
    }

    const transporter = nodemailer.createTransport(transportOptions)

    await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    })

    return { success: true }
  } catch (error: any) {
    console.error('Failed to send email:', error)
    return { success: false, error: error.message || 'Failed to send email' }
  }
}

export async function testSmtpConnection(userId?: number): Promise<{ success: boolean; error?: string }> {
  const config = await getSmtpConfig(userId)

  if (!config) {
    return { success: false, error: 'SMTP is not configured' }
  }

  if (!config.host || !config.username || !config.password) {
    return { success: false, error: 'SMTP configuration is incomplete' }
  }

  try {
    const transportOptions: nodemailer.TransportOptions = {
      host: config.host,
      port: config.port,
      secure: config.encryption === 'ssl',
      auth: {
        user: config.username,
        pass: config.password,
      },
    } as any

    if (config.encryption === 'tls') {
      (transportOptions as any).requireTLS = true
    }

    const transporter = nodemailer.createTransport(transportOptions)

    await transporter.verify()

    return { success: true }
  } catch (error: any) {
    console.error('SMTP connection test failed:', error)
    return { success: false, error: error.message || 'Failed to connect to SMTP server' }
  }
}
