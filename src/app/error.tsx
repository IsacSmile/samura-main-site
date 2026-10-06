"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Samaura App Error Caught]:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-linear-to-b from-blush/40 via-white to-white px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center gap-2 bg-red-50 text-brand px-4 py-1.5 rounded-full border border-red-200 shadow-xs text-xs font-semibold">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Something went wrong</span>
        </div>

        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-ink tracking-tight">
          We encountered a temporary issue
        </h1>

        <p className="text-muted text-sm sm:text-base leading-relaxed">
          An unexpected error occurred while loading this page. Our team has been notified.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="primary"
            onClick={() => reset()}
            className="w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </Button>
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full flex items-center justify-center gap-2">
              <Home className="w-4 h-4" />
              <span>Back to Home</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
