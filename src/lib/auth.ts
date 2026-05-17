import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { prisma } from "@/lib/prisma";

async function logLogin({
  userId,
  email,
  method,
  success,
}: {
  userId: string | null;
  email: string;
  method: "credentials" | "google" | "facebook";
  success: boolean;
}) {
  await getSupabaseAdmin()
    .from("LoginEvent")
    .insert({
      id: crypto.randomUUID(),
      userId: userId ?? null,
      email,
      method,
      success,
    });
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/login" },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET
      ? [
          FacebookProvider({
            clientId: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
            authorization: {
              params: { scope: "email,public_profile" },
            },
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim() ?? "";
        const password = credentials?.password ?? "";
        if (!email || !password) return null;

        const { data: user } = await getSupabaseAdmin()
          .from("User")
          .select("id, email, name, image, passwordHash, ageGroup, nickname")
          .eq("email", email)
          .single();

        if (!user?.passwordHash) {
          await logLogin({
            userId: null,
            email,
            method: "credentials",
            success: false,
          });
          return null;
        }

        const ok = await bcrypt.compare(password, user.passwordHash);
        await logLogin({
          userId: user.id,
          email,
          method: "credentials",
          success: ok,
        });

        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          nickname: user.nickname,
          onboarded: !!user.ageGroup,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile, trigger, session }) {
      if (trigger === "update" && session) {
        if (session.onboarded !== undefined) token.onboarded = session.onboarded;
        if (session.nickname !== undefined) token.nickname = session.nickname;
        if (session.image !== undefined) token.image = session.image;
      }
      if (user) {
        token.id = user.id;
        if ('onboarded' in user) token.onboarded = user.onboarded;
        if ('nickname' in user) token.nickname = user.nickname;
        if ('image' in user) token.image = user.image;
      }

      if (
        (account?.provider === "google" || account?.provider === "facebook") &&
        profile?.email
      ) {
        const provider = account.provider as "google" | "facebook";
        const email = profile.email;
        const name = (profile as { name?: string }).name ?? null;
        const image =
          provider === "google"
            ? ((profile as { picture?: string }).picture ?? null)
            : ((profile as { picture?: { data?: { url?: string } } }).picture
                ?.data?.url ?? null);

        const existing = await prisma.user.findUnique({
          where: { email },
          select: { id: true, ageGroup: true, nickname: true, image: true }
        });

        let userId: string;
        if (!existing) {
          userId = crypto.randomUUID();
          await prisma.user.create({
            data: { id: userId, email, name, image }
          });
          token.onboarded = false;
        } else {
          userId = existing.id;
          await prisma.user.update({
            where: { id: userId },
            data: { name, image }
          });
          token.onboarded = !!existing.ageGroup;
          token.nickname = existing.nickname;
          if (existing.image) token.image = existing.image;
        }
        token.id = userId;

        const { data: existingAccount } = await getSupabaseAdmin()
          .from("Account")
          .select("id")
          .eq("provider", provider)
          .eq("providerAccountId", account.providerAccountId)
          .single();

        if (!existingAccount) {
          await getSupabaseAdmin()
            .from("Account")
            .insert({
              id: crypto.randomUUID(),
              userId,
              type: "oauth",
              provider,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token ?? null,
              refresh_token: account.refresh_token ?? null,
              expires_at: account.expires_at ?? null,
              token_type: account.token_type ?? null,
              scope: account.scope ?? null,
              id_token: account.id_token ?? null,
            });
        }

        await logLogin({ userId, email, method: provider, success: true });
      }

      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        (session.user as any).onboarded = token.onboarded;
        (session.user as any).nickname = token.nickname;
        if (token.image) session.user.image = token.image as string;
      }
      return session;
    },
  },
};
