import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/lib/validation/schemas";

// In-memory rate limiting map for login attempts: email -> { attempts, lockUntil }
const loginRateLimitMap = new Map<string, { attempts: number; lockUntil: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function recordFailedAttempt(email: string) {
  const now = Date.now();
  const current = loginRateLimitMap.get(email);
  if (!current) {
    loginRateLimitMap.set(email, { attempts: 1, lockUntil: 0 });
  } else {
    const attempts = current.attempts + 1;
    const lockUntil = attempts >= MAX_LOGIN_ATTEMPTS ? now + LOCKOUT_DURATION_MS : 0;
    loginRateLimitMap.set(email, { attempts, lockUntil });
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
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

        // Rate limit check: max 5 failed attempts per 15 minutes
        const now = Date.now();
        const attemptRecord = loginRateLimitMap.get(normalizedEmail);
        if (attemptRecord && attemptRecord.lockUntil > now) {
          throw new Error("Too many failed login attempts. Please try again after 15 minutes.");
        }

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, normalizedEmail))
          .limit(1);

        if (!user || !user.passwordHash) {
          recordFailedAttempt(normalizedEmail);
          return null;
        }

        if (user.isActive === false) {
          throw new Error("This account has been deactivated. Please contact support.");
        }

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) {
          recordFailedAttempt(normalizedEmail);
          return null;
        }

        // Reset failed attempts on success
        loginRateLimitMap.delete(normalizedEmail);

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
