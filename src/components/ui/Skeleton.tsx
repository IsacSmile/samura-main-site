import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular" | "rounded";
}

export function Skeleton({
  variant = "rounded",
  className = "",
  ...props
}: SkeletonProps) {
  const variantStyles = {
    text: "h-4 rounded-md w-full",
    circular: "rounded-full aspect-square",
    rectangular: "rounded-none w-full",
    rounded: "rounded-2xl w-full",
  };

  return (
    <div
      className={`animate-pulse bg-blush border border-pink-light/50 ${variantStyles[variant]} ${className}`}
      {...props}
    />
  );
}
