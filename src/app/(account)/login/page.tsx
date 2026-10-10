"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") || "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl,
      });

      if (res?.error) {
        setError("Invalid email or password. Please check your credentials.");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-[calc(100vh-var(--header-height)-var(--top-notch-height))] py-12 sm:py-20 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-pink-light space-y-6">
        {/* Header */}
        <div className="text-left sm:text-center space-y-1.5">
          <h1 className="font-heading font-semibold text-2xl sm:text-3xl text-ink tracking-tight">
            Sign in
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            Sign in to track orders, manage saved addresses, and repeat purchases.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="block text-xs font-medium text-ink">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="w-full min-h-11 bg-white border border-pink-light rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-ink focus:outline-none focus:border-brand transition-colors placeholder:text-muted/60"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="login-password" className="block text-xs font-medium text-ink">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-brand hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full min-h-11 bg-white border border-pink-light rounded-xl pl-3.5 pr-11 py-2.5 text-xs sm:text-sm text-ink focus:outline-none focus:border-brand transition-colors placeholder:text-muted/60"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-0 h-full w-11 flex items-center justify-center text-muted hover:text-ink transition-colors touch-manipulation"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" strokeWidth={1.75} />
                ) : (
                  <Eye className="w-4 h-4" strokeWidth={1.75} />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-11 rounded-full bg-brand hover:bg-brand-dark text-white font-medium text-xs sm:text-sm py-2.5 px-4 transition-colors disabled:opacity-50 touch-manipulation cursor-pointer"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <div className="text-center text-xs text-muted pt-2 space-y-2">
            <p>
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-brand font-medium hover:underline">
                Create an account
              </Link>
            </p>
            <div>
              <Link
                href="/shop"
                className="text-muted hover:text-ink transition-colors inline-block pt-2"
              >
                Continue as guest
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
