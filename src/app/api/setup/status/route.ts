import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { count } from 'drizzle-orm';

export async function GET() {
  try {
    const db = getDb();

    // Check if any users exist
    const result = await db.select({ count: count() }).from(users);
    const userCount = result[0]?.count || 0;

    return NextResponse.json({
      needsSetup: userCount === 0,
      userCount,
    });
  } catch (error: any) {
    console.error('Setup status check error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check setup status' },
      { status: 500 }
    );
  }
}
