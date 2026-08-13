import { readFile } from "node:fs/promises";

import { config } from "dotenv";
import { Client } from "pg";

config({ path: ".env.local" });
config();

const connectionString = process.env.DATABASE_URL;
const dryRun = process.argv.includes("--dry-run");
const migrationUrl = new URL("../drizzle/0028_fixed_price_claim_lock.sql", import.meta.url);

async function main() {
  const migrationSql = await readFile(migrationUrl, "utf8");

  if (dryRun) {
    console.log(migrationSql.trim());
    return;
  }

  if (!connectionString) {
    throw new Error("DATABASE_URL belum diatur. Isi environment production atau .env.local sebelum menjalankan migrasi.");
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query("begin");
    await client.query(migrationSql);
    await client.query("commit");
    console.log("Pengunci klaim Harga Tetap berhasil diterapkan.");
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
