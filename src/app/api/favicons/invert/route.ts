import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { join } from 'path';
import { existsSync } from 'fs';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { favicon } = await request.json();

  if (!favicon || !favicon.startsWith('favicon:')) {
    return NextResponse.json({ error: 'Invalid favicon path' }, { status: 400 });
  }

  try {
    // Extract just the filename
    let filename = favicon.replace('favicon:', '');
    // Strip the /api/favicons/serve/ prefix if present
    if (filename.startsWith('/api/favicons/serve/')) {
      filename = filename.replace('/api/favicons/serve/', '');
    }

    // Validate filename to prevent path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const fullPath = join(process.cwd(), 'public', 'favicons', filename);

    // Check if file exists
    if (!existsSync(fullPath)) {
      return NextResponse.json({ error: 'Favicon file not found' }, { status: 404 });
    }

    // Generate new filename with _inverted suffix
    const nameParts = filename.split('.');
    const ext = nameParts.pop();
    const baseName = nameParts.join('.');
    const newFilename = `${baseName}_inverted.png`;
    const newFullPath = join(process.cwd(), 'public', 'favicons', newFilename);

    // Check if converted file already exists - if so, return it without regenerating
    if (existsSync(newFullPath)) {
      return NextResponse.json({
        success: true,
        filename: `/api/favicons/serve/${newFilename}`,
        message: 'Using cached inverted favicon',
      });
    }

    // Use Sharp to invert the image colors
    await sharp(fullPath)
      .png()
      .negate()
      .toFile(newFullPath);

    return NextResponse.json({
      success: true,
      filename: `/api/favicons/serve/${newFilename}`,
      message: 'Successfully inverted favicon colors',
    });
  } catch (error: any) {
    console.error('Error inverting favicon:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to invert colors' },
      { status: 500 }
    );
  }
}
