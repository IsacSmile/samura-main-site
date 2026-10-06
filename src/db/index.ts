import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";
import fs from "node:fs";
import path from "node:path";

let client: Client;
let db: LibSQLDatabase<typeof schema>;

declare global {
  var __samaura_db: LibSQLDatabase<typeof schema> | undefined;
  var __samaura_client: Client | undefined;
}

const dbUrl = process.env.DATABASE_URL || "file:data/samaura.db";
const authToken = process.env.DATABASE_AUTH_TOKEN || undefined;

// Ensure local data directory exists in development
if (process.env.NODE_ENV !== "production" && dbUrl.startsWith("file:")) {
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Normalize libsql:// to https:// for fast, reliable HTTP transport in Next.js builds
const clientUrl = dbUrl.startsWith("libsql://")
  ? dbUrl.replace(/^libsql:\/\//, "https://")
  : dbUrl;

if (process.env.NODE_ENV === "production") {
  client = createClient({
    url: clientUrl,
    authToken,
  });
  db = drizzle(client, { schema });
} else {
  if (!global.__samaura_client) {
    global.__samaura_client = createClient({
      url: clientUrl,
      authToken,
    });
  }
  client = global.__samaura_client;

  if (!global.__samaura_db) {
    global.__samaura_db = drizzle(client, { schema });
  }
  db = global.__samaura_db;
}

export { db, client };
export * from "./schema";
