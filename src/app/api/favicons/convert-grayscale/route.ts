import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { join } from 'path';
import { existsSync, readdirSync } from 'fs';
import sharp from 'sharp';
import { getDb } from '@/db';
import { bookmarks, services } from '@/db/schema';
import { fetchAndSaveFavicon, getFaviconDir, validateFaviconFile, convertToGrayscale } from '@/lib/favicon-utils';
import { logFavicon } from '@/lib/logger';

// Helper to find the original file for a given favicon
async function findOriginalFile(filename: string, faviconDir: string): Promise<string | null> {
  // Strip any transformation suffixes to get the base name
  const baseName = filename
    .replace(/_themed_[^.]+\.png$/, '')
    .replace(/_grayscale_black\.png$/, '')
    .replace(/_grayscale_white\.png$/, '')
    .replace(/_grayscale$/, '')
    .replace(/_monotone_black\.png$/, '')
    .replace(/_monotone_white\.png$/, '')
    .replace(/_monotone$/, '')
    .replace(/_inverted\.png$/, '')
    .replace(/\.png$/, '');

  // Try to find the original file
  const originalPath = join(faviconDir, `${baseName}_original.png`);
  if (existsSync(originalPath)) {
    return originalPath;
  }

  // Fallback: Try to find any file starting with the base name that has _original
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

  // No original exists - try to find the base file
  const basePath = join(faviconDir, `${baseName}.png`);
  if (existsSync(basePath)) {
    return basePath;
  }

  // Try the exact filename as a last resort
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

    // Search for any bookmark or service that uses this favicon path
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
    // Extract just the filename
    let filename = favicon.replace('favicon:', '');
    if (filename.startsWith('/api/favicons/serve/')) {
      filename = filename.replace('/api/favicons/serve/', '');
    }

    // Validate filename to prevent path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const faviconDir = getFaviconDir();

    // Find the source file
    let sourcePath = await findOriginalFile(filename, faviconDir);

    if (!sourcePath) {
      logFavicon('warn', `Favicon file not found: ${filename}`);
      return NextResponse.json(
        { error: `Favicon file not found: ${filename}` },
        { status: 404 }
      );
    }

    // Validate the source file - if invalid, try to re-fetch
    const validation = await validateFaviconFile(sourcePath);
    if (!validation.valid) {
      logFavicon('warn', `Invalid favicon file: ${sourcePath}`, { error: validation.error });

      // Try to find the URL and re-fetch
      const url = itemUrl || await findUrlForFavicon(sourcePath);
      if (url) {
        logFavicon('info', `Re-fetching favicon from: ${url}`);
        const result = await fetchAndSaveFavicon(url);

        if (result.success && result.path) {
          // Update sourcePath to the new file
          const newFilename = result.path.replace('/api/favicons/serve/', '');
          sourcePath = join(faviconDir, newFilename.replace('.png', '_original.png'));

          if (!existsSync(sourcePath)) {
            sourcePath = join(faviconDir, newFilename);
          }

          // Verify the new file is valid
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
      .replace(/_grayscale_black\.png$/, '')
      .replace(/_grayscale_white\.png$/, '')
      .replace(/_grayscale$/, '')
      .replace(/_monotone_black\.png$/, '')
      .replace(/_monotone_white\.png$/, '')
      .replace(/_monotone$/, '')
      .replace(/_inverted\.png$/, '')
      .replace(/\.png$/, '');

    const blackFilename = `${baseName}_grayscale_black.png`;
    const whiteFilename = `${baseName}_grayscale_white.png`;
    const blackFullPath = join(faviconDir, blackFilename);
    const whiteFullPath = join(faviconDir, whiteFilename);

    // Check if converted files already exist and are valid
    if (existsSync(blackFullPath) && existsSync(whiteFullPath)) {
      const blackValid = await validateFaviconFile(blackFullPath);
      const whiteValid = await validateFaviconFile(whiteFullPath);

      if (blackValid.valid && whiteValid.valid) {
        logFavicon('info', `Using cached grayscale versions for: ${baseName}`);
        return NextResponse.json({
          success: true,
          filename: `/api/favicons/serve/${baseName}_grayscale`,
          message: 'Using cached grayscale versions',
        });
      }
    }

    logFavicon('info', `Converting favicon to grayscale: ${filename}`);

    // Use shared conversion function
    const result = await convertToGrayscale(sourcePath, baseName, faviconDir);

    if (result.success) {
      logFavicon('info', `Successfully converted to grayscale: ${baseName}`);
      return NextResponse.json({
        success: true,
        filename: result.filename,
        message: 'Successfully created grayscale versions',
      });
    }

    // If conversion failed, try to re-fetch the favicon
    logFavicon('warn', `Grayscale conversion failed: ${result.error}`);
    const url = itemUrl || await findUrlForFavicon(sourcePath);
    if (url) {
      logFavicon('info', `Conversion failed, re-fetching favicon from: ${url}`);
      const fetchResult = await fetchAndSaveFavicon(url);

      if (fetchResult.success && fetchResult.path) {
        // Try conversion again with the new file
        const newFilename = fetchResult.path.replace('/api/favicons/serve/', '');
        const newSourcePath = join(faviconDir, newFilename.replace('.png', '_original.png'));
        const actualSourcePath = existsSync(newSourcePath) ? newSourcePath : join(faviconDir, newFilename);

        const retryResult = await convertToGrayscale(actualSourcePath, baseName, faviconDir);

        if (retryResult.success) {
          logFavicon('info', `Re-fetched and converted to grayscale: ${baseName}`);
          return NextResponse.json({
            success: true,
            filename: retryResult.filename,
            message: 'Re-fetched and converted to grayscale',
          });
        }

        return NextResponse.json(
          { error: `Conversion failed after re-fetch: ${retryResult.error}` },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: `Conversion failed: ${result.error}` },
      { status: 400 }
    );
  } catch (error: any) {
    logFavicon('error', 'Error converting to grayscale', { error: error.message });
    return NextResponse.json(
      { error: error.message || 'Failed to convert to grayscale' },
      { status: 500 }
    );
  }
}
