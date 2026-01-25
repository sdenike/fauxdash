import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { testSmtpConnection } from '@/lib/email'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = (session.user as any).id

  const result = await testSmtpConnection(parseInt(userId))

  if (result.success) {
    return NextResponse.json({ success: true, message: 'SMTP connection successful' })
  } else {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 })
  }
}
