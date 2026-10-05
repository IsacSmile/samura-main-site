import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

const isTurso = Boolean(process.env.DATABASE_AUTH_TOKEN);

export default isTurso
  ? defineConfig({
      schema: "./src/db/schema/index.ts",
      out: "./src/db/migrations",
      dialect: "turso",
      dbCredentials: {
        url: process.env.DATABASE_URL || "",
        authToken: process.env.DATABASE_AUTH_TOKEN || "",
      },
    })
  : defineConfig({
      schema: "./src/db/schema/index.ts",
      out: "./src/db/migrations",
      dialect: "sqlite",
      dbCredentials: {
        url: process.env.DATABASE_URL || "file:data/samaura.db",
      },
    });
