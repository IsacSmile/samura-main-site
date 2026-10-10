"use client";

import React from "react";
import { usePathname } from "next/navigation";

interface StorefrontChromeProps {
  header: React.ReactNode;
  footer: React.ReactNode;
  extras: React.ReactNode;
  children: React.ReactNode;
}

export function StorefrontChrome({
  header,
  footer,
  extras,
  children,
}: StorefrontChromeProps) {
  const pathname = usePathname();
  const isAdmin = Boolean(pathname?.startsWith("/admin"));

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      {header}
      <main className="flex-1 pb-12 sm:pb-16">{children}</main>
      {footer}
      {extras}
    </>
  );
}
