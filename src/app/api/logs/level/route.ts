import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger, LogLevel } from '@/lib/logger';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    level: logger.getLogLevel(),
  });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { level } = await request.json();

  if (!level || !['debug', 'info', 'warn', 'error'].includes(level)) {
    return NextResponse.json({ error: 'Invalid log level' }, { status: 400 });
  }

  logger.setLogLevel(level as LogLevel);

  return NextResponse.json({
    success: true,
    level: logger.getLogLevel(),
  });
}
