import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/db';
import { serviceCategories, services } from '@/db/schema';
import { eq, and, asc, desc } from 'drizzle-orm';
import { cacheGet, cacheSet, cacheDel } from '@/lib/redis';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const db = getDb();

  // Check cache first
  const cacheKey = session ? `service-categories:auth:${session.user?.email}` : 'service-categories:public';
  const cached = await cacheGet(cacheKey);

  if (cached) {
    return NextResponse.json(cached);
  }

  let query = db
    .select()
    .from(serviceCategories)
    .orderBy(asc(serviceCategories.order));

  let categoriesData = await query;

  // Filter out categories that require auth if user is not logged in
  if (!session) {
    categoriesData = categoriesData.filter((cat: any) => !cat.requiresAuth && cat.isVisible);
  } else {
    categoriesData = categoriesData.filter((cat: any) => cat.isVisible);
  }

  // Get services for each category
  const categoriesWithServices = await Promise.all(
    categoriesData.map(async (category: any) => {
      // Determine sorting based on category.sortBy
      let orderByClause;
      switch (category.sortBy) {
        case 'name_asc':
          orderByClause = asc(services.name);
          break;
        case 'name_desc':
          orderByClause = desc(services.name);
          break;
        case 'clicks_asc':
          orderByClause = asc(services.clickCount);
          break;
        case 'clicks_desc':
          orderByClause = desc(services.clickCount);
          break;
        case 'order':
        default:
          orderByClause = asc(services.order);
          break;
      }

      let servicesQuery = db
        .select()
        .from(services)
        .where(eq(services.categoryId, category.id))
        .orderBy(orderByClause);

      let servicesData = await servicesQuery;

      // Filter services based on auth
      if (!session) {
        servicesData = servicesData.filter((svc: any) => !svc.requiresAuth && svc.isVisible);
      } else {
        servicesData = servicesData.filter((svc: any) => svc.isVisible);
      }

      return {
        ...category,
        services: servicesData,
      };
    })
  );

  // Cache for 5 minutes
  await cacheSet(cacheKey, categoriesWithServices, 300);

  return NextResponse.json(categoriesWithServices);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const db = getDb();

  const newCategory = await db.insert(serviceCategories).values({
    name: body.name,
    icon: body.icon || null,
    order: body.order || 0,
    columns: body.columns || 1,
    isVisible: body.isVisible ?? true,
    requiresAuth: body.requiresAuth ?? false,
    itemsToShow: body.itemsToShow ?? 5,
    showItemCount: body.showItemCount ?? true,
    autoExpanded: body.autoExpanded ?? false,
    showOpenAll: body.showOpenAll ?? false,
  }).returning();

  // Invalidate cache
  await cacheDel('service-categories:public');
  await cacheDel(`service-categories:auth:${session.user?.email}`);
  await cacheDel('services:public');
  await cacheDel(`services:auth:${session.user?.email}`);

  return NextResponse.json(newCategory[0]);
}
