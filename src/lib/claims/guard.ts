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
  "ph 3.5",
  "ph balanced",
  "relief",
  "soothing",
  "herbal",
  "botanical",
  "pain",
  "heal",
  "treat",
  "cure",
  "essential oil",
  "guarantee",
  "cramp",
  "period pain",
  "natural",
  "organic",
  "zero ",
  "without",
  "free of",
  "free-from",
  "suitable for",
  "extended wear",
  "holds up to",
  "bpa",
  "latex",
  "phthalate",
  "paraben",
  "verified",
  "guaranteed",
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

export function getClaimRegex(phrase: string): RegExp {
  const lower = phrase.toLowerCase();
  switch (lower) {
    case "heal":
      return /\bheal(?:s|ed|ing|er|ers)?\b/gi;
    case "cure":
      return /\bcure(?:s|ed|ing)?\b/gi;
    case "treat":
      return /\btreat(?:s|ed|ing|ment|ments)?\b/gi;
    case "pain":
      return /\bpain(?:s|ful|fully|less|lessly|killer|killers)?\b/gi;
    case "soothing":
      return /\bsooth(?:e|es|ing|ingly|ed)?\b/gi;
    case "relief":
      return /\b(?:relief|reliev(?:e|es|ing|ed))\b/gi;
    case "herbal":
      return /\bherbal(?:s)?\b/gi;
    case "botanical":
      return /\bbotanic(?:al|als)?\b/gi;
    case "ph 3.5":
      return /\bph\s*3\.5\b/gi;
    case "ph balanced":
      return /\bph[\s-]balanced\b/gi;
    case "essential oil":
      return /\bessential[\s-]oils?\b/gi;
    case "guarantee":
      return /\bguarantee(?:s|d)?\b/gi;
    case "cramp":
      return /\bcramp(?:s)?\b/gi;
    case "period pain":
      return /\bperiod[\s-]pain\b/gi;
    case "natural":
      return /\bnatural(?:ly)?\b/gi;
    case "organic":
      return /\borganic(?:ally)?\b/gi;
    case "zero ":
      return /\bzero\s+/gi;
    case "without":
      return /\bwithout\b/gi;
    case "free of":
      return /\bfree[\s-]of\b/gi;
    case "free-from":
      return /\bfree[\s-]from\b/gi;
    case "suitable for":
      return /\bsuitable[\s-]for\b/gi;
    case "extended wear":
      return /\bextended[\s-]wear\b/gi;
    case "holds up to":
      return /\bholds[\s-]up[\s-]to\b/gi;
    case "bpa":
      return /\bbpa\b/gi;
    case "latex":
      return /\blatex\b/gi;
    case "phthalate":
      return /\bphthalate(?:s)?\b/gi;
    case "paraben":
      return /\bparaben(?:s)?\b/gi;
    case "verified":
      return /\bverified\b/gi;
    case "guaranteed":
      return /\bguaranteed\b/gi;
    default: {
      const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(escaped, "gi");
    }
  }
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

  const allowlist = loadClaimsAllowlist();
  const allowedSet = new Set(allowlist.map((item) => item.phrase.toLowerCase()));

  const matches: string[] = [];

  for (const phrase of BANNED_CLAIM_PHRASES) {
    const lowerPhrase = phrase.toLowerCase();
    if (allowedSet.has(lowerPhrase)) {
      continue;
    }

    const regex = getClaimRegex(phrase);
    if (regex.test(textToScan)) {
      matches.push(phrase);
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
