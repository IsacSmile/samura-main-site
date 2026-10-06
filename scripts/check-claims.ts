import fs from "node:fs";
import path from "node:path";
import Database from "libsql";

// -------------------------------------------------------------
// Banned marketing & medical claims per CCPA & Ayush guidelines
// -------------------------------------------------------------
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
    const data: AllowlistItem[] = JSON.parse(fs.readFileSync(allowlistPath, "utf-8"));
    return new Set(data.map((item) => item.phrase.toLowerCase().trim()));
  } catch (err) {
    console.error("[ClaimsGuard] Failed to parse allowlist:", err);
    return new Set();
  }
}

const allowlist = loadAllowlist();
const violations: MatchResult[] = [];

function checkText(text: string, source: string, locationIdentifier = ""): void {
  const lower = text.toLowerCase();
  for (const phrase of BANNED_CLAIM_PHRASES) {
    const lowerPhrase = phrase.toLowerCase();
    if (allowlist.has(lowerPhrase)) {
      continue;
    }

    let searchIndex = 0;
    while ((searchIndex = lower.indexOf(lowerPhrase, searchIndex)) !== -1) {
      // Calculate line number if text contains newlines
      const beforeText = text.substring(0, searchIndex);
      const lineNumber = beforeText.split("\n").length;
      const start = Math.max(0, searchIndex - 35);
      const end = Math.min(text.length, searchIndex + lowerPhrase.length + 35);
      const snippet = text.substring(start, end).replace(/\s+/g, " ");

      violations.push({
        source,
        location: locationIdentifier ? `${locationIdentifier}:${lineNumber}` : `Line ${lineNumber}`,
        phrase,
        snippet: `...${snippet}...`,
      });

      searchIndex += lowerPhrase.length;
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
      // Skip the guard itself and check-claims script where banned words are explicitly defined
      const relative = path.relative(process.cwd(), fullPath);
      if (
        relative.includes("scripts/check-claims.ts") ||
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

function checkDatabase(dbPath: string): void {
  if (!fs.existsSync(dbPath)) {
    console.log(`[ClaimsGuard] DB at ${dbPath} not found, skipping DB check.`);
    return;
  }

  const db = new Database(dbPath);
  const tables = ["settings", "pages", "banners", "categories", "products", "posts"];

  for (const table of tables) {
    try {
      const rows = db.prepare(`SELECT * FROM ${table}`).all();
      for (const row of rows) {
        const record = row as Record<string, unknown>;
        const id = String(record.id || record.key || record.slug || "unknown");

        for (const [col, val] of Object.entries(record)) {
          if (typeof val === "string" && val.trim().length > 0) {
            checkText(val, `DB [${table}]`, `ID=${id} Col=${col}`);
          }
        }
      }
    } catch (err: unknown) {
      console.warn(`[ClaimsGuard] Table ${table} check warning:`, (err as Error).message);
    }
  }
}

console.log("=================================================");
console.log("SAMAURA HEALTHCARE — COMPLIANCE CLAIMS AUDIT");
console.log("=================================================");
console.log(`Audit Targets: src/, db/seed, public/**/*.svg, README.md, DB`);
console.log(`Banned Terms: ${BANNED_CLAIM_PHRASES.join(", ")}`);
console.log(`Allowlist items: ${allowlist.size}\n`);

// 1. Scan src/
scanDirectory(path.join(process.cwd(), "src"), (p) => {
  const ext = path.extname(p);
  return [".ts", ".tsx", ".js", ".jsx", ".json", ".css"].includes(ext);
});

// 2. Scan db/seed (or src/db/seed)
if (fs.existsSync(path.join(process.cwd(), "db", "seed"))) {
  scanDirectory(path.join(process.cwd(), "db", "seed"), () => true);
}

// 3. Scan public/**/*.svg
scanDirectory(path.join(process.cwd(), "public"), (p) => p.endsWith(".svg"));

// 4. Scan README.md
const readmePath = path.join(process.cwd(), "README.md");
if (fs.existsSync(readmePath)) {
  const content = fs.readFileSync(readmePath, "utf-8");
  checkText(content, "README.md");
}

// 5. Scan database
const defaultDbPath = path.join(process.cwd(), "data", "samaura.db");
checkDatabase(defaultDbPath);

// Output results
if (violations.length > 0) {
  console.error(`\n❌ [CLAIMS AUDIT FAILED] Found ${violations.length} prohibited claim matches:\n`);
  for (const v of violations) {
    console.error(`  - ${v.source} (${v.location})`);
    console.error(`    Phrase: "${v.phrase}"`);
    console.error(`    Context: ${v.snippet}\n`);
  }
  console.error("Action Required: Neutralize copy or obtain written client authorization and add to config/claims-allowlist.json.\n");
  process.exit(1);
} else {
  console.log("✅ [CLAIMS AUDIT PASSED] Zero non-compliant marketing or medical claims found.\n");
  process.exit(0);
}
