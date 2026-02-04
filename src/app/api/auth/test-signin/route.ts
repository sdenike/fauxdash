import { NextRequest, NextResponse } from 'next/server';

// Redirect to OIDC signin with test callback
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin') || process.env.NEXTAUTH_URL || '';
  const callbackUrl = `${origin}/auth/test-result`;

  // Redirect to NextAuth OIDC signin with custom callback
  return NextResponse.redirect(
    `${origin}/api/auth/signin/oidc?callbackUrl=${encodeURIComponent(callbackUrl)}`
  );
}
