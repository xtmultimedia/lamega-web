import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

// Sentinel id for the .env escape-hatch account (see authorize() below).
export const ENV_ADMIN_ID = "env-admin";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim();
        const password = credentials?.password;
        if (!email || !password) return null;

        // 1) Escape hatch: the original .env credential always works, with the
        //    admin role. Guarantees the owner is never locked out of the panel
        //    even if the AdminUser table or the DB is unavailable.
        const envUser = process.env.ADMIN_USER;
        const envPass = process.env.ADMIN_PASSWORD;
        if (envUser && envPass && email === envUser && password === envPass) {
          return { id: ENV_ADMIN_ID, name: envUser, email: envUser, role: "admin" };
        }

        // 2) DB-backed accounts (email + bcrypt password).
        try {
          const user = await prisma.adminUser.findUnique({
            where: { email: email.toLowerCase() },
          });
          if (!user || !user.active || !user.passwordHash) return null;
          const ok = await bcrypt.compare(password, user.passwordHash);
          if (!ok) return null;

          // best-effort; never block sign-in on this
          prisma.adminUser
            .update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
            .catch(() => {});

          return { id: user.id, name: user.name, email: user.email, role: user.role };
        } catch {
          return null; // DB unavailable → only the escape hatch works
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.uid = (user as { id?: string }).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string | undefined;
        (session.user as { id?: string }).id = token.uid as string | undefined;
      }
      return session;
    },
  },
};
