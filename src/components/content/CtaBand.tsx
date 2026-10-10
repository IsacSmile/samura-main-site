import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface ActionConfig {
  label: string;
  href: string;
}

interface CtaBandProps {
  title: string;
  description?: string;
  primaryAction: ActionConfig;
  secondaryAction?: ActionConfig;
  className?: string;
}

export function CtaBand({
  title,
  description,
  primaryAction,
  secondaryAction,
  className = "",
}: CtaBandProps) {
  return (
    <div
      className={`rounded-2xl border border-pink-light bg-linear-to-br from-blush via-[#FFF5F7] to-blush/60 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6 ${className}`}
    >
      <div className="space-y-1.5 text-left max-w-xl">
        <h3 className="font-heading font-semibold text-base sm:text-lg text-ink">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-muted leading-relaxed font-sans font-normal">
            {description}
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 md:justify-end">
        {secondaryAction && (
          <Link
            href={secondaryAction.href}
            className="group min-h-11 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-pink-light px-5 py-2.5 text-sm font-medium text-ink shadow-xs hover:bg-blush/60 hover:border-[#FFC7D4] active:scale-[0.98] transition-all duration-200 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            <span>{secondaryAction.label}</span>
          </Link>
        )}

        <Link
          href={primaryAction.href}
          className="group min-h-11 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-brand-dark active:scale-[0.98] transition-all duration-200 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <span>{primaryAction.label}</span>
          <ArrowRight
            className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
            strokeWidth={1.75}
            aria-hidden="true"
          />
        </Link>
      </div>
    </div>
  );
}
