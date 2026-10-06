import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/lib/validation/schemas";

import { checkRateLimit, resetRateLimit } from "@/lib/rateLimit";

// Fail-fast in production if AUTH_SECRET is missing
if (process.env.NODE_ENV === "production" && !process.env.AUTH_SECRET) {
  throw new Error("CRITICAL SECURITY ERROR: AUTH_SECRET environment variable is missing in production.");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? "__Secure-authjs.session-token" : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;
        const normalizedEmail = email.toLowerCase().trim();

        // 1. Persistent rate limit: max 5 login attempts per 15 minutes
        const rateCheck = await checkRateLimit(`login:${normalizedEmail}`, 5, 900);
        if (!rateCheck.allowed) {
          throw new Error("Too many failed login attempts. Please try again after 15 minutes.");
        }

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, normalizedEmail))
          .limit(1);

        // Generic error message: do not reveal whether user exists or is deactivated
        if (!user || !user.passwordHash) {
          return null;
        }

        // Deactivated user cannot log in
        if (user.isActive === false) {
          return null;
        }

        // Admin-specific rate limiting
        if (user.role === "admin") {
          const adminRate = await checkRateLimit(`admin_login:${normalizedEmail}`, 5, 900);
          if (!adminRate.allowed) {
            throw new Error("Too many failed admin login attempts. Please try again after 15 minutes.");
          }
        }

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) {
          return null;
        }

        // Reset rate limits on successful authentication
        resetRateLimit(`login:${normalizedEmail}`);
        if (user.role === "admin") {
          resetRateLimit(`admin_login:${normalizedEmail}`);
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role || "customer";
        token.phone = (user as { phone?: string }).phone;
        token.authTime = Math.floor(Date.now() / 1000);
      }

      if (token?.id) {
        const [u] = await db
          .select({ isActive: users.isActive, passwordChangedAt: users.passwordChangedAt })
          .from(users)
          .where(eq(users.id, token.id as string))
          .limit(1);

        if (!u || u.isActive === false) {
          return null;
        }

        if (u.passwordChangedAt) {
          const changedSec = Math.floor(u.passwordChangedAt.getTime() / 1000);
          const tokenIssuedSec = (token.authTime as number) || (token.iat as number) || 0;
          if (tokenIssuedSec < changedSec) {
            return null; // session invalidated by password reset
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (!token?.id) {
        return {
          ...session,
          user: undefined,
        } as unknown as typeof session;
      }
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = (token.role as string) || "customer";
        (session.user as { phone?: string }).phone = token.phone as string | undefined;
      }
      return session;
    },
  },
});

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized: Authentication required.");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== "admin") {
    throw new Error("Forbidden: Administrator privileges required.");
  }
  return user as {
    id: string;
    name?: string | null;
    email?: string | null;
    role: "admin";
    phone?: string;
  };
}
