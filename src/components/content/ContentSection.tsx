import React from "react";

interface ContentSectionProps {
  id?: string;
  ariaLabelledBy?: string;
  ariaLabel?: string;
  className?: string;
  containerClassName?: string;
  children: React.ReactNode;
}

export function ContentSection({
  id,
  ariaLabelledBy,
  ariaLabel,
  className = "",
  containerClassName = "",
  children,
}: ContentSectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={ariaLabelledBy}
      aria-label={ariaLabel}
      className={`w-full py-10 sm:py-16 scroll-mt-[calc(var(--header-height)+var(--top-notch-height))] ${className}`}
    >
      <div
        className={`mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 text-left ${containerClassName}`}
      >
        {children}
      </div>
    </section>
  );
}
