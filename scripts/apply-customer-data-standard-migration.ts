import { readFile } from "node:fs/promises";

import { config } from "dotenv";
import { Client } from "pg";

config({ path: ".env.local" });
config();

const connectionString = process.env.DATABASE_URL;
const dryRun = process.argv.includes("--dry-run");
const migrationUrl = new URL("../drizzle/0025_customer_data_standard.sql", import.meta.url);

if (!connectionString) {
  throw new Error("DATABASE_URL belum diatur. Isi environment production atau .env.local sebelum menjalankan migrasi.");
}

function describeTarget(urlValue: string) {
  try {
    const url = new URL(urlValue);
    return `${url.protocol.replace(":", "")}://${url.hostname}${url.port ? `:${url.port}` : ""}${url.pathname}`;
  } catch {
    return "(DATABASE_URL tidak bisa diparse, nilai tidak ditampilkan)";
  }
}

async function main() {
  const migrationSql = await readFile(migrationUrl, "utf8");
  const target = describeTarget(connectionString!);

  if (dryRun) {
    console.log(`Target database: ${target}`);
    console.log(migrationSql.trim());
    return;
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query("begin");
    await client.query(migrationSql);

    const audit = await client.query<{
      total_count: string;
      invalid_count: string;
    }>(`
      select
        count(*)::text as total_count,
        count(*) filter (
          where "customer_number" !~ '^08[0-9]{8,11}$'
             or trim("owner_name") ~ '[0-9]'
             or array_length(regexp_split_to_array(trim("owner_name"), '\\s+'), 1) < 2
        )::text as invalid_count
      from "barang"
    `);

    await client.query("commit");

    console.log(`Migrasi standar data nasabah barang selesai pada ${target}.`);
    console.log(
      `Data nasabah standar: ${Number(audit.rows[0]?.total_count ?? 0) - Number(audit.rows[0]?.invalid_count ?? 0)}/${audit.rows[0]?.total_count ?? "0"}.`,
    );
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
