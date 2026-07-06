import pg from "pg";
import { readFile } from "node:fs/promises";
import { startProductionCronScheduler } from "./production-cron-scheduler.mjs";

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
const customerDataStandardMigrationSql = await readFile(
  new URL("./customer-data-standard-migration.sql", import.meta.url),
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
  await client.query(`
    insert into "riwayat_status_barang" (
      "id",
      "barang_id",
      "old_status",
      "new_status",
      "changed_by_user_id",
      "note",
      "created_at"
    )
    select
      'initial-history-backfill-' || item."id",
      item."id",
      null,
      case
        when item."status" in ('gadai', 'jaminan') then item."status"
        else 'jaminan'
      end,
      item."created_by_user_id",
      'Catatan Barang Masuk dipulihkan dari data barang yang sudah ada.',
      item."created_at"
    from "barang" as item
    where not exists (
      select 1
      from "riwayat_status_barang" as history
      where history."barang_id" = item."id"
        and history."old_status" is null
    )
    on conflict ("id") do nothing;
  `);
  await client.query(`
    insert into "pemasaran_views" (
      "id",
      "pemasaran_id",
      "viewer_key",
      "created_at",
      "updated_at"
    )
    select
      'bid-view-backfill-' || bid."id",
      bid."pemasaran_id",
      'user:' || bid."user_id",
      bid."created_at",
      bid."created_at"
    from "bids" as bid
    on conflict ("pemasaran_id", "viewer_key") do nothing;
  `);
  await client.query(canonicalCodeMigrationSql);
  await client.query(customerDataStandardMigrationSql);

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

  const barangHistoryAudit = await client.query(`
    select count(*) as barang_tanpa_catatan_awal
    from "barang" as item
    where not exists (
      select 1
      from "riwayat_status_barang" as history
      where history."barang_id" = item."id"
        and history."old_status" is null
    )
  `);

  if (Number(barangHistoryAudit.rows[0]?.barang_tanpa_catatan_awal ?? 0)) {
    throw new Error("Audit startup menemukan barang tanpa catatan Barang Masuk.");
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

  const customerDataAudit = await client.query(`
    select count(*) as invalid_customer_data
    from "barang"
    where "customer_number" !~ '^08[0-9]{8,11}$'
       or trim("owner_name") ~ '[0-9]'
       or array_length(regexp_split_to_array(trim("owner_name"), '\\s+'), 1) < 2
  `);

  if (Number(customerDataAudit.rows[0]?.invalid_customer_data ?? 0)) {
    throw new Error("Audit startup menemukan nama atau nomor nasabah barang yang belum standar.");
  }

  await client.query("commit");
  console.log("Startup migration: database bersih, data nasabah standar, dan seluruh kode unit/SBG sudah canonical.");
} catch (error) {
  await client.query("rollback").catch(() => undefined);
  throw error;
} finally {
  await client.end();
}

startProductionCronScheduler({
  secret: process.env.CRON_SECRET,
});

await import("./server.js");
