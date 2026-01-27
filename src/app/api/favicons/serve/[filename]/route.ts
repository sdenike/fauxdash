import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    let filename = params.filename;

    // Validate filename to prevent path traversal attacks
    // Only allow alphanumeric, underscore, hyphen, and dot characters
    if (!filename || !/^[a-zA-Z0-9_\-\.]+$/.test(filename)) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      );
    }

    // Additional check: ensure no path traversal attempts
    if (filename.includes('..')) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      );
    }

    const faviconDir = join(process.cwd(), 'public', 'favicons');
    let filepath = join(faviconDir, filename);

    // Handle grayscale/monotone files - if filename ends with _grayscale or _monotone (no extension),
    // try to find the black or white version
    if ((filename.endsWith('_grayscale') || filename.endsWith('_monotone')) && !existsSync(filepath)) {
      // Try black version first (for light theme), then white
      const blackPath = join(faviconDir, `${filename}_black.png`);
      const whitePath = join(faviconDir, `${filename}_white.png`);

      if (existsSync(blackPath)) {
        filepath = blackPath;
        filename = `${filename}_black.png`;
      } else if (existsSync(whitePath)) {
        filepath = whitePath;
        filename = `${filename}_white.png`;
      }
    }

    // Read the file
    const fileBuffer = await readFile(filepath);

    // Determine content type from extension
    const ext = filename.split('.').pop()?.toLowerCase();
    let contentType = 'image/x-icon';

    if (ext === 'png') contentType = 'image/png';
    else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
    else if (ext === 'svg') contentType = 'image/svg+xml';
    else if (ext === 'gif') contentType = 'image/gif';
    else if (ext === 'webp') contentType = 'image/webp';

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving favicon:', error);
    return NextResponse.json(
      { error: 'Favicon not found' },
      { status: 404 }
    );
  }
}
