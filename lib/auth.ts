import type { NextAuthOptions } from 'next-auth';
import type { Provider } from 'next-auth/providers/index';
import CredentialsProvider from 'next-auth/providers/credentials';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/db';
import { setLastOAuthError } from '@/lib/auth-last-error';
import '@/lib/normalize-nextauth-url';

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

const providers: Provider[] = [
  CredentialsProvider({
    name: 'Credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Senha', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;
      const user = await prisma.user.findUnique({ where: { email: credentials.email } });
      if (!user || !user.passwordHash) return null;
      const { compare } = await import('bcryptjs');
      const isValid = await compare(credentials.password, user.passwordHash);
      if (!isValid) return null;
      return {
        id: user.id,
        name: user.name ?? undefined,
        email: user.email ?? undefined,
        image: user.image ?? undefined,
      };
    },
  }),
];

if (env('GITHUB_CLIENT_ID') && env('GITHUB_CLIENT_SECRET')) {
  providers.push(
    GitHubProvider({
      clientId: env('GITHUB_CLIENT_ID')!,
      clientSecret: env('GITHUB_CLIENT_SECRET')!,
      allowDangerousEmailAccountLinking: true,
      authorization: { params: { scope: 'read:user user:email' } },
      httpOptions: {
        headers: {
          'User-Agent': 'tarefy',
        },
      },
      // Override completo: NextAuth v4 chama /user/emails sem User-Agent.
      userinfo: {
        url: 'https://api.github.com/user',
        async request({ tokens }) {
          const accessToken = tokens.access_token;
          if (!accessToken) {
            setLastOAuthError('github_missing_access_token');
            throw new Error('github_missing_access_token');
          }

          const headers: Record<string, string> = {
            Authorization: `Bearer ${accessToken}`,
            'User-Agent': 'tarefy',
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          };

          const profileRes = await fetch('https://api.github.com/user', { headers });
          const profileText = await profileRes.text();
          if (!profileRes.ok) {
            setLastOAuthError(`github_user_${profileRes.status}:${profileText.slice(0, 120)}`);
            throw new Error(`github_user_${profileRes.status}`);
          }

          const data = JSON.parse(profileText) as {
            id: number;
            login: string;
            name?: string | null;
            email?: string | null;
            avatar_url?: string;
          };

          let email = data.email ?? undefined;
          if (!email) {
            const emailsRes = await fetch('https://api.github.com/user/emails', { headers });
            const emailsText = await emailsRes.text();
            if (!emailsRes.ok) {
              setLastOAuthError(`github_emails_${emailsRes.status}:${emailsText.slice(0, 120)}`);
              throw new Error(`github_emails_${emailsRes.status}`);
            }
            const emails = JSON.parse(emailsText) as Array<{
              email: string;
              primary: boolean;
              verified: boolean;
            }>;
            email =
              emails.find((entry) => entry.primary && entry.verified)?.email ??
              emails.find((entry) => entry.primary)?.email ??
              emails[0]?.email;
          }

          if (!email) {
            setLastOAuthError('github_no_email');
          }

          return {
            id: data.id,
            login: data.login,
            name: data.name ?? data.login,
            email,
            avatar_url: data.avatar_url,
          };
        },
      },
      profile(profile) {
        const gh = profile as {
          id: number | string;
          login?: string;
          name?: string;
          email?: string;
          avatar_url?: string;
        };
        return {
          id: String(gh.id),
          name: gh.name ?? gh.login,
          email: gh.email,
          image: gh.avatar_url,
        };
      },
    }),
  );
}

if (env('GOOGLE_CLIENT_ID') && env('GOOGLE_CLIENT_SECRET')) {
  providers.push(
    GoogleProvider({
      clientId: env('GOOGLE_CLIENT_ID')!,
      clientSecret: env('GOOGLE_CLIENT_SECRET')!,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

async function upsertOAuthUser(input: {
  email: string;
  name?: string | null;
  image?: string | null;
  provider: string;
  providerAccountId: string;
}) {
  let user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        image: input.image,
      },
    });
  } else if (input.name || input.image) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: input.name ?? user.name,
        image: input.image ?? user.image,
      },
    });
  }

  await prisma.account.upsert({
    where: {
      provider_providerAccountId: {
        provider: input.provider,
        providerAccountId: input.providerAccountId,
      },
    },
    update: { userId: user.id },
    create: {
      userId: user.id,
      type: 'oauth',
      provider: input.provider,
      providerAccountId: input.providerAccountId,
    },
  });

  return user;
}

export const authOptions: NextAuthOptions = {
  providers,
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  debug: process.env.NEXTAUTH_DEBUG === '1' || process.env.NODE_ENV === 'development',
  pages: {
    signIn: '/login',
    error: '/login',
  },
  logger: {
    error(code, metadata) {
      const meta = metadata as { error?: Error; message?: string } | Error | string | undefined;
      let detail = String(code);
      if (typeof meta === 'string') {
        detail = `${code}:${meta}`;
      } else if (meta instanceof Error) {
        detail = `${code}:${meta.message}`;
      } else if (meta && typeof meta === 'object') {
        const err = meta.error;
        if (err instanceof Error) detail = `${code}:${err.message}`;
        else if (typeof meta.message === 'string') detail = `${code}:${meta.message}`;
        else detail = `${code}:${JSON.stringify(meta).slice(0, 180)}`;
      }
      setLastOAuthError(detail);
      console.error('[next-auth:error]', code, metadata);
    },
    warn(code) {
      console.warn('[next-auth:warn]', code);
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account || account.provider === 'credentials') return true;

      const email =
        user.email ??
        (typeof profile === 'object' && profile && 'email' in profile
          ? (profile.email as string | null | undefined)
          : null);

      if (!email) {
        console.error('[auth] OAuth sem email do provider:', account.provider, {
          userEmail: user.email,
          profile,
        });
        return '/login?error=OAuthEmailRequired';
      }

      if (!account.providerAccountId) {
        console.error('[auth] OAuth sem providerAccountId:', account);
        return '/login?error=OAuthCallback';
      }

      try {
        await upsertOAuthUser({
          email,
          name: user.name ?? null,
          image: user.image ?? null,
          provider: account.provider,
          providerAccountId: String(account.providerAccountId),
        });
        return true;
      } catch (error) {
        console.error('[auth] Falha ao salvar usuário OAuth:', error);
        return '/login?error=OAuthCreateAccount';
      }
    },
    async redirect({ url, baseUrl }) {
      try {
        const target = new URL(url, baseUrl);
        if (target.origin === new URL(baseUrl).origin) return target.toString();
        return baseUrl;
      } catch {
        const path = url.startsWith('/') ? url : `/${url}`;
        return `${baseUrl}${path}`;
      }
    },
    async jwt({ token, user, account }) {
      if (user?.id && account?.provider === 'credentials') {
        token.id = user.id;
        return token;
      }

      if (user?.email) {
        try {
          const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
          if (dbUser) token.id = dbUser.id;
        } catch (error) {
          console.error('[auth] jwt: falha ao buscar usuário:', error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session?.user && token?.id) {
        session.user.id = String(token.id);
      }
      return session;
    },
  },
};
