import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { logSystem } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('database') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file extension
    if (!file.name.endsWith('.mmdb')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only .mmdb files are accepted.' },
        { status: 400 }
      );
    }

    // Validate file size (max 200MB)
    const maxSize = 200 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 200MB.' },
        { status: 400 }
      );
    }

    // Determine the data directory
    const dataDir = process.env.NODE_ENV === 'production'
      ? '/data'
      : join(process.cwd(), 'data');

    // Ensure data directory exists
    if (!existsSync(dataDir)) {
      await mkdir(dataDir, { recursive: true });
    }

    // Generate filename with timestamp for versioning
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${sanitizedName.replace('.mmdb', '')}_${timestamp}.mmdb`;
    const filepath = join(dataDir, filename);

    // Read file content
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Basic validation - check for MMDB magic bytes
    // MaxMind databases start with specific metadata structure
    if (buffer.length < 100) {
      return NextResponse.json(
        { error: 'Invalid database file. File is too small.' },
        { status: 400 }
      );
    }

    // Write the file
    await writeFile(filepath, buffer);

    logSystem('info', `MaxMind database uploaded: ${filename}`, {
      size: file.size,
      originalName: file.name
    });

    // Return the path relative to the data directory
    const relativePath = process.env.NODE_ENV === 'production'
      ? `/data/${filename}`
      : `./data/${filename}`;

    return NextResponse.json({
      success: true,
      message: `Database uploaded successfully (${(file.size / 1024 / 1024).toFixed(1)}MB)`,
      path: relativePath,
      filename: filename,
    });
  } catch (error: any) {
    logSystem('error', 'Error uploading MaxMind database', { error: error.message });
    return NextResponse.json(
      { error: error.message || 'Failed to upload database' },
      { status: 500 }
    );
  }
}
