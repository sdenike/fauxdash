import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, getOidcSettings } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !(session.user as any)?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { clientId, clientSecret, issuerUrl } = body;

    // Use provided values or fall back to stored settings
    const storedSettings = await getOidcSettings();
    const testClientId = clientId || storedSettings.clientId;
    const testClientSecret = clientSecret || storedSettings.clientSecret;
    const testIssuerUrl = issuerUrl || storedSettings.issuerUrl;

    if (!testClientId || !testIssuerUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required OIDC configuration (Client ID and Issuer URL are required)'
        },
        { status: 400 }
      );
    }

    // Normalize issuer URL
    const normalizedIssuerUrl = testIssuerUrl.endsWith('/')
      ? testIssuerUrl
      : testIssuerUrl + '/';

    // Test 1: Fetch the well-known configuration
    const wellKnownUrl = `${normalizedIssuerUrl}.well-known/openid-configuration`;

    let wellKnownResponse;
    try {
      wellKnownResponse = await fetch(wellKnownUrl, {
        headers: {
          'Accept': 'application/json',
        },
        // Set a reasonable timeout
        signal: AbortSignal.timeout(10000),
      });
    } catch (fetchError: any) {
      return NextResponse.json({
        success: false,
        error: `Failed to connect to OIDC provider: ${fetchError.message}`,
        details: {
          wellKnownUrl,
          stage: 'connection',
        },
      });
    }

    if (!wellKnownResponse.ok) {
      return NextResponse.json({
        success: false,
        error: `OIDC provider returned error: ${wellKnownResponse.status} ${wellKnownResponse.statusText}`,
        details: {
          wellKnownUrl,
          status: wellKnownResponse.status,
          stage: 'well-known',
        },
      });
    }

    let config;
    try {
      config = await wellKnownResponse.json();
    } catch {
      return NextResponse.json({
        success: false,
        error: 'OIDC provider returned invalid JSON',
        details: {
          wellKnownUrl,
          stage: 'parsing',
        },
      });
    }

    // Validate required OIDC endpoints exist
    const requiredEndpoints = ['authorization_endpoint', 'token_endpoint', 'issuer'];
    const missingEndpoints = requiredEndpoints.filter(ep => !config[ep]);

    if (missingEndpoints.length > 0) {
      return NextResponse.json({
        success: false,
        error: `OIDC configuration missing required endpoints: ${missingEndpoints.join(', ')}`,
        details: {
          wellKnownUrl,
          missingEndpoints,
          stage: 'validation',
        },
      });
    }

    // Test 2: Verify the issuer matches
    if (config.issuer && !config.issuer.startsWith(testIssuerUrl.replace(/\/$/, ''))) {
      return NextResponse.json({
        success: false,
        error: `Issuer mismatch: configured "${testIssuerUrl}" but provider reports "${config.issuer}"`,
        details: {
          configuredIssuer: testIssuerUrl,
          reportedIssuer: config.issuer,
          stage: 'issuer-validation',
        },
      });
    }

    // Test 3: Check if required scopes are supported (if scopes_supported is provided)
    const requiredScopes = ['openid', 'email', 'profile'];
    if (config.scopes_supported) {
      const unsupportedScopes = requiredScopes.filter(
        scope => !config.scopes_supported.includes(scope)
      );
      if (unsupportedScopes.length > 0) {
        return NextResponse.json({
          success: false,
          error: `OIDC provider does not support required scopes: ${unsupportedScopes.join(', ')}`,
          details: {
            requiredScopes,
            supportedScopes: config.scopes_supported,
            stage: 'scope-validation',
          },
        });
      }
    }

    // All tests passed
    return NextResponse.json({
      success: true,
      message: 'OIDC configuration is valid',
      details: {
        issuer: config.issuer,
        authorizationEndpoint: config.authorization_endpoint,
        tokenEndpoint: config.token_endpoint,
        userinfoEndpoint: config.userinfo_endpoint || 'Not provided',
        supportedScopes: config.scopes_supported || 'Not specified',
        supportedResponseTypes: config.response_types_supported || 'Not specified',
      },
    });

  } catch (error: any) {
    console.error('OIDC test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to test OIDC configuration'
      },
      { status: 500 }
    );
  }
}
