import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/db';
import { bookmarks, services } from '@/db/schema';
import { join } from 'path';
import { readdirSync, statSync, unlinkSync } from 'fs';

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

    // Build set of referenced favicon base names
    const referencedBases = new Set<string>();

    for (const item of [...allBookmarks, ...allServices]) {
      if (item.icon?.startsWith('favicon:')) {
        let filename = item.icon.replace('favicon:', '');
        if (filename.startsWith('/api/favicons/serve/')) {
          filename = filename.replace('/api/favicons/serve/', '');
        }

        // Get base name (strip transformation and _original suffixes)
        const baseName = filename
          .replace(/_themed_[^.]+\.png$/, '')
          .replace(/_monotone_black\.png$/, '')
          .replace(/_monotone_white\.png$/, '')
          .replace(/_monotone$/, '')
          .replace(/_inverted\.png$/, '')
          .replace(/_original\.png$/, '')
          .replace(/\.png$/, '');

        referencedBases.add(baseName);
      }
    }

    // Scan favicon directory
    let files: string[] = [];
    try {
      files = readdirSync(faviconDir).filter(f => f.endsWith('.png'));
    } catch (e) {
      return NextResponse.json({ error: 'Could not read favicon directory' }, { status: 500 });
    }

    let totalFiles = files.length;
    let removed = 0;
    let spaceFreed = 0;

    for (const file of files) {
      // Get base name from file
      const baseName = file
        .replace(/_themed_[^.]+\.png$/, '')
        .replace(/_monotone_black\.png$/, '')
        .replace(/_monotone_white\.png$/, '')
        .replace(/_inverted\.png$/, '')
        .replace(/_original\.png$/, '')
        .replace(/\.png$/, '');

      // If this base name is not referenced, it's an orphan
      if (!referencedBases.has(baseName)) {
        const filePath = join(faviconDir, file);
        try {
          const stats = statSync(filePath);
          spaceFreed += stats.size;
          unlinkSync(filePath);
          removed++;
        } catch (e) {
          // Ignore deletion errors
        }
      }
    }

    // Format space freed
    let spaceFreedStr = `${spaceFreed} bytes`;
    if (spaceFreed > 1024 * 1024) {
      spaceFreedStr = `${(spaceFreed / (1024 * 1024)).toFixed(2)} MB`;
    } else if (spaceFreed > 1024) {
      spaceFreedStr = `${(spaceFreed / 1024).toFixed(2)} KB`;
    }

    return NextResponse.json({
      success: true,
      message: `Removed ${removed} orphan files, freed ${spaceFreedStr}`,
      totalFiles,
      removed,
      spaceFreed: spaceFreedStr,
    });
  } catch (error: any) {
    console.error('Prune orphans error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to prune orphans' },
      { status: 500 }
    );
  }
}
