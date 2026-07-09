export type UnitAdminAuditRepairContext = {
  replacement_user_id: string | null;
  replacement_user_name: string | null;
  unit_id: string | null;
  unit_name: string | null;
};

export type UnitAdminAuditRepairCandidate = {
  barang_created_count: number;
  extension_history_count: number;
  history_actor_count: number;
  marketing_created_count: number;
  stale_user_id: string;
  stale_user_name: string;
  verified_transaction_count: number;
  handover_transaction_count: number;
};

type QueryResult = {
  rows: unknown[];
  rowCount: number | null;
};

export type UnitAdminAuditRepairClient = {
  query(text: string, values?: unknown[]): Promise<QueryResult>;
};

export const UNIT_ADMIN_AUDIT_REPAIR_CONTEXT_SQL = `
select
  unit_target."id" as unit_id,
  unit_target."name" as unit_name,
  replacement_admin."id" as replacement_user_id,
  replacement_admin."name" as replacement_user_name
from "units" unit_target
left join lateral (
  select u."id", u."name"
  from "user" u
  where u."role" = 'admin_unit'
    and u."is_active" = true
    and u."unit_id" = unit_target."id"
    and lower(u."name") = lower($2)
  order by u."updated_at" desc, u."created_at" desc, u."id" desc
  limit 1
) replacement_admin on true
where lower(unit_target."name") = lower($1)
limit 1
`.trim();

export const UNIT_ADMIN_AUDIT_REPAIR_CANDIDATES_SQL = `
select
  stale."id" as stale_user_id,
  stale."name" as stale_user_name,
  (
    select count(*)::integer
    from "transaksi" t
    inner join "pemasaran" p on p."id" = t."pemasaran_id"
    inner join "barang" b on b."id" = p."barang_id"
    where b."unit_id" = $1
      and t."verified_by_user_id" = stale."id"
  ) as verified_transaction_count,
  (
    select count(*)::integer
    from "transaksi" t
    inner join "pemasaran" p on p."id" = t."pemasaran_id"
    inner join "barang" b on b."id" = p."barang_id"
    where b."unit_id" = $1
      and t."handover_proof_uploaded_by_user_id" = stale."id"
  ) as handover_transaction_count,
  (
    select count(*)::integer
    from "riwayat_status_barang" history
    inner join "barang" b on b."id" = history."barang_id"
    where b."unit_id" = $1
      and history."changed_by_user_id" = stale."id"
  ) as history_actor_count,
  (
    select count(*)::integer
    from "riwayat_perpanjangan" extension_history
    inner join "barang" b on b."id" = extension_history."barang_id"
    where b."unit_id" = $1
      and extension_history."extended_by_user_id" = stale."id"
  ) as extension_history_count,
  (
    select count(*)::integer
    from "pemasaran" p
    inner join "barang" b on b."id" = p."barang_id"
    where b."unit_id" = $1
      and p."created_by_user_id" = stale."id"
  ) as marketing_created_count,
  (
    select count(*)::integer
    from "barang" b
    where b."unit_id" = $1
      and b."created_by_user_id" = stale."id"
  ) as barang_created_count
from "user" stale
where stale."role" = 'admin_unit'
  and lower(stale."name") = any($2::text[])
order by stale."name" asc, stale."id" asc
`.trim();

const UPDATE_TRANSAKSI_VERIFIER_SQL = `
update "transaksi" as t
set "verified_by_user_id" = $2,
    "updated_at" = $4
from "pemasaran" as p
inner join "barang" as b on b."id" = p."barang_id"
where t."pemasaran_id" = p."id"
  and b."unit_id" = $1
  and t."verified_by_user_id" = $3
`.trim();

const UPDATE_TRANSAKSI_HANDOVER_UPLOADER_SQL = `
update "transaksi" as t
set "handover_proof_uploaded_by_user_id" = $2,
    "updated_at" = $4
from "pemasaran" as p
inner join "barang" as b on b."id" = p."barang_id"
where t."pemasaran_id" = p."id"
  and b."unit_id" = $1
  and t."handover_proof_uploaded_by_user_id" = $3
`.trim();

const UPDATE_HISTORY_ACTOR_SQL = `
update "riwayat_status_barang" as history
set "changed_by_user_id" = $2
from "barang" as b
where history."barang_id" = b."id"
  and b."unit_id" = $1
  and history."changed_by_user_id" = $3
`.trim();

const UPDATE_EXTENSION_HISTORY_ACTOR_SQL = `
update "riwayat_perpanjangan" as extension_history
set "extended_by_user_id" = $2
from "barang" as b
where extension_history."barang_id" = b."id"
  and b."unit_id" = $1
  and extension_history."extended_by_user_id" = $3
`.trim();

const UPDATE_MARKETING_CREATOR_SQL = `
update "pemasaran" as p
set "created_by_user_id" = $2,
    "updated_at" = $4
from "barang" as b
where p."barang_id" = b."id"
  and b."unit_id" = $1
  and p."created_by_user_id" = $3
`.trim();

const UPDATE_BARANG_CREATOR_SQL = `
update "barang"
set "created_by_user_id" = $2,
    "updated_at" = $4
where "unit_id" = $1
  and "created_by_user_id" = $3
`.trim();

export async function getUnitAdminAuditRepairContext(
  client: UnitAdminAuditRepairClient,
  unitName: string,
  replacementAdminName: string,
) {
  const [context] = (await client.query(UNIT_ADMIN_AUDIT_REPAIR_CONTEXT_SQL, [unitName, replacementAdminName]))
    .rows as UnitAdminAuditRepairContext[];

  return context ?? null;
}

export async function listUnitAdminAuditRepairCandidates(
  client: UnitAdminAuditRepairClient,
  unitId: string,
  staleAdminNames: string[],
) {
  const normalizedNames = staleAdminNames
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  if (normalizedNames.length === 0) {
    return [] as UnitAdminAuditRepairCandidate[];
  }

  return (await client.query(UNIT_ADMIN_AUDIT_REPAIR_CANDIDATES_SQL, [unitId, normalizedNames]))
    .rows as UnitAdminAuditRepairCandidate[];
}

export async function repairUnitAdminAuditTrail(
  client: UnitAdminAuditRepairClient,
  options: {
    apply?: boolean;
    replacementAdminName: string;
    staleAdminNames: string[];
    unitName: string;
    nowFactory?: () => Date;
  },
) {
  const context = await getUnitAdminAuditRepairContext(
    client,
    options.unitName,
    options.replacementAdminName,
  );

  if (!context?.unit_id) {
    throw new Error(`Unit ${options.unitName} tidak ditemukan.`);
  }

  if (!context.replacement_user_id || !context.replacement_user_name) {
    throw new Error(
      `Admin aktif ${options.replacementAdminName} untuk unit ${context.unit_name ?? options.unitName} tidak ditemukan.`,
    );
  }

  const candidates = await listUnitAdminAuditRepairCandidates(
    client,
    context.unit_id,
    options.staleAdminNames,
  );

  if (!options.apply || candidates.length === 0) {
    return { applied: 0, candidates, context, skipped: 0 };
  }

  const nowFactory = options.nowFactory ?? (() => new Date());
  let applied = 0;
  let skipped = 0;

  await client.query("begin");
  try {
    for (const candidate of candidates) {
      const totalReferences =
        candidate.verified_transaction_count +
        candidate.handover_transaction_count +
        candidate.history_actor_count +
        candidate.extension_history_count +
        candidate.marketing_created_count +
        candidate.barang_created_count;

      if (totalReferences < 1) {
        skipped += 1;
        continue;
      }

      const now = nowFactory();
      const params = [
        context.unit_id,
        context.replacement_user_id,
        candidate.stale_user_id,
        now,
      ];

      const verifiedUpdate = await client.query(UPDATE_TRANSAKSI_VERIFIER_SQL, params);
      const handoverUpdate = await client.query(UPDATE_TRANSAKSI_HANDOVER_UPLOADER_SQL, params);
      const historyUpdate = await client.query(UPDATE_HISTORY_ACTOR_SQL, params);
      const extensionHistoryUpdate = await client.query(UPDATE_EXTENSION_HISTORY_ACTOR_SQL, params);
      const marketingUpdate = await client.query(UPDATE_MARKETING_CREATOR_SQL, params);
      const barangUpdate = await client.query(UPDATE_BARANG_CREATOR_SQL, params);

      applied +=
        (verifiedUpdate.rowCount ?? verifiedUpdate.rows.length) +
        (handoverUpdate.rowCount ?? handoverUpdate.rows.length) +
        (historyUpdate.rowCount ?? historyUpdate.rows.length) +
        (extensionHistoryUpdate.rowCount ?? extensionHistoryUpdate.rows.length) +
        (marketingUpdate.rowCount ?? marketingUpdate.rows.length) +
        (barangUpdate.rowCount ?? barangUpdate.rows.length);
    }

    await client.query("commit");
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  }

  return { applied, candidates, context, skipped };
}
