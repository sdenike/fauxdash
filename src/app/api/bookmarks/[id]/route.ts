import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/db';
import { bookmarks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { cacheDel } from '@/lib/redis';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const db = getDb();

  const updated = await db
    .update(bookmarks)
    .set({
      ...body,
      updatedAt: new Date(),
    })
    .where(eq(bookmarks.id, parseInt(id)))
    .returning();

  // Invalidate cache
  await cacheDel('categories:public');
  await cacheDel(`categories:auth:${session.user?.email}`);

  return NextResponse.json(updated[0]);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();

  await db
    .delete(bookmarks)
    .where(eq(bookmarks.id, parseInt(id)));

  // Invalidate cache
  await cacheDel('categories:public');
  await cacheDel(`categories:auth:${session.user?.email}`);

  return NextResponse.json({ success: true });
}
