import React from "react";
import type { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  className = "",
}: FeatureCardProps) {
  return (
    <div
      className={`group h-full flex flex-col justify-start rounded-2xl border border-pink-light bg-linear-to-b from-[#FFF7F9] to-white p-5 sm:p-6 shadow-xs transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-sm hover:border-[#FFC7D4] ${className}`}
    >
      <div className="mb-4 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-pink-light/80 bg-white text-ink shadow-xs transition-all duration-200 ease-out group-hover:border-rose-200 group-hover:text-rose-700">
        <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
      </div>
      <h3 className="font-heading font-semibold text-base sm:text-lg text-ink">
        {title}
      </h3>
      <p className="mt-2 text-sm sm:text-base text-muted leading-relaxed font-sans font-normal">
        {description}
      </p>
    </div>
  );
}
