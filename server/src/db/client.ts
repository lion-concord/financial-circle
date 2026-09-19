import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";

const dbUrl = process.env.DATABASE_URL;

if (dbUrl) {
  try {
    const url = new URL(dbUrl);
    console.log("[db/client] Connecting to host:", url.hostname);
    console.log(
      "[runtime] DATABASE_URL hostname:",
      new URL(dbUrl).hostname
    );
  } catch {
    console.warn("[db/client] DATABASE_URL is not a valid URL");
  }
} else {
  console.warn("[db/client] DATABASE_URL is not set");
}

const pool = new Pool({
  connectionString: dbUrl,
});

export const db = drizzle(pool, { schema });
export type DB = typeof db;
