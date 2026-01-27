import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const lines = parseInt(searchParams.get('lines') || '500', 10);

  try {
    const logs = logger.getRecentLogs(lines);
    return NextResponse.json({
      success: true,
      logs,
      count: logs.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to read logs' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    logger.clearLogs();
    return NextResponse.json({ success: true, message: 'Logs cleared' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to clear logs' },
      { status: 500 }
    );
  }
}
