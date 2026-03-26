import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

const ALLOWED_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename: paramFilename } = await params;
    let filename = paramFilename;

    // Only allow a single optional extension — prevents path traversal and bare dots
    if (!filename || !/^[a-zA-Z0-9_\-]+(\.[a-zA-Z0-9]+)?$/.test(filename)) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      );
    }

    const faviconDir = join(process.cwd(), 'public', 'favicons');

    // convertToGrayscale only creates _grayscale_black.png / _grayscale_white.png,
    // so probe for those variants directly rather than pre-checking existence.
    let fileBuffer: Buffer;
    if (filename.endsWith('_grayscale') || filename.endsWith('_monotone')) {
      try {
        const blackFilename = `${filename}_black.png`;
        fileBuffer = await readFile(join(faviconDir, blackFilename));
        filename = blackFilename;
      } catch {
        const whiteFilename = `${filename}_white.png`;
        fileBuffer = await readFile(join(faviconDir, whiteFilename));
        filename = whiteFilename;
      }
    } else {
      fileBuffer = await readFile(join(faviconDir, filename));
    }

    // Determine content type from extension.
    // SVG files are served with Content-Disposition: attachment to prevent
    // inline rendering and XSS if a user navigates directly to the URL.
    // All other non-image extensions are rejected.
    const ext = filename.split('.').pop()?.toLowerCase();

    if (ext === 'svg') {
      return new NextResponse(new Uint8Array(fileBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Content-Disposition': 'attachment; filename="favicon.svg"',
          'Cache-Control': 'public, max-age=3600',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }

    const contentType = ALLOWED_TYPES[ext ?? ''];
    if (!contentType) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 });
    }

    // Filenames include a timestamp so immutable caching is safe
    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
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
