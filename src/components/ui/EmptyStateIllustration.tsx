import React from "react";

interface EmptyStateIllustrationProps {
  className?: string;
  type?: "cart" | "search" | "orders";
}

export function EmptyStateIllustration({
  className = "w-28 h-28 mx-auto",
  type = "cart",
}: EmptyStateIllustrationProps) {
  if (type === "search") {
    return (
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
      >
        <circle cx="60" cy="60" r="54" fill="#FFF1F4" />
        <circle cx="60" cy="60" r="44" fill="#FFEAF0" />
        {/* Soft decorative floating dots */}
        <circle cx="28" cy="40" r="3" fill="#F5A3B7" opacity="0.6" />
        <circle cx="92" cy="36" r="4" fill="#F5A3B7" opacity="0.4" />
        <circle cx="34" cy="84" r="2.5" fill="#FFD9E2" />
        {/* Magnifying Glass */}
        <circle
          cx="52"
          cy="52"
          r="22"
          fill="#FFFFFF"
          stroke="#5C4A52"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Glass reflection */}
        <path
          d="M40 44 A14 14 0 0 1 54 38"
          stroke="#F5A3B7"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Handle */}
        <path
          d="M68 68 L84 84"
          stroke="#5C4A52"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (type === "orders") {
    return (
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
      >
        <circle cx="60" cy="60" r="54" fill="#FFF1F4" />
        <circle cx="60" cy="60" r="44" fill="#FFEAF0" />
        {/* Cardboard Box outline */}
        <path
          d="M36 48 L60 36 L84 48 L60 60 Z"
          fill="#FFFFFF"
          stroke="#5C4A52"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M36 48 L36 74 L60 86 L60 60 Z"
          fill="#FFF8F9"
          stroke="#5C4A52"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M84 48 L84 74 L60 86 L60 60 Z"
          fill="#FFEAF0"
          stroke="#5C4A52"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Tape strip */}
        <path
          d="M52 40 L68 48"
          stroke="#F5A3B7"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  // Default: shopping bag
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Background circles */}
      <circle cx="60" cy="60" r="54" fill="#FFF1F4" />
      <circle cx="60" cy="60" r="44" fill="#FFEAF0" />
      {/* Decorative dots */}
      <circle cx="30" cy="42" r="3" fill="#F5A3B7" opacity="0.6" />
      <circle cx="90" cy="38" r="4" fill="#F5A3B7" opacity="0.4" />
      <circle cx="36" cy="80" r="2.5" fill="#FFD9E2" />
      <circle cx="86" cy="80" r="3" fill="#FFD9E2" />
      {/* Bag handle */}
      <path
        d="M48 50 V40 C48 33.37 53.37 28 60 28 C66.63 28 72 33.37 72 40 V50"
        stroke="#5C4A52"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Bag body */}
      <rect
        x="38"
        y="46"
        width="44"
        height="46"
        rx="8"
        fill="#FFFFFF"
        stroke="#5C4A52"
        strokeWidth="2"
      />
      {/* Subtle bag fold line */}
      <path
        d="M38 56 H82"
        stroke="#FFD9E2"
        strokeWidth="1.5"
      />
      {/* Soft heart / petal motif on bag */}
      <path
        d="M60 66 C60 66 54 62 54 68 C54 72 60 76 60 76 C60 76 66 72 66 68 C66 62 60 66 60 66 Z"
        fill="#F5A3B7"
        opacity="0.8"
      />
    </svg>
  );
}
