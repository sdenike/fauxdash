import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Handle test signin flow with proper session check
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin') || request.nextUrl.origin || process.env.NEXTAUTH_URL || '';

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
