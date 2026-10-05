import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "brand" | "blush" | "success" | "outline" | "muted";
  size?: "sm" | "md";
}

export function Badge({
  children,
  variant = "blush",
  size = "md",
  className = "",
  ...props
}: BadgeProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold rounded-full tracking-wide";

  const variantStyles = {
    brand: "bg-brand text-white shadow-xs",
    blush: "bg-blush text-brand border border-pink-light",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    outline: "border border-pink-light text-ink bg-white",
    muted: "bg-gray-100 text-muted",
  };

  const sizeStyles = {
    sm: "text-[10px] px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
  };

  return (
    <span
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
