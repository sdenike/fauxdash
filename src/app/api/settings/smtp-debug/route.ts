import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDb } from '@/db'
import { settings } from '@/db/schema'
import { eq, and, isNull, like } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getDb()
  const userId = (session.user as any).id

  // 1. Get ALL rows from settings table that have 'smtp' in the key
  const allSmtpRows = await db
    .select()
    .from(settings)
    .where(like(settings.key, '%smtp%'))

  // 2. Get global settings (userId = null)
  const globalSettings = await db
    .select()
    .from(settings)
    .where(isNull(settings.userId))

  // 3. Get user settings
  const userSettings = await db
    .select()
    .from(settings)
    .where(eq(settings.userId, parseInt(userId)))

  // 4. Filter to SMTP-related
  const globalSmtp = globalSettings.filter((s: any) => s.key?.startsWith('smtp'))
  const userSmtp = userSettings.filter((s: any) => s.key?.startsWith('smtp'))

  // 5. Build settingsObj the same way GET does
  const settingsObj: Record<string, string> = {}
  globalSettings.forEach((setting: any) => {
    settingsObj[setting.key] = setting.value || ''
  })
  userSettings.forEach((setting: any) => {
    settingsObj[setting.key] = setting.value || ''
  })

  // 6. Write a test value and read it back
  const testKey = '_smtp_debug_test'
  await db.delete(settings).where(eq(settings.key, testKey))
  await db.insert(settings).values({ key: testKey, value: 'works', userId: null })
  const [readBack] = await db.select().from(settings).where(eq(settings.key, testKey))
  await db.delete(settings).where(eq(settings.key, testKey))

  return NextResponse.json({
    diagnosis: {
      dbWriteReadTest: readBack?.value === 'works' ? 'PASS' : 'FAIL',
      totalSettingsRows: globalSettings.length + userSettings.length,
      globalSmtpCount: globalSmtp.length,
      userSmtpCount: userSmtp.length,
    },
    allSmtpRows: allSmtpRows.map((r: any) => ({
      id: r.id,
      userId: r.userId,
      key: r.key,
      value: r.key === 'smtpPassword' ? '***REDACTED***' : r.value,
    })),
    globalSmtp: globalSmtp.map((r: any) => ({
      key: r.key,
      value: r.key === 'smtpPassword' ? '***REDACTED***' : r.value,
      userId: r.userId,
    })),
    userSmtp: userSmtp.map((r: any) => ({
      key: r.key,
      value: r.key === 'smtpPassword' ? '***REDACTED***' : r.value,
      userId: r.userId,
    })),
    whatGetEndpointReturns: {
      smtpProvider: settingsObj.smtpProvider || process.env.SMTP_PROVIDER || 'none',
      smtpHost: settingsObj.smtpHost || process.env.SMTP_HOST || '',
      smtpUsername: settingsObj.smtpUsername || process.env.SMTP_USERNAME || '',
      smtpEncryption: settingsObj.smtpEncryption || process.env.SMTP_ENCRYPTION || 'tls',
      smtpFromEmail: settingsObj.smtpFromEmail || process.env.SMTP_FROM_EMAIL || '',
      smtpFromName: settingsObj.smtpFromName || process.env.SMTP_FROM_NAME || 'Faux|Dash',
    },
    rawSettingsObjSmtp: {
      smtpProvider: settingsObj.smtpProvider ?? '(undefined)',
      smtpHost: settingsObj.smtpHost ?? '(undefined)',
      smtpUsername: settingsObj.smtpUsername ?? '(undefined)',
    },
  }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
