import { readFile } from "node:fs/promises";

import { config } from "dotenv";
import { Client } from "pg";

config({ path: ".env.local" });
config();

const connectionString = process.env.DATABASE_URL;
const dryRun = process.argv.includes("--dry-run");
const migrationUrl = new URL("../drizzle/0023_canonical_unit_sbg_codes.sql", import.meta.url);

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

    const unitsAudit = await client.query<{
      code: string;
      name: string;
    }>(`
      select "name", "code"
      from "units"
      order by "name", "id"
    `);
    const itemsAudit = await client.query<{
      invalid_count: string;
      total_count: string;
    }>(`
      select
        count(*)::text as total_count,
        count(*) filter (
          where item."code" !~ '^SBG-[0-9]{16}$'
             or substring(item."code" from 5 for 5) <> right(unit_record."code", 5)
        )::text as invalid_count
      from "barang" as item
      inner join "units" as unit_record on unit_record."id" = item."unit_id"
    `);

    await client.query("commit");

    console.log(`Migrasi kode canonical selesai pada ${target}.`);
    console.table(unitsAudit.rows);
    console.log(
      `Barang canonical: ${Number(itemsAudit.rows[0]?.total_count ?? 0) - Number(itemsAudit.rows[0]?.invalid_count ?? 0)}/${itemsAudit.rows[0]?.total_count ?? "0"}.`,
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
