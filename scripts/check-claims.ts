// Re-entry guard: exit immediately if CHECK_RUNNING=1 is already set
if (process.env.CHECK_RUNNING === "1") {
  console.log("[Re-entry Guard] CHECK_RUNNING=1 is already set; exiting check-claims immediately.");
  process.exit(0);
}

import fs from "node:fs";
import path from "node:path";

// -------------------------------------------------------------
// Banned marketing & medical claims per CCPA & Ayush guidelines
// -------------------------------------------------------------
import { BANNED_CLAIM_PHRASES, getClaimRegex } from "../src/lib/claims/guard";

interface AllowlistItem {
  phrase: string;
  reference: string;
  notes?: string;
}

interface MatchResult {
  source: string;
  location: string;
  phrase: string;
  snippet: string;
}

function loadAllowlist(): Set<string> {
  const allowlistPath = path.join(process.cwd(), "config", "claims-allowlist.json");
  if (!fs.existsSync(allowlistPath)) {
    return new Set();
  }
  try {
    const raw = fs.readFileSync(allowlistPath, "utf-8").trim();
    if (!raw) return new Set();
    const data: AllowlistItem[] = JSON.parse(raw);
    return new Set(data.map((item) => item.phrase.toLowerCase().trim()));
  } catch (err) {
    console.error("[ClaimsGuard] Failed to parse allowlist:", err);
    return new Set();
  }
}

const allowlist = loadAllowlist();
const violations: MatchResult[] = [];

function checkText(text: string, source: string, locationIdentifier = ""): void {
  for (const phrase of BANNED_CLAIM_PHRASES) {
    const lowerPhrase = phrase.toLowerCase();
    if (allowlist.has(lowerPhrase)) {
      continue;
    }

    const regex = getClaimRegex(phrase);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const matchIndex = match.index;
      const matchStr = match[0];

      // 1. Skip code identifiers (e.g. approveReviewAction, isApproved, approved_at)
      const prevChar = matchIndex > 0 ? text[matchIndex - 1] : "";
      const nextChar = matchIndex + matchStr.length < text.length ? text[matchIndex + matchStr.length] : "";
      const isWordChar = (c: string) => /[a-zA-Z0-9_$]/.test(c);

      // If bounded by code identifier characters, skip it as a code identifier
      if (isWordChar(prevChar) || isWordChar(nextChar)) {
        continue;
      }

      // 2. Skip references to reviews.status column in code/queries
      const lineStart = text.lastIndexOf("\n", matchIndex) + 1;
      const lineEnd = text.indexOf("\n", matchIndex);
      const currentLine = text.substring(lineStart, lineEnd === -1 ? text.length : lineEnd);

      if (
        currentLine.includes("reviews.status") ||
        (currentLine.includes("status") && (currentLine.includes("review") || currentLine.includes("Review")))
      ) {
        continue;
      }

      // Calculate line number if text contains newlines
      const beforeText = text.substring(0, matchIndex);
      const lineNumber = beforeText.split("\n").length;
      const start = Math.max(0, matchIndex - 35);
      const end = Math.min(text.length, matchIndex + matchStr.length + 35);
      const snippet = text.substring(start, end).replace(/\s+/g, " ");

      violations.push({
        source,
        location: locationIdentifier ? `${locationIdentifier}:${lineNumber}` : `Line ${lineNumber}`,
        phrase,
        snippet: `...${snippet}...`,
      });

      if (matchStr.length === 0) {
        regex.lastIndex++;
      }
    }
  }
}

function scanDirectory(dirPath: string, fileFilter: (f: string) => boolean): void {
  if (!fs.existsSync(dirPath)) return;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name !== "node_modules" &&
        entry.name !== ".next" &&
        entry.name !== ".git"
      ) {
        scanDirectory(fullPath, fileFilter);
      }
    } else if (entry.isFile() && fileFilter(fullPath)) {
      // Skip the guard itself, check scripts, and tests
      const relative = path.relative(process.cwd(), fullPath);
      if (
        relative.includes("scripts/check-claims") ||
        relative.includes("src/lib/claims/guard.ts") ||
        relative.includes("tests/")
      ) {
        continue;
      }

      const content = fs.readFileSync(fullPath, "utf-8");
      checkText(content, relative);
    }
  }
}

console.log("=================================================");
console.log("SAMAURA HEALTHCARE — SOURCE & SVG CLAIMS SCAN");
console.log("=================================================");
console.log(`Scan Targets: src/, db/seed, public/**/*.svg, README.md`);
console.log(`Banned Terms: ${BANNED_CLAIM_PHRASES.join(", ")}`);
console.log(`Allowlist items: ${allowlist.size}\n`);

// 1. Scan src/ (excluding generated migrations)
scanDirectory(path.join(process.cwd(), "src"), (p) => {
  if (p.includes(path.join("src", "db", "migrations"))) return false;
  const ext = path.extname(p);
  return [".ts", ".tsx", ".js", ".jsx", ".json", ".css"].includes(ext);
});

// 2. Scan db/seed (or src/db/seed)
if (fs.existsSync(path.join(process.cwd(), "db", "seed"))) {
  scanDirectory(path.join(process.cwd(), "db", "seed"), () => true);
}

// 3. Scan public/**/*.svg content
scanDirectory(path.join(process.cwd(), "public"), (p) => p.endsWith(".svg"));

// 4. Scan all filenames in public/ (including subdirectories)
function scanPublicFilenames(dirPath: string): void {
  if (!fs.existsSync(dirPath)) return;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      scanPublicFilenames(fullPath);
    } else if (entry.isFile()) {
      const relative = path.relative(process.cwd(), fullPath);
      // Check normalized filename with hyphens/underscores/dots replaced by spaces
      const normalizedName = entry.name.replace(/[-_.]/g, " ");
      checkText(normalizedName, `public/ filename: ${relative}`);
    }
  }
}
scanPublicFilenames(path.join(process.cwd(), "public"));

// 5. Scan README.md
const readmePath = path.join(process.cwd(), "README.md");
if (fs.existsSync(readmePath)) {
  const content = fs.readFileSync(readmePath, "utf-8");
  checkText(content, "README.md");
}

// Output results
if (violations.length > 0) {
  console.error(`\n❌ [CLAIMS AUDIT FAILED] Found ${violations.length} prohibited claim matches in source/assets:\n`);
  for (const v of violations) {
    console.error(`  - ${v.source} (${v.location})`);
    console.error(`    Phrase: "${v.phrase}"`);
    console.error(`    Context: ${v.snippet}\n`);
  }
  console.error("Action Required: Neutralize copy in source/assets or add written client authorization to config/claims-allowlist.json.\n");
  process.exit(1);
} else {
  console.log("✅ [SOURCE CLAIMS SCAN PASSED] Zero non-compliant claims found in source files and vector assets.\n");
  process.exit(0);
}
