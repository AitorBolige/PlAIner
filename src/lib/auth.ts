import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

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
          .select("id, email, name, image, passwordHash")
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
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) token.id = user.id;

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

        const { data: existing } = await getSupabaseAdmin()
          .from("User")
          .select("id")
          .eq("email", email)
          .single();

        let userId: string;
        if (!existing) {
          userId = crypto.randomUUID();
          await getSupabaseAdmin()
            .from("User")
            .insert({ id: userId, email, name, image });
        } else {
          userId = existing.id;
          await getSupabaseAdmin()
            .from("User")
            .update({ name, image })
            .eq("id", userId);
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
      if (session.user && token.id) session.user.id = token.id as string;
      return session;
    },
  },
};
