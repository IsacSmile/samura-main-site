"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, ShieldCheck, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { forgotPasswordAction } from "@/app/actions/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await forgotPasswordAction(email);
      if (!res.success) {
        setError("error" in res ? String(res.error) : "Failed to process request. Please try again.");
      } else {
        setSubmitted(true);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
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
            <span>Account Security</span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-ink">
            Reset Password
          </h1>
          <p className="text-xs text-muted">
            Enter your email address and we will send you a single-use link valid for 1 hour to securely reset your password.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-2xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          <div className="space-y-6">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 text-emerald-900">
              <div className="flex items-center gap-2 font-semibold text-sm text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Reset Link Dispatched</span>
              </div>
              <p className="text-xs leading-relaxed text-emerald-700">
                If an account exists for <strong className="text-emerald-900">{email}</strong>, we have sent password reset instructions to your inbox.
              </p>
              <p className="text-[11px] text-emerald-600">
                (In local development mode lacking Resend API keys, the link is logged directly to your terminal console.)
              </p>
            </div>

            <Link href="/login" className="block">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" /> Return to Login
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink">Account Email Address</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <Button
              type="submit"
              size="lg"
              isLoading={loading}
              className="w-full shadow-md mt-2"
            >
              <Mail className="w-4 h-4 mr-2" /> Send Reset Link
            </Button>

            <div className="pt-2 text-center">
              <Link
                href="/login"
                className="text-xs font-medium text-brand hover:underline inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" /> Back to sign in
              </Link>
            </div>
          </form>
        )}

        <div className="pt-4 border-t border-blush text-center">
          <p className="text-[11px] text-muted flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-success" />
            Tokens expire after 1 hour and can only be used once
          </p>
        </div>
      </div>
    </div>
  );
}
