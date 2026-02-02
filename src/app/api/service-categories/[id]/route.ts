import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/db';
import { serviceCategories, services } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
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
    .update(serviceCategories)
    .set({
      ...body,
      updatedAt: new Date(),
    })
    .where(eq(serviceCategories.id, parseInt(id)))
    .returning();

  // Invalidate cache
  await cacheDel('service-categories:public');
  await cacheDel(`service-categories:auth:${session.user?.email}`);
  await cacheDel('services:public');
  await cacheDel(`services:auth:${session.user?.email}`);

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
  const categoryId = parseInt(id);

  // Check if there are services in this category
  const servicesInCategory = await db
    .select({ count: sql<number>`count(*)` })
    .from(services)
    .where(eq(services.categoryId, categoryId));

  const serviceCount = servicesInCategory[0]?.count || 0;

  if (serviceCount > 0) {
    // Get or create Uncategorized service category
    let uncategorized = await db
      .select()
      .from(serviceCategories)
      .where(eq(serviceCategories.name, 'Uncategorized'));

    let uncategorizedId: number;

    if (uncategorized.length === 0) {
      // Create Uncategorized category
      const maxOrder = await db
        .select({ max: sql<number>`COALESCE(MAX("order"), 0)` })
        .from(serviceCategories);

      const [newCategory] = await db.insert(serviceCategories).values({
        name: 'Uncategorized',
        icon: 'mdi:folder-alert',
        order: (maxOrder[0]?.max || 0) + 1,
        isVisible: true,
        autoExpanded: true,
      }).returning();

      uncategorizedId = newCategory.id;
    } else {
      uncategorizedId = uncategorized[0].id;
    }

    // Move services to Uncategorized
    await db
      .update(services)
      .set({ categoryId: uncategorizedId })
      .where(eq(services.categoryId, categoryId));
  }

  // Now delete the category
  await db
    .delete(serviceCategories)
    .where(eq(serviceCategories.id, categoryId));

  // Invalidate cache
  await cacheDel('service-categories:public');
  await cacheDel(`service-categories:auth:${session.user?.email}`);
  await cacheDel('services:public');
  await cacheDel(`services:auth:${session.user?.email}`);

  return NextResponse.json({ success: true, movedServices: serviceCount });
}
