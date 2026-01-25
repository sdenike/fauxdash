import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const db = getDb();
  const userId = (session.user as any).id;

  try {
    const updated = await db
      .update(users)
      .set({
        email: body.email,
        username: body.username,
        firstname: body.firstname || null,
        lastname: body.lastname || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, parseInt(userId)))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Failed to update user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
