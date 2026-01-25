import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/db';
import { services } from '@/db/schema';
import { asc } from 'drizzle-orm';
import { cacheDel, cacheGet, cacheSet } from '@/lib/redis';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const cacheKey = session ? `services:auth:${session.user?.email}` : 'services:public';

  // Check cache first
  const cached = await cacheGet(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  const db = getDb();
  let allServices = await db
    .select()
    .from(services)
    .orderBy(asc(services.order));

  // Filter based on auth status
  if (!session) {
    allServices = allServices.filter((s: any) => !s.requiresAuth && s.isVisible);
  } else {
    allServices = allServices.filter((s: any) => s.isVisible);
  }

  // Cache the result
  await cacheSet(cacheKey, allServices, 300); // 5 minutes

  return NextResponse.json(allServices);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const db = getDb();

  const newService = await db
    .insert(services)
    .values({
      name: body.name,
      url: body.url,
      description: body.description || null,
      icon: body.icon || null,
      categoryId: body.categoryId || null,
      order: body.order || 0,
      isVisible: body.isVisible !== undefined ? body.isVisible : true,
      requiresAuth: body.requiresAuth !== undefined ? body.requiresAuth : false,
    })
    .returning();

  // Invalidate cache
  await cacheDel('services:public');
  await cacheDel(`services:auth:${session.user?.email}`);
  await cacheDel('service-categories:public');
  await cacheDel(`service-categories:auth:${session.user?.email}`);

  return NextResponse.json(newService[0]);
}
