import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fetchAndSaveFavicon } from '@/lib/favicon-utils';
import { logFavicon } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { url, itemId, isDirectFaviconUrl } = await request.json();

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    logFavicon('info', `Fetching favicon for: ${url}`);
    const result = await fetchAndSaveFavicon(url, { isDirectFaviconUrl });

    if (!result.success) {
      logFavicon('warn', `Failed to fetch favicon: ${result.error}`, { url });
      return NextResponse.json(
        {
          error: result.error || 'Failed to fetch favicon',
          noFavicon: true,
        },
        { status: 404 }
      );
    }

    logFavicon('info', `Successfully fetched favicon for: ${result.domain}`, { path: result.path });
    return NextResponse.json({
      success: true,
      path: result.path,
      filename: result.filename,
      domain: result.domain,
    });
  } catch (error: any) {
    logFavicon('error', 'Error fetching favicon', { url, error: error.message });
    return NextResponse.json(
      { error: error.message || 'Failed to fetch favicon' },
      { status: 500 }
    );
  }
}
