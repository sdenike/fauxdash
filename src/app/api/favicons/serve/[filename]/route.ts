import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename;

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

    const filepath = join(process.cwd(), 'public', 'favicons', filename);

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
