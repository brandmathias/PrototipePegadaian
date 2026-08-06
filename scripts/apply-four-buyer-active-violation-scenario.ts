import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { config } from "dotenv";
import { Client } from "pg";

import { getBlacklistDurationUnit } from "../lib/blacklist/restrictions";
import {
  FOUR_BUYER_ACTIVE_EMAILS,
  FOUR_BUYER_ACTIVE_IDENTITIES,
  FOUR_BUYER_ACTIVE_VIOLATION_SCENARIO,
  getFourBuyerActiveRestrictions,
  validateFourBuyerActiveViolationScenario
} from "../lib/blacklist/four-buyer-active-violation-scenario";
import {
  buildFourBuyerActiveViolationSeedRows,
  type FourBuyerActiveViolationSeedContext
} from "../lib/blacklist/four-buyer-active-violation-seed";

config({ path: ".env.local", quiet: true });

const connectionString = process.env.DATABASE_URL;
const apply = process.argv.includes("--apply");
const production = process.env.SCENARIO_TARGET === "production";
const itemIds = FOUR_BUYER_ACTIVE_VIOLATION_SCENARIO.map((entry) => entry.ids.barang);
const marketingIds = FOUR_BUYER_ACTIVE_VIOLATION_SCENARIO.map((entry) => entry.ids.pemasaran);
const transactionIds = FOUR_BUYER_ACTIVE_VIOLATION_SCENARIO.map((entry) => entry.ids.transaksi);
const violationIds = FOUR_BUYER_ACTIVE_VIOLATION_SCENARIO.map((entry) => entry.ids.violation);
const blacklistIds = FOUR_BUYER_ACTIVE_VIOLATION_SCENARIO.map((_, index) =>
  `a7b00000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`
);

if (!connectionString) throw new Error("DATABASE_URL belum diatur.");
if (apply && !production) throw new Error("Penerapan ditolak. Set SCENARIO_TARGET=production secara eksplisit.");
if (production && getBlacklistDurationUnit() !== "days") {
  throw new Error("Production harus memakai BLACKLIST_DURATION_UNIT=days.");
}

type Buyer = { email: string; id: string; nationalId: string };
type Context = FourBuyerActiveViolationSeedContext & { buyers: Buyer[] };

function requireCount<T>(rows: T[], expected: number, label: string) {
  if (rows.length !== expected) throw new Error(`${label} tidak sesuai: ${rows.length}/${expected}.`);
}

async function insertRows(client: Client, table: string, columns: Array<[string, string]>, rows: Array<Record<string, unknown>>) {
  if (!rows.length) return;
  const values: unknown[] = [];
  const placeholders = rows.map((row, rowIndex) => `(${columns.map(([, key], columnIndex) => {
    values.push(row[key]);
    return `$${rowIndex * columns.length + columnIndex + 1}`;
  }).join(", ")})`);
  await client.query(
    `insert into "${table}" (${columns.map(([column]) => `"${column}"`).join(", ")}) values ${placeholders.join(", ")}`,
    values
  );
}

async function verifyMedia() {
  await Promise.all(FOUR_BUYER_ACTIVE_VIOLATION_SCENARIO.map(async (entry) => {
    const file = resolve(process.cwd(), "public", entry.media.publicPath.replace(/^\//, ""));
    const data = await readFile(file);
    if (
      data.length !== entry.media.sizeBytes ||
      data.subarray(0, 4).toString("ascii") !== "RIFF" ||
      data.subarray(8, 12).toString("ascii") !== "WEBP"
    ) {
      throw new Error(`Media ${entry.itemName} tidak valid.`);
    }
  }));
}

async function loadContext(client: Client): Promise<Context> {
  const buyers = await client.query<{
    email: string;
    id: string;
    is_active: boolean;
    name: string;
    national_id: string | null;
    role: string;
  }>(
    `select id, lower(email) as email, name, national_id, role, is_active
     from "user"
     where lower(email) = any($1::text[])`,
    [[...FOUR_BUYER_ACTIVE_EMAILS]]
  );
  requireCount(buyers.rows, FOUR_BUYER_ACTIVE_EMAILS.length, "Akun buyer target");
  const buyerByEmail = new Map(buyers.rows.map((buyer) => [buyer.email, buyer]));
  for (const email of FOUR_BUYER_ACTIVE_EMAILS) {
    const buyer = buyerByEmail.get(email);
    if (
      !buyer ||
      buyer.name !== FOUR_BUYER_ACTIVE_IDENTITIES[email].name ||
      buyer.role !== "buyer" ||
      !buyer.is_active ||
      !buyer.national_id
    ) {
      throw new Error(`Identitas atau status buyer ${email} tidak aman.`);
    }
  }

  const buyerIds = buyers.rows.map((buyer) => buyer.id);
  // ponytail: one PostgreSQL client queues queries; sequential calls avoid deprecated concurrent use.
  const accounts = await client.query<{ user_id: string }>(
    `select user_id from "account" where user_id = any($1::text[]) and provider_id='credential' and password is not null`,
    [buyerIds]
  );
  const profiles = await client.query<{ email: string; full_name: string; user_id: string }>(
    `select user_id, lower(email) as email, full_name from buyer_profile where user_id=any($1::text[])`,
    [buyerIds]
  );
  const units = await client.query<{ id: string; is_active: boolean; name: string }>(
    `select id,name,is_active from units where name=any($1::text[])`,
    [["UPC Wanea", "UPC Ranotana", "UPC Sarinah"]]
  );
  const admins = await client.query<{ id: string; unit_name: string }>(
    `select distinct on (un.id) u.id, un.name as unit_name
     from units un
     join "user" u on u.unit_id=un.id
     where un.name=any($1::text[]) and un.is_active=true and u.role='admin_unit' and u.is_active=true
     order by un.id, u.created_at asc`,
    [["UPC Wanea", "UPC Ranotana", "UPC Sarinah"]]
  );
  requireCount(accounts.rows, buyerIds.length, "Akun credential buyer");
  requireCount(profiles.rows, buyerIds.length, "Profil buyer");
  requireCount(units.rows, 3, "UPC target");
  requireCount(admins.rows, 3, "Admin UPC target");
  if (units.rows.some((unit) => !unit.is_active)) throw new Error("Ada UPC target tidak aktif.");
  for (const buyer of buyers.rows) {
    const profile = profiles.rows.find((row) => row.user_id === buyer.id);
    if (!profile || profile.email !== buyer.email || profile.full_name !== buyer.name) {
      throw new Error(`Profil buyer ${buyer.email} tidak cocok.`);
    }
  }

  return {
    buyers: buyers.rows.map((buyer) => ({
      email: buyer.email,
      id: buyer.id,
      nationalId: buyer.national_id!
    })),
    usersByEmail: new Map(buyers.rows.map((buyer) => [buyer.email, { id: buyer.id, nationalId: buyer.national_id! }])),
    unitsByName: new Map(units.rows.map((unit) => [unit.name, { id: unit.id }])),
    adminsByUnitName: new Map(admins.rows.map((admin) => [admin.unit_name, { id: admin.id }]))
  };
}

async function preflight(client: Client, context: Context) {
  const userIds = context.buyers.map((buyer) => buyer.id);
  const foreignViolations = await client.query(`select id from pelanggaran_user where user_id=any($1::text[]) and not (id=any($2::text[])) limit 1`, [userIds, violationIds]);
  const foreignBlacklists = await client.query(`select id from blacklist where user_id=any($1::text[]) and not (id=any($2::text[])) limit 1`, [userIds, blacklistIds]);
  const openTransactions = await client.query(`select id from transaksi where user_id=any($1::text[]) and status not in ('gagal','lunas','selesai') and not (id=any($2::text[])) limit 1`, [userIds, transactionIds]);
  const activeBids = await client.query(`select bid.id from bids bid join pemasaran p on p.id=bid.pemasaran_id where bid.user_id=any($1::text[]) and p.status='aktif' and not (p.id=any($2::text[])) limit 1`, [userIds, marketingIds]);
  const collisions = await client.query(
    `select id from barang where id=any($1::text[]) or code=any($2::text[])
     union all select id from pemasaran where id=any($3::text[])
     union all select id from transaksi where id=any($4::text[])
     union all select id from pelanggaran_user where id=any($5::text[])
     union all select id from blacklist where id=any($6::text[]) limit 1`,
    [itemIds, FOUR_BUYER_ACTIVE_VIOLATION_SCENARIO.map((entry) => entry.itemCode), marketingIds, transactionIds, violationIds, blacklistIds]
  );
  if (foreignViolations.rows.length) throw new Error("Preflight gagal: pelanggaran asing pada buyer target.");
  if (foreignBlacklists.rows.length) throw new Error("Preflight gagal: blacklist asing pada buyer target.");
  if (openTransactions.rows.length) throw new Error("Preflight gagal: transaksi aktif pada buyer target.");
  if (activeBids.rows.length) throw new Error("Preflight gagal: bid aktif pada buyer target.");
  if (collisions.rows.length) throw new Error("Preflight gagal: ID atau kode barang skenario sudah dipakai data lain.");
}

async function applyRows(client: Client, context: FourBuyerActiveViolationSeedContext) {
  const rows = buildFourBuyerActiveViolationSeedRows(context);
  await client.query(`delete from blacklist where id=any($1::text[])`, [blacklistIds]);
  await client.query(`delete from barang where id=any($1::text[])`, [itemIds]);
  await insertRows(client, "barang", [["id","id"],["unit_id","unitId"],["code","code"],["name","name"],["category","category"],["condition","condition"],["description","description"],["specifications","specifications"],["appraisal_value","appraisalValue"],["owner_name","ownerName"],["customer_number","customerNumber"],["pawned_at","pawnedAt"],["due_date","dueDate"],["status","status"],["created_by_user_id","createdByUserId"],["created_at","createdAt"],["updated_at","updatedAt"]], rows.barang);
  await insertRows(client, "media_barang", [["id","id"],["barang_id","barangId"],["type","type"],["url","url"],["file_name","fileName"],["size_bytes","sizeBytes"],["sort_order","sortOrder"],["created_at","createdAt"]], rows.mediaBarang);
  await insertRows(client, "pemasaran", [["id","id"],["barang_id","barangId"],["mode","mode"],["base_price","basePrice"],["duration_days","durationDays"],["duration_seconds","durationSeconds"],["starts_at","startsAt"],["ends_at","endsAt"],["winner_id","winnerId"],["final_price","finalPrice"],["iteration","iteration"],["status","status"],["created_by_user_id","createdByUserId"],["created_at","createdAt"],["updated_at","updatedAt"]], rows.pemasaran);
  await insertRows(client, "bids", [["id","id"],["pemasaran_id","pemasaranId"],["user_id","userId"],["nominal","nominal"],["created_at","createdAt"]], rows.bids);
  await insertRows(client, "transaksi", [["id","id"],["pemasaran_id","pemasaranId"],["user_id","userId"],["type","type"],["amount","amount"],["payment_method","paymentMethod"],["status","status"],["payment_deadline","paymentDeadline"],["created_at","createdAt"],["updated_at","updatedAt"]], rows.transaksi);
  await insertRows(client, "pelanggaran_user", [["id","id"],["user_id","userId"],["pemasaran_id","pemasaranId"],["transaksi_id","transaksiId"],["unit_id","unitId"],["note","note"],["escalation_eligible","escalationEligible"],["created_at","createdAt"],["updated_at","updatedAt"]], rows.pelanggaranUser);
  await insertRows(client, "riwayat_status_barang", [["id","id"],["barang_id","barangId"],["old_status","oldStatus"],["new_status","newStatus"],["changed_by_user_id","changedByUserId"],["note","note"],["created_at","createdAt"]], rows.riwayatStatusBarang);
  await insertRows(client, "blacklist", [["id","id"],["unit_id","unitId"],["user_id","userId"],["national_id","nationalId"],["total_violations","totalViolations"],["is_active","isActive"],["blocked_at","blockedAt"],["blocked_until","blockedUntil"],["updated_at","updatedAt"]], rows.blacklists);
  await insertRows(client, "blacklist_action_log", [["id","id"],["blacklist_id","blacklistId"],["target_user_id","targetUserId"],["action","action"],["note","note"],["created_at","createdAt"]], rows.blacklistActionLogs);
}

async function audit(client: Client) {
  const items = await client.query<{ count: string }>(`select count(*)::text as count from barang where id=any($1::text[])`, [itemIds]);
  const marketing = await client.query<{ count: string }>(`select count(*)::text as count from pemasaran where id=any($1::text[]) and iteration=1 and status='gagal'`, [marketingIds]);
  const bids = await client.query<{ count: string }>(`select count(*)::text as count from bids where pemasaran_id=any($1::text[])`, [marketingIds]);
  const violations = await client.query<{ count: string }>(`select count(*)::text as count from pelanggaran_user where id=any($1::text[]) and escalation_eligible=true`, [violationIds]);
  const history = await client.query<{ count: string }>(`select count(*)::text as count from riwayat_status_barang where barang_id=any($1::text[])`, [itemIds]);
  const restrictions = await client.query<{ blocked_until: Date; email: string; is_active: boolean; total_violations: number; unit_name: string }>(
    `select lower(u.email) as email, bl.total_violations, bl.is_active, bl.blocked_until, un.name as unit_name
     from blacklist bl join "user" u on u.id=bl.user_id join units un on un.id=bl.unit_id
     where bl.id=any($1::text[])`,
    [blacklistIds]
  );
  const counts = [
    [items, 3, "barang"], [marketing, 3, "pemasaran"], [bids, 9, "bid"],
    [violations, 3, "pelanggaran"], [history, 12, "riwayat barang"]
  ] as const;
  for (const [result, expected, label] of counts) {
    if (Number(result.rows[0]?.count) !== expected) throw new Error(`Audit ${label} gagal.`);
  }
  for (const expected of getFourBuyerActiveRestrictions()) {
    const actual = restrictions.rows.find((row) => row.email === expected.buyerEmail);
    if (!actual || actual.total_violations !== 1 || !actual.is_active || actual.unit_name !== expected.unitName || actual.blocked_until.getTime() !== expected.blockedUntil.getTime()) {
      throw new Error(`Audit pembatasan ${expected.buyerEmail} gagal.`);
    }
  }
  return { items: 3, bids: 9, violations: 3, restrictions: restrictions.rows };
}

async function main() {
  validateFourBuyerActiveViolationScenario();
  await verifyMedia();
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query("begin");
    await client.query("set local lock_timeout='5s'");
    await client.query("set local statement_timeout='60s'");
    await client.query("select pg_advisory_xact_lock(hashtext('four-buyer-active-violation-scenario-2026-08-07'))");
    const context = await loadContext(client);
    await preflight(client, context);
    await applyRows(client, context);
    const result = await audit(client);
    if (apply) {
      await client.query("commit");
      console.log("[four-buyer-active-violation-scenario] production applied and audited.");
    } else {
      await client.query("rollback");
      console.log("[four-buyer-active-violation-scenario] dry-run passed; no data was written.");
    }
    console.log(JSON.stringify(result, null, 2));
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
