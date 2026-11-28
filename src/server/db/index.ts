import "server-only";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const g = globalThis as unknown as { __mpjDb?: NodePgDatabase<typeof schema> };

/** One pool per server instance (reused across hot reloads in development). */
export function db() {
  if (!g.__mpjDb) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set. See README: 'Run it on your computer'.");
    const pool = new Pool({ connectionString: url, max: 5 });
    g.__mpjDb = drizzle(pool, { schema });
  }
  return g.__mpjDb;
}

export { schema };
