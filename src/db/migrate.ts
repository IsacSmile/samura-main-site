import { migrate } from "drizzle-orm/libsql/migrator";
import { db } from "./index";

async function runMigrations() {
  console.log("Applying migrations from ./src/db/migrations...");
  await migrate(db, { migrationsFolder: "./src/db/migrations" });
  console.log("✅ Migrations applied successfully!");
}

runMigrations().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
