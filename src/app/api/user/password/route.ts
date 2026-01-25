import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDb } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import * as argon2 from 'argon2'
import { validatePassword } from '@/lib/validation/password'
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limiting by user ID
  const userId = (session.user as any).id
  const rateLimitResult = checkRateLimit(userId, RATE_LIMITS.passwordChange)

  if (!rateLimitResult.success) {
    return rateLimitResponse(rateLimitResult)
  }

  const body = await request.json()
  const { currentPassword, newPassword } = body

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: 'Current password and new password are required' },
      { status: 400 }
    )
  }

  // Validate password complexity
  const validation = validatePassword(newPassword)
  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors[0] },
      { status: 400 }
    )
  }

  const db = getDb()

  try {
    // Get current user with password hash
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(userId)))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { error: 'Cannot change password for OIDC-only accounts' },
        { status: 400 }
      )
    }

    // Verify current password
    const isValidPassword = await argon2.verify(user.passwordHash, currentPassword)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await argon2.hash(newPassword)

    // Update password
    await db
      .update(users)
      .set({
        passwordHash: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, parseInt(userId)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to change password:', error)
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    )
  }
}
