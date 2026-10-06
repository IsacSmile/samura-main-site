"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock, ShieldCheck, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { resetPasswordAction } from "@/app/actions/auth";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Reset token is missing from the URL. Please request a new link.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await resetPasswordAction({
        token,
        newPassword,
      });

      if (!res.success) {
        setError(res.error || "Failed to reset password. The link may have expired or already been used.");
      } else {
        setSuccess(true);
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
            <span>Set New Password</span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-ink">
            Create New Password
          </h1>
          <p className="text-xs text-muted">
            Enter your new password below to secure your Samaura account.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-2xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="space-y-6">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 text-emerald-900">
              <div className="flex items-center gap-2 font-semibold text-sm text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Password Successfully Updated</span>
              </div>
              <p className="text-xs leading-relaxed text-emerald-700">
                Your password has been changed. You can now sign in with your new credentials.
              </p>
            </div>

            <Button
              type="button"
              onClick={() => router.push("/login")}
              className="w-full shadow-md"
            >
              Sign In to Your Account
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <meta name="referrer" content="no-referrer" />
            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink">New Password (min. 8 characters)</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-ink">Confirm New Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>

            <Button
              type="submit"
              size="lg"
              isLoading={loading}
              className="w-full shadow-md mt-2"
            >
              <Lock className="w-4 h-4 mr-2" /> Update Password
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
            Encrypted with 12 bcrypt salt rounds
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
