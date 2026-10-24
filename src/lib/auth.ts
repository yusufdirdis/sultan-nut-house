import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import type { Role } from "@/generated/prisma/enums";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Auth.js only passes an error back to the browser if it's a CredentialsSignin
// (as `code`). A plain `throw new Error(...)` from authorize() is reported as a
// generic "Configuration" error instead, which the login page can't tell apart
// from a server failure.
class EmailNotVerified extends CredentialsSignin {
  code = "email_not_verified";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Credentials provider only supports the JWT session strategy in Auth.js —
  // database sessions require an OAuth-style provider. Instant revocation
  // (password change, admin-forced logout, suspected compromise) is achieved
  // instead via User.sessionVersion, re-checked against the DB on every
  // request in the `jwt` callback below.
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const user = await db.user.findUnique({ where: { email: parsed.data.email } });
        if (!user?.passwordHash) return null;

        const isValidPassword = await verifyPassword(user.passwordHash, parsed.data.password);
        if (!isValidPassword) return null;

        if (!user.emailVerified) {
          throw new EmailNotVerified();
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role as Role;
        token.sessionVersion = (user as { sessionVersion: number }).sessionVersion;
      }

      if (!token.sub) return token;

      const current = await db.user.findUnique({
        where: { id: token.sub },
        select: { role: true, sessionVersion: true },
      });

      // User deleted, or sessionVersion bumped since this token was issued —
      // end the session rather than trusting a stale token.
      if (!current || current.sessionVersion !== token.sessionVersion) {
        return null;
      }

      token.role = current.role;
      return token;
    },
    async session({ session, token }) {
      if (token?.sub) {
        session.user.id = token.sub;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
});
