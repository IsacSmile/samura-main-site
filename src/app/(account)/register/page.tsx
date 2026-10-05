"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { ArrowRight, ShieldCheck, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { registerAction } from "@/app/actions/auth";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await registerAction({
        name,
        email,
        password,
        phone: phone.trim() ? phone.trim() : null,
      });

      if (!res.success) {
        setError(res.error || "Registration failed. Please check your information.");
        setLoading(false);
        return;
      }

      setSuccess(true);

      // Auto sign in user
      const loginRes = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (loginRes?.ok) {
        router.push("/account");
        router.refresh();
      } else {
        router.push("/login?registered=1");
      }
    } catch {
      setError("An unexpected error occurred during account creation.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-linear-to-b from-blush/40 via-white to-white min-h-screen py-12 sm:py-20 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-pink-light shadow-lg">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-blush text-brand text-xs font-semibold px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Join Samaura</span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-ink">
            Create Your Account
          </h1>
          <p className="text-xs text-muted">
            Enjoy one-click checkout, saved addresses, and automatic linking of previous guest orders.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-2xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>Account created successfully! Signing you in...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-ink">Full Name *</label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya Sharma"
              required
              minLength={2}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-ink">Email Address *</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-ink">Phone Number (Optional)</label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit mobile number"
              pattern="[6-9][0-9]{9}"
              title="10-digit Indian mobile number"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-ink">Password * (min. 6 characters)</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <Button
            type="submit"
            size="lg"
            isLoading={loading}
            className="w-full shadow-md mt-2"
          >
            Create Account <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <p className="text-center text-xs text-muted pt-2">
            Already have an account?{" "}
            <Link href="/login" className="text-brand font-semibold hover:underline">
              Sign in
            </Link>
          </p>
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
            Your medical and personal data is never shared
          </p>
        </div>
      </div>
    </div>
  );
}
