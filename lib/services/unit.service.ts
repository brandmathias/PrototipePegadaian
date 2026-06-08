import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "@/lib/db/client";
import { barang, pemasaran, transaksi, unitAccounts, units, users } from "@/lib/db/schema";
import { getAdminBarangById, listAdminBarangHistory } from "@/lib/services/admin-barang.service";
import { getAdminPemasaranById } from "@/lib/services/admin-pemasaran.service";
import { serializeUnitAccount, serializeUnitListItem } from "@/lib/superadmin/serializers";
import { validateManagedUnitCreatePayload, validateUnitPayload } from "@/lib/superadmin/validation";

function getUnitStatus(unit: { isActive: boolean }, activeAccountCount: number, adminCount: number) {
  if (!unit.isActive) {
    return "Nonaktif";
  }

  if (activeAccountCount === 0 || adminCount === 0) {
    return "Perlu Review";
  }

  return "Aktif";
}

function toNumber(value: string | number | null | undefined) {
  return Number(value ?? 0);
}

function formatUnitMarketingMode(value: string | null | undefined) {
  if (!value) {
    return "Belum dipasarkan";
  }

  if (value === "vickrey") {
    return "Lelang Tertutup";
  }

  if (value === "fixed_price") {
    return "Harga Tetap";
  }

  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((segment) => `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`)
    .join(" ");
}

export function resolveUnitMarketingModeLabel(input: {
  activeMarketingMode?: string | null;
  itemStatus?: string | null;
  latestMarketingMode?: string | null;
  latestMarketingStatus?: string | null;
  transactionStatus?: string | null;
  transactionType?: string | null;
}) {
  const resolvedMode =
    input.activeMarketingMode ?? input.transactionType ?? input.latestMarketingMode;

  if (resolvedMode) {
    return formatUnitMarketingMode(resolvedMode);
  }

  const itemStatus = String(input.itemStatus ?? "").toLowerCase();
  const latestMarketingStatus = String(input.latestMarketingStatus ?? "").toLowerCase();
  const transactionStatus = String(input.transactionStatus ?? "").toLowerCase();
  const hasHistoricOutcome =
    ["terjual", "gagal", "menunggu_pembayaran"].includes(itemStatus) ||
    ["selesai", "gagal", "menunggu_pembayaran"].includes(latestMarketingStatus) ||
    transactionStatus.length > 0;

  return hasHistoricOutcome ? "Mode tidak tercatat" : "Belum dipasarkan";
}

function formatUnitOperationalStatusLabel(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((segment) => `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`)
    .join(" ");
}

export function getUnitItemOperationalState(input: {
  itemStatus: string;
  activeMarketingMode?: string | null;
  activeMarketingStatus?: string | null;
  dueDate?: Date | null;
  latestMarketingStatus?: string | null;
  now?: Date;
  transactionStatus?: string | null;
}): {
  operationalStatus: string;
  operationalTone: "amber" | "blue" | "emerald" | "red" | "slate";
} {
  const itemStatus = input.itemStatus.toLowerCase();
  const activeMarketingMode = String(input.activeMarketingMode ?? "").toLowerCase();
  const activeMarketingStatus = String(input.activeMarketingStatus ?? "").toLowerCase();
  const latestMarketingStatus = String(input.latestMarketingStatus ?? "").toLowerCase();
  const transactionStatus = String(input.transactionStatus ?? "").toLowerCase();
  const now = input.now ?? new Date();
  const dueDate = input.dueDate ?? null;
  const isCollateralStatus = itemStatus === "gadai" || itemStatus === "jaminan";
  const isBeforeDueDate = dueDate ? dueDate.getTime() > now.getTime() : false;

  if (itemStatus === "terjual" || transactionStatus === "lunas" || transactionStatus === "selesai") {
    return { operationalStatus: "Terjual", operationalTone: "slate" };
  }

  if (itemStatus === "gagal" || latestMarketingStatus === "gagal") {
    return { operationalStatus: "Ada Tindak Lanjut", operationalTone: "red" };
  }

  const fixedPriceCatalogLocked =
    activeMarketingMode === "fixed_price" &&
    ["bukti_diunggah", "menunggu_konfirmasi_langsung"].includes(transactionStatus);

  if (itemStatus === "dipasarkan" && activeMarketingStatus === "aktif" && !fixedPriceCatalogLocked) {
    return { operationalStatus: "Sedang Dipasarkan", operationalTone: "blue" };
  }

  if (fixedPriceCatalogLocked) {
    return {
      operationalStatus: formatUnitOperationalStatusLabel(transactionStatus),
      operationalTone: "slate"
    };
  }

  if (transactionStatus === "ditolak_bukti") {
    return { operationalStatus: "Ada Tindak Lanjut", operationalTone: "red" };
  }

  if (isCollateralStatus && isBeforeDueDate) {
    return { operationalStatus: "Barang Jaminan", operationalTone: "amber" };
  }

  if (isCollateralStatus || (itemStatus === "dipasarkan" && !activeMarketingStatus)) {
    return { operationalStatus: "Siap Dipasarkan", operationalTone: "emerald" };
  }

  return {
    operationalStatus: itemStatus
      ? formatUnitOperationalStatusLabel(itemStatus)
      : "Belum Tercatat",
    operationalTone: "slate"
  };
}

export async function listUnits() {
  const unitRows = await db.select().from(units).orderBy(units.name);

  if (unitRows.length === 0) {
    return [];
  }

  const unitIds = unitRows.map((unit) => unit.id);

  const adminCounts = await db
    .select({
      unitId: users.unitId,
      count: sql<number>`count(*)`
    })
    .from(users)
    .where(and(eq(users.role, "admin_unit"), inArray(users.unitId, unitIds), eq(users.isActive, true)))
    .groupBy(users.unitId);

  const accountCounts = await db
    .select({
      unitId: unitAccounts.unitId,
      count: sql<number>`count(*)`
    })
    .from(unitAccounts)
    .where(inArray(unitAccounts.unitId, unitIds))
    .groupBy(unitAccounts.unitId);

  const activeAccounts = await db
    .select()
    .from(unitAccounts)
    .where(and(inArray(unitAccounts.unitId, unitIds), eq(unitAccounts.isActive, true)));

  const adminCountMap = new Map(adminCounts.map((row) => [row.unitId ?? "", Number(row.count)]));
  const accountCountMap = new Map(accountCounts.map((row) => [row.unitId, Number(row.count)]));
  const activeAccountMap = new Map(
    activeAccounts.map((account) => [account.unitId, serializeUnitAccount(account)])
  );

  return unitRows.map((unit) => {
    const adminCount = adminCountMap.get(unit.id) ?? 0;
    const accountCount = accountCountMap.get(unit.id) ?? 0;
    const activeAccount = activeAccountMap.get(unit.id) ?? null;

    return {
      ...serializeUnitListItem({
        id: unit.id,
        code: unit.code,
        name: unit.name,
        address: unit.address,
        isActive: unit.isActive,
        adminCount,
        accountCount,
        activeAccount
      }),
      status: getUnitStatus(unit, activeAccount ? 1 : 0, adminCount)
    };
  });
}

export async function getUnitById(unitId: string) {
  const unitBarang = alias(barang, "unit_detail_barang");
  const outerBarangId = sql.raw('"unit_detail_barang"."id"');
  const [unit] = await db.select().from(units).where(eq(units.id, unitId)).limit(1);

  if (!unit) {
    throw new Error("Unit belum ditemukan.");
  }

  const [adminCountRow] = await db
    .select({
      count: sql<number>`count(*)`
    })
    .from(users)
    .where(and(eq(users.role, "admin_unit"), eq(users.unitId, unitId), eq(users.isActive, true)));

  const accounts = await db
    .select()
    .from(unitAccounts)
    .where(eq(unitAccounts.unitId, unitId))
    .orderBy(desc(unitAccounts.isActive), desc(unitAccounts.createdAt));

  const admins = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phoneNumber,
      status: users.isActive
    })
    .from(users)
    .where(and(eq(users.role, "admin_unit"), eq(users.unitId, unitId)))
    .orderBy(users.name);

  const itemRows = await db
    .select({
      id: unitBarang.id,
      code: unitBarang.code,
      name: unitBarang.name,
      category: unitBarang.category,
      dueDate: unitBarang.dueDate,
      appraisalValue: unitBarang.appraisalValue,
      status: unitBarang.status,
      imageUrl: sql<string | null>`(
        select mb.url
        from media_barang mb
        where mb.barang_id = ${outerBarangId}
          and mb.type = 'foto'
        order by mb.sort_order asc, mb.created_at asc
        limit 1
      )`,
      activeMarketingMode: sql<string | null>`(
        select p.mode
        from pemasaran p
        where p.barang_id = ${outerBarangId}
          and p.status = 'aktif'
        order by p.created_at desc
        limit 1
      )`,
      activeMarketingStatus: sql<string | null>`(
        select p.status
        from pemasaran p
        where p.barang_id = ${outerBarangId}
          and p.status = 'aktif'
        order by p.created_at desc
        limit 1
      )`,
      latestMarketingMode: sql<string | null>`(
        select p.mode
        from pemasaran p
        where p.barang_id = ${outerBarangId}
        order by p.created_at desc
        limit 1
      )`,
      latestMarketingStatus: sql<string | null>`(
        select p.status
        from pemasaran p
        where p.barang_id = ${outerBarangId}
        order by p.created_at desc
        limit 1
      )`,
      transactionType: sql<string | null>`(
        select t.type
        from transaksi t
        inner join pemasaran p on p.id = t.pemasaran_id
        where p.barang_id = ${outerBarangId}
        order by t.created_at desc
        limit 1
      )`,
      transactionStatus: sql<string | null>`(
        select t.status
        from transaksi t
        inner join pemasaran p on p.id = t.pemasaran_id
        where p.barang_id = ${outerBarangId}
        order by t.created_at desc
        limit 1
      )`
    })
    .from(unitBarang)
    .where(eq(unitBarang.unitId, unitId))
    .orderBy(desc(unitBarang.createdAt));

  const activeAccount = accounts.find((account) => account.isActive) ?? null;

  return {
    id: unit.id,
    code: unit.code,
    name: unit.name,
    address: unit.address,
    status: getUnitStatus(unit, activeAccount ? 1 : 0, Number(adminCountRow?.count ?? 0)),
    isActive: unit.isActive,
    adminCount: Number(adminCountRow?.count ?? 0),
    accountCount: accounts.length,
    activeAccount: activeAccount ? serializeUnitAccount(activeAccount) : null,
    accounts: accounts.map(serializeUnitAccount),
    admins: admins.map((admin) => ({
      ...admin,
      phone: admin.phone ?? "-",
      status: admin.status ? "Aktif" : "Nonaktif"
    })),
    items: itemRows.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name,
      category: item.category,
      imageUrl: item.imageUrl,
      marketingModeLabel: resolveUnitMarketingModeLabel({
        activeMarketingMode: item.activeMarketingMode,
        itemStatus: item.status,
        latestMarketingMode: item.latestMarketingMode,
        latestMarketingStatus: item.latestMarketingStatus,
        transactionStatus: item.transactionStatus,
        transactionType: item.transactionType
      }),
      value: toNumber(item.appraisalValue),
      ...getUnitItemOperationalState({
        itemStatus: item.status,
        activeMarketingMode: item.activeMarketingMode,
        activeMarketingStatus: item.activeMarketingStatus,
        dueDate: item.dueDate,
        latestMarketingStatus: item.latestMarketingStatus,
        transactionStatus: item.transactionStatus
      })
    }))
  };
}

export async function getSuperAdminUnitBarangDetail(unitId: string, barangId: string) {
  const [unit] = await db.select().from(units).where(eq(units.id, unitId)).limit(1);

  if (!unit) {
    throw new Error("Unit belum ditemukan.");
  }

  const [rawItem] = await db
    .select({
      id: barang.id,
      status: barang.status,
      dueDate: barang.dueDate
    })
    .from(barang)
    .where(and(eq(barang.id, barangId), eq(barang.unitId, unitId)))
    .limit(1);

  if (!rawItem) {
    throw new Error("Barang tidak ditemukan pada unit ini.");
  }

  const [[adminCountRow], [activeAccount], [activeMarketing], [latestMarketing], [latestTransaction]] = await Promise.all([
    db
      .select({
        count: sql<number>`count(*)`
      })
      .from(users)
      .where(and(eq(users.role, "admin_unit"), eq(users.unitId, unitId), eq(users.isActive, true))),
    db
      .select({
        id: unitAccounts.id
      })
      .from(unitAccounts)
      .where(and(eq(unitAccounts.unitId, unitId), eq(unitAccounts.isActive, true)))
      .limit(1),
    db
      .select({
        id: pemasaran.id,
        mode: pemasaran.mode,
        status: pemasaran.status
      })
      .from(pemasaran)
      .where(and(eq(pemasaran.barangId, barangId), eq(pemasaran.status, "aktif")))
      .orderBy(desc(pemasaran.createdAt))
      .limit(1),
    db
      .select({
        id: pemasaran.id,
        mode: pemasaran.mode,
        status: pemasaran.status
      })
      .from(pemasaran)
      .where(eq(pemasaran.barangId, barangId))
      .orderBy(desc(pemasaran.iteration), desc(pemasaran.createdAt))
      .limit(1),
    db
      .select({
        status: transaksi.status,
        type: transaksi.type
      })
      .from(transaksi)
      .innerJoin(pemasaran, eq(pemasaran.id, transaksi.pemasaranId))
      .where(eq(pemasaran.barangId, barangId))
      .orderBy(desc(transaksi.createdAt))
      .limit(1)
  ]);

  const [item, history, marketing] = await Promise.all([
    getAdminBarangById(unitId, barangId),
    listAdminBarangHistory(unitId, 24, barangId),
    latestMarketing ? getAdminPemasaranById(unitId, latestMarketing.id) : Promise.resolve(null)
  ]);
  const normalizedMarketing = marketing
    ? {
        ...marketing,
        totalIterations: marketing.iterationHistory?.length ?? 1,
        iterationHistory:
          marketing.iterationHistory?.map((entry) => ({
            ...entry,
            totalIterations: marketing.iterationHistory?.length ?? 1
          })) ?? []
      }
    : null;

  return {
    unit: {
      id: unit.id,
      code: unit.code,
      name: unit.name,
      address: unit.address,
      status: getUnitStatus(unit, activeAccount ? 1 : 0, Number(adminCountRow?.count ?? 0))
    },
    item,
    marketing: normalizedMarketing,
    history,
    ...getUnitItemOperationalState({
      itemStatus: rawItem.status,
      activeMarketingMode: activeMarketing?.mode,
      activeMarketingStatus: activeMarketing?.status,
      dueDate: rawItem.dueDate,
      latestMarketingStatus: latestMarketing?.status,
      transactionStatus: latestTransaction?.status
    })
  };
}

export async function createUnit(input: {
  code?: string;
  name?: string;
  address?: string;
  primaryAccount?: {
    bankName?: string;
    accountNumber?: string;
    accountHolderName?: string;
    branchName?: string;
  };
}) {
  const payload = validateManagedUnitCreatePayload(input);

  const [existing] = await db.select().from(units).where(eq(units.code, payload.code)).limit(1);
  if (existing) {
    throw new Error("Kode unit sudah dipakai.");
  }

  const created = await db.transaction(async (tx) => {
    const unitId = crypto.randomUUID();
    const [createdUnit] = await tx
      .insert(units)
      .values({
        id: unitId,
        code: payload.code,
        name: payload.name,
        address: payload.address
      })
      .returning();

    await tx.insert(unitAccounts).values({
      id: crypto.randomUUID(),
      unitId,
      bankName: payload.primaryAccount.bankName,
      accountNumber: payload.primaryAccount.accountNumber,
      accountHolderName: payload.primaryAccount.accountHolderName,
      branchName: payload.primaryAccount.branchName,
      isActive: true
    });

    return createdUnit;
  });

  return created;
}

export async function updateUnit(
  unitId: string,
  input: {
    code?: string;
    name?: string;
    address?: string;
    isActive?: boolean;
  }
) {
  const payload = validateUnitPayload(input);

  const [existing] = await db
    .select()
    .from(units)
    .where(and(eq(units.code, payload.code), sql`${units.id} <> ${unitId}`))
    .limit(1);

  if (existing) {
    throw new Error("Kode unit sudah dipakai.");
  }

  const [updated] = await db
    .update(units)
    .set({
      code: payload.code,
      name: payload.name,
      address: payload.address,
      isActive: typeof input.isActive === "boolean" ? input.isActive : true,
      updatedAt: new Date()
    })
    .where(eq(units.id, unitId))
    .returning();

  if (!updated) {
    throw new Error("Unit belum ditemukan.");
  }

  return updated;
}

export async function deactivateUnit(unitId: string) {
  const [updated] = await db
    .update(units)
    .set({
      isActive: false,
      updatedAt: new Date()
    })
    .where(eq(units.id, unitId))
    .returning();

  if (!updated) {
    throw new Error("Unit belum ditemukan.");
  }

  return updated;
}
