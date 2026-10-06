"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Samaura Global Error]:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="font-sans antialiased bg-white text-ink min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="inline-block p-4 rounded-full bg-red-50 text-red-600 mb-2">
            ⚠️
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Critical System Error
          </h1>
          <p className="text-gray-600 text-sm">
            A critical application error occurred. Please try refreshing the page.
          </p>
          <div className="pt-4">
            <button
              onClick={() => reset()}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-full shadow-sm transition"
            >
              Reload Application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
