import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { statSync } from 'fs';
import Database from 'better-sqlite3';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const dbPath = process.env.SQLITE_FILE || '/data/fauxdash.db';

    // Get size before
    let sizeBefore = 0;
    try {
      const stats = statSync(dbPath);
      sizeBefore = stats.size;
    } catch (e) {
      return NextResponse.json({ error: 'Database file not found' }, { status: 404 });
    }

    // Run VACUUM
    const db = new Database(dbPath);
    try {
      // Run ANALYZE first for better query optimization
      db.exec('ANALYZE');
      // Run VACUUM to reclaim space
      db.exec('VACUUM');
      // Run integrity check
      const integrityCheck = db.prepare('PRAGMA integrity_check').get() as { integrity_check: string };
      if (integrityCheck.integrity_check !== 'ok') {
        return NextResponse.json({ error: 'Database integrity check failed' }, { status: 500 });
      }
    } finally {
      db.close();
    }

    // Get size after
    let sizeAfter = 0;
    try {
      const stats = statSync(dbPath);
      sizeAfter = stats.size;
    } catch (e) {
      // Ignore
    }

    const spaceSaved = sizeBefore - sizeAfter;

    // Format sizes
    const formatSize = (bytes: number) => {
      if (bytes > 1024 * 1024) {
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
      } else if (bytes > 1024) {
        return `${(bytes / 1024).toFixed(2)} KB`;
      }
      return `${bytes} bytes`;
    };

    return NextResponse.json({
      success: true,
      message: `Database optimized. Saved ${formatSize(spaceSaved)}.`,
      sizeBefore: formatSize(sizeBefore),
      sizeAfter: formatSize(sizeAfter),
      spaceSaved: formatSize(spaceSaved),
    });
  } catch (error: any) {
    console.error('Vacuum DB error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to optimize database' },
      { status: 500 }
    );
  }
}
