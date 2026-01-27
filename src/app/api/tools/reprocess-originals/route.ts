import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/db';
import { bookmarks, services } from '@/db/schema';
import { join } from 'path';
import { existsSync, readdirSync } from 'fs';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getDb();
    const faviconDir = join(process.cwd(), 'public', 'favicons');

    // Get all bookmarks and services with favicon icons
    const allBookmarks = await db.select().from(bookmarks);
    const allServices = await db.select().from(services);

    const faviconItems = [
      ...allBookmarks.filter((b: { icon: string | null }) => b.icon?.startsWith('favicon:')),
      ...allServices.filter((s: { icon: string | null }) => s.icon?.startsWith('favicon:')),
    ];

    let processed = 0;
    let created = 0;
    let skipped = 0;
    let errors: string[] = [];

    for (const item of faviconItems) {
      processed++;

      // Extract filename from icon path
      let filename = item.icon!.replace('favicon:', '');
      if (filename.startsWith('/api/favicons/serve/')) {
        filename = filename.replace('/api/favicons/serve/', '');
      }

      // Get base name (strip transformation suffixes)
      const baseName = filename
        .replace(/_themed_[^.]+\.png$/, '')
        .replace(/_monotone_black\.png$/, '')
        .replace(/_monotone_white\.png$/, '')
        .replace(/_monotone$/, '')
        .replace(/_inverted\.png$/, '')
        .replace(/\.png$/, '');

      const originalPath = join(faviconDir, `${baseName}_original.png`);

      // Skip if original already exists
      if (existsSync(originalPath)) {
        skipped++;
        continue;
      }

      // Try to find the base file to create original from
      const basePath = join(faviconDir, `${baseName}.png`);
      const exactPath = join(faviconDir, filename);

      let sourcePath: string | null = null;
      if (existsSync(basePath)) {
        sourcePath = basePath;
      } else if (existsSync(exactPath)) {
        sourcePath = exactPath;
      }

      if (sourcePath) {
        try {
          await sharp(sourcePath).png().toFile(originalPath);
          created++;
        } catch (e: any) {
          errors.push(`Failed to create original for ${baseName}: ${e.message}`);
        }
      } else {
        errors.push(`No source file found for ${baseName}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processed} favicons. Created ${created} originals, skipped ${skipped}.`,
      processed,
      created,
      skipped,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    });
  } catch (error: any) {
    console.error('Reprocess originals error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reprocess originals' },
      { status: 500 }
    );
  }
}
