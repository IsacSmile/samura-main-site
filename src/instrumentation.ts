/**
 * Next.js Instrumentation hook executed at server startup.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (process.env.NODE_ENV === "production" && !process.env.RESEND_API_KEY) {
      console.error(
        "[CRITICAL ERROR] RESEND_API_KEY is not configured in production! Email notifications will fail to send."
      );
    }
  }
}
