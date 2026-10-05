import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "customer" | "admin";
      phone?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: "customer" | "admin";
    phone?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "customer" | "admin";
    phone?: string;
  }
}
