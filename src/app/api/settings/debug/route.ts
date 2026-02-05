import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDb } from '@/db'
import { settings } from '@/db/schema'
import { isNull } from 'drizzle-orm'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getDb()

  // Fetch ALL global settings
  const allGlobalSettings = await db
    .select()
    .from(settings)
    .where(isNull(settings.userId))

  // Filter to just SMTP settings
  const smtpSettings = allGlobalSettings.filter(s =>
    s.key?.startsWith('smtp')
  )

  return NextResponse.json({
    totalGlobalSettings: allGlobalSettings.length,
    allGlobalSettings: allGlobalSettings.map(s => ({
      key: s.key,
      value: s.value,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    })),
    smtpSettings: smtpSettings.map(s => ({
      key: s.key,
      value: s.value,
    })),
  })
}
