import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/db';
import { serviceCategories, services } from '@/db/schema';
import { eq, and, asc, desc, inArray } from 'drizzle-orm';
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

  // Fetch all services in a single query (fixes N+1 problem)
  const categoryIds = categoriesData.map((cat: any) => cat.id);
  let allServices = categoryIds.length > 0
    ? await db.select().from(services).where(
        categoryIds.length === 1
          ? eq(services.categoryId, categoryIds[0])
          : inArray(services.categoryId, categoryIds)
      )
    : [];

  // Filter services based on auth
  if (!session) {
    allServices = allServices.filter((svc: any) => !svc.requiresAuth && svc.isVisible);
  } else {
    allServices = allServices.filter((svc: any) => svc.isVisible);
  }

  // Group services by categoryId
  const servicesByCategory = new Map<number, any[]>();
  allServices.forEach((svc: any) => {
    const catId = svc.categoryId;
    if (!servicesByCategory.has(catId)) {
      servicesByCategory.set(catId, []);
    }
    servicesByCategory.get(catId)!.push(svc);
  });

  // Sort services per category based on category.sortBy setting
  const sortServices = (items: any[], sortBy: string) => {
    const sorted = [...items];
    switch (sortBy) {
      case 'name_asc':
        return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      case 'name_desc':
        return sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
      case 'clicks_asc':
        return sorted.sort((a, b) => (a.clickCount || 0) - (b.clickCount || 0));
      case 'clicks_desc':
        return sorted.sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0));
      case 'order':
      default:
        return sorted.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
  };

  // Build final result with sorted services
  const categoriesWithServices = categoriesData.map((category: any) => {
    const catServices = servicesByCategory.get(category.id) || [];
    return {
      ...category,
      services: sortServices(catServices, category.sortBy),
    };
  });

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
