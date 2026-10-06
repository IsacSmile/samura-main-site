import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config();

/**
 * Database Backup Utility for Samaura Healthcare.
 * Backs up local SQLite database or outputs Turso cloud backup procedure.
 */
async function backupDatabase() {
  const dbUrl = process.env.DATABASE_URL || "file:data/samaura.db";
  console.log(`[Backup] Initiating database backup for: ${dbUrl}`);

  const backupDir = path.resolve(process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  if (dbUrl.startsWith("file:") || !dbUrl.includes("://")) {
    const rawPath = dbUrl.replace(/^file:/, "");
    const srcPath = path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath);

    if (!fs.existsSync(srcPath)) {
      console.error(`[Backup Error] Source database file not found at: ${srcPath}`);
      process.exit(1);
    }

    const destPath = path.join(backupDir, `samaura-backup-${timestamp}.db`);
    fs.copyFileSync(srcPath, destPath);
    const sizeMb = (fs.statSync(destPath).size / (1024 * 1024)).toFixed(2);
    console.log(`✅ [Backup Complete] Local SQLite backup created at: ${destPath} (${sizeMb} MB)`);
  } else if (dbUrl.startsWith("libsql://")) {
    console.log(`ℹ️ [Turso Cloud Database Detected]`);
    console.log(`To create a point-in-time cloud backup on Turso, run:`);
    console.log(`  turso db dump <database-name> > backups/turso-dump-${timestamp}.sql`);
  } else {
    console.warn(`[Backup Notice] Custom database protocol "${dbUrl}". Please use database vendor export tool.`);
  }
}

backupDatabase().catch((err) => {
  console.error("[Backup Error]:", err);
  process.exit(1);
});
