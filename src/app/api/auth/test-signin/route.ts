import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Handle test signin flow with proper session check
export async function GET(request: NextRequest) {
  // Get the correct origin, prioritizing actual external URL over internal Docker address
  let origin = '';

  // 1. Try x-forwarded headers (reverse proxy/Docker)
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  if (forwardedHost) {
    origin = `${forwardedProto}://${forwardedHost}`;
  }

  // 2. Try origin header from browser request
  if (!origin) {
    origin = request.headers.get('origin') || '';
  }

  // 3. Try host header with protocol detection
  if (!origin) {
    const host = request.headers.get('host');
    if (host) {
      const proto = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
      origin = `${proto}://${host}`;
    }
  }

  // 4. Fall back to NEXTAUTH_URL
  if (!origin) {
    origin = process.env.NEXTAUTH_URL || '';
  }

  console.log('Test signin: Detected origin:', origin);

  // Check if user is already authenticated in this popup
  const session = await getServerSession(authOptions);

  if (session) {
    // Already authenticated, redirect to success page
    console.log('Test signin: User already authenticated, redirecting to result page');
    return NextResponse.redirect(`${origin}/auth/test-result`);
  }

  // Not authenticated yet, start OIDC flow
  const callbackUrl = `${origin}/auth/test-result`;

  console.log('Test signin: Starting OIDC flow with callback:', callbackUrl);

  // Redirect to NextAuth OIDC signin with custom callback
  return NextResponse.redirect(
    `${origin}/api/auth/signin/oidc?callbackUrl=${encodeURIComponent(callbackUrl)}`
  );
}
