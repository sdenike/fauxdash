import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getDb } from '@/db';
import { users, settings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import * as argon2 from 'argon2';

const oidcClientId = process.env.OIDC_CLIENT_ID || '';
const oidcClientSecret = process.env.OIDC_CLIENT_SECRET || '';
const oidcIssuerUrl = process.env.OIDC_ISSUER_URL || '';

// Build providers array
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

// Add OIDC provider if configured
if (oidcClientId && oidcIssuerUrl) {
  providers.push({
    id: 'oidc',
    name: 'OIDC',
    type: 'oauth',
    wellKnown: `${oidcIssuerUrl}.well-known/openid-configuration`,
    authorization: { params: { scope: 'openid email profile' } },
    clientId: oidcClientId,
    clientSecret: oidcClientSecret,
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
}

export const authOptions: NextAuthOptions = {
  providers,
  callbacks: {
    async jwt({ token, user, account, profile, trigger }) {
      const db = getDb();

      // Handle OIDC login
      if (account && account.provider === 'oidc' && profile) {
        const oidcSub = profile.sub;

        // Check if user exists by OIDC subject
        let dbUser = await db
          .select()
          .from(users)
          .where(eq(users.oidcSubject, oidcSub as string))
          .limit(1);

        if (!dbUser || dbUser.length === 0) {
          // Check if user exists by email
          dbUser = await db
            .select()
            .from(users)
            .where(eq(users.email, profile.email as string))
            .limit(1);

          if (dbUser && dbUser.length > 0) {
            // Link OIDC subject to existing user
            await db
              .update(users)
              .set({ oidcSubject: oidcSub as string, updatedAt: new Date() })
              .where(eq(users.id, dbUser[0].id));
          } else {
            // Create new user
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
          }
        }

        if (dbUser && dbUser.length > 0) {
          token.id = dbUser[0].id.toString();
          token.email = dbUser[0].email;
          token.name = dbUser[0].username || dbUser[0].email;
          token.isAdmin = dbUser[0].isAdmin;
          token.firstname = dbUser[0].firstname;
          token.lastname = dbUser[0].lastname;
        }
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
    maxAge: 2 * 24 * 60 * 60, // 2 days (reduced from 30 for security)
  },
  secret: process.env.NEXTAUTH_SECRET,
};
