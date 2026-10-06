import fs from "node:fs";
import path from "node:path";

export const BANNED_CLAIM_PHRASES: readonly string[] = [
  "dermatolog",
  "gots",
  "certified",
  "100%",
  "medical-grade",
  "medical grade",
  "fda",
  "biocompatible",
  "leakproof",
  "zero leak",
  "anion",
  "rash-free",
  "hypoallergenic",
  "clinically",
  "sustainable",
  "eco-friendly",
  "no chlorine",
  "no perfume",
  "free from",
  "10yr",
  "12h",
  "approved",
];

export interface AllowlistItem {
  phrase: string;
  reference: string;
  notes?: string;
}

/**
 * Loads the client-approved claims allowlist.
 */
export function loadClaimsAllowlist(): AllowlistItem[] {
  try {
    const allowlistPath = path.join(process.cwd(), "config", "claims-allowlist.json");
    if (fs.existsSync(allowlistPath)) {
      const content = fs.readFileSync(allowlistPath, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("[ClaimsGuard] Error loading allowlist:", err);
  }
  return [];
}

/**
 * Inspects a string or object for unapproved medical / marketing claims.
 * Returns violations and an admin warning message.
 */
export function checkClaims(
  input: string | Record<string, unknown> | null | undefined
): {
  hasViolation: boolean;
  matches: string[];
  warning?: string;
} {
  if (!input) {
    return { hasViolation: false, matches: [] };
  }

  const textToScan = typeof input === "string" ? input : JSON.stringify(input);
  const lower = textToScan.toLowerCase();

  const allowlist = loadClaimsAllowlist();
  const allowedSet = new Set(allowlist.map((item) => item.phrase.toLowerCase()));

  const matches: string[] = [];

  for (const phrase of BANNED_CLAIM_PHRASES) {
    if (lower.includes(phrase.toLowerCase())) {
      if (!allowedSet.has(phrase.toLowerCase())) {
        matches.push(phrase);
      }
    }
  }

  if (matches.length > 0) {
    return {
      hasViolation: true,
      matches,
      warning: `Compliance Notice: Text contains regulated marketing claim phrase(s): [${matches.join(
        ", "
      )}]. Ensure written client & regulatory approval references are on file before publishing.`,
    };
  }

  return { hasViolation: false, matches: [] };
}
