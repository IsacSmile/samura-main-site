"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { ArrowRight, ShieldCheck, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") || "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  const setDemoCredentials = (role: "admin" | "customer") => {
    if (role === "admin") {
      setEmail("admin@samaura.com");
      setPassword("Admin@123456");
    } else {
      setEmail("priya@example.com");
      setPassword("Customer@123456");
    }
    setError(null);
  };

  return (
    <div className="bg-linear-to-b from-blush/40 via-white to-white min-h-screen py-12 sm:py-20 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-pink-light shadow-lg">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-blush text-brand text-xs font-semibold px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Samaura Account</span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-ink">
            Welcome Back
          </h1>
          <p className="text-xs text-muted">
            Sign in to track orders, manage saved delivery addresses, and repeat purchases.
          </p>
        </div>

        {/* Demo Credentials Box */}
        <div className="bg-blush/70 border border-pink-light rounded-2xl p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between text-ink font-semibold">
            <span>Quick Demo Sign-In:</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDemoCredentials("customer")}
              className="flex-1 bg-white hover:bg-pink-light/40 border border-pink-light text-brand py-1.5 px-2 rounded-xl text-xs font-medium transition-colors"
            >
              Demo Customer
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials("admin")}
              className="flex-1 bg-white hover:bg-pink-light/40 border border-pink-light text-ink py-1.5 px-2 rounded-xl text-xs font-medium transition-colors"
            >
              Demo Admin
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-2xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-ink">Email Address</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-ink">Password</label>
            </div>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <Button
            type="submit"
            size="lg"
            isLoading={loading}
            className="w-full shadow-md mt-2"
          >
            Sign In to Account <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>

        <div className="pt-4 border-t border-blush text-center space-y-2">
          <Link
            href="/shop"
            className="text-xs font-medium text-muted hover:text-brand transition-colors block"
          >
            ← Continue shopping as guest
          </Link>
          <p className="text-[11px] text-muted flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-success" />
            256-bit encrypted secure sign-in
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
