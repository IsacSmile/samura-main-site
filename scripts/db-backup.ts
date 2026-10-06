import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config();

/**
 * Local SQLite Database Backup Utility for Samaura Healthcare.
 * Backs up local SQLite database file to the backups/ folder.
 * For Turso cloud database backups, use `npm run db:backup:turso`.
 */
async function backupLocalDatabase() {
  const dbUrl = process.env.DATABASE_URL || "file:data/samaura.db";
  console.log("==================================================");
  console.log("Local SQLite Database Backup Utility");
  console.log("==================================================");
  console.log(`[Backup] Inspecting database URL: ${dbUrl}`);

  if (dbUrl.startsWith("libsql://")) {
    console.warn("\n⚠️  [Turso Database Detected]");
    console.warn("This script ('db:backup') is reserved strictly for local SQLite backups.");
    console.warn("To perform a Turso cloud database backup, please run:");
    console.warn("  npm run db:backup:turso");
    process.exit(0);
  }

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
  } else {
    console.warn(`[Backup Notice] Unrecognized database protocol "${dbUrl}". Please use your database provider export tool.`);
  }
}

backupLocalDatabase().catch((err) => {
  console.error("[Backup Error]:", err);
  process.exit(1);
});
