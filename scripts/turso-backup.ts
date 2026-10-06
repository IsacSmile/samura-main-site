import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import dotenv from "dotenv";

dotenv.config();

/**
 * Turso Database Cloud Backup Utility for Samaura Healthcare.
 * Executes point-in-time database dump via Turso CLI (`turso db shell <db> .dump`).
 */
async function backupTursoDatabase() {
  const dbUrl = process.env.DATABASE_URL || "";
  const dbAuthToken = process.env.DATABASE_AUTH_TOKEN || "";
  const backupDir = path.resolve(process.cwd(), "backups");

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dumpFilename = `turso-dump-${timestamp}.sql`;
  const dumpPath = path.join(backupDir, dumpFilename);

  console.log("==================================================");
  console.log("Turso Cloud Database Backup Utility");
  console.log("==================================================");

  // Parse Turso database name from DATABASE_URL
  // e.g., libsql://samaura-prod-myorg.turso.io -> samaura-prod
  let dbName = process.env.TURSO_DATABASE_NAME || "";
  if (!dbName && dbUrl.includes(".turso.io")) {
    const urlMatch = dbUrl.match(/libsql:\/\/([a-zA-Z0-9_-]+)/);
    if (urlMatch && urlMatch[1]) {
      dbName = urlMatch[1];
    }
  }

  if (!dbName) {
    dbName = "samaura-prod"; // default expected production db name
  }

  console.log(`Target Turso Database: ${dbName}`);
  console.log(`Target Output File:    ${dumpPath}\n`);

  // Check if Turso CLI is available locally
  let hasTursoCli = false;
  try {
    execSync("turso --version", { stdio: "ignore" });
    hasTursoCli = true;
  } catch {
    hasTursoCli = false;
  }

  if (hasTursoCli) {
    console.log("Found Turso CLI. Executing shell dump command:");
    const dumpCmd = `turso db shell ${dbName} .dump > "${dumpPath}"`;
    console.log(`  $ ${dumpCmd}`);

    try {
      execSync(dumpCmd, { stdio: "inherit", shell: "/bin/bash" });
      if (fs.existsSync(dumpPath) && fs.statSync(dumpPath).size > 0) {
        const sizeKb = (fs.statSync(dumpPath).size / 1024).toFixed(2);
        console.log(`\n✅ [Success] Turso SQL dump completed successfully: ${dumpPath} (${sizeKb} KB)`);
        return;
      }
    } catch (execErr) {
      console.warn(`[Warning] Automated CLI dump failed: ${execErr instanceof Error ? execErr.message : String(execErr)}`);
      console.log("Falling back to manual instruction output...\n");
    }
  }

  // CLI not installed or failed - provide clear instructions
  console.log("ℹ️  To back up your Turso database in production or CI/CD:\n");
  console.log("1. Install the Turso CLI (if not already installed):");
  console.log("   curl -sSfL https://get.tur.so/install.sh | bash\n");
  console.log("2. Authenticate Turso CLI:");
  console.log("   turso auth login\n");
  console.log("3. Run the SQL dump command:");
  console.log(`   turso db shell ${dbName} .dump > backups/${dumpFilename}\n`);
  console.log("4. Alternatively, export directly via Turso CLI:");
  console.log(`   turso db dump ${dbName} > backups/${dumpFilename}\n`);

  if (dbAuthToken && dbUrl.startsWith("libsql://")) {
    console.log("5. For headless / token-based CI/CD pipelines:");
    console.log(`   TURSO_API_TOKEN="..." turso db shell ${dbName} .dump > backups/${dumpFilename}\n`);
  }
}

backupTursoDatabase().catch((err) => {
  console.error("[Turso Backup Error]:", err);
  process.exit(1);
});
