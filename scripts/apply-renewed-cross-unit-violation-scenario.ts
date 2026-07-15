import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { config } from "dotenv";
import { Client } from "pg";

import {
  getRenewedExpectedFinalRestrictions,
  RENEWED_CROSS_UNIT_EMAILS,
  RENEWED_CROSS_UNIT_IDENTITIES,
  RENEWED_CROSS_UNIT_VIOLATION_SCENARIO,
  validateRenewedCrossUnitViolationScenario
} from "../lib/blacklist/renewed-cross-unit-violation-scenario";
import { buildRenewedCrossUnitViolationSeedRows, type RenewedCrossUnitViolationSeedContext } from "../lib/blacklist/renewed-cross-unit-violation-seed";
import { getBlacklistDurationUnit } from "../lib/blacklist/restrictions";

config({ path: ".env.local", quiet: true });

const connectionString = process.env.DATABASE_URL;
const apply = process.argv.includes("--apply");
const production = process.env.SCENARIO_TARGET === "production";
const itemIds = RENEWED_CROSS_UNIT_VIOLATION_SCENARIO.map((entry) => entry.ids.barang);
const marketingIds = RENEWED_CROSS_UNIT_VIOLATION_SCENARIO.map((entry) => entry.ids.pemasaran);
const violationIds = RENEWED_CROSS_UNIT_VIOLATION_SCENARIO.map((entry) => entry.ids.violation);
const transactionIds = RENEWED_CROSS_UNIT_VIOLATION_SCENARIO.map((entry) => entry.ids.transaksi);
const blacklistIds = [
  "81000000-0000-4000-8000-000000000001",
  "81000000-0000-4000-8000-000000000002",
  "81000000-0000-4000-8000-000000000003",
  "81000000-0000-4000-8000-000000000004",
  "81000000-0000-4000-8000-000000000005"
];
const legacyViolationIds = RENEWED_CROSS_UNIT_VIOLATION_SCENARIO.slice(0, 5).map((entry) => entry.ids.violation);
const legacyItemIds = RENEWED_CROSS_UNIT_VIOLATION_SCENARIO.slice(0, 5).map((entry) => entry.ids.barang);
const legacyBlacklistIds = blacklistIds.slice(0, 2);

if (!connectionString) throw new Error("DATABASE_URL belum diatur.");
if (apply && !production) throw new Error("Penerapan ditolak. Set SCENARIO_TARGET=production secara eksplisit.");
if (production && getBlacklistDurationUnit() !== "days") throw new Error("Production harus memakai BLACKLIST_DURATION_UNIT=days.");

function requireRows<T>(rows: T[], expected: number, label: string) {
  if (rows.length !== expected) throw new Error(`${label} tidak sesuai: ${rows.length}/${expected}.`);
}

async function insertRows(client: Client, table: string, columns: Array<[string, string]>, rows: Array<Record<string, unknown>>) {
  if (!rows.length) return;
  const values: unknown[] = [];
  const placeholders = rows.map((row, rowIndex) => `(${columns.map(([, key], columnIndex) => { values.push(row[key]); return `$${rowIndex * columns.length + columnIndex + 1}`; }).join(", ")})`);
  await client.query(`insert into "${table}" (${columns.map(([column]) => `"${column}"`).join(", ")}) values ${placeholders.join(", ")}`, values);
}

async function verifyMedia() {
  await Promise.all(RENEWED_CROSS_UNIT_VIOLATION_SCENARIO.map(async (entry) => {
    const file = resolve(process.cwd(), "public", entry.media.publicPath.replace(/^\//, ""));
    const data = await readFile(file);
    if (data.length !== entry.media.sizeBytes || data.subarray(0, 4).toString("ascii") !== "RIFF" || data.subarray(8, 12).toString("ascii") !== "WEBP") throw new Error(`Media ${entry.itemName} tidak valid.`);
  }));
}

async function loadContext(client: Client): Promise<RenewedCrossUnitViolationSeedContext & { activeByEmail: Map<string, boolean> }> {
  const users = await client.query<{ id: string; email: string; name: string; national_id: string | null; is_active: boolean; role: string }>(`select id, lower(email) as email, name, national_id, is_active, role from "user" where lower(email)=any($1::text[])`, [[...RENEWED_CROSS_UNIT_EMAILS]]);
  requireRows(users.rows, RENEWED_CROSS_UNIT_EMAILS.length, "Akun buyer");
  for (const row of users.rows) {
    const expected = RENEWED_CROSS_UNIT_IDENTITIES[row.email as keyof typeof RENEWED_CROSS_UNIT_IDENTITIES];
    if (!expected || row.role !== "buyer" || row.name !== expected.name || row.national_id !== expected.nationalId) throw new Error(`Identitas buyer ${row.email} tidak cocok.`);
  }
  const units = await client.query<{ id: string; name: string; is_active: boolean }>(`select id,name,is_active from units where name=any($1::text[])`, [["UPC Sarinah", "UPC Ranotana"]]);
  requireRows(units.rows, 2, "Unit");
  if (units.rows.some((unit) => !unit.is_active)) throw new Error("Unit target tidak aktif.");
  const adminEmails = [...new Set(RENEWED_CROSS_UNIT_VIOLATION_SCENARIO.map((entry) => entry.unitAdminEmail))];
  const admins = await client.query<{ id: string; email: string; unit_id: string | null }>(`select id,lower(email) as email,unit_id from "user" where lower(email)=any($1::text[])`, [adminEmails]);
  requireRows(admins.rows, adminEmails.length, "Admin unit");
  for (const entry of RENEWED_CROSS_UNIT_VIOLATION_SCENARIO) {
    const admin = admins.rows.find((row) => row.email === entry.unitAdminEmail);
    const unit = units.rows.find((row) => row.name === entry.unitName);
    if (!admin || !unit || admin.unit_id !== unit.id) {
      throw new Error(`Admin ${entry.unitAdminEmail} tidak berada pada ${entry.unitName}.`);
    }
  }
  return { usersByEmail: new Map(users.rows.map((row) => [row.email, { id: row.id, nationalId: row.national_id }])), unitsByName: new Map(units.rows.map((row) => [row.name, { id: row.id }])), adminsByEmail: new Map(admins.rows.map((row) => [row.email, { id: row.id }])), activeByEmail: new Map(users.rows.map((row) => [row.email, row.is_active])) };
}

async function preflight(client: Client, context: Awaited<ReturnType<typeof loadContext>>) {
  const userIds = [...context.usersByEmail.values()].map((row) => row.id);
  const existing = await client.query<{ id: string }>(`select id from pelanggaran_user where id=any($1::text[])`, [violationIds]);
  const existingIds = new Set(existing.rows.map((row) => row.id));
  const hasLegacySeed = existingIds.size === legacyViolationIds.length && legacyViolationIds.every((id) => existingIds.has(id));
  const hasCompleteSeed = existingIds.size === violationIds.length;
  if (existingIds.size !== 0 && !hasLegacySeed && !hasCompleteSeed) throw new Error(`Skenario parsial terdeteksi: ${existingIds.size}/${violationIds.length}.`);
  const expectedActive = new Map(RENEWED_CROSS_UNIT_EMAILS.map((email) => [email, email !== "kirana@gmail.com"]));
  for (const [email, isActive] of expectedActive) {
    if (context.activeByEmail.get(email) !== (existingIds.size === 0 ? true : isActive)) throw new Error(`Status akun ${email} tidak aman untuk skenario ini.`);
  }
  for (const [table, ids, label] of [["pelanggaran_user", violationIds, "pelanggaran"], ["blacklist", blacklistIds, "blacklist"]] as const) {
    const foreign = await client.query<{ id: string }>(`select id from ${table} where user_id=any($1::text[]) and not (id=any($2::text[])) limit 1`, [userIds, ids]);
    if (foreign.rows.length) throw new Error(`Preflight gagal: ${label} asing pada buyer target.`);
  }
  const openTransactions = await client.query(`select id from transaksi where user_id=any($1::text[]) and status not in ('gagal','lunas','selesai') and not (id=any($2::text[])) limit 1`, [userIds, transactionIds]);
  if (openTransactions.rows.length) throw new Error("Preflight gagal: ada transaksi aktif pada buyer target.");
  const activeBids = await client.query(`select bid.id from bids bid join pemasaran p on p.id=bid.pemasaran_id where bid.user_id=any($1::text[]) and p.status='aktif' and not (p.id=any($2::text[])) limit 1`, [userIds, marketingIds]);
  if (activeBids.rows.length) throw new Error("Preflight gagal: ada bid aktif pada buyer target.");
  const permittedItems = hasLegacySeed ? legacyItemIds : hasCompleteSeed ? itemIds : [];
  const permittedBlacklists = hasLegacySeed ? legacyBlacklistIds : hasCompleteSeed ? blacklistIds : [];
  const collisions = await client.query(`select id from barang where id=any($1::text[]) and not (id=any($2::text[])) union all select id from blacklist where id=any($3::text[]) and not (id=any($4::text[])) limit 1`, [itemIds, permittedItems, blacklistIds, permittedBlacklists]);
  if (collisions.rows.length) throw new Error("Preflight gagal: ID skenario sudah dipakai.");
  if (Date.now() < Math.max(...RENEWED_CROSS_UNIT_VIOLATION_SCENARIO.map((entry) => entry.violationOccurredAt.getTime()))) throw new Error("Pelanggaran terakhir masih berada di masa depan.");
}

async function applyRows(client: Client, context: RenewedCrossUnitViolationSeedContext) {
  const rows = buildRenewedCrossUnitViolationSeedRows(context);
  await client.query(`delete from blacklist where id=any($1::text[])`, [blacklistIds]);
  await client.query(`delete from barang where id=any($1::text[])`, [itemIds]);
  await insertRows(client, "barang", [["id","id"],["unit_id","unitId"],["code","code"],["name","name"],["category","category"],["condition","condition"],["description","description"],["specifications","specifications"],["appraisal_value","appraisalValue"],["owner_name","ownerName"],["customer_number","customerNumber"],["pawned_at","pawnedAt"],["due_date","dueDate"],["status","status"],["created_by_user_id","createdByUserId"],["created_at","createdAt"],["updated_at","updatedAt"]], rows.barang);
  await insertRows(client, "media_barang", [["id","id"],["barang_id","barangId"],["type","type"],["url","url"],["file_name","fileName"],["size_bytes","sizeBytes"],["sort_order","sortOrder"],["created_at","createdAt"]], rows.mediaBarang);
  await insertRows(client, "pemasaran", [["id","id"],["barang_id","barangId"],["mode","mode"],["base_price","basePrice"],["duration_days","durationDays"],["duration_seconds","durationSeconds"],["starts_at","startsAt"],["ends_at","endsAt"],["reveal_ends_at","revealEndsAt"],["winner_id","winnerId"],["final_price","finalPrice"],["iteration","iteration"],["status","status"],["created_by_user_id","createdByUserId"],["created_at","createdAt"],["updated_at","updatedAt"]], rows.pemasaran);
  await insertRows(client, "bids", [["id","id"],["pemasaran_id","pemasaranId"],["user_id","userId"],["bid_hash","bidHash"],["encrypted_bid_payload","encryptedBidPayload"],["nominal","nominal"],["salt","salt"],["revealed_at","revealedAt"],["created_at","createdAt"]], rows.bids);
  await insertRows(client, "transaksi", [["id","id"],["pemasaran_id","pemasaranId"],["user_id","userId"],["type","type"],["amount","amount"],["payment_method","paymentMethod"],["status","status"],["payment_deadline","paymentDeadline"],["created_at","createdAt"],["updated_at","updatedAt"]], rows.transaksi);
  await insertRows(client, "pelanggaran_user", [["id","id"],["user_id","userId"],["pemasaran_id","pemasaranId"],["transaksi_id","transaksiId"],["unit_id","unitId"],["note","note"],["escalation_eligible","escalationEligible"],["created_at","createdAt"],["updated_at","updatedAt"]], rows.pelanggaranUser);
  await insertRows(client, "riwayat_status_barang", [["id","id"],["barang_id","barangId"],["old_status","oldStatus"],["new_status","newStatus"],["changed_by_user_id","changedByUserId"],["note","note"],["created_at","createdAt"]], rows.riwayatStatusBarang);
  await insertRows(client, "blacklist", [["id","id"],["unit_id","unitId"],["user_id","userId"],["national_id","nationalId"],["total_violations","totalViolations"],["is_active","isActive"],["blocked_at","blockedAt"],["blocked_until","blockedUntil"],["updated_at","updatedAt"]], rows.blacklists);
  await insertRows(client, "blacklist_action_log", [["id","id"],["blacklist_id","blacklistId"],["target_user_id","targetUserId"],["action","action"],["note","note"],["created_at","createdAt"]], rows.blacklistActionLogs);
  const activeUserIds = [...context.usersByEmail.values()].map((user) => user.id).filter((id) => !rows.suspendedUserIds.includes(id));
  await client.query(`update "user" set is_active=true,updated_at=$2 where id=any($1::text[])`, [activeUserIds, RENEWED_CROSS_UNIT_VIOLATION_SCENARIO.at(-1)?.violationOccurredAt]);
  await client.query(`update "user" set is_active=false,updated_at=$2 where id=any($1::text[])`, [rows.suspendedUserIds, RENEWED_CROSS_UNIT_VIOLATION_SCENARIO.at(-1)?.violationOccurredAt]);
  await client.query(`delete from session where user_id=any($1::text[])`, [rows.suspendedUserIds]);
  return rows;
}

async function audit(client: Client) {
  const scenarioCount = RENEWED_CROSS_UNIT_VIOLATION_SCENARIO.length;
  const checks: Array<[string, string[], number]> = [["barang",itemIds,scenarioCount],["media_barang",RENEWED_CROSS_UNIT_VIOLATION_SCENARIO.map((entry) => entry.ids.media),scenarioCount],["pemasaran",marketingIds,scenarioCount],["transaksi",transactionIds,scenarioCount],["pelanggaran_user",violationIds,scenarioCount],["blacklist",blacklistIds,getRenewedExpectedFinalRestrictions().length]];
  for (const [table, ids, expected] of checks) { const result = await client.query<{ count: string }>(`select count(*)::text as count from "${table}" where id=any($1::text[])`, [ids]); if (Number(result.rows[0]?.count) !== expected) throw new Error(`Audit ${table} gagal.`); }
  const history = await client.query<{ count: string }>(`select count(*)::text as count from riwayat_status_barang where barang_id=any($1::text[])`, [itemIds]);
  if (Number(history.rows[0]?.count) !== scenarioCount * 4) throw new Error("Audit riwayat barang gagal.");
  const final = await client.query<{ email: string; total_violations: number; blocked_until: Date; unit_name: string }>(`select lower(u.email) email,bl.total_violations,bl.blocked_until,un.name unit_name from blacklist bl join "user" u on u.id=bl.user_id join units un on un.id=bl.unit_id where bl.id=any($1::text[])`, [blacklistIds]);
  for (const expected of getRenewedExpectedFinalRestrictions()) { const actual=final.rows.find((row) => row.email===expected.buyerEmail); if (!actual || actual.total_violations!==expected.level || actual.unit_name!==expected.unitName || actual.blocked_until.getTime()!==expected.blockedUntil.getTime()) throw new Error(`Audit pembatasan ${expected.buyerEmail} gagal.`); }
  return { items: scenarioCount, bids: RENEWED_CROSS_UNIT_VIOLATION_SCENARIO.reduce((total, entry) => total + entry.bids.length, 0), violations: scenarioCount, restrictions: final.rows.map((row) => ({ email: row.email, level: row.total_violations, unit: row.unit_name, blockedUntil: row.blocked_until.toISOString() })) };
}

async function main() {
  validateRenewedCrossUnitViolationScenario(); await verifyMedia();
  const client = new Client({ connectionString }); await client.connect();
  try { await client.query("begin"); await client.query("set local lock_timeout='5s'"); await client.query("set local statement_timeout='60s'"); await client.query("select pg_advisory_xact_lock(hashtext('renewed-cross-unit-violation-scenario-2026-07-16'))"); const context=await loadContext(client); await preflight(client,context); await applyRows(client,context); const result=await audit(client); if (apply) { await client.query("commit"); console.log("[renewed-cross-unit-scenario] production applied and audited."); } else { await client.query("rollback"); console.log("[renewed-cross-unit-scenario] dry-run passed; no data was written."); } console.log(JSON.stringify(result,null,2)); } catch (error) { await client.query("rollback").catch(() => undefined); throw error; } finally { await client.end(); }
}

main().catch((error) => { console.error(error); process.exitCode=1; });
