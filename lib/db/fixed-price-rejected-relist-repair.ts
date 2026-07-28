import { randomUUID } from "node:crypto";

export type FixedPriceRejectedRelistCandidate = {
  amount: string | null;
  barang_id: string;
  created_by_user_id: string;
  item_status: string;
  iteration: number;
  marketing_id: string;
  max_iteration: number;
  original_published_at?: Date | string | null;
  price: string | null;
  rejected_at?: Date | string | null;
  rejection_reason: string | null;
  transaction_id: string;
  verified_by_user_id: string | null;
};

type QueryResult = {
  rows: unknown[];
  rowCount: number | null;
};

export type RepairQueryClient = {
  query(text: string, values?: unknown[]): Promise<QueryResult>;
};

export const FIXED_PRICE_REJECTED_RELIST_CANDIDATES_SQL = `
with latest_rejected_transaction as (
  select distinct on (t."pemasaran_id")
    t."id",
    t."pemasaran_id",
    t."amount",
    t."rejection_reason",
    t."verified_by_user_id",
    coalesce(t."verified_at", t."updated_at", t."created_at") as rejected_at,
    t."created_at",
    t."updated_at"
  from "transaksi" t
  where t."type" = 'fixed_price'
    and t."status" = 'ditolak_bukti'
  order by t."pemasaran_id", t."updated_at" desc, t."created_at" desc, t."id" desc
)
select
  p."id" as marketing_id,
  p."barang_id",
  coalesce(p."price", rejected."amount")::text as price,
  rejected."amount"::text as amount,
  p."iteration",
  p."created_at" as original_published_at,
  (
    select coalesce(max(all_p."iteration"), p."iteration")
    from "pemasaran" all_p
    where all_p."barang_id" = p."barang_id"
  )::integer as max_iteration,
  p."created_by_user_id",
  b."status" as item_status,
  rejected."id" as transaction_id,
  rejected."rejected_at",
  rejected."rejection_reason",
  rejected."verified_by_user_id"
from "pemasaran" p
inner join "barang" b on b."id" = p."barang_id"
inner join latest_rejected_transaction rejected on rejected."pemasaran_id" = p."id"
where p."mode" = 'fixed_price'
  and p."status" = 'aktif'
  and b."status" = 'dipasarkan'
order by rejected."updated_at" asc, p."id" asc
`.trim();

const ARCHIVE_MARKETING_SQL = `
update "pemasaran"
set "status" = 'gagal',
    "updated_at" = $2
where "id" = $1
  and "mode" = 'fixed_price'
  and "status" = 'aktif'
  and exists (
    select 1
    from "barang" b
    where b."id" = "pemasaran"."barang_id"
      and b."status" = 'dipasarkan'
  )
  and exists (
    select 1
    from (
      select t."status"
      from "transaksi" t
      where t."pemasaran_id" = $1
        and t."type" = 'fixed_price'
      order by t."created_at" desc, t."updated_at" desc, t."id" desc
      limit 1
    ) latest_transaction
    where latest_transaction."status" = 'ditolak_bukti'
  )
returning "id"
`.trim();

const INSERT_NEXT_MARKETING_SQL = `
insert into "pemasaran" (
  "id",
  "barang_id",
  "mode",
  "price",
  "base_price",
  "duration_days",
  "duration_seconds",
  "starts_at",
  "ends_at",
  "reveal_ends_at",
  "iteration",
  "status",
  "created_by_user_id",
  "created_at",
  "updated_at"
) values (
  $1,
  $2,
  'fixed_price',
  $3,
  null,
  null,
  null,
  $6,
  null,
  null,
  $4,
  'aktif',
  $5,
  $6,
  $7
)
`.trim();

const KEEP_ITEM_MARKETED_SQL = `
update "barang"
set "status" = 'dipasarkan',
    "updated_at" = $2
where "id" = $1
`.trim();

export const DELETE_FIXED_PRICE_RELIST_REPAIR_HISTORY_SQL = `
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
`.trim();

export const CLEAN_FIXED_PRICE_REJECTION_HISTORY_SQL = `
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
`.trim();

export const SYNC_FIXED_PRICE_RELIST_TIMESTAMPS_SQL = `
with recursive rejected_edges as (
  select distinct on (next_p."id")
    previous_p."id" as previous_marketing_id,
    next_p."id" as next_marketing_id,
    next_p."barang_id",
    previous_p."created_at" as original_published_at,
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
), rejected_relist as (
  select
    edge.previous_marketing_id,
    edge.next_marketing_id,
    edge.barang_id,
    edge.original_published_at,
    edge.rejected_at
  from rejected_edges edge
  where not exists (
    select 1
    from rejected_edges parent_edge
    where parent_edge.next_marketing_id = edge.previous_marketing_id
  )

  union all

  select
    child_edge.previous_marketing_id,
    child_edge.next_marketing_id,
    child_edge.barang_id,
    parent_edge.original_published_at,
    child_edge.rejected_at
  from rejected_relist parent_edge
  inner join rejected_edges child_edge
    on child_edge.previous_marketing_id = parent_edge.next_marketing_id
)
update "pemasaran" relisted
set "starts_at" = rejected_relist.original_published_at,
    "created_at" = rejected_relist.original_published_at
from rejected_relist
where relisted."id" = rejected_relist.next_marketing_id
  and (
    relisted."starts_at" is distinct from rejected_relist.original_published_at
    or relisted."created_at" is distinct from rejected_relist.original_published_at
  )
`.trim();

export const INSERT_FIXED_PRICE_RELIST_SYSTEM_HISTORY_SQL = `
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
`.trim();

function resolveTimestamp(value: Date | string | null | undefined, fallback: Date) {
  if (!value) {
    return fallback;
  }

  const timestamp = new Date(value);
  return Number.isNaN(timestamp.getTime()) ? fallback : timestamp;
}

export async function listFixedPriceRejectedRelistCandidates(client: RepairQueryClient) {
  return (await client.query(FIXED_PRICE_REJECTED_RELIST_CANDIDATES_SQL)).rows as FixedPriceRejectedRelistCandidate[];
}

export async function repairFixedPriceRejectedRelists(
  client: RepairQueryClient,
  options: {
    apply?: boolean;
    idFactory?: () => string;
    nowFactory?: () => Date;
  } = {}
) {
  const candidates = await listFixedPriceRejectedRelistCandidates(client);

  if (!options.apply) {
    return { applied: 0, candidates, skipped: 0 };
  }

  const idFactory = options.idFactory ?? randomUUID;
  const nowFactory = options.nowFactory ?? (() => new Date());
  let applied = 0;
  let skipped = 0;

  await client.query("begin");
  try {
    await client.query(DELETE_FIXED_PRICE_RELIST_REPAIR_HISTORY_SQL);
    await client.query(CLEAN_FIXED_PRICE_REJECTION_HISTORY_SQL);
    await client.query(SYNC_FIXED_PRICE_RELIST_TIMESTAMPS_SQL);

    for (const candidate of candidates) {
      const price = candidate.price ?? candidate.amount;
      if (!price) {
        skipped += 1;
        continue;
      }

      const now = resolveTimestamp(candidate.rejected_at, nowFactory());
      const originalPublishedAt = resolveTimestamp(candidate.original_published_at, now);
      const actorId = candidate.verified_by_user_id ?? candidate.created_by_user_id;
      const nextIteration = Number(candidate.max_iteration ?? candidate.iteration) + 1;
      const archived = await client.query(ARCHIVE_MARKETING_SQL, [candidate.marketing_id, now]);

      if ((archived.rowCount ?? archived.rows.length) < 1) {
        skipped += 1;
        continue;
      }

      await client.query(INSERT_NEXT_MARKETING_SQL, [
        idFactory(),
        candidate.barang_id,
        price,
        nextIteration,
        actorId,
        originalPublishedAt,
        now
      ]);
      await client.query(KEEP_ITEM_MARKETED_SQL, [candidate.barang_id, now]);

      applied += 1;
    }

    await client.query(INSERT_FIXED_PRICE_RELIST_SYSTEM_HISTORY_SQL);
    await client.query("commit");
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  }

  return { applied, candidates, skipped };
}
