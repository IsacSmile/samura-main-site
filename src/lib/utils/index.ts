export * from "./money";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Normalizes the storefront base URL so that it always includes a valid protocol (https:// or http://)
 * and strips trailing slashes, even if configured as a bare domain (e.g. "samaura.nihatechsolutions.online").
 */
export function getSiteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.samaurahealthcare.com").trim();
  const withProtocol = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
  return withProtocol.replace(/\/+$/, "");
}
