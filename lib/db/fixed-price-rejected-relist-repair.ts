import { randomUUID } from "node:crypto";

export type FixedPriceRejectedRelistCandidate = {
  amount: string | null;
  barang_id: string;
  created_by_user_id: string;
  item_status: string;
  iteration: number;
  marketing_id: string;
  max_iteration: number;
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
  coalesce(p."price", lt."amount")::text as price,
  lt."amount"::text as amount,
  p."iteration",
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
  $6
)
`.trim();

const KEEP_ITEM_MARKETED_SQL = `
update "barang"
set "status" = 'dipasarkan',
    "updated_at" = $2
where "id" = $1
`.trim();

const INSERT_REPAIR_HISTORY_SQL = `
insert into "riwayat_status_barang" (
  "id",
  "barang_id",
  "old_status",
  "new_status",
  "changed_by_user_id",
  "note",
  "created_at"
) values (
  $1,
  $2,
  $3,
  'gagal',
  $4,
  $5,
  $6
)
`.trim();

function buildRejectedRelistAuditNote(candidate: FixedPriceRejectedRelistCandidate, nextIteration: number) {
  const reason = candidate.rejection_reason?.trim();
  const reasonText = reason && reason !== "-" ? ` Alasan: ${reason.replace(/[.!?]+$/u, "")}.` : "";

  return `Bukti pembayaran harga tetap ditolak admin unit.${reasonText} Barang dipasarkan ulang otomatis ke iterasi ${nextIteration}.`;
}

function resolveRejectedRelistTimestamp(candidate: FixedPriceRejectedRelistCandidate, fallback: Date) {
  if (!candidate.rejected_at) {
    return fallback;
  }

  const rejectedAt = new Date(candidate.rejected_at);
  return Number.isNaN(rejectedAt.getTime()) ? fallback : rejectedAt;
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

  if (!options.apply || candidates.length === 0) {
    return { applied: 0, candidates, skipped: 0 };
  }

  const idFactory = options.idFactory ?? randomUUID;
  const nowFactory = options.nowFactory ?? (() => new Date());
  let applied = 0;
  let skipped = 0;

  await client.query("begin");
  try {
    for (const candidate of candidates) {
      const price = candidate.price ?? candidate.amount;
      if (!price) {
        skipped += 1;
        continue;
      }

      const now = resolveRejectedRelistTimestamp(candidate, nowFactory());
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
        now
      ]);
      await client.query(KEEP_ITEM_MARKETED_SQL, [candidate.barang_id, now]);
      await client.query(INSERT_REPAIR_HISTORY_SQL, [
        idFactory(),
        candidate.barang_id,
        candidate.item_status,
        actorId,
        buildRejectedRelistAuditNote(candidate, nextIteration),
        now
      ]);

      applied += 1;
    }

    await client.query("commit");
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  }

  return { applied, candidates, skipped };
}
