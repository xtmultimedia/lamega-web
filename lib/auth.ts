import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const user = process.env.ADMIN_USER;
        const pass = process.env.ADMIN_PASSWORD;
        if (!user || !pass) return null;
        if (credentials?.username === user && credentials?.password === pass) {
          return { id: "admin", name: user };
        }
        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
};
