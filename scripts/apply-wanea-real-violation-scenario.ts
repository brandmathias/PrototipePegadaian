import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { hashPassword } from "@better-auth/utils/password";
import { config } from "dotenv";
import { Client } from "pg";

import { getBlacklistDurationUnit } from "../lib/blacklist/restrictions";
import {
  WANEA_REAL_BUYER_EMAILS,
  WANEA_REAL_BUYER_IDENTITIES,
  WANEA_REAL_VIOLATION_SCENARIO,
  getWaneaRealExpectedRestrictions,
  validateWaneaRealViolationScenario,
  type WaneaRealBuyerEmail
} from "../lib/blacklist/wanea-real-violation-scenario";
import {
  buildWaneaRealViolationSeedRows,
  type WaneaRealViolationSeedContext
} from "../lib/blacklist/wanea-real-violation-seed";

config({ path: ".env.local", quiet: true });

const connectionString = process.env.DATABASE_URL;
const apply = process.argv.includes("--apply");
const production = process.env.SCENARIO_TARGET === "production";
const itemIds = WANEA_REAL_VIOLATION_SCENARIO.map((entry) => entry.ids.barang);
const marketingIds = WANEA_REAL_VIOLATION_SCENARIO.map((entry) => entry.ids.pemasaran);
const transactionIds = WANEA_REAL_VIOLATION_SCENARIO.map((entry) => entry.ids.transaksi);
const violationIds = WANEA_REAL_VIOLATION_SCENARIO.map((entry) => entry.ids.violation);
const blacklistIds = [
  "9a000000-0000-4000-8000-000000000101",
  "9a000000-0000-4000-8000-000000000102"
];

if (!connectionString) throw new Error("DATABASE_URL belum diatur.");
if (apply && !production) throw new Error("Penerapan ditolak. Set SCENARIO_TARGET=production secara eksplisit.");
if (production && getBlacklistDurationUnit() !== "days") throw new Error("Production harus memakai BLACKLIST_DURATION_UNIT=days.");

type ExistingBuyer = {
  email: WaneaRealBuyerEmail;
  id: string;
  nationalId: string;
};

type ScenarioContext = Omit<WaneaRealViolationSeedContext, "usersByEmail"> & {
  missingBuyerEmails: WaneaRealBuyerEmail[];
  usersByEmail: Map<string, ExistingBuyer>;
};

function requireRows<T>(rows: T[], expected: number, label: string) {
  if (rows.length !== expected) throw new Error(`${label} tidak sesuai: ${rows.length}/${expected}.`);
}

function required<T>(value: T | undefined, label: string): T {
  if (!value) throw new Error(`${label} tidak ditemukan.`);
  return value;
}

function parsePasswords() {
  const raw = process.env.WANEA_SCENARIO_PASSWORDS_JSON;
  if (!raw) throw new Error("WANEA_SCENARIO_PASSWORDS_JSON wajib diisi hanya saat membuat akun baru.");
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error("WANEA_SCENARIO_PASSWORDS_JSON harus berupa JSON valid.");
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("WANEA_SCENARIO_PASSWORDS_JSON harus berupa object email-password.");
  }
  const passwords = value as Record<string, unknown>;
  for (const email of WANEA_REAL_BUYER_EMAILS) {
    if (typeof passwords[email] !== "string" || passwords[email].length < 8) {
      throw new Error(`Password awal ${email} tidak valid.`);
    }
  }
  return passwords as Record<WaneaRealBuyerEmail, string>;
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
  await Promise.all(WANEA_REAL_VIOLATION_SCENARIO.map(async (entry) => {
    const file = resolve(process.cwd(), "public", entry.media.publicPath.replace(/^\//, ""));
    const data = await readFile(file);
    if (data.length !== entry.media.sizeBytes || data.subarray(0, 4).toString("ascii") !== "RIFF" || data.subarray(8, 12).toString("ascii") !== "WEBP") {
      throw new Error(`Media ${entry.itemName} tidak valid.`);
    }
  }));
}

async function loadContext(client: Client): Promise<ScenarioContext> {
  const identityRows = await client.query<{
    email: string;
    id: string;
    is_active: boolean;
    name: string;
    national_id: string | null;
    phone_number: string | null;
    role: string;
  }>(
    `select id, lower(email) as email, name, national_id, phone_number, role, is_active
     from "user"
     where lower(email) = any($1::text[]) or national_id = any($2::text[])`,
    [[...WANEA_REAL_BUYER_EMAILS], WANEA_REAL_BUYER_EMAILS.map((email) => WANEA_REAL_BUYER_IDENTITIES[email].nationalId)]
  );
  const usersByEmail = new Map<string, ExistingBuyer>();
  const missingBuyerEmails: WaneaRealBuyerEmail[] = [];

  for (const email of WANEA_REAL_BUYER_EMAILS) {
    const identity = WANEA_REAL_BUYER_IDENTITIES[email];
    const matches = identityRows.rows.filter((row) => row.email === email || row.national_id === identity.nationalId);
    if (!matches.length) {
      missingBuyerEmails.push(email);
      continue;
    }
    requireRows(matches, 1, `Benturan identitas ${email}`);
    const row = matches[0]!;
    if (row.email !== email || row.name !== identity.name || row.national_id !== identity.nationalId || row.phone_number !== identity.phoneNumber || row.role !== "buyer" || !row.is_active) {
      throw new Error(`Identitas buyer ${email} tidak cocok atau tidak aktif.`);
    }
    usersByEmail.set(email, { id: row.id, email, nationalId: identity.nationalId });
  }

  const existingIds = [...usersByEmail.values()].map((buyer) => buyer.id);
  if (existingIds.length) {
    const [accounts, profiles] = await Promise.all([
      client.query<{ user_id: string }>(`select user_id from "account" where user_id=any($1::text[]) and provider_id='credential' and password is not null`, [existingIds]),
      client.query<{ email: string; full_name: string; national_id: string; phone_number: string; user_id: string }>(`select user_id, lower(email) as email, full_name, national_id, phone_number from buyer_profile where user_id=any($1::text[])`, [existingIds])
    ]);
    requireRows(accounts.rows, existingIds.length, "Akun credential buyer");
    requireRows(profiles.rows, existingIds.length, "Profil buyer");
    for (const buyer of usersByEmail.values()) {
      const identity = WANEA_REAL_BUYER_IDENTITIES[buyer.email];
      const profile = required(profiles.rows.find((row) => row.user_id === buyer.id), `Profil ${buyer.email}`);
      if (profile.email !== buyer.email || profile.full_name !== identity.name || profile.national_id !== identity.nationalId || profile.phone_number !== identity.phoneNumber) {
        throw new Error(`Profil buyer ${buyer.email} tidak cocok.`);
      }
    }
  }

  const [unitResult, adminResult] = await Promise.all([
    client.query<{ id: string }>(`select id from units where name='UPC Wanea' and is_active=true`),
    client.query<{ id: string }>(`select u.id from "user" u join units un on un.id=u.unit_id where u.role='admin_unit' and u.is_active=true and un.name='UPC Wanea' and un.is_active=true order by u.created_at asc limit 1`)
  ]);
  requireRows(unitResult.rows, 1, "UPC Wanea aktif");
  requireRows(adminResult.rows, 1, "Admin UPC Wanea aktif");

  return {
    usersByEmail,
    missingBuyerEmails,
    unit: unitResult.rows[0]!,
    admin: adminResult.rows[0]!
  };
}

async function preflight(client: Client, context: ScenarioContext) {
  const userIds = [...context.usersByEmail.values()].map((buyer) => buyer.id);
  if (userIds.length) {
    const [foreignViolations, foreignBlacklists, openTransactions, activeBids] = await Promise.all([
      client.query(`select id from pelanggaran_user where user_id=any($1::text[]) and not (id=any($2::text[])) limit 1`, [userIds, violationIds]),
      client.query(`select id from blacklist where user_id=any($1::text[]) and not (id=any($2::text[])) limit 1`, [userIds, blacklistIds]),
      client.query(`select id from transaksi where user_id=any($1::text[]) and status not in ('gagal','lunas','selesai') and not (id=any($2::text[])) limit 1`, [userIds, transactionIds]),
      client.query(`select bid.id from bids bid join pemasaran p on p.id=bid.pemasaran_id where bid.user_id=any($1::text[]) and p.status='aktif' and not (p.id=any($2::text[])) limit 1`, [userIds, marketingIds])
    ]);
    if (foreignViolations.rows.length) throw new Error("Preflight gagal: pelanggaran asing pada buyer target.");
    if (foreignBlacklists.rows.length) throw new Error("Preflight gagal: blacklist asing pada buyer target.");
    if (openTransactions.rows.length) throw new Error("Preflight gagal: transaksi aktif pada buyer target.");
    if (activeBids.rows.length) throw new Error("Preflight gagal: bid aktif pada buyer target.");
  }

  const collisions = await client.query(
    `select id from barang where id=any($1::text[]) and not (id=any($2::text[]))
     union all select id from blacklist where id=any($3::text[]) and not (id=any($4::text[]))
     union all select id from barang where code=any($5::text[]) and not (id=any($2::text[])) limit 1`,
    [itemIds, itemIds, blacklistIds, blacklistIds, WANEA_REAL_VIOLATION_SCENARIO.map((entry) => entry.itemCode)]
  );
  if (collisions.rows.length) throw new Error("Preflight gagal: ID atau kode barang skenario sudah dipakai data lain.");
}

async function createMissingBuyers(client: Client, context: ScenarioContext) {
  if (!context.missingBuyerEmails.length) return;
  const passwords = parsePasswords();
  for (const email of context.missingBuyerEmails) {
    const identity = WANEA_REAL_BUYER_IDENTITIES[email];
    const id = randomUUID();
    const passwordHash = await hashPassword(passwords[email]);
    await client.query(`insert into "user" (id,name,email,role,phone_number,national_id,is_active) values ($1,$2,$3,'buyer',$4,$5,true)`, [id, identity.name, email, identity.phoneNumber, identity.nationalId]);
    await client.query(`insert into "account" (id,account_id,provider_id,user_id,password) values ($1,$2,'credential',$2,$3)`, [randomUUID(), id, passwordHash]);
    await client.query(`insert into buyer_profile (id,user_id,full_name,email,phone_number,national_id,status) values ($1,$2,$3,$4,$5,$6,'active')`, [randomUUID(), id, identity.name, email, identity.phoneNumber, identity.nationalId]);
    context.usersByEmail.set(email, { id, email, nationalId: identity.nationalId });
  }
}

async function applyRows(client: Client, context: WaneaRealViolationSeedContext) {
  const rows = buildWaneaRealViolationSeedRows(context);
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
  return rows;
}

async function audit(client: Client, context: ScenarioContext) {
  const users = [...context.usersByEmail.values()];
  requireRows(users, WANEA_REAL_BUYER_EMAILS.length, "Akun buyer skenario");
  const [profiles, itemCount, marketingCount, bidCount, violationCount, restrictions, history, finalAuctionBids] = await Promise.all([
    client.query(`select user_id from buyer_profile where user_id=any($1::text[])`, [users.map((user) => user.id)]),
    client.query<{ count: string }>(`select count(*)::text as count from barang where id=any($1::text[])`, [itemIds]),
    client.query<{ count: string }>(`select count(*)::text as count from pemasaran where id=any($1::text[])`, [marketingIds]),
    client.query<{ count: string }>(`select count(*)::text as count from bids where pemasaran_id=any($1::text[])`, [marketingIds]),
    client.query<{ count: string }>(`select count(*)::text as count from pelanggaran_user where id=any($1::text[])`, [violationIds]),
    client.query<{ email: string; total_violations: number; unit_name: string; blocked_until: Date }>(`select lower(u.email) email, bl.total_violations, un.name unit_name, bl.blocked_until from blacklist bl join "user" u on u.id=bl.user_id join units un on un.id=bl.unit_id where bl.id=any($1::text[])`, [blacklistIds]),
    client.query<{ count: string }>(`select count(*)::text as count from riwayat_status_barang where barang_id=any($1::text[])`, [itemIds]),
    client.query<{ count: string }>(`select count(*)::text as count from bids where pemasaran_id=$1 and user_id=$2`, [WANEA_REAL_VIOLATION_SCENARIO[2]!.ids.pemasaran, users.find((user) => user.email === "rendra@gmail.com")!.id])
  ]);
  requireRows(profiles.rows, WANEA_REAL_BUYER_EMAILS.length, "Profil buyer skenario");
  if (Number(itemCount.rows[0]?.count) !== itemIds.length) throw new Error("Audit jumlah barang gagal.");
  if (Number(marketingCount.rows[0]?.count) !== marketingIds.length) throw new Error("Audit jumlah pemasaran gagal.");
  if (Number(bidCount.rows[0]?.count) !== 14) throw new Error("Audit jumlah bid gagal.");
  if (Number(violationCount.rows[0]?.count) !== violationIds.length) throw new Error("Audit jumlah pelanggaran gagal.");
  if (Number(history.rows[0]?.count) !== 12) throw new Error("Audit riwayat status barang gagal.");
  if (Number(finalAuctionBids.rows[0]?.count) !== 0) throw new Error("Audit peserta gagal: Rendra masuk lelang setelah Level 2.");
  for (const expected of getWaneaRealExpectedRestrictions()) {
    const actual = restrictions.rows.find((row) => row.email === expected.buyerEmail);
    if (
      !actual ||
      actual.total_violations !== expected.level ||
      actual.unit_name !== expected.unitName ||
      new Date(actual.blocked_until).getTime() !== expected.blockedUntil.getTime()
    ) {
      throw new Error(`Audit pembatasan ${expected.buyerEmail} gagal.`);
    }
  }
  return { accounts: users.length, items: itemIds.length, bids: 14, violations: violationIds.length, restrictions: restrictions.rows };
}

async function main() {
  validateWaneaRealViolationScenario();
  await verifyMedia();
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query("begin");
    await client.query("set local lock_timeout='5s'");
    await client.query("set local statement_timeout='60s'");
    await client.query("select pg_advisory_xact_lock(hashtext('wanea-real-violation-scenario-2026-07-27'))");
    const context = await loadContext(client);
    await preflight(client, context);
    await createMissingBuyers(client, context);
    await applyRows(client, context);
    const result = await audit(client, context);
    if (apply) {
      await client.query("commit");
      console.log("[wanea-real-violation-scenario] production applied and audited.");
    } else {
      await client.query("rollback");
      console.log("[wanea-real-violation-scenario] dry-run passed; no data was written.");
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
