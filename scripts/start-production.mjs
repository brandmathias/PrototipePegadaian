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
  const crossUnitHistoryDateSync = await client.query(`
    with first_marketing as (
      select
        "barang_id",
        min("created_at") as first_marketed_at
      from "pemasaran"
      group by "barang_id"
    ),
    stale_initial_history as (
      select
        history."id",
        first_marketing.first_marketed_at - interval '10 days' as target_created_at
      from "riwayat_status_barang" as history
      inner join "barang" as item on item."id" = history."barang_id"
      inner join first_marketing on first_marketing."barang_id" = history."barang_id"
      where history."old_status" is null
        and history."new_status" in ('gadai', 'jaminan')
        and item."name" in (
          'Kalung Emas Rantai Singapura 22K',
          'Cincin Emas Solitaire 22K',
          'Gelang Emas Bangle Polos 22K'
        )
        and history."created_at" < first_marketing.first_marketed_at - interval '10 days'
    )
    update "riwayat_status_barang" as history
    set "created_at" = stale_initial_history.target_created_at
    from stale_initial_history
    where history."id" = stale_initial_history."id"
    returning history."id"
  `);
  await client.query(canonicalCodeMigrationSql);
  await client.query(customerDataStandardMigrationSql);
  const unitAdminAuditRepair = await client.query(`
    with target_context as (
      select
        unit_target."id" as unit_id,
        replacement_admin."id" as replacement_user_id
      from "units" unit_target
      join lateral (
        select u."id"
        from "user" u
        where u."role" = 'admin_unit'
          and u."is_active" = true
          and u."unit_id" = unit_target."id"
          and lower(u."name") = lower('Hendra Wijaya')
        order by u."updated_at" desc, u."created_at" desc, u."id" desc
        limit 1
      ) replacement_admin on true
      where lower(unit_target."name") = lower('UPC Wanea')
      limit 1
    ),
    stale_admins as (
      select stale."id"
      from "user" stale
      where stale."role" = 'admin_unit'
        and lower(stale."name") = any(array['admin unit ranotana', 'admin upc ranotana']::text[])
    ),
    updated_verified_transactions as (
      update "transaksi" as t
      set "verified_by_user_id" = target_context.replacement_user_id,
          "updated_at" = now()
      from target_context, stale_admins, "pemasaran" as p, "barang" as b
      where t."pemasaran_id" = p."id"
        and b."id" = p."barang_id"
        and b."unit_id" = target_context.unit_id
        and t."verified_by_user_id" = stale_admins."id"
      returning 1
    ),
    updated_handover_transactions as (
      update "transaksi" as t
      set "handover_proof_uploaded_by_user_id" = target_context.replacement_user_id,
          "updated_at" = now()
      from target_context, stale_admins, "pemasaran" as p, "barang" as b
      where t."pemasaran_id" = p."id"
        and b."id" = p."barang_id"
        and b."unit_id" = target_context.unit_id
        and t."handover_proof_uploaded_by_user_id" = stale_admins."id"
      returning 1
    ),
    updated_status_history as (
      update "riwayat_status_barang" as history
      set "changed_by_user_id" = target_context.replacement_user_id
      from target_context, stale_admins, "barang" as b
      where history."barang_id" = b."id"
        and b."unit_id" = target_context.unit_id
        and history."changed_by_user_id" = stale_admins."id"
      returning 1
    ),
    updated_extension_history as (
      update "riwayat_perpanjangan" as extension_history
      set "extended_by_user_id" = target_context.replacement_user_id
      from target_context, stale_admins, "barang" as b
      where extension_history."barang_id" = b."id"
        and b."unit_id" = target_context.unit_id
        and extension_history."extended_by_user_id" = stale_admins."id"
      returning 1
    ),
    updated_marketing_creators as (
      update "pemasaran" as p
      set "created_by_user_id" = target_context.replacement_user_id,
          "updated_at" = now()
      from target_context, stale_admins, "barang" as b
      where p."barang_id" = b."id"
        and b."unit_id" = target_context.unit_id
        and p."created_by_user_id" = stale_admins."id"
      returning 1
    ),
    updated_item_creators as (
      update "barang" as b
      set "created_by_user_id" = target_context.replacement_user_id,
          "updated_at" = now()
      from target_context, stale_admins
      where b."unit_id" = target_context.unit_id
        and b."created_by_user_id" = stale_admins."id"
      returning 1
    )
    select
      (select count(*) from updated_verified_transactions)::integer
      + (select count(*) from updated_handover_transactions)::integer
      + (select count(*) from updated_status_history)::integer
      + (select count(*) from updated_extension_history)::integer
      + (select count(*) from updated_marketing_creators)::integer
      + (select count(*) from updated_item_creators)::integer as repaired_references
  `);

  const fixedPriceRepairDeletedHistory = await client.query(`
    delete from "riwayat_status_barang"
    where "new_status" = 'gagal'
      and (
        "note" ilike 'Repair DB:%'
        or "note" ilike 'Repair DB production:%'
        or (
          "note" ilike 'Bukti pembayaran harga tetap ditolak admin unit.%'
          and "note" ilike '%Barang dipasarkan ulang otomatis ke iterasi %'
        )
      )
  `);

  const fixedPriceRepairCleanedNotes = await client.query(`
    update "riwayat_status_barang"
    set "note" = regexp_replace(
      "note",
      ' Barang otomatis dipasarkan ulang ke katalog pada iterasi berikutnya[.]?$',
      '',
      'i'
    )
    where "new_status" = 'gagal'
      and "note" ilike 'Verifikasi bukti pembayaran harga tetap ditolak admin unit.%'
      and "note" ilike '%Barang otomatis dipasarkan ulang ke katalog pada iterasi berikutnya.%'
  `);

  const fixedPriceRepairSyncedRelists = await client.query(`
    with rejected_relist as (
      select distinct on (next_p."id")
        next_p."id" as next_marketing_id,
        next_p."barang_id",
        coalesce(t."verified_at", t."updated_at", t."created_at") as rejected_at
      from "pemasaran" previous_p
      inner join "transaksi" t
        on t."pemasaran_id" = previous_p."id"
       and t."type" = 'fixed_price'
       and t."status" = 'ditolak_bukti'
      inner join "pemasaran" next_p
        on next_p."barang_id" = previous_p."barang_id"
       and next_p."mode" = 'fixed_price'
       and next_p."iteration" = previous_p."iteration" + 1
      where previous_p."mode" = 'fixed_price'
      order by next_p."id", t."updated_at" desc, t."created_at" desc, t."id" desc
    )
    update "pemasaran" relisted
    set "starts_at" = rejected_relist.rejected_at,
        "created_at" = rejected_relist.rejected_at
    from rejected_relist
    where relisted."id" = rejected_relist.next_marketing_id
      and (
        relisted."starts_at" is distinct from rejected_relist.rejected_at
        or relisted."created_at" is distinct from rejected_relist.rejected_at
      )
  `);

  const fixedPriceRepairInsertedRelistHistory = await client.query(`
    with rejected_relist as (
      select distinct on (next_p."id")
        next_p."id" as next_marketing_id,
        next_p."barang_id",
        coalesce(t."verified_at", t."updated_at", t."created_at") as rejected_at
      from "pemasaran" previous_p
      inner join "transaksi" t
        on t."pemasaran_id" = previous_p."id"
       and t."type" = 'fixed_price'
       and t."status" = 'ditolak_bukti'
      inner join "pemasaran" next_p
        on next_p."barang_id" = previous_p."barang_id"
       and next_p."mode" = 'fixed_price'
       and next_p."iteration" = previous_p."iteration" + 1
      where previous_p."mode" = 'fixed_price'
      order by next_p."id", t."updated_at" desc, t."created_at" desc, t."id" desc
    )
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
      'fixed-price-relist-history-' || rejected_relist.next_marketing_id,
      rejected_relist."barang_id",
      'gagal',
      'dipasarkan',
      null,
      'Barang dipublikasikan kembali ke katalog sebagai sesi Harga Tetap.',
      rejected_relist.rejected_at
    from rejected_relist
    where not exists (
      select 1
      from "riwayat_status_barang" history
      where history."barang_id" = rejected_relist."barang_id"
        and history."new_status" = 'dipasarkan'
        and history."changed_by_user_id" is null
        and history."note" = 'Barang dipublikasikan kembali ke katalog sebagai sesi Harga Tetap.'
        and history."created_at" between rejected_relist.rejected_at - interval '60 seconds'
          and rejected_relist.rejected_at + interval '60 seconds'
    )
    on conflict ("id") do update
    set "changed_by_user_id" = null,
        "note" = excluded."note",
        "created_at" = excluded."created_at"
  `);

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
  console.log(
    `Startup migration: database bersih, data nasabah standar, seluruh kode unit/SBG sudah canonical, sinkronisasi tanggal riwayat lintas unit memperbarui ${crossUnitHistoryDateSync.rowCount ?? 0} riwayat, audit admin unit diperbaiki ${unitAdminAuditRepair.rows[0]?.repaired_references ?? 0} referensi, relist harga tetap disinkronkan ${fixedPriceRepairSyncedRelists.rowCount ?? 0} pemasaran dan ${fixedPriceRepairInsertedRelistHistory.rowCount ?? 0} riwayat sistem (${fixedPriceRepairDeletedHistory.rowCount ?? 0} repair lama dihapus, ${fixedPriceRepairCleanedNotes.rowCount ?? 0} catatan dibersihkan).`,
  );
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
