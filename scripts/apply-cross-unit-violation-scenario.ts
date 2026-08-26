import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { config } from "dotenv";
import { Client, type PoolClient } from "pg";

import {
  CROSS_UNIT_SCENARIO_IDENTITIES,
  CROSS_UNIT_SCENARIO_EMAILS,
  CROSS_UNIT_VIOLATION_SCENARIO,
  getExpectedFinalRestrictions,
  validateCrossUnitViolationScenario
} from "../lib/blacklist/cross-unit-violation-scenario";
import {
  buildCrossUnitViolationSeedRows,
  getCrossUnitViolationHistoricalSessionIds,
  type CrossUnitViolationSeedContext
} from "../lib/blacklist/cross-unit-violation-seed";
import { getBlacklistDurationUnit } from "../lib/blacklist/restrictions";

config({ path: ".env.local", quiet: true });

const connectionString = process.env.DATABASE_URL;
const applyChanges = process.argv.includes("--apply");
const productionTarget = process.env.SCENARIO_TARGET === "production";

if (!connectionString) {
  throw new Error("DATABASE_URL belum diatur.");
}

if (applyChanges && !productionTarget) {
  throw new Error(
    "Perubahan ditolak. Set SCENARIO_TARGET=production secara eksplisit sebelum memakai --apply."
  );
}

if (productionTarget && getBlacklistDurationUnit() !== "days") {
  throw new Error(
    "Perubahan ditolak. Production harus memakai BLACKLIST_DURATION_UNIT=days untuk skenario ini."
  );
}

const scenarioApplyDeadline = Math.min(
  ...getExpectedFinalRestrictions().map((restriction) => restriction.blockedUntil.getTime())
);

type SeedUserRow = {
  email: string;
  id: string;
  is_active: boolean;
  name: string;
  national_id: string | null;
  role: string;
};

type SeedUnitRow = { id: string; is_active: boolean; name: string };
type SeedAdminRow = {
  email: string;
  id: string;
  is_active: boolean;
  role: string;
  unit_id: string | null;
};

type LoadedSeedContext = CrossUnitViolationSeedContext & {
  activeByEmail: Map<string, boolean>;
};

type Column<Row> = {
  column: string;
  key: keyof Row;
};

const targetViolationIds = CROSS_UNIT_VIOLATION_SCENARIO.map((incident) => incident.ids.violation);
const targetBarangIds = CROSS_UNIT_VIOLATION_SCENARIO.map((incident) => incident.ids.barang);
const targetBarangCodes = CROSS_UNIT_VIOLATION_SCENARIO.map((incident) => incident.itemCode);
const targetPemasaranIds = CROSS_UNIT_VIOLATION_SCENARIO.map((incident) => incident.ids.pemasaran);
const targetTransaksiIds = CROSS_UNIT_VIOLATION_SCENARIO.map((incident) => incident.ids.transaksi);
const targetHistoricalSessionIds = getCrossUnitViolationHistoricalSessionIds();
const targetBlacklistIds = getExpectedFinalRestrictions().map((restriction) =>
  restriction.buyerEmail === "yoga@gmail.com"
    ? "61000000-0000-4000-8000-000000000001"
    : restriction.buyerEmail === "tiara@gmail.com"
      ? "61000000-0000-4000-8000-000000000002"
      : "61000000-0000-4000-8000-000000000003"
);

function toDatabaseValue(value: unknown) {
  if (value && typeof value === "object" && !(value instanceof Date)) {
    return JSON.stringify(value);
  }
  return value;
}

async function insertRows<Row extends object>(
  client: PoolClient | Client,
  table: string,
  columns: Array<Column<Row>>,
  rows: Row[]
) {
  if (!rows.length) return;

  const values: unknown[] = [];
  const tuples = rows.map((row) => {
    const placeholders = columns.map(({ key }) => {
      values.push(toDatabaseValue(row[key]));
      return `$${values.length}`;
    });
    return `(${placeholders.join(", ")})`;
  });
  const columnSql = columns.map(({ column }) => `"${column}"`).join(", ");

  await client.query(
    `insert into "${table}" (${columnSql}) values ${tuples.join(", ")}`,
    values
  );
}

function assertCount(actual: number, expected: number, label: string) {
  if (actual !== expected) {
    throw new Error(`Audit ${label} gagal: ${actual}, seharusnya ${expected}.`);
  }
}

async function assertExactScopedIds(
  client: Client,
  input: {
    expectedIds: string[];
    label: string;
    params: unknown[];
    table: string;
    whereSql: string;
  }
) {
  const result = await client.query<{ id: string }>(
    `select id from "${input.table}" where ${input.whereSql} order by id`,
    input.params
  );
  const actualIds = result.rows.map((row) => row.id).sort();
  const expectedIds = [...input.expectedIds].sort();

  if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) {
    throw new Error(
      `Preflight gagal: turunan ${input.label} berubah (${actualIds.length}/${expectedIds.length}).`
    );
  }
}

async function verifyMediaFiles() {
  for (const incident of CROSS_UNIT_VIOLATION_SCENARIO) {
    const mediaPath = resolve(process.cwd(), "public", incident.media.publicPath.replace(/^\//, ""));
    const file = await readFile(mediaPath).catch(() => {
      throw new Error(`Media ${incident.itemName} belum tersedia di ${mediaPath}.`);
    });
    const isWebp =
      file.subarray(0, 4).toString("ascii") === "RIFF" &&
      file.subarray(8, 12).toString("ascii") === "WEBP";
    if (file.byteLength !== incident.media.sizeBytes || !isWebp) {
      throw new Error(`Media ${incident.itemName} tidak cocok dengan metadata WebP yang diaudit.`);
    }
  }
}

async function loadSeedContext(client: Client): Promise<LoadedSeedContext> {
  const users = await client.query<SeedUserRow>(
    `select id, lower(email) as email, name, role, is_active, national_id
     from "user"
     where lower(email) = any($1::text[])
     order by email`,
    [[...CROSS_UNIT_SCENARIO_EMAILS]]
  );
  assertCount(users.rows.length, CROSS_UNIT_SCENARIO_EMAILS.length, "akun buyer");
  if (users.rows.some((user) => user.role !== "buyer")) {
    throw new Error("Preflight gagal: seluruh akun skenario harus memiliki role buyer.");
  }
  for (const user of users.rows) {
    const expected = CROSS_UNIT_SCENARIO_IDENTITIES[user.email as keyof typeof CROSS_UNIT_SCENARIO_IDENTITIES];
    if (
      !expected ||
      user.name.trim() !== expected.name ||
      user.national_id !== expected.nationalId
    ) {
      throw new Error(`Preflight gagal: identitas nama/NIK ${user.email} tidak sesuai manifest.`);
    }
  }

  const expectedUnitNames = Array.from(
    new Set(CROSS_UNIT_VIOLATION_SCENARIO.map((incident) => incident.unitName))
  );
  const units = await client.query<SeedUnitRow>(
    `select id, name, is_active
     from units
     where lower(name) = any($1::text[])
     order by name`,
    [expectedUnitNames.map((name) => name.toLowerCase())]
  );
  assertCount(units.rows.length, expectedUnitNames.length, "unit");
  if (units.rows.some((unit) => !unit.is_active)) {
    throw new Error("Preflight gagal: UPC Sarinah dan UPC Wanea harus aktif.");
  }

  const expectedAdminEmails = Array.from(
    new Set(CROSS_UNIT_VIOLATION_SCENARIO.map((incident) => incident.unitAdminEmail))
  );
  const admins = await client.query<SeedAdminRow>(
    `select id, lower(email) as email, role, is_active, unit_id
     from "user"
     where lower(email) = any($1::text[])
     order by email`,
    [expectedAdminEmails]
  );
  assertCount(admins.rows.length, expectedAdminEmails.length, "admin unit");
  if (admins.rows.some((admin) => admin.role !== "admin_unit" || !admin.is_active)) {
    throw new Error("Preflight gagal: admin pembuat barang harus admin unit aktif.");
  }

  const unitsByName = new Map(units.rows.map((unit) => [unit.name, { id: unit.id }]));
  for (const incident of CROSS_UNIT_VIOLATION_SCENARIO) {
    const admin = admins.rows.find((candidate) => candidate.email === incident.unitAdminEmail);
    const unit = unitsByName.get(incident.unitName);
    if (!admin || !unit || admin.unit_id !== unit.id) {
      throw new Error(
        `Preflight gagal: ${incident.unitAdminEmail} tidak terikat ke ${incident.unitName}.`
      );
    }
  }

  const profileAudit = await client.query<{ invalid_count: string }>(
    `select count(*)::text as invalid_count
     from "user" u
     left join buyer_profile bp on bp.user_id = u.id
     where lower(u.email) = any($1::text[])
       and (
         bp.id is null
         or u.created_at > $2::timestamptz
         or bp.created_at > $2::timestamptz
       )`,
    [[...CROSS_UNIT_SCENARIO_EMAILS], CROSS_UNIT_VIOLATION_SCENARIO[0].auctionStartsAt]
  );
  assertCount(Number(profileAudit.rows[0]?.invalid_count ?? 0), 0, "tanggal member buyer");

  return {
    usersByEmail: new Map(
      users.rows.map((user) => [user.email, { id: user.id, nationalId: user.national_id }])
    ),
    unitsByName,
    adminsByEmail: new Map(admins.rows.map((admin) => [admin.email, { id: admin.id }])),
    activeByEmail: new Map(users.rows.map((user) => [user.email, user.is_active]))
  };
}

async function runPreflight(client: Client, context: LoadedSeedContext) {
  const userIds = [...context.usersByEmail.values()].map((user) => user.id);
  const expectedRows = buildCrossUnitViolationSeedRows(context);

  const existingScenario = await client.query<{ count: string }>(
    `select count(*)::text as count
     from pelanggaran_user
     where id = any($1::text[])`,
    [targetViolationIds]
  );
  const scenarioCount = Number(existingScenario.rows[0]?.count ?? 0);
  if (scenarioCount !== 0 && scenarioCount !== targetViolationIds.length) {
    throw new Error(`Preflight gagal: skenario lama hanya terisi ${scenarioCount}/7 kasus.`);
  }

  const expectedInactiveEmails = new Set(["yoga@gmail.com", "tiara@gmail.com"]);
  for (const email of CROSS_UNIT_SCENARIO_EMAILS) {
    const isActive = context.activeByEmail.get(email);
    const expectedActive = scenarioCount === 0 ? true : !expectedInactiveEmails.has(email);
    if (isActive !== expectedActive) {
      throw new Error(
        `Preflight gagal: status aktif ${email} tidak sesuai kondisi ${scenarioCount === 0 ? "awal" : "rerun"}.`
      );
    }
  }

  const foreignViolations = await client.query(
    `select id
     from pelanggaran_user
     where user_id = any($1::text[])
       and not (id = any($2::text[]))
     limit 1`,
    [userIds, targetViolationIds]
  );
  assertCount(foreignViolations.rowCount ?? 0, 0, "pelanggaran asing target");

  const foreignBlacklists = await client.query(
    `select id
     from blacklist
     where user_id = any($1::text[])
       and not (id = any($2::text[]))
     limit 1`,
    [userIds, targetBlacklistIds]
  );
  assertCount(foreignBlacklists.rowCount ?? 0, 0, "blacklist asing target");

  const expectedBlacklistUserIds = getExpectedFinalRestrictions().map((restriction) => {
    const buyer = context.usersByEmail.get(restriction.buyerEmail);
    if (!buyer) throw new Error(`Preflight gagal: buyer ${restriction.buyerEmail} tidak ditemukan.`);
    return buyer.id;
  });
  const blacklistIdentityConflicts = await client.query(
    `with expected(id, user_id) as (
       select * from unnest($1::text[], $2::text[])
     )
     select bl.id, bl.user_id
     from blacklist bl
     left join expected e on e.id = bl.id and e.user_id = bl.user_id
     where bl.id = any($1::text[])
       and e.id is null
     limit 1`,
    [targetBlacklistIds, expectedBlacklistUserIds]
  );
  assertCount(
    blacklistIdentityConflicts.rowCount ?? 0,
    0,
    "konflik pasangan ID/user blacklist"
  );

  const itemIdentityConflicts = await client.query(
    `with expected(id, code) as (
       select * from unnest($1::text[], $2::text[])
     )
     select b.id, b.code
     from barang b
     left join expected e on e.id = b.id and e.code = b.code
     where (b.id = any($1::text[]) or b.code = any($2::text[]))
       and e.id is null
     limit 1`,
    [targetBarangIds, targetBarangCodes]
  );
  assertCount(itemIdentityConflicts.rowCount ?? 0, 0, "konflik pasangan ID/kode barang");

  if (scenarioCount === 0) {
    const partialParents = await client.query<{ count: string }>(
      `select (
         (select count(*) from barang where id = any($1::text[])) +
         (select count(*) from blacklist where id = any($2::text[]))
       )::text as count`,
      [targetBarangIds, targetBlacklistIds]
    );
    assertCount(Number(partialParents.rows[0]?.count ?? 0), 0, "skenario parsial");
    await assertExactScopedIds(client, {
      table: "session",
      whereSql: "id = any($1::text[])",
      params: [targetHistoricalSessionIds],
      expectedIds: [],
      label: "riwayat sesi login"
    });
  } else {
    const rowId = (row: Record<string, unknown>) => String(row.id);
    await assertExactScopedIds(client, {
      table: "barang",
      whereSql: "id = any($1::text[])",
      params: [targetBarangIds],
      expectedIds: expectedRows.barang.map(rowId),
      label: "barang"
    });
    await assertExactScopedIds(client, {
      table: "media_barang",
      whereSql: "barang_id = any($1::text[])",
      params: [targetBarangIds],
      expectedIds: expectedRows.mediaBarang.map(rowId),
      label: "media barang"
    });
    await assertExactScopedIds(client, {
      table: "riwayat_perpanjangan",
      whereSql: "barang_id = any($1::text[])",
      params: [targetBarangIds],
      expectedIds: [],
      label: "riwayat perpanjangan"
    });
    await assertExactScopedIds(client, {
      table: "pemasaran",
      whereSql: "barang_id = any($1::text[])",
      params: [targetBarangIds],
      expectedIds: expectedRows.pemasaran.map((row) => row.id),
      label: "pemasaran"
    });
    await assertExactScopedIds(client, {
      table: "pemasaran_views",
      whereSql: "pemasaran_id = any($1::text[])",
      params: [targetPemasaranIds],
      expectedIds: [],
      label: "view pemasaran"
    });
    await assertExactScopedIds(client, {
      table: "buyer_wishlist",
      whereSql: "pemasaran_id = any($1::text[])",
      params: [targetPemasaranIds],
      expectedIds: [],
      label: "wishlist pemasaran"
    });
    await assertExactScopedIds(client, {
      table: "bids",
      whereSql: "pemasaran_id = any($1::text[])",
      params: [targetPemasaranIds],
      expectedIds: expectedRows.bids.map((row) => row.id),
      label: "bid"
    });
    await assertExactScopedIds(client, {
      table: "transaksi",
      whereSql: "pemasaran_id = any($1::text[])",
      params: [targetPemasaranIds],
      expectedIds: expectedRows.transaksi.map(rowId),
      label: "transaksi"
    });
    await assertExactScopedIds(client, {
      table: "pelanggaran_user",
      whereSql: "pemasaran_id = any($1::text[])",
      params: [targetPemasaranIds],
      expectedIds: expectedRows.pelanggaranUser.map(rowId),
      label: "pelanggaran"
    });
    await assertExactScopedIds(client, {
      table: "riwayat_status_barang",
      whereSql: "barang_id = any($1::text[])",
      params: [targetBarangIds],
      expectedIds: expectedRows.riwayatStatusBarang.map((row) => row.id),
      label: "riwayat status barang"
    });
    await assertExactScopedIds(client, {
      table: "blacklist",
      whereSql: "id = any($1::text[])",
      params: [targetBlacklistIds],
      expectedIds: expectedRows.blacklists.map(rowId),
      label: "blacklist"
    });
    await assertExactScopedIds(client, {
      table: "blacklist_action_log",
      whereSql: "blacklist_id = any($1::text[])",
      params: [targetBlacklistIds],
      expectedIds: expectedRows.blacklistActionLogs.map(rowId),
      label: "log blacklist"
    });
    const historicalSessionCount = await client.query<{ count: string }>(
      `select count(*)::text as count from session where id = any($1::text[])`,
      [targetHistoricalSessionIds]
    );
    const existingSessionCount = Number(historicalSessionCount.rows[0]?.count ?? 0);
    if (existingSessionCount !== 0 && existingSessionCount !== targetHistoricalSessionIds.length) {
      throw new Error(
        `Preflight gagal: riwayat sesi login hanya terisi ${existingSessionCount}/${targetHistoricalSessionIds.length}.`
      );
    }
  }

  const openTransactions = await client.query(
    `select id
     from transaksi
     where user_id = any($1::text[])
       and status not in ('gagal', 'lunas', 'selesai')
       and not (id = any($2::text[]))
     limit 1`,
    [userIds, targetTransaksiIds]
  );
  assertCount(openTransactions.rowCount ?? 0, 0, "transaksi aktif target");

  const activeBids = await client.query(
    `select bid.id
     from bids bid
     inner join pemasaran p on p.id = bid.pemasaran_id
     where bid.user_id = any($1::text[])
       and p.status = 'aktif'
       and not (p.id = any($2::text[]))
     limit 1`,
    [userIds, targetPemasaranIds]
  );
  assertCount(activeBids.rowCount ?? 0, 0, "bid aktif target");

  const latestViolationAt = Math.max(
    ...CROSS_UNIT_VIOLATION_SCENARIO.map((incident) => incident.violationOccurredAt.getTime())
  );
  if (Date.now() < latestViolationAt) {
    throw new Error("Preflight gagal: timestamp pelanggaran terakhir masih berada di masa depan.");
  }

  return scenarioCount;
}

async function syncHistoricalSessionRows(
  client: Client,
  rows: ReturnType<typeof buildCrossUnitViolationSeedRows>
) {
  await client.query(`delete from session where id = any($1::text[])`, [targetHistoricalSessionIds]);
  await insertRows(client, "session", [
    { key: "id", column: "id" },
    { key: "expiresAt", column: "expires_at" },
    { key: "token", column: "token" },
    { key: "createdAt", column: "created_at" },
    { key: "updatedAt", column: "updated_at" },
    { key: "ipAddress", column: "ip_address" },
    { key: "userAgent", column: "user_agent" },
    { key: "userId", column: "user_id" }
  ], rows.sessions);
}

async function insertScenario(client: Client, context: CrossUnitViolationSeedContext) {
  const rows = buildCrossUnitViolationSeedRows(context);

  await client.query(`delete from blacklist where id = any($1::text[])`, [targetBlacklistIds]);
  await client.query(`delete from barang where id = any($1::text[])`, [targetBarangIds]);

  await insertRows(client, "barang", [
    { key: "id", column: "id" },
    { key: "unitId", column: "unit_id" },
    { key: "code", column: "code" },
    { key: "name", column: "name" },
    { key: "category", column: "category" },
    { key: "condition", column: "condition" },
    { key: "description", column: "description" },
    { key: "specifications", column: "specifications" },
    { key: "appraisalValue", column: "appraisal_value" },
    { key: "ownerName", column: "owner_name" },
    { key: "customerNumber", column: "customer_number" },
    { key: "pawnedAt", column: "pawned_at" },
    { key: "dueDate", column: "due_date" },
    { key: "status", column: "status" },
    { key: "createdByUserId", column: "created_by_user_id" },
    { key: "createdAt", column: "created_at" },
    { key: "updatedAt", column: "updated_at" }
  ], rows.barang);

  await insertRows(client, "media_barang", [
    { key: "id", column: "id" },
    { key: "barangId", column: "barang_id" },
    { key: "type", column: "type" },
    { key: "url", column: "url" },
    { key: "fileName", column: "file_name" },
    { key: "sizeBytes", column: "size_bytes" },
    { key: "sortOrder", column: "sort_order" },
    { key: "createdAt", column: "created_at" }
  ], rows.mediaBarang);

  await insertRows(client, "pemasaran", [
    { key: "id", column: "id" },
    { key: "barangId", column: "barang_id" },
    { key: "mode", column: "mode" },
    { key: "basePrice", column: "base_price" },
    { key: "durationDays", column: "duration_days" },
    { key: "durationSeconds", column: "duration_seconds" },
    { key: "startsAt", column: "starts_at" },
    { key: "endsAt", column: "ends_at" },
    { key: "winnerId", column: "winner_id" },
    { key: "finalPrice", column: "final_price" },
    { key: "iteration", column: "iteration" },
    { key: "status", column: "status" },
    { key: "createdByUserId", column: "created_by_user_id" },
    { key: "createdAt", column: "created_at" },
    { key: "updatedAt", column: "updated_at" }
  ], rows.pemasaran);

  await insertRows(client, "bids", [
    { key: "id", column: "id" },
    { key: "pemasaranId", column: "pemasaran_id" },
    { key: "userId", column: "user_id" },
    { key: "nominal", column: "nominal" },
    { key: "createdAt", column: "created_at" }
  ], rows.bids);

  await insertRows(client, "transaksi", [
    { key: "id", column: "id" },
    { key: "pemasaranId", column: "pemasaran_id" },
    { key: "userId", column: "user_id" },
    { key: "type", column: "type" },
    { key: "amount", column: "amount" },
    { key: "paymentMethod", column: "payment_method" },
    { key: "status", column: "status" },
    { key: "paymentDeadline", column: "payment_deadline" },
    { key: "createdAt", column: "created_at" },
    { key: "updatedAt", column: "updated_at" }
  ], rows.transaksi);

  await insertRows(client, "pelanggaran_user", [
    { key: "id", column: "id" },
    { key: "userId", column: "user_id" },
    { key: "pemasaranId", column: "pemasaran_id" },
    { key: "transaksiId", column: "transaksi_id" },
    { key: "unitId", column: "unit_id" },
    { key: "note", column: "note" },
    { key: "escalationEligible", column: "escalation_eligible" },
    { key: "createdAt", column: "created_at" },
    { key: "updatedAt", column: "updated_at" }
  ], rows.pelanggaranUser);

  await insertRows(client, "riwayat_status_barang", [
    { key: "id", column: "id" },
    { key: "barangId", column: "barang_id" },
    { key: "oldStatus", column: "old_status" },
    { key: "newStatus", column: "new_status" },
    { key: "changedByUserId", column: "changed_by_user_id" },
    { key: "note", column: "note" },
    { key: "createdAt", column: "created_at" }
  ], rows.riwayatStatusBarang);

  await insertRows(client, "blacklist", [
    { key: "id", column: "id" },
    { key: "unitId", column: "unit_id" },
    { key: "userId", column: "user_id" },
    { key: "nationalId", column: "national_id" },
    { key: "totalViolations", column: "total_violations" },
    { key: "isActive", column: "is_active" },
    { key: "blockedAt", column: "blocked_at" },
    { key: "blockedUntil", column: "blocked_until" },
    { key: "updatedAt", column: "updated_at" }
  ], rows.blacklists);

  await insertRows(client, "blacklist_action_log", [
    { key: "id", column: "id" },
    { key: "blacklistId", column: "blacklist_id" },
    { key: "targetUserId", column: "target_user_id" },
    { key: "action", column: "action" },
    { key: "note", column: "note" },
    { key: "createdAt", column: "created_at" }
  ], rows.blacklistActionLogs);

  await client.query(
    `update "user"
     set is_active = false,
         updated_at = greatest(updated_at, $2::timestamptz)
     where id = any($1::text[])`,
    [rows.suspendedUserIds, CROSS_UNIT_VIOLATION_SCENARIO[5].violationOccurredAt]
  );
  await client.query(`delete from session where user_id = any($1::text[])`, [rows.suspendedUserIds]);
  await syncHistoricalSessionRows(client, rows);

  return rows;
}

async function auditScenario(client: Client) {
  const countChecks = [
    ["barang", targetBarangIds, 7],
    ["media_barang", CROSS_UNIT_VIOLATION_SCENARIO.map((incident) => incident.ids.media), 7],
    ["pemasaran", targetPemasaranIds, 7],
    ["transaksi", targetTransaksiIds, 7],
    ["pelanggaran_user", targetViolationIds, 7],
    ["blacklist", targetBlacklistIds, 3]
  ] as const;

  for (const [table, ids, expected] of countChecks) {
    const result = await client.query<{ count: string }>(
      `select count(*)::text as count from "${table}" where id = any($1::text[])`,
      [ids]
    );
    assertCount(Number(result.rows[0]?.count ?? 0), expected, table);
  }

  const bidCount = await client.query<{ count: string }>(
    `select count(*)::text as count from bids where pemasaran_id = any($1::text[])`,
    [targetPemasaranIds]
  );
  assertCount(Number(bidCount.rows[0]?.count ?? 0), 22, "bids");

  const historyCount = await client.query<{ count: string }>(
    `select count(*)::text as count from riwayat_status_barang where barang_id = any($1::text[])`,
    [targetBarangIds]
  );
  assertCount(Number(historyCount.rows[0]?.count ?? 0), 28, "riwayat barang");

  const historicalSessionCount = await client.query<{ count: string }>(
    `select count(*)::text as count from session where id = any($1::text[])`,
    [targetHistoricalSessionIds]
  );
  assertCount(
    Number(historicalSessionCount.rows[0]?.count ?? 0),
    targetHistoricalSessionIds.length,
    "riwayat sesi login"
  );
  const activeHistoricalSessionCount = await client.query<{ count: string }>(
    `select count(*)::text as count
     from session
     where id = any($1::text[])
       and expires_at > now()`,
    [targetHistoricalSessionIds]
  );
  assertCount(Number(activeHistoricalSessionCount.rows[0]?.count ?? 0), 0, "sesi login aktif");

  const chronologyErrors = await client.query<{ count: string }>(
    `select count(*)::text as count
     from barang b
     inner join pemasaran p on p.barang_id = b.id
     inner join transaksi t on t.pemasaran_id = p.id
     inner join pelanggaran_user pu on pu.transaksi_id = t.id
     where b.id = any($1::text[])
       and (
         p.starts_at - b.created_at <> interval '10 days'
         or p.ends_at <= p.starts_at
         or pu.created_at - p.ends_at <> interval '24 hours'
         or t.payment_deadline <> pu.created_at
       )`,
    [targetBarangIds]
  );
  assertCount(Number(chronologyErrors.rows[0]?.count ?? 0), 0, "kronologi");

  const finalRestrictions = await client.query<{
    blocked_until: Date;
    email: string;
    total_violations: number;
    unit_name: string;
  }>(
    `select lower(u.email) as email, bl.total_violations, bl.blocked_until, un.name as unit_name
     from blacklist bl
     inner join "user" u on u.id = bl.user_id
     inner join units un on un.id = bl.unit_id
     where bl.id = any($1::text[])
     order by bl.blocked_at`,
    [targetBlacklistIds]
  );
  const expected = getExpectedFinalRestrictions();
  for (const restriction of expected) {
    const actual = finalRestrictions.rows.find((row) => row.email === restriction.buyerEmail);
    if (
      !actual ||
      Number(actual.total_violations) !== restriction.level ||
      actual.unit_name !== restriction.unitName ||
      Math.abs(actual.blocked_until.getTime() - restriction.blockedUntil.getTime()) >= 1000
    ) {
      throw new Error(`Audit pembatasan akhir ${restriction.buyerEmail} gagal.`);
    }
  }

  const activeLevelThree = await client.query<{ count: string }>(
    `select count(*)::text as count
     from "user" u
     inner join blacklist bl on bl.user_id = u.id
     where bl.id = any($1::text[])
       and bl.total_violations = 3
       and u.is_active = true`,
    [targetBlacklistIds]
  );
  assertCount(Number(activeLevelThree.rows[0]?.count ?? 0), 0, "suspensi Level 3");

  const inactiveBlacklist = await client.query<{ count: string }>(
    `select count(*)::text as count
     from blacklist
     where id = any($1::text[])
       and is_active = false`,
    [targetBlacklistIds]
  );
  assertCount(Number(inactiveBlacklist.rows[0]?.count ?? 0), 0, "status aktif blacklist");

  const actionLogCount = await client.query<{ count: string }>(
    `select count(*)::text as count
     from blacklist_action_log
     where blacklist_id = any($1::text[])`,
    [targetBlacklistIds]
  );
  assertCount(Number(actionLogCount.rows[0]?.count ?? 0), 7, "log keputusan blacklist");

  const accountStates = await client.query<{ email: string; is_active: boolean }>(
    `select lower(email) as email, is_active
     from "user"
     where lower(email) = any($1::text[])`,
    [[...CROSS_UNIT_SCENARIO_EMAILS]]
  );
  const inactiveEmails = new Set(["yoga@gmail.com", "tiara@gmail.com"]);
  for (const email of CROSS_UNIT_SCENARIO_EMAILS) {
    const account = accountStates.rows.find((row) => row.email === email);
    if (!account || account.is_active !== !inactiveEmails.has(email)) {
      throw new Error(`Audit status aktif akun ${email} gagal.`);
    }
  }

  const mediaRows = await client.query<{ size_bytes: number; url: string }>(
    `select size_bytes, url
     from media_barang
     where id = any($1::text[])
     order by id`,
    [CROSS_UNIT_VIOLATION_SCENARIO.map((incident) => incident.ids.media)]
  );
  for (const incident of CROSS_UNIT_VIOLATION_SCENARIO) {
    const media = mediaRows.rows.find((row) => row.url === incident.media.publicPath);
    if (!media || Number(media.size_bytes) !== incident.media.sizeBytes) {
      throw new Error(`Audit metadata media ${incident.itemName} gagal.`);
    }
  }

  return {
    items: 7,
    bids: 22,
    violations: 7,
    finalRestrictions: finalRestrictions.rows.map((row) => ({
      email: row.email,
      level: Number(row.total_violations),
      unit: row.unit_name,
      blockedUntil: row.blocked_until.toISOString()
    }))
  };
}

async function main() {
  validateCrossUnitViolationScenario();
  await verifyMediaFiles();

  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query("begin");
    await client.query("set local lock_timeout = '5s'");
    await client.query("set local statement_timeout = '60s'");
    await client.query(
      "select pg_advisory_xact_lock(hashtext('cross-unit-violation-scenario-2026-07-16'))"
    );

    const context = await loadSeedContext(client);
    const scenarioCount = await runPreflight(client, context);
    const reconcileHistoricalSessions =
      scenarioCount === targetViolationIds.length && Date.now() >= scenarioApplyDeadline;
    if (scenarioCount === 0 && Date.now() >= scenarioApplyDeadline) {
      throw new Error(
        "Perubahan ditolak. Jendela penerapan skenario telah berakhir agar hukuman lama tidak diaktifkan kembali."
      );
    }
    if (reconcileHistoricalSessions) {
      await syncHistoricalSessionRows(client, buildCrossUnitViolationSeedRows(context));
    } else {
      await insertScenario(client, context);
    }
    const audit = await auditScenario(client);

    if (applyChanges) {
      await client.query("commit");
      console.log(
        reconcileHistoricalSessions
          ? "[cross-unit-scenario] production login history reconciled and audited."
          : "[cross-unit-scenario] production applied and audited."
      );
    } else {
      await client.query("rollback");
      console.log("[cross-unit-scenario] dry-run passed; no data was written.");
    }
    console.log(JSON.stringify(audit, null, 2));
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
