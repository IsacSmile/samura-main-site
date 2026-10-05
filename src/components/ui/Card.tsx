import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "blush" | "flat";
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({
  children,
  variant = "default",
  padding = "md",
  className = "",
  ...props
}: CardProps) {
  const baseStyles = "rounded-3xl transition-all duration-200";

  const variantStyles = {
    default:
      "bg-white border border-pink-light/70 shadow-pink hover:border-rose",
    blush:
      "bg-blush border border-pink-light shadow-xs",
    flat:
      "bg-white border border-gray-100",
  };

  const paddingStyles = {
    none: "p-0",
    sm: "p-4",
    md: "p-6",
    lg: "p-8 sm:p-10",
  };

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
