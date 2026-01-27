import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/db';
import { categories, bookmarks, serviceCategories, services } from '@/db/schema';
import { asc } from 'drizzle-orm';

// Helper to escape CSV fields
function escapeCSV(value: string | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // If contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Helper to get exportable icon value
function getExportableIcon(icon: string | null): string {
  if (!icon) return '';

  // selfhst icons - export full value
  if (icon.startsWith('selfhst:')) {
    return icon;
  }

  // HeroIcon names - export the name
  if (!icon.startsWith('favicon:') && !icon.startsWith('/')) {
    return icon;
  }

  // Favicon icons - cannot be exported, leave empty
  if (icon.startsWith('favicon:')) {
    return '';
  }

  return '';
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getDb();

    // Fetch all data
    const allCategories = await db.select().from(categories).orderBy(asc(categories.order));
    const allBookmarks = await db.select().from(bookmarks).orderBy(asc(bookmarks.order));
    const allServiceCategories = await db.select().from(serviceCategories).orderBy(asc(serviceCategories.order));
    const allServices = await db.select().from(services).orderBy(asc(services.order));

    // Build CSV
    const csvRows: string[] = [
      '# Favicons are not exported. Use Icon column for HeroIcons or selfhst: icons only.',
      'Section,Category,Name,Description,URL,Icon'
    ];

    // Add bookmarks
    for (const bookmark of allBookmarks) {
      const cat = allCategories.find((c: { id: number }) => c.id === bookmark.categoryId);
      csvRows.push([
        'Bookmarks',
        escapeCSV((cat as any)?.name || 'Uncategorized'),
        escapeCSV(bookmark.name),
        escapeCSV(bookmark.description),
        escapeCSV(bookmark.url),
        escapeCSV(getExportableIcon(bookmark.icon))
      ].join(','));
    }

    // Add services
    for (const service of allServices) {
      const cat = allServiceCategories.find((c: { id: number }) => c.id === service.categoryId);
      csvRows.push([
        'Services',
        escapeCSV((cat as any)?.name || 'Uncategorized'),
        escapeCSV(service.name),
        escapeCSV(service.description),
        escapeCSV(service.url),
        escapeCSV(getExportableIcon(service.icon))
      ].join(','));
    }

    const csvContent = csvRows.join('\n');
    const date = new Date().toISOString().split('T')[0];

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="fauxdash-export-${date}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('CSV export error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export CSV' },
      { status: 500 }
    );
  }
}
