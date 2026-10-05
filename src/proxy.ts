import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - uploads (uploaded static media)
     * - favicon.ico (favicon file)
     * - public assets
     */
    "/admin/:path*",
    "/account/:path*",
  ],
};
