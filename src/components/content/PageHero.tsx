import React from "react";
import Link from "next/link";

interface PageHeroProps {
  breadcrumbLabel: string;
  breadcrumbHref?: string;
  eyebrow?: string;
  title: string;
  lead?: string;
  children?: React.ReactNode;
}

export function PageHero({
  breadcrumbLabel,
  breadcrumbHref,
  eyebrow,
  title,
  lead,
  children,
}: PageHeroProps) {
  return (
    <header className="relative bg-linear-to-b from-blush/70 via-blush/40 to-white/10 pt-8 sm:pt-12">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 pb-10 sm:pb-14 text-left">
        {/* Semantic Breadcrumb Navigation - Plain Sentence Case */}
        <nav
          aria-label="Breadcrumb"
          className="mb-4 sm:mb-6 flex items-center gap-2 text-xs text-muted"
        >
          <Link
            href="/"
            className="hover:text-ink transition-colors underline-offset-4 hover:underline"
          >
            Home
          </Link>
          <span className="text-muted/40 select-none">/</span>
          {breadcrumbHref ? (
            <Link
              href={breadcrumbHref}
              className="text-ink font-medium hover:underline underline-offset-4"
              aria-current="page"
            >
              {breadcrumbLabel}
            </Link>
          ) : (
            <span className="text-ink font-medium" aria-current="page">
              {breadcrumbLabel}
            </span>
          )}
        </nav>

        {/* Small Eyebrow Label - Plain text, no pill border */}
        {eyebrow && (
          <p className="mb-2.5 text-xs sm:text-sm font-medium text-rose-800 tracking-normal">
            {eyebrow}
          </p>
        )}

        {/* Page Title - Exactly one H1 per page, clamp(2rem, 6vw, 3rem), tight tracking */}
        <h1 className="font-heading font-semibold text-[clamp(2rem,6vw,3rem)] leading-[1.15] tracking-tight text-ink max-w-3xl">
          {title}
        </h1>

        {/* Lead Paragraph - Comfortable 16-18px body, line length 60-70 characters */}
        {lead && (
          <p className="mt-4 sm:mt-5 text-base sm:text-lg text-muted leading-relaxed max-w-2xl">
            {lead}
          </p>
        )}

        {children && <div className="mt-6">{children}</div>}
      </div>

      {/* Subtle Inline SVG Curved Divider at Bottom */}
      <div
        className="w-full overflow-hidden leading-none pointer-events-none select-none -mb-px"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 1200 36"
          className="w-full h-5 sm:h-9 block text-white fill-current"
          preserveAspectRatio="none"
        >
          <path d="M0,0 C350,30 850,30 1200,0 L1200,36 L0,36 Z" />
        </svg>
      </div>
    </header>
  );
}
