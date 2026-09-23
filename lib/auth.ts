import type { NextAuthOptions } from 'next-auth';
import type { Provider } from 'next-auth/providers/index';
import CredentialsProvider from 'next-auth/providers/credentials';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/db';

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

/** NextAuth quebra OAuth se NEXTAUTH_URL tiver barra no final. */
function normalizeNextAuthUrl(): void {
  const raw = process.env.NEXTAUTH_URL?.trim();
  if (!raw) return;
  const normalized = raw.replace(/\/+$/, '');
  if (normalized !== raw) {
    process.env.NEXTAUTH_URL = normalized;
    console.warn('[auth] NEXTAUTH_URL tinha barra final; normalizado para:', normalized);
  }
}

normalizeNextAuthUrl();

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
