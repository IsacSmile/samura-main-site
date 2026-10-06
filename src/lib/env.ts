import { z } from "zod";

const productionEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
  NEXT_PUBLIC_SITE_URL: z.string().url("NEXT_PUBLIC_SITE_URL must be a valid URL"),
});

export const seedAdminEnvSchema = z.object({
  ADMIN_EMAIL: z.string().email("ADMIN_EMAIL must be a valid email for production seeding"),
  ADMIN_PASSWORD: z.string().min(8, "ADMIN_PASSWORD must be at least 8 characters"),
});

/**
 * Validates critical environment variables at startup in production.
 * Fails fast without leaking secret values to logs.
 */
export function validateStartupEnv(): void {
  if (process.env.NODE_ENV === "production") {
    const result = productionEnvSchema.safeParse({
      DATABASE_URL: process.env.DATABASE_URL,
      AUTH_SECRET: process.env.AUTH_SECRET,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    });

    if (!result.success) {
      const missingKeys = result.error.issues.map((i) => i.path.join(".")).join(", ");
      throw new Error(
        `[SAMAURA STARTUP ERROR] Missing or invalid required environment variables in production: ${missingKeys}. Startup aborted.`
      );
    }

    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes("placeholder")) {
      console.warn(
        "⚠️ [SAMAURA STARTUP WARNING] RESEND_API_KEY is not configured or uses a placeholder in production. Outbound customer and admin emails will fail."
      );
    }
  }
}
