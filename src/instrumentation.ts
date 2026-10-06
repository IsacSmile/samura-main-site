import { validateStartupEnv } from "@/lib/env";

/**
 * Next.js Instrumentation hook executed at server startup.
 * Enforces production environment validation and security alerts.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    validateStartupEnv();
  }
}
