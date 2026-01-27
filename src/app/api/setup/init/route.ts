import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { count } from 'drizzle-orm';
import argon2 from 'argon2';
import { logSystem } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const db = getDb();

    // Check if any users already exist - only allow setup if no users
    const result = await db.select({ count: count() }).from(users);
    const userCount = result[0]?.count || 0;

    if (userCount > 0) {
      return NextResponse.json(
        { error: 'Setup has already been completed. Users already exist.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { email, password, username, firstname, lastname } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Hash the password
    const passwordHash = await argon2.hash(password);

    // Create the admin user
    await db.insert(users).values({
      email: email.toLowerCase(),
      passwordHash,
      username: username || email.split('@')[0],
      firstname: firstname || null,
      lastname: lastname || null,
      isAdmin: true,
    });

    logSystem('info', 'Initial admin user created during setup', { email });

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully. You can now log in.',
    });
  } catch (error: any) {
    logSystem('error', 'Setup initialization error', { error: error.message });
    return NextResponse.json(
      { error: error.message || 'Failed to complete setup' },
      { status: 500 }
    );
  }
}
