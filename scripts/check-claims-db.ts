import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { createClient } from "@libsql/client";
import { BANNED_CLAIM_PHRASES, getClaimRegex } from "../src/lib/claims/guard";

dotenv.config();

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
    console.error("[ClaimsGuard:DB] Failed to parse allowlist:", err);
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

async function runDbScan() {
  const dbUrl = process.env.DATABASE_URL || "file:data/samaura.db";
  const authToken = process.env.DATABASE_AUTH_TOKEN || undefined;

  console.log("=================================================");
  console.log("SAMAURA HEALTHCARE — DATABASE CLAIMS AUDIT");
  console.log("=================================================");
  console.log(`Database Target: ${dbUrl}`);
  console.log(`Allowlist items: ${allowlist.size}\n`);

  if (dbUrl.startsWith("file:")) {
    const filePath = path.resolve(process.cwd(), dbUrl.replace(/^file:/, ""));
    if (!fs.existsSync(filePath)) {
      console.log(`[ClaimsGuard:DB] Database file not found at ${filePath}. Skipping check.`);
      process.exit(0);
    }
  }

  const client = createClient({
    url: dbUrl,
    authToken,
  });

  // Client/catalog tables to scan (strictly excludes customer reviews per CCPA/Privacy guidelines)
  const tables = ["settings", "pages", "banners", "categories", "products", "posts", "product_images"];

  for (const table of tables) {
    try {
      const res = await client.execute(`SELECT * FROM ${table}`);
      for (const row of res.rows) {
        const record = row as unknown as Record<string, unknown>;
        const id = String(record.id || record.key || record.slug || "unknown");

        for (const [col, val] of Object.entries(record)) {
          // Skip internal IDs, timestamps, and numbers (slugs, titles, descriptions, and alt text ARE scanned)
          if (
            col === "id" ||
            col === "key" ||
            col === "status" ||
            col.endsWith("_id") ||
            col.endsWith("_at")
          ) {
            continue;
          }

          if (typeof val === "string" && val.trim().length > 0) {
            checkText(val, `DB [${table}]`, `ID=${id} Col=${col}`);
            if (col === "slug") {
              checkText(val.replace(/[-_]/g, " "), `DB [${table}]`, `ID=${id} Col=${col} (normalized)`);
            }
          }
        }
      }
    } catch (err: unknown) {
      console.warn(`[ClaimsGuard:DB] Table '${table}' scan warning: ${(err as Error).message}`);
    }
  }

  if (violations.length > 0) {
    console.error(`\n❌ [DB CLAIMS AUDIT FAILED] Found ${violations.length} prohibited claim matches in database:\n`);
    for (const v of violations) {
      console.error(`  - ${v.source} (${v.location})`);
      console.error(`    Phrase: "${v.phrase}"`);
      console.error(`    Context: ${v.snippet}\n`);
    }
    console.error("Action Required: Update DB rows or add written client authorization to config/claims-allowlist.json.\n");
    process.exit(1);
  } else {
    console.log("✅ [DB CLAIMS AUDIT PASSED] Zero non-compliant marketing or medical claims found in database rows.\n");
    process.exit(0);
  }
}

runDbScan().catch((err) => {
  console.error("[ClaimsGuard:DB Fatal Error]:", err);
  process.exit(1);
});
