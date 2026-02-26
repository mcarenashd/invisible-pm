import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";

// Conditionally include Microsoft Entra ID provider only if env vars are set
const microsoftProvider = process.env.AUTH_MICROSOFT_ENTRA_ID_ID
  ? [
      MicrosoftEntraID({
        clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
        clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
        issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID
          ? `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID}/v2.0/`
          : undefined,
        authorization: {
          params: {
            scope:
              "openid profile email User.Read Calendars.Read offline_access",
          },
        },
      }),
    ]
  : [];

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email, deleted_at: null },
        });

        if (!user || !user.password_hash || !user.is_active) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.password_hash);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.full_name,
        };
      },
    }),
    ...microsoftProvider,
  ],
  callbacks: {
    ...authConfig.callbacks,

    async signIn({ user, account, profile }) {
      // Handle Microsoft Entra ID sign-in: provision user + store tokens
      if (account?.provider === "microsoft-entra-id" && profile?.email) {
        let dbUser = await prisma.user.findUnique({
          where: { email: profile.email },
        });

        if (!dbUser) {
          // Create new user from Microsoft profile
          dbUser = await prisma.user.create({
            data: {
              email: profile.email,
              full_name: (profile.name as string) || profile.email,
              sso_provider_id: account.providerAccountId,
              is_active: true,
            },
          });

          // Auto-assign to default workspace as Consultor
          const defaultWorkspace = await prisma.workspace.findFirst({
            where: { deleted_at: null },
            orderBy: { created_at: "asc" },
          });
          const consultorRole = await prisma.role.findUnique({
            where: { name: "Consultor" },
          });

          if (defaultWorkspace && consultorRole) {
            await prisma.workspaceUser.create({
              data: {
                user_id: dbUser.id,
                workspace_id: defaultWorkspace.id,
                role_id: consultorRole.id,
              },
            });
          }
        } else if (!dbUser.is_active) {
          return false;
        }

        // Upsert Account record to store OAuth tokens
        await prisma.account.upsert({
          where: {
            provider_provider_account_id: {
              provider: account.provider,
              provider_account_id: account.providerAccountId,
            },
          },
          update: {
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token as string | undefined,
          },
          create: {
            user_id: dbUser.id,
            type: account.type,
            provider: account.provider,
            provider_account_id: account.providerAccountId,
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token as string | undefined,
          },
        });

        // Set user fields so jwt callback can use them
        user.id = dbUser.id;
        user.name = dbUser.full_name;
        user.email = dbUser.email;
      }

      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      if (account?.provider === "microsoft-entra-id" && account.access_token) {
        token.access_token = account.access_token;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
