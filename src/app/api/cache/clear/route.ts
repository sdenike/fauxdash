import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { cacheDel } from '@/lib/redis';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Clear all common caches
    await Promise.all([
      cacheDel('categories:public'),
      cacheDel(`categories:auth:${session.user?.email}`),
      cacheDel('service-categories:public'),
      cacheDel(`service-categories:auth:${session.user?.email}`),
    ]);

    return NextResponse.json({ success: true, message: 'Cache cleared' });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json({ error: 'Failed to clear cache' }, { status: 500 });
  }
}
