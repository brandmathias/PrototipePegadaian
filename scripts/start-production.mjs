import pg from "pg";
import { readFile } from "node:fs/promises";

const { Client } = pg;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL wajib tersedia sebelum server production dijalankan.");
}

const client = new Client({ connectionString });
const canonicalCodeMigrationSql = await readFile(
  new URL("./canonical-code-migration.sql", import.meta.url),
  "utf8",
);
await client.connect();

try {
  await client.query("begin");
  await client.query(`
    alter table "transaksi"
      drop column if exists "handover_complaint_at";
    alter table "transaksi"
      drop column if exists "handover_complaint_note";
    alter table "barang"
      drop column if exists "loan_value";
  `);
  await client.query(canonicalCodeMigrationSql);

  const retiredColumnAudit = await client.query(`
    select table_name, column_name
    from information_schema.columns
    where table_schema = 'public'
      and (
        (
          table_name = 'transaksi'
          and column_name in ('handover_complaint_at', 'handover_complaint_note')
        )
        or (
          table_name = 'barang'
          and column_name = 'loan_value'
        )
      )
  `);

  if (retiredColumnAudit.rowCount) {
    throw new Error(
      `Kolom lama masih tersisa: ${retiredColumnAudit.rows
        .map((row) => `${row.table_name}.${row.column_name}`)
        .join(", ")}`,
    );
  }

  const canonicalAudit = await client.query(`
    select
      (select count(*) from "units" where "code" !~ '^CP-[A-Z]{3}-[0-9]{5}$') as invalid_units,
      (
        select count(*)
        from "barang" as item
        inner join "units" as unit_record on unit_record."id" = item."unit_id"
        where item."code" !~ '^SBG-[0-9]{16}$'
           or substring(item."code" from 5 for 5) <> right(unit_record."code", 5)
      ) as invalid_items
  `);

  if (Number(canonicalAudit.rows[0]?.invalid_units ?? 0) || Number(canonicalAudit.rows[0]?.invalid_items ?? 0)) {
    throw new Error("Audit startup menemukan kode unit atau SBG yang belum canonical.");
  }

  await client.query("commit");
  console.log("Startup migration: database bersih dan seluruh kode unit/SBG sudah canonical.");
} catch (error) {
  await client.query("rollback").catch(() => undefined);
  throw error;
} finally {
  await client.end();
}

await import("./server.js");
