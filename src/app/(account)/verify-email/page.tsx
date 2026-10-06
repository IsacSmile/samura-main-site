"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { verifyEmailAction } from "@/app/actions/auth";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const hasToken = Boolean(token);
  const [loading, setLoading] = useState(hasToken);
  const [success, setSuccess] = useState(false);
  const [linkedCount, setLinkedCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(
    hasToken ? null : "Verification token is missing from the link. Please request a new verification email."
  );

  useEffect(() => {
    if (!token) return;

    let ignore = false;
    async function executeVerification() {
      try {
        const res = await verifyEmailAction(token);
        if (ignore) return;
        if (res.success) {
          setSuccess(true);
          if ("linkedOrdersCount" in res && typeof res.linkedOrdersCount === "number") {
            setLinkedCount(res.linkedOrdersCount);
          }
        } else {
          setError(res.error || "Email verification failed or link has expired.");
        }
      } catch {
        if (!ignore) {
          setError("An unexpected error occurred while verifying your email.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    executeVerification();
    return () => {
      ignore = true;
    };
  }, [token]);

  return (
    <div className="bg-linear-to-b from-blush/40 via-white to-white min-h-screen py-12 sm:py-20 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl border border-pink-light shadow-lg text-center space-y-6">
        <div className="inline-flex items-center gap-1.5 bg-blush text-brand text-xs font-semibold px-3 py-1 rounded-full">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Email Verification</span>
        </div>

        {loading && (
          <div className="space-y-4 py-8">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-3 border-brand border-t-transparent" />
            <h2 className="font-heading font-bold text-lg text-ink">Verifying Your Email...</h2>
            <p className="text-xs text-muted">
              Please wait while we validate your credentials and link your purchase history.
            </p>
          </div>
        )}

        {!loading && success && (
          <div className="space-y-6">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="font-heading font-extrabold text-2xl text-ink">
                Email Successfully Verified!
              </h1>
              <p className="text-xs text-muted leading-relaxed">
                Your email address has been confirmed. You now have full access to your Samaura account.
              </p>
            </div>

            {linkedCount > 0 ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs">
                <strong>{linkedCount} previous guest {linkedCount === 1 ? "order" : "orders"}</strong> matching your email address {linkedCount === 1 ? "has" : "have"} been securely linked to your account.
              </div>
            ) : (
              <div className="p-3 bg-blush/60 border border-pink-light rounded-2xl text-xs text-muted">
                Your account is verified and ready for seamless shopping and tracking.
              </div>
            )}

            <Button
              type="button"
              onClick={() => {
                router.push("/account");
                router.refresh();
              }}
              className="w-full shadow-md"
            >
              Continue to My Account <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        )}

        {!loading && error && (
          <div className="space-y-6">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="font-heading font-extrabold text-2xl text-ink">
                Verification Failed
              </h1>
              <p className="text-xs text-red-600 bg-red-50 p-3 rounded-2xl border border-red-200">
                {error}
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Sign In to Your Account
                </Button>
              </Link>
              <Link href="/contact" className="text-xs font-semibold text-brand hover:underline">
                Contact Customer Support
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
