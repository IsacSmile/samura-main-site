import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdminRoute = nextUrl.pathname.startsWith("/admin");
      const isAccountRoute = nextUrl.pathname.startsWith("/account");
      const userRole = (auth?.user as { role?: string })?.role;

      if (isAdminRoute) {
        if (!isLoggedIn) return false; // redirect to /login
        if (userRole !== "admin") {
          // Logged in but not admin: redirect to home
          return Response.redirect(new URL("/", nextUrl));
        }
        return true;
      }

      if (isAccountRoute) {
        return isLoggedIn;
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role || "customer";
        token.phone = (user as { phone?: string }).phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = (token.role as string) || "customer";
        (session.user as { phone?: string }).phone = token.phone as string | undefined;
      }
      return session;
    },
  },
  providers: [], // Added in auth.ts
};
