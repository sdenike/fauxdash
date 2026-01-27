import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { join } from 'path';
import { existsSync, readdirSync } from 'fs';
import sharp from 'sharp';
import { getDb } from '@/db';
import { bookmarks, services } from '@/db/schema';
import { fetchAndSaveFavicon, getFaviconDir, validateFaviconFile } from '@/lib/favicon-utils';
import { logFavicon } from '@/lib/logger';

// Helper to find the original file for a given favicon
async function findOriginalFile(filename: string, faviconDir: string): Promise<string | null> {
  const baseName = filename
    .replace(/_themed_[^.]+\.png$/, '')
    .replace(/_monotone_black\.png$/, '')
    .replace(/_monotone_white\.png$/, '')
    .replace(/_monotone$/, '')
    .replace(/_inverted\.png$/, '')
    .replace(/\.png$/, '');

  const originalPath = join(faviconDir, `${baseName}_original.png`);
  if (existsSync(originalPath)) {
    return originalPath;
  }

  try {
    const files = readdirSync(faviconDir);
    const match = baseName.match(/^(.+?)_(\d+)/);
    if (match) {
      const [, domain, timestamp] = match;
      const originalFile = files.find(f => f.startsWith(`${domain}_${timestamp}`) && f.includes('_original.png'));
      if (originalFile) {
        return join(faviconDir, originalFile);
      }
    }
  } catch (e) {
    // Ignore errors
  }

  const basePath = join(faviconDir, `${baseName}.png`);
  if (existsSync(basePath)) {
    return basePath;
  }

  const exactPath = join(faviconDir, filename);
  if (existsSync(exactPath)) {
    return exactPath;
  }

  return null;
}

// Helper to find the URL for a favicon from the database
async function findUrlForFavicon(faviconPath: string): Promise<string | null> {
  try {
    const db = getDb();
    const allBookmarks = await db.select().from(bookmarks);
    const allServices = await db.select().from(services);

    for (const bookmark of allBookmarks) {
      if (bookmark.icon?.includes(faviconPath.replace('/app/public/favicons/', '').replace('.png', ''))) {
        return bookmark.url;
      }
    }

    for (const service of allServices) {
      if (service.icon?.includes(faviconPath.replace('/app/public/favicons/', '').replace('.png', ''))) {
        return service.url;
      }
    }
  } catch (e) {
    logFavicon('error', 'Error finding URL for favicon', { error: e });
  }
  return null;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { favicon, itemUrl } = await request.json();

  if (!favicon || !favicon.startsWith('favicon:')) {
    return NextResponse.json({ error: 'Invalid favicon path' }, { status: 400 });
  }

  try {
    let filename = favicon.replace('favicon:', '');
    if (filename.startsWith('/api/favicons/serve/')) {
      filename = filename.replace('/api/favicons/serve/', '');
    }

    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const faviconDir = getFaviconDir();

    // Find the source file
    let sourcePath = await findOriginalFile(filename, faviconDir);

    if (!sourcePath) {
      logFavicon('warn', `Favicon file not found: ${filename}`);
      return NextResponse.json({ error: 'Favicon file not found' }, { status: 404 });
    }

    // Validate the source file - if invalid, try to re-fetch
    const validation = await validateFaviconFile(sourcePath);
    if (!validation.valid) {
      logFavicon('warn', `Invalid favicon file: ${sourcePath}`, { error: validation.error });

      const url = itemUrl || await findUrlForFavicon(sourcePath);
      if (url) {
        logFavicon('info', `Re-fetching favicon from: ${url}`);
        const result = await fetchAndSaveFavicon(url);

        if (result.success && result.path) {
          const newFilename = result.path.replace('/api/favicons/serve/', '');
          sourcePath = join(faviconDir, newFilename.replace('.png', '_original.png'));

          if (!existsSync(sourcePath)) {
            sourcePath = join(faviconDir, newFilename);
          }

          const newValidation = await validateFaviconFile(sourcePath);
          if (!newValidation.valid) {
            return NextResponse.json(
              { error: `Re-fetched favicon is still invalid: ${newValidation.error}` },
              { status: 400 }
            );
          }
        } else {
          return NextResponse.json(
            { error: `Could not re-fetch favicon: ${result.error}` },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: `Invalid image format and no URL available to re-fetch` },
          { status: 400 }
        );
      }
    }

    // Get the base name for output files
    const baseName = filename
      .replace(/_themed_[^.]+\.png$/, '')
      .replace(/_monotone_black\.png$/, '')
      .replace(/_monotone_white\.png$/, '')
      .replace(/_monotone$/, '')
      .replace(/_inverted\.png$/, '')
      .replace(/\.png$/, '');

    const newFilename = `${baseName}_inverted.png`;
    const newFullPath = join(faviconDir, newFilename);

    // Check if converted file already exists and is valid
    if (existsSync(newFullPath)) {
      const existingValid = await validateFaviconFile(newFullPath);
      if (existingValid.valid) {
        logFavicon('debug', `Using cached inverted favicon: ${newFilename}`);
        return NextResponse.json({
          success: true,
          filename: `/api/favicons/serve/${newFilename}`,
          message: 'Using cached inverted favicon',
        });
      }
    }

    logFavicon('info', `Inverting favicon colors: ${filename}`);

    // Invert the image colors
    try {
      await sharp(sourcePath)
        .png()
        .negate()
        .toFile(newFullPath);

      logFavicon('info', `Successfully inverted favicon: ${baseName}`);
      return NextResponse.json({
        success: true,
        filename: `/api/favicons/serve/${newFilename}`,
        message: 'Successfully inverted favicon colors',
      });
    } catch (conversionError: any) {
      logFavicon('error', 'Favicon invert error', { error: conversionError.message });

      // Try to re-fetch and retry
      const url = itemUrl || await findUrlForFavicon(sourcePath);
      if (url) {
        logFavicon('info', `Conversion failed, re-fetching favicon from: ${url}`);
        const result = await fetchAndSaveFavicon(url);

        if (result.success && result.path) {
          const newSourceFilename = result.path.replace('/api/favicons/serve/', '');
          const newSourcePath = join(faviconDir, newSourceFilename.replace('.png', '_original.png'));
          const actualSourcePath = existsSync(newSourcePath) ? newSourcePath : join(faviconDir, newSourceFilename);

          try {
            await sharp(actualSourcePath)
              .png()
              .negate()
              .toFile(newFullPath);

            logFavicon('info', `Re-fetched and inverted favicon: ${baseName}`);
            return NextResponse.json({
              success: true,
              filename: `/api/favicons/serve/${newFilename}`,
              message: 'Re-fetched and inverted favicon',
            });
          } catch (retryError: any) {
            logFavicon('error', 'Retry invert also failed', { error: retryError.message });
          }
        }
      }

      logFavicon('error', `Unable to invert favicon: ${conversionError.message}`);
      return NextResponse.json(
        { error: `Unable to invert favicon: ${conversionError.message}` },
        { status: 400 }
      );
    }
  } catch (error: any) {
    logFavicon('error', 'Error inverting favicon', { error: error.message });
    return NextResponse.json(
      { error: error.message || 'Failed to invert colors' },
      { status: 500 }
    );
  }
}
