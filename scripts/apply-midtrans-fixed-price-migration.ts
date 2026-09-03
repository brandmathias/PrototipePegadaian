import { readFile } from "node:fs/promises";

import { config } from "dotenv";
import { Client } from "pg";

config({ path: ".env.local" });
config();

const connectionString = process.env.DATABASE_URL;
const migrationUrl = new URL("../drizzle/0029_midtrans_fixed_price.sql", import.meta.url);

async function main() {
  if (!connectionString) {
    throw new Error("DATABASE_URL belum diatur. Jalankan migrasi hanya pada database yang disetujui.");
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query("begin");
    await client.query(await readFile(migrationUrl, "utf8"));
    await client.query("commit");
    console.log("Migrasi Midtrans Harga Tetap berhasil diterapkan.");
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
