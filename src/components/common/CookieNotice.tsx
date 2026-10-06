"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import Script from "next/script";
import { Cookie, X } from "lucide-react";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot() {
  return localStorage.getItem("samaura_cookie_consent") || "prompt";
}

function getServerSnapshot() {
  return null;
}

export function CookieNotice() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const consent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!gaId || consent !== "prompt") {
    return (
      <>
        {gaId && consent === "granted" && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
      </>
    );
  }

  const handleAccept = () => {
    localStorage.setItem("samaura_cookie_consent", "granted");
    window.dispatchEvent(new Event("storage"));
  };

  const handleDecline = () => {
    localStorage.setItem("samaura_cookie_consent", "denied");
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <div
      role="region"
      aria-label="Cookie consent banner"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 bg-white border border-pink-light/80 shadow-xl rounded-3xl p-5 text-ink animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="flex items-start gap-3.5">
        <div className="p-2 rounded-2xl bg-blush text-brand shrink-0">
          <Cookie className="w-5 h-5" />
        </div>
        <div className="space-y-1.5 flex-1 text-xs">
          <p className="font-heading font-bold text-sm text-ink">Cookie Preferences</p>
          <p className="text-muted leading-relaxed">
            We use essential cookies to keep your shopping cart working and optional analytics to measure site performance. Read our{" "}
            <Link href="/privacy" className="text-brand font-medium hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={handleAccept}
              className="px-4 py-2 bg-brand text-white font-semibold rounded-full hover:bg-brand-dark transition text-xs shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              Accept All
            </button>
            <button
              onClick={handleDecline}
              className="px-4 py-2 bg-blush text-muted font-medium rounded-full hover:bg-pink-light/50 transition text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              Essential Only
            </button>
          </div>
        </div>
        <button
          onClick={handleDecline}
          aria-label="Dismiss cookie notice"
          className="text-muted hover:text-ink p-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
