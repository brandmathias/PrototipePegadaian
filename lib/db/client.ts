import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "@/lib/db/schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL belum diatur. Isi env terlebih dahulu sebelum memakai auth/database.");
}

const globalForDatabase = globalThis as typeof globalThis & {
  __pegadaianPool?: Pool;
};

export const pool =
  globalForDatabase.__pegadaianPool ??
  new Pool({
    connectionString
  });

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.__pegadaianPool = pool;
}

export const db = drizzle(pool, { schema });
