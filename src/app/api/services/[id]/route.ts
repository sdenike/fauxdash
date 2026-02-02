import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/db';
import { services } from '@/db/schema';
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
    .update(services)
    .set({
      ...body,
      updatedAt: new Date(),
    })
    .where(eq(services.id, parseInt(id)))
    .returning();

  // Invalidate cache
  await cacheDel('services:public');
  await cacheDel(`services:auth:${session.user?.email}`);
  await cacheDel('service-categories:public');
  await cacheDel(`service-categories:auth:${session.user?.email}`);

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
    .delete(services)
    .where(eq(services.id, parseInt(id)));

  // Invalidate cache
  await cacheDel('services:public');
  await cacheDel(`services:auth:${session.user?.email}`);
  await cacheDel('service-categories:public');
  await cacheDel(`service-categories:auth:${session.user?.email}`);

  return NextResponse.json({ success: true });
}
