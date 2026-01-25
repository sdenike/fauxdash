import { NextResponse } from 'next/server'
import { isSmtpConfigured } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Check if SMTP is configured using admin settings
  const configured = await isSmtpConfigured()

  return NextResponse.json({ configured })
}
