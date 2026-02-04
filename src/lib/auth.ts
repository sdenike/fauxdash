import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getDb } from '@/db';
import { users, settings } from '@/db/schema';
import { eq, isNull } from 'drizzle-orm';
import * as argon2 from 'argon2';

// Synchronously read OIDC settings from database at startup
function getOidcSettingsSync(): {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  issuerUrl: string;
  disablePasswordLogin: boolean;
} {
  try {
    const db = getDb();
    // Drizzle with better-sqlite3 is synchronous
    const allSettings = db.select().from(settings).where(isNull(settings.userId)).all();
    const settingsObj: Record<string, string> = {};
    for (const s of allSettings) {
      if (s.key && s.value !== null) {
        settingsObj[s.key] = s.value;
      }
    }

    return {
      enabled: settingsObj.oidcEnabled === 'true',
      clientId: settingsObj.oidcClientId || process.env.OIDC_CLIENT_ID || '',
      clientSecret: settingsObj.oidcClientSecret || process.env.OIDC_CLIENT_SECRET || '',
      issuerUrl: settingsObj.oidcIssuerUrl || process.env.OIDC_ISSUER_URL || '',
      disablePasswordLogin: settingsObj.disablePasswordLogin === 'true',
    };
  } catch (e) {
    // Fallback to env vars if DB not available (e.g., during build)
    console.log('Could not read OIDC settings from DB, using env vars:', e);
    return {
      enabled: false,
      clientId: process.env.OIDC_CLIENT_ID || '',
      clientSecret: process.env.OIDC_CLIENT_SECRET || '',
      issuerUrl: process.env.OIDC_ISSUER_URL || '',
      disablePasswordLogin: false,
    };
  }
}

// Cache for runtime OIDC settings checks
let oidcSettingsCache: {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  issuerUrl: string;
  disablePasswordLogin: boolean;
  cachedAt: number;
} | null = null;

const CACHE_TTL = 30000; // 30 seconds cache

// Async version for runtime checks (e.g., in credentials authorize)
export async function getOidcSettings() {
  // Return cached settings if still valid
  if (oidcSettingsCache && Date.now() - oidcSettingsCache.cachedAt < CACHE_TTL) {
    return oidcSettingsCache;
  }

  try {
    const db = getDb();
    const allSettings = await db.select().from(settings).where(isNull(settings.userId));
    const settingsObj: Record<string, string> = {};
    for (const s of allSettings) {
      if (s.key && s.value !== null) {
        settingsObj[s.key] = s.value;
      }
    }

    oidcSettingsCache = {
      enabled: settingsObj.oidcEnabled === 'true',
      clientId: settingsObj.oidcClientId || process.env.OIDC_CLIENT_ID || '',
      clientSecret: settingsObj.oidcClientSecret || process.env.OIDC_CLIENT_SECRET || '',
      issuerUrl: settingsObj.oidcIssuerUrl || process.env.OIDC_ISSUER_URL || '',
      disablePasswordLogin: settingsObj.disablePasswordLogin === 'true',
      cachedAt: Date.now(),
    };

    return oidcSettingsCache;
  } catch {
    // Fallback to env vars if DB not available
    return {
      enabled: false,
      clientId: process.env.OIDC_CLIENT_ID || '',
      clientSecret: process.env.OIDC_CLIENT_SECRET || '',
      issuerUrl: process.env.OIDC_ISSUER_URL || '',
      disablePasswordLogin: false,
      cachedAt: Date.now(),
    };
  }
}

// Clear OIDC settings cache (call after saving settings)
export function clearOidcSettingsCache() {
  oidcSettingsCache = null;
}

// Get OIDC settings at module load time
const oidcConfig = getOidcSettingsSync();

// Build providers array based on configuration
function buildProviders(config: ReturnType<typeof getOidcSettingsSync>): any[] {
  const providers: any[] = [
    CredentialsProvider({
    id: 'credentials',
    name: 'Credentials',
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
      rememberMe: { label: "Remember Me", type: "text" },
      rememberDuration: { label: "Remember Duration", type: "text" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null;
      }

      // Check if password login is disabled (re-check from DB for real-time settings)
      const currentOidcSettings = await getOidcSettings();
      if (currentOidcSettings.disablePasswordLogin && currentOidcSettings.enabled) {
        console.log('Password login is disabled, OIDC only mode');
        return null;
      }

      const db = getDb();
      // Normalize email to lowercase for consistent comparison
      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, credentials.email.toLowerCase().trim()))
        .limit(1);

      if (!user || user.length === 0) {
        return null;
      }

      const foundUser = user[0];

      if (!foundUser.passwordHash) {
        return null;
      }

      const isValid = await argon2.verify(
        foundUser.passwordHash,
        credentials.password
      );

      if (!isValid) {
        return null;
      }

      return {
        id: foundUser.id.toString(),
        email: foundUser.email,
        name: foundUser.username || foundUser.email,
        isAdmin: foundUser.isAdmin,
        firstname: foundUser.firstname,
        lastname: foundUser.lastname,
        rememberDuration: credentials.rememberDuration || '2',
      };
    },
  }),
  ];

  return providers;
}

// Add OIDC provider if enabled and configured
function addOidcProvider(providers: any[], config: ReturnType<typeof getOidcSettingsSync>) {
  if (config.enabled && config.clientId && config.issuerUrl) {
    const normalizedIssuerUrl = config.issuerUrl.endsWith('/')
      ? config.issuerUrl
      : config.issuerUrl + '/';

    console.log('OIDC provider configuration:', {
      enabled: config.enabled,
      issuerUrl: normalizedIssuerUrl,
      clientId: config.clientId ? `${config.clientId.substring(0, 8)}...` : 'MISSING',
      clientSecret: config.clientSecret ? '***SET***' : 'MISSING',
    });

    providers.push({
      id: 'oidc',
      name: 'OIDC',
      type: 'oauth',
      wellKnown: `${normalizedIssuerUrl}.well-known/openid-configuration`,
      authorization: { params: { scope: 'openid email profile' } },
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      idToken: true,
      checks: ['pkce', 'state'],
      profile(profile: any) {
        return {
          id: profile.sub,
          email: profile.email,
          name: profile.name || profile.preferred_username || profile.email,
          isAdmin: false,
        };
      },
    });
    console.log('OIDC provider configured successfully');
  } else {
    console.log('OIDC provider NOT configured:', {
      enabled: config.enabled,
      hasClientId: !!config.clientId,
      hasIssuerUrl: !!config.issuerUrl,
    });
  }
}

// Build initial providers array
const initialProviders = buildProviders(oidcConfig);
addOidcProvider(initialProviders, oidcConfig);

// Dynamic provider management for hot-reload
let dynamicProviders: any[] = [...initialProviders];

// Function to reload OIDC provider configuration without restart
export async function reloadOidcProvider() {
  console.log('===============================================');
  console.log('OIDC RELOAD: Starting provider reload...');
  console.log('===============================================');

  try {
    const currentConfig = await getOidcSettings();

    console.log('OIDC RELOAD: Current configuration:', {
      enabled: currentConfig.enabled,
      hasClientId: !!currentConfig.clientId,
      clientIdPrefix: currentConfig.clientId ? currentConfig.clientId.substring(0, 8) + '...' : 'MISSING',
      hasClientSecret: !!currentConfig.clientSecret,
      issuerUrl: currentConfig.issuerUrl || 'MISSING',
      disablePasswordLogin: currentConfig.disablePasswordLogin,
    });

    // Rebuild providers array
    const newProviders = buildProviders(currentConfig);
    addOidcProvider(newProviders, currentConfig);

    // Update dynamic providers
    dynamicProviders = newProviders;

    console.log('OIDC RELOAD: Provider reloaded successfully');
    console.log('OIDC RELOAD: Active providers:', dynamicProviders.map(p => p.id || p.name));
    console.log('===============================================');

    return { success: true, message: 'OIDC configuration reloaded' };
  } catch (error) {
    console.error('OIDC RELOAD ERROR: Failed to reload provider:', error);
    console.error('OIDC RELOAD ERROR: Stack trace:', (error as Error).stack);
    console.log('===============================================');
    return { success: false, error: 'Failed to reload OIDC configuration' };
  }
}

export const authOptions: NextAuthOptions = {
  get providers() {
    // Return dynamic providers to support hot-reload
    return dynamicProviders;
  },
  callbacks: {
    async jwt({ token, user, account, profile, trigger }) {
      const db = getDb();

      // Debug logging for OIDC
      if (account && account.provider === 'oidc') {
        console.log('OIDC JWT callback:', {
          provider: account.provider,
          hasProfile: !!profile,
          accountType: account.type,
          profileSub: profile?.sub,
          profileEmail: profile?.email,
        });
      }

      // Handle OIDC login
      if (account && account.provider === 'oidc' && profile) {
        console.log('Processing OIDC login for profile:', {
          sub: profile.sub,
          email: profile.email,
          name: profile.name,
        });

        const oidcSub = profile.sub;

        try {
          // Check if user exists by OIDC subject
          let dbUser = await db
            .select()
            .from(users)
            .where(eq(users.oidcSubject, oidcSub as string))
            .limit(1);

          if (!dbUser || dbUser.length === 0) {
            console.log('No user found with OIDC subject, checking by email:', profile.email);

            // Check if user exists by email
            dbUser = await db
              .select()
              .from(users)
              .where(eq(users.email, profile.email as string))
              .limit(1);

            if (dbUser && dbUser.length > 0) {
              // Link OIDC subject to existing user
              console.log('Linking OIDC subject to existing user:', {
                userId: dbUser[0].id,
                email: dbUser[0].email,
              });

              await db
                .update(users)
                .set({ oidcSubject: oidcSub as string, updatedAt: new Date() })
                .where(eq(users.id, dbUser[0].id));
            } else {
              // Create new user
              console.log('Creating new user from OIDC profile:', {
                email: profile.email,
                oidcSub: oidcSub,
              });

              const newUser = await db
                .insert(users)
                .values({
                  email: profile.email as string,
                  username: (profile.name || (profile as any).preferred_username || profile.email) as string,
                  oidcSubject: oidcSub as string,
                  isAdmin: false,
                })
                .returning();

              dbUser = newUser;
              console.log('New user created successfully:', { userId: dbUser[0]?.id });
            }
          } else {
            console.log('Found existing user with OIDC subject:', {
              userId: dbUser[0].id,
              email: dbUser[0].email,
            });
          }

          if (dbUser && dbUser.length > 0) {
            token.id = dbUser[0].id.toString();
            token.email = dbUser[0].email;
            token.name = dbUser[0].username || dbUser[0].email;
            token.isAdmin = dbUser[0].isAdmin;
            token.firstname = dbUser[0].firstname;
            token.lastname = dbUser[0].lastname;

            // Set token expiration for OIDC logins (same as credentials default: 2 days)
            const maxAgeSeconds = 2 * 24 * 60 * 60; // 2 days
            token.exp = Math.floor(Date.now() / 1000) + maxAgeSeconds;

            console.log('OIDC token created successfully:', {
              userId: token.id,
              email: token.email,
              expiresIn: `${maxAgeSeconds / 3600} hours`,
            });
          } else {
            console.error('OIDC ERROR: Failed to create or find user after processing');
          }
        } catch (error) {
          console.error('OIDC ERROR: Exception during user processing:', error);
        }
      }

      // Log if OIDC callback received but missing profile
      if (account && account.provider === 'oidc' && !profile) {
        console.error('OIDC ERROR: Callback received but no profile data', {
          accountType: account.type,
          hasAccessToken: !!account.access_token,
          hasIdToken: !!account.id_token,
        });
      }

      // Handle regular credentials login
      if (user && account && account.provider === 'credentials') {
        token.isAdmin = (user as any).isAdmin;
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.firstname = (user as any).firstname;
        token.lastname = (user as any).lastname;

        // Handle remember me duration
        const days = parseInt((user as any).rememberDuration || '2', 10);
        const maxAgeSeconds = days * 24 * 60 * 60;
        token.exp = Math.floor(Date.now() / 1000) + maxAgeSeconds;
      }

      // Refresh user data from database on update trigger
      if (trigger === 'update' && token.id) {
        const dbUser = await db
          .select()
          .from(users)
          .where(eq(users.id, parseInt(token.id as string)))
          .limit(1);

        if (dbUser && dbUser.length > 0) {
          token.email = dbUser[0].email;
          token.name = dbUser[0].username || dbUser[0].email;
          token.isAdmin = dbUser[0].isAdmin;
          token.firstname = dbUser[0].firstname;
          token.lastname = dbUser[0].lastname;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).isAdmin = token.isAdmin;
        (session.user as any).id = token.id;
        (session.user as any).email = token.email;
        (session.user as any).name = token.name;
        (session.user as any).firstname = token.firstname;
        (session.user as any).lastname = token.lastname;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 2 * 24 * 60 * 60, // 2 days
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log('Sign in event:', {
        provider: account?.provider,
        userEmail: user?.email,
        isNewUser,
      });
    },
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
};
