import { randomUUID } from "node:crypto";

import { hashPassword } from "@better-auth/utils/password";
import { config } from "dotenv";
import { Pool, type PoolClient } from "pg";

config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL belum diatur di .env.local.");
}

const pool = new Pool({ connectionString });
const DAY_MS = 86_400_000;

const durations: Record<number, number> = {
  1: 7,
  2: 30,
  3: 365,
};

const mediaUrls = [
  "/uploads/barang/1777649584512-2ab74656-b968-4f9d-817a-5e9f6007c4ab-pexels-the-glorious-studio-3584518-10976653.jpg",
  "/uploads/barang/1777649584530-c45e0c41-c36e-46d8-ae12-db682704423a-pexels-kaderdygnn-15871491.jpg",
  "/uploads/barang/1778623065018-6cad2f9f-45d0-48c9-a664-65f9a0d93cb5-pexels-mikebirdy-18379620.jpg",
];

const testPasswords: Record<string, string> = {
  "level1-expired": "BlacklistL1Aktif!2026",
  "level2-active": "BlacklistL2Aktif!2026",
  "level3-review": "BlacklistL3Review!2026",
};

type Scenario = {
  category: string;
  condition: string;
  email: string;
  itemName: string;
  key: string;
  level: 1 | 2 | 3;
  name: string;
  nationalId: string;
  phone: string;
  status: "active" | "expired";
};

const scenarios: Scenario[] = [
  {
    category: "emas",
    condition: "baik",
    email: "uji.blacklist.level1.expired@example.com",
    itemName: "Kalung Emas Uji Level 1",
    key: "level1-expired",
    level: 1,
    name: "Uji Blacklist Level 1 Aktif",
    nationalId: "7371122605010001",
    phone: "6282112605001",
    status: "active",
  },
  {
    category: "elektronik",
    condition: "baik",
    email: "uji.blacklist.level2.aktif@example.com",
    itemName: "Laptop Premium Uji Level 2",
    key: "level2-active",
    level: 2,
    name: "Uji Blacklist Level 2 Aktif",
    nationalId: "7371122605010002",
    phone: "6282112605002",
    status: "active",
  },
  {
    category: "kendaraan",
    condition: "baik",
    email: "uji.blacklist.level3.review@example.com",
    itemName: "Motor Touring Uji Level 3",
    key: "level3-review",
    level: 3,
    name: "Uji Blacklist Level 3 Review",
    nationalId: "7371122605010003",
    phone: "6282112605003",
    status: "active",
  },
];

function offsetDate(base: Date, days: number) {
  return new Date(base.getTime() + days * DAY_MS);
}

function iso(date: Date) {
  return date.toISOString();
}

async function getRanotanaUnitId() {
  const result = await pool.query<{ id: string }>(
    `select id from units where name = 'UPC Ranotana' order by created_at desc limit 1`,
  );

  if (result.rows[0]?.id) return result.rows[0].id;

  const fallback = await pool.query<{ id: string }>(
    `select id from units where is_active = true order by created_at desc limit 1`,
  );

  if (!fallback.rows[0]?.id) {
    throw new Error("Unit aktif tidak ditemukan untuk memasukkan data uji.");
  }

  return fallback.rows[0].id;
}

async function getAdminUserId(unitId: string) {
  const result = await pool.query<{ id: string }>(
    `select id from "user" where role = 'admin_unit' and unit_id = $1 order by created_at desc limit 1`,
    [unitId],
  );

  if (result.rows[0]?.id) return result.rows[0].id;

  const fallback = await pool.query<{ id: string }>(
    `select id from "user" order by created_at asc limit 1`,
  );

  if (!fallback.rows[0]?.id) {
    throw new Error("User pembuat data tidak ditemukan.");
  }

  return fallback.rows[0].id;
}

async function upsertScenario(
  client: PoolClient,
  unitId: string,
  adminId: string,
  scenario: Scenario,
) {
  const now = new Date();
  const latestIncident =
    scenario.status === "expired" ? offsetDate(now, -8) : offsetDate(now, -1);
  const blockedAt = latestIncident;
  const blockedUntil = offsetDate(blockedAt, durations[scenario.level]);
  const isActive =
    scenario.status === "active" && blockedUntil.getTime() > now.getTime();
  const userId = `seed-${scenario.key}-user`;
  const profileId = `seed-${scenario.key}-profile`;
  const blacklistId = `seed-${scenario.key}-blacklist`;
  const credentialId = `seed-${scenario.key}-credential`;
  const passwordHash = await hashPassword(testPasswords[scenario.key]);
  const amountBase = scenario.level === 1 ? 12_500_000 : scenario.level === 2 ? 27_500_000 : 165_000_000;
  const appraisalBase = Math.round(amountBase * 1.18);
  const basePrice = Math.round(amountBase * 0.82);

  await client.query(
    `
      insert into "user" (id, name, email, email_verified, role, phone_number, national_id, is_active, created_at, updated_at)
      values ($1, $2, $3, false, 'buyer', $4, $5, $6, $7, $7)
      on conflict (id) do update set
        name = excluded.name,
        email = excluded.email,
        phone_number = excluded.phone_number,
        national_id = excluded.national_id,
        is_active = excluded.is_active,
        updated_at = excluded.updated_at
    `,
    [
      userId,
      scenario.name,
      scenario.email,
      scenario.phone,
      scenario.nationalId,
      scenario.level < 3,
      iso(now),
    ],
  );

  await client.query(
    `
      insert into account (
        id, account_id, provider_id, user_id, password, created_at, updated_at
      )
      values ($1, $2, 'credential', $2, $3, $4, $4)
      on conflict (provider_id, account_id) do update set
        password = excluded.password,
        updated_at = excluded.updated_at
    `,
    [credentialId, userId, passwordHash, iso(now)],
  );

  await client.query(
    `
      insert into buyer_profile (id, user_id, full_name, email, phone_number, national_id, status, created_at, updated_at)
      values ($1, $2, $3, $4, $5, $6, 'active', $7, $7)
      on conflict (id) do update set
        full_name = excluded.full_name,
        email = excluded.email,
        phone_number = excluded.phone_number,
        national_id = excluded.national_id,
        updated_at = excluded.updated_at
    `,
    [
      profileId,
      userId,
      scenario.name,
      scenario.email,
      scenario.phone,
      scenario.nationalId,
      iso(now),
    ],
  );

  for (let index = 0; index < scenario.level; index += 1) {
    const sequence = index + 1;
    const incidentDate =
      sequence === scenario.level
        ? latestIncident
        : offsetDate(latestIncident, -10 * (scenario.level - sequence));
    const itemId = `seed-${scenario.key}-barang-${sequence}`;
    const marketingId = `seed-${scenario.key}-pemasaran-${sequence}`;
    const transactionId = `seed-${scenario.key}-trx-${sequence}`;
    const violationId = `seed-${scenario.key}-violation-${sequence}`;
    const mediaId = `seed-${scenario.key}-media-${sequence}`;
    const suffix = scenario.level === sequence ? scenario.itemName : `${scenario.itemName} ${sequence}`;
    const code = `BRG-UJI-L${scenario.level}-${sequence}`;

    await client.query(
      `
        insert into barang (
          id, unit_id, code, name, category, condition, description,
          appraisal_value, loan_value, owner_name, customer_number,
          pawned_at, due_date, status, created_by_user_id, created_at, updated_at
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'gagal', $14, $15, $15)
        on conflict (id) do update set
          code = excluded.code,
          name = excluded.name,
          category = excluded.category,
          condition = excluded.condition,
          description = excluded.description,
          appraisal_value = excluded.appraisal_value,
          loan_value = excluded.loan_value,
          owner_name = excluded.owner_name,
          customer_number = excluded.customer_number,
          status = excluded.status,
          updated_at = excluded.updated_at
      `,
      [
        itemId,
        unitId,
        code,
        suffix,
        scenario.category,
        scenario.condition,
        `Data uji blacklist level ${scenario.level} untuk validasi aturan pembatasan lelang.`,
        appraisalBase + sequence * 150_000,
        Math.round(appraisalBase * 0.72),
        scenario.name,
        `NSB-UJI-L${scenario.level}-${sequence}`,
        iso(offsetDate(incidentDate, -45)),
        iso(offsetDate(incidentDate, 30)),
        adminId,
        iso(incidentDate),
      ],
    );

    await client.query(
      `
        insert into media_barang (id, barang_id, type, url, file_name, size_bytes, sort_order, created_at)
        values ($1, $2, 'foto', $3, $4, 120000, 0, $5)
        on conflict (id) do update set
          barang_id = excluded.barang_id,
          url = excluded.url,
          file_name = excluded.file_name,
          sort_order = excluded.sort_order
      `,
      [
        mediaId,
        itemId,
        mediaUrls[index % mediaUrls.length],
        `uji-blacklist-level-${scenario.level}-${sequence}.jpg`,
        iso(incidentDate),
      ],
    );

    await client.query(
      `
        insert into pemasaran (
          id, barang_id, mode, price, base_price, duration_days,
          starts_at, ends_at, reveal_ends_at, winner_id, final_price,
          iteration, status, created_by_user_id, created_at, updated_at
        )
        values ($1, $2, 'vickrey', null, $3, 3, $4, $5, $6, $7, $8, 1, 'gagal', $9, $4, $5)
        on conflict (id) do update set
          base_price = excluded.base_price,
          winner_id = excluded.winner_id,
          final_price = excluded.final_price,
          status = excluded.status,
          updated_at = excluded.updated_at
      `,
      [
        marketingId,
        itemId,
        basePrice + sequence * 100_000,
        iso(offsetDate(incidentDate, -4)),
        iso(offsetDate(incidentDate, -1)),
        iso(incidentDate),
        userId,
        amountBase + sequence * 250_000,
        adminId,
      ],
    );

    await client.query(
      `
        insert into transaksi (
          id, pemasaran_id, user_id, type, amount, payment_method, status,
          payment_deadline, created_at, updated_at
        )
        values ($1, $2, $3, 'vickrey', $4, 'langsung', 'gagal', $5, $6, $6)
        on conflict (id) do update set
          amount = excluded.amount,
          status = excluded.status,
          payment_deadline = excluded.payment_deadline,
          updated_at = excluded.updated_at
      `,
      [
        transactionId,
        marketingId,
        userId,
        amountBase + sequence * 250_000,
        iso(incidentDate),
        iso(offsetDate(incidentDate, -1)),
      ],
    );

    await client.query(
      `
        insert into pelanggaran_user (id, user_id, pemasaran_id, transaksi_id, unit_id, note, created_at)
        values ($1, $2, $3, $4, $5, 'Pemenang lelang tidak menyelesaikan pembayaran sampai batas waktu.', $6)
        on conflict (id) do update set
          note = excluded.note,
          created_at = excluded.created_at
      `,
      [violationId, userId, marketingId, transactionId, unitId, iso(incidentDate)],
    );
  }

  await client.query(
    `
      insert into blacklist (
        id, unit_id, user_id, national_id, total_violations, is_active,
        blocked_at, blocked_until, revoke_reason, updated_at
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      on conflict (id) do update set
        unit_id = excluded.unit_id,
        national_id = excluded.national_id,
        total_violations = excluded.total_violations,
        is_active = excluded.is_active,
        blocked_at = excluded.blocked_at,
        blocked_until = excluded.blocked_until,
        revoke_reason = excluded.revoke_reason,
        updated_at = excluded.updated_at
    `,
    [
      blacklistId,
      unitId,
      userId,
      scenario.nationalId,
      scenario.level,
      isActive,
      iso(blockedAt),
      iso(blockedUntil),
      isActive ? null : "Masa pembatasan level 1 sudah berakhir.",
      iso(now),
    ],
  );

  await client.query(
    `
      insert into blacklist_action_log (
        id, blacklist_id, target_user_id, action, performed_by_type,
        performed_by_user_id, note, created_at
      )
      values ($1, $2, $3, $4, 'system', null, $5, $6)
      on conflict (id) do update set
        action = excluded.action,
        note = excluded.note,
        created_at = excluded.created_at
    `,
    [
      `seed-${scenario.key}-blacklist-log`,
      blacklistId,
      userId,
      isActive ? "blokir_otomatis" : "selesai_otomatis",
      isActive
        ? `Data uji Level ${scenario.level}: pembatasan masih aktif.`
        : "Data uji Level 1: masa pembatasan 7 hari sudah selesai.",
      iso(now),
    ],
  );

  return {
    blockedUntil: blockedUntil.toISOString().slice(0, 10),
    email: scenario.email,
    level: scenario.level,
    name: scenario.name,
    status: isActive ? "AKTIF" : "TIDAK_AKTIF",
    userId,
  };
}

async function main() {
  const unitId = await getRanotanaUnitId();
  const adminId = await getAdminUserId(unitId);
  const client = await pool.connect();

  try {
    await client.query("begin");
    const result = [];

    for (const scenario of scenarios) {
      result.push(await upsertScenario(client, unitId, adminId, scenario));
    }

    await client.query("commit");
    console.table(result);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
