import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { canEditMarketedBarang } from "@/lib/admin-unit/marketing-edit-policy";
import { serializeAdminBarang } from "@/lib/admin-unit/serializers";
import {
  ADMIN_BARANG_MEDIA_LIMIT,
  validateAdminBarangPayload,
  validateFixedPriceMarketingPricePayload,
  validateAdminBarangMediaList,
  validatePerpanjanganPayload,
  validateTebusPayload
} from "@/lib/admin-unit/validation";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema/auth";
import { barang, bids, mediaBarang, pemasaran, riwayatPerpanjangan, riwayatStatusBarang, transaksi } from "@/lib/db/schema";
import { formatAppDateTime } from "@/lib/timezone";

function toUtcDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function makeBarangCode() {
  return `BRG-${Date.now().toString().slice(-8)}`;
}

async function assertBarangForUnit(barangId: string, unitId: string) {
  const [row] = await db
    .select()
    .from(barang)
    .where(and(eq(barang.id, barangId), eq(barang.unitId, unitId)))
    .limit(1);

  if (!row) {
    throw new Error("Barang tidak ditemukan di unit Anda.");
  }

  return row;
}

async function getMarketingEditContext(barangId: string) {
  const [activeMarketing] = await db
    .select({
      id: pemasaran.id,
      price: pemasaran.price,
      mode: pemasaran.mode
    })
    .from(pemasaran)
    .where(and(eq(pemasaran.barangId, barangId), eq(pemasaran.status, "aktif")))
    .limit(1);

  const [latestMarketing] = await db
    .select({
      id: pemasaran.id,
      mode: pemasaran.mode,
      status: pemasaran.status,
      winnerId: pemasaran.winnerId
    })
    .from(pemasaran)
    .where(eq(pemasaran.barangId, barangId))
    .orderBy(desc(pemasaran.iteration), desc(pemasaran.createdAt))
    .limit(1);

  if (!latestMarketing) {
    return {
      activeMarketingMode: activeMarketing?.mode ?? null,
      latestMarketingMode: null,
      latestMarketingStatus: null,
      participantCount: 0,
      hasWinner: false,
      hasFailedWinnerPayment: false
    };
  }

  const [[bidSummary], [failedTransaction]] = await Promise.all([
    db
      .select({
        count: sql<number>`count(${bids.id})`
      })
      .from(bids)
      .where(eq(bids.pemasaranId, latestMarketing.id)),
    db
      .select({
        id: transaksi.id
      })
      .from(transaksi)
      .where(and(eq(transaksi.pemasaranId, latestMarketing.id), eq(transaksi.status, "gagal")))
      .limit(1)
  ]);

  return {
    activeMarketingMode: activeMarketing?.mode ?? null,
    latestMarketingMode: latestMarketing.mode,
    latestMarketingStatus: latestMarketing.status,
    participantCount: Number(bidSummary?.count ?? 0),
    hasWinner: Boolean(latestMarketing.winnerId),
    hasFailedWinnerPayment: Boolean(failedTransaction)
  };
}

type AdminBarangUpdateInput = Parameters<typeof validateAdminBarangPayload>[0] & {
  marketingPrice?: unknown;
};

async function recordStatusChange(input: {
  barangId: string;
  oldStatus?: string | null;
  newStatus: string;
  userId: string;
  note?: string;
}) {
  await db.insert(riwayatStatusBarang).values({
    id: crypto.randomUUID(),
    barangId: input.barangId,
    oldStatus: input.oldStatus ?? null,
    newStatus: input.newStatus,
    changedByUserId: input.userId,
    note: input.note ?? ""
  });
}

export type AdminBarangHistoryEntry = {
  id: string;
  barangId: string;
  barangCode: string;
  barangName: string;
  ownerName: string;
  customerNumber: string;
  actionKey: "input_baru" | "perpanjangan" | "ditebus" | "dipasarkan";
  actionLabel: string;
  actionTone: "default" | "success" | "warning" | "danger";
  note: string;
  actorName: string;
  createdAt: string;
  createdAtLabel: string;
};

function mapStatusHistoryAction(oldStatus: string | null, newStatus: string) {
  if (!oldStatus && newStatus === "jaminan") {
    return {
      actionKey: "input_baru" as const,
      actionLabel: "Input Baru",
      actionTone: "default" as const
    };
  }

  if (newStatus === "dipasarkan") {
    return {
      actionKey: "dipasarkan" as const,
      actionLabel: "Dipasarkan",
      actionTone: "success" as const
    };
  }

  if (newStatus === "ditebus") {
    return {
      actionKey: "ditebus" as const,
      actionLabel: "Ditebus",
      actionTone: "warning" as const
    };
  }

  return null;
}

export async function listAdminBarang(unitId: string) {
  const rows = await db
    .select()
    .from(barang)
    .where(and(eq(barang.unitId, unitId), inArray(barang.status, ["gadai", "jaminan"])))
    .orderBy(desc(barang.createdAt));
  const inventoryRows = rows.filter((item) => ["gadai", "jaminan"].includes(item.status));

  if (inventoryRows.length === 0) {
    return [];
  }

  const ids = inventoryRows.map((item) => item.id);
  const mediaCounts = await db
    .select({
      barangId: mediaBarang.barangId,
      count: sql<number>`count(*)`
    })
    .from(mediaBarang)
    .where(inArray(mediaBarang.barangId, ids))
    .groupBy(mediaBarang.barangId);
  const mediaRows = await db
    .select({
      barangId: mediaBarang.barangId,
      type: mediaBarang.type,
      url: mediaBarang.url,
      sortOrder: mediaBarang.sortOrder
    })
    .from(mediaBarang)
    .where(inArray(mediaBarang.barangId, ids))
    .orderBy(mediaBarang.barangId, mediaBarang.sortOrder);
  const activeMarketing = await db
    .select()
    .from(pemasaran)
    .where(and(inArray(pemasaran.barangId, ids), eq(pemasaran.status, "aktif")));

  const mediaMap = new Map(mediaCounts.map((row) => [row.barangId, Number(row.count)]));
  const marketingMap = new Map(activeMarketing.map((row) => [row.barangId, row.mode]));
  const previewImageMap = new Map<string, string>();

  for (const media of mediaRows) {
    const isLikelyImage =
      media.type !== "video" &&
      !/\.(mp4|mov|webm|mkv)$/i.test(media.url);

    if (!isLikelyImage || previewImageMap.has(media.barangId)) {
      continue;
    }

    previewImageMap.set(media.barangId, media.url);
  }

  return inventoryRows.map((row) =>
    serializeAdminBarang(row, {
      mediaCount: mediaMap.get(row.id) ?? 0,
      marketingMode: marketingMap.get(row.id) ?? null,
      previewImageUrl: previewImageMap.get(row.id) ?? null
    })
  );
}

export async function listAdminBarangHistory(
  unitId: string,
  limit = 24,
  barangId?: string
): Promise<AdminBarangHistoryEntry[]> {
  const historyWhere = barangId
    ? and(eq(barang.unitId, unitId), eq(barang.id, barangId))
    : eq(barang.unitId, unitId);

  const [statusRows, extensionRows] = await Promise.all([
    db
      .select({
        id: riwayatStatusBarang.id,
        barangId: barang.id,
        barangCode: barang.code,
        barangName: barang.name,
        ownerName: barang.ownerName,
        customerNumber: barang.customerNumber,
        oldStatus: riwayatStatusBarang.oldStatus,
        newStatus: riwayatStatusBarang.newStatus,
        note: riwayatStatusBarang.note,
        createdAt: riwayatStatusBarang.createdAt,
        actorName: users.name
      })
      .from(riwayatStatusBarang)
      .innerJoin(barang, eq(barang.id, riwayatStatusBarang.barangId))
      .leftJoin(users, eq(users.id, riwayatStatusBarang.changedByUserId))
      .where(historyWhere)
      .orderBy(desc(riwayatStatusBarang.createdAt)),
    db
      .select({
        id: riwayatPerpanjangan.id,
        barangId: barang.id,
        barangCode: barang.code,
        barangName: barang.name,
        ownerName: barang.ownerName,
        customerNumber: barang.customerNumber,
        note: riwayatPerpanjangan.note,
        createdAt: riwayatPerpanjangan.createdAt,
        actorName: users.name
      })
      .from(riwayatPerpanjangan)
      .innerJoin(barang, eq(barang.id, riwayatPerpanjangan.barangId))
      .leftJoin(users, eq(users.id, riwayatPerpanjangan.extendedByUserId))
      .where(historyWhere)
      .orderBy(desc(riwayatPerpanjangan.createdAt))
  ]);

  const normalizedStatusRows: AdminBarangHistoryEntry[] = [];

  for (const row of statusRows) {
    const action = mapStatusHistoryAction(row.oldStatus, row.newStatus);
    if (!action) {
      continue;
    }

    normalizedStatusRows.push({
      id: row.id,
      barangId: row.barangId,
      barangCode: row.barangCode,
      barangName: row.barangName,
      ownerName: row.ownerName,
      customerNumber: row.customerNumber,
      actionKey: action.actionKey,
      actionLabel: action.actionLabel,
      actionTone: action.actionTone,
      note: row.note,
      actorName: row.actorName ?? "Admin Unit",
      createdAt: row.createdAt.toISOString(),
      createdAtLabel: formatAppDateTime(row.createdAt)
    });
  }

  const normalizedExtensionRows = extensionRows.map((row) => ({
    id: row.id,
    barangId: row.barangId,
    barangCode: row.barangCode,
    barangName: row.barangName,
    ownerName: row.ownerName,
    customerNumber: row.customerNumber,
    actionKey: "perpanjangan" as const,
    actionLabel: "Diperpanjang",
    actionTone: "warning" as const,
    note: row.note || "Tanggal jatuh tempo barang diperpanjang sebelum pemasaran.",
    actorName: row.actorName ?? "Admin Unit",
    createdAt: row.createdAt.toISOString(),
    createdAtLabel: formatAppDateTime(row.createdAt)
  }));

  return [...normalizedStatusRows, ...normalizedExtensionRows]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, limit);
}

export async function getAdminBarangById(unitId: string, barangId: string) {
  const row = await assertBarangForUnit(barangId, unitId);
  const media = await db.select().from(mediaBarang).where(eq(mediaBarang.barangId, barangId)).orderBy(mediaBarang.sortOrder);
  const [activeMarketing] = await db
    .select()
    .from(pemasaran)
    .where(and(eq(pemasaran.barangId, barangId), eq(pemasaran.status, "aktif")))
    .limit(1);
  const [latestMarketing] = await db
    .select()
    .from(pemasaran)
    .where(eq(pemasaran.barangId, barangId))
    .orderBy(desc(pemasaran.iteration), desc(pemasaran.createdAt))
    .limit(1);

  return {
    ...serializeAdminBarang(row, {
      mediaCount: media.length,
      marketingIteration: latestMarketing?.iteration ?? null,
      marketingMode: activeMarketing?.mode ?? latestMarketing?.mode ?? null
    }),
    activeMarketingId: activeMarketing?.mode === "fixed_price" ? activeMarketing.id : null,
    marketingPrice: activeMarketing?.mode === "fixed_price" ? Number(activeMarketing.price ?? 0) : null,
    media
  };
}

export async function createAdminBarang(
  unitId: string,
  userId: string,
  input: Parameters<typeof validateAdminBarangPayload>[0] & { media?: unknown }
) {
  const payload = validateAdminBarangPayload(input);
  const media = validateAdminBarangMediaList(input.media);

  const created = await db.transaction(async (tx) => {
    const [createdBarang] = await tx
      .insert(barang)
      .values({
        id: crypto.randomUUID(),
        unitId,
        code: makeBarangCode(),
        name: payload.name,
        category: payload.category,
        condition: payload.condition,
        description: payload.description,
        specifications: payload.specifications,
        appraisalValue: payload.appraisalValue,
        loanValue: payload.loanValue,
        ownerName: payload.ownerName,
        customerNumber: payload.customerNumber,
        pawnedAt: toUtcDate(payload.pawnedAt),
        dueDate: toUtcDate(payload.dueDate),
        status: "jaminan",
        createdByUserId: userId
      })
      .returning();

    await tx.insert(riwayatStatusBarang).values({
      id: crypto.randomUUID(),
      barangId: createdBarang.id,
      oldStatus: null,
      newStatus: "jaminan",
      changedByUserId: userId,
      note: "Barang hasil input gadai dicatat sebagai barang jaminan unit."
    });

    if (media.length > 0) {
      await tx.insert(mediaBarang).values(
        media.map((item, index) => ({
          id: crypto.randomUUID(),
          barangId: createdBarang.id,
          type: item.type,
          url: item.url,
          fileName: item.fileName,
          sizeBytes: item.sizeBytes,
          sortOrder: item.sortOrder ?? index
        }))
      );
    }

    return createdBarang;
  });

  return serializeAdminBarang(created);
}

export async function updateAdminBarang(unitId: string, barangId: string, input: AdminBarangUpdateInput) {
  const current = await assertBarangForUnit(barangId, unitId);
  const marketingContext = await getMarketingEditContext(barangId);

  if (!canEditMarketedBarang({ status: current.status, ...marketingContext })) {
    throw new Error("Barang fixed price dapat diedit saat aktif, sedangkan barang lelang hanya dapat diedit setelah gagal karena tanpa peserta atau pemenang tidak membayar dalam 24 jam.");
  }

  const payload = validateAdminBarangPayload(input);
  const shouldUpdateMarketingPrice = input.marketingPrice !== undefined;
  const marketingPricePayload = shouldUpdateMarketingPrice ? validateFixedPriceMarketingPricePayload(input) : null;

  if (marketingPricePayload && marketingContext.activeMarketingMode !== "fixed_price") {
    throw new Error("Harga pemasaran hanya dapat diperbarui untuk barang fixed price yang masih aktif.");
  }

  const [updated] = await db
    .update(barang)
    .set({
      name: payload.name,
      category: payload.category,
      condition: payload.condition,
      description: payload.description,
      specifications: payload.specifications,
      appraisalValue: payload.appraisalValue,
      loanValue: payload.loanValue,
      ownerName: payload.ownerName,
      customerNumber: payload.customerNumber,
      pawnedAt: toUtcDate(payload.pawnedAt),
      dueDate: toUtcDate(payload.dueDate),
      updatedAt: new Date()
    })
    .where(eq(barang.id, barangId))
    .returning();

  if (marketingPricePayload) {
    await db
      .update(pemasaran)
      .set({
        price: marketingPricePayload.marketingPrice,
        updatedAt: new Date()
      })
      .where(and(eq(pemasaran.barangId, barangId), eq(pemasaran.status, "aktif"), eq(pemasaran.mode, "fixed_price")));
  }

  return serializeAdminBarang(updated);
}

export async function extendAdminBarang(unitId: string, userId: string, barangId: string, input: { newDueDate?: unknown; note?: unknown }) {
  const current = await assertBarangForUnit(barangId, unitId);
  if (current.status !== "gadai" && current.status !== "jaminan") {
    throw new Error("Perpanjangan hanya bisa dilakukan sebelum barang dipasarkan.");
  }

  const payload = validatePerpanjanganPayload(input, current.dueDate.toISOString().slice(0, 10));
  const newDueDate = toUtcDate(payload.newDueDate);

  await db.insert(riwayatPerpanjangan).values({
    id: crypto.randomUUID(),
    barangId,
    oldDueDate: current.dueDate,
    newDueDate,
    note: payload.note,
    extendedByUserId: userId
  });

  const [updated] = await db
    .update(barang)
    .set({ dueDate: newDueDate, updatedAt: new Date() })
    .where(eq(barang.id, barangId))
    .returning();

  await recordStatusChange({
    barangId,
    oldStatus: current.status,
    newStatus: current.status,
    userId,
    note: "Tanggal jatuh tempo barang diperpanjang sebelum pemasaran."
  });

  return serializeAdminBarang(updated);
}

export async function redeemAdminBarang(unitId: string, userId: string, barangId: string, input: { reference?: unknown; redeemedAt?: unknown }) {
  const current = await assertBarangForUnit(barangId, unitId);
  if (current.status !== "gadai" && current.status !== "jaminan") {
    throw new Error("Penebusan hanya bisa dicatat sebelum barang dipasarkan.");
  }

  const payload = validateTebusPayload(input);
  const [updated] = await db
    .update(barang)
    .set({
      status: "ditebus",
      redeemedAt: toUtcDate(payload.redeemedAt),
      redemptionReference: payload.reference,
      updatedAt: new Date()
    })
    .where(eq(barang.id, barangId))
    .returning();

  await recordStatusChange({
    barangId,
    oldStatus: current.status,
    newStatus: "ditebus",
    userId,
    note: "Barang ditebus oleh nasabah."
  });

  return serializeAdminBarang(updated);
}

export async function convertAdminBarangToJaminan(unitId: string, userId: string, barangId: string) {
  const current = await assertBarangForUnit(barangId, unitId);
  if (current.status !== "gadai") {
    throw new Error("Hanya barang gadai yang bisa dipindahkan menjadi jaminan.");
  }

  if (current.dueDate.getTime() > Date.now()) {
    throw new Error("Barang baru bisa menjadi jaminan setelah melewati tanggal jatuh tempo.");
  }

  const [updated] = await db
    .update(barang)
    .set({ status: "jaminan", updatedAt: new Date() })
    .where(eq(barang.id, barangId))
    .returning();

  await recordStatusChange({
    barangId,
    oldStatus: current.status,
    newStatus: "jaminan",
    userId,
    note: "Barang dipindahkan menjadi aset jaminan unit."
  });

  return serializeAdminBarang(updated);
}

export async function addAdminBarangMedia(
  unitId: string,
  barangId: string,
  input: { type?: string; url?: string; fileName?: string; sizeBytes?: number; sortOrder?: number }
) {
  const [created] = await addAdminBarangMediaBatch(unitId, barangId, [input]);
  return created;
}

export async function addAdminBarangMediaBatch(
  unitId: string,
  barangId: string,
  input: Array<{ type?: string; url?: string; fileName?: string; sizeBytes?: number; sortOrder?: number }>
) {
  await assertBarangForUnit(barangId, unitId);
  const [{ count }] = await db
    .select({
      count: sql<number>`count(*)`
    })
    .from(mediaBarang)
    .where(eq(mediaBarang.barangId, barangId));

  if (Number(count) + input.length > ADMIN_BARANG_MEDIA_LIMIT) {
    throw new Error(`Maksimal ${ADMIN_BARANG_MEDIA_LIMIT} foto atau video untuk satu barang.`);
  }

  const media = validateAdminBarangMediaList(input).map((item, index) => ({
    ...item,
    sortOrder: Number(count) + index
  }));

  const created = await db
    .insert(mediaBarang)
    .values(
      media.map((item) => ({
        id: crypto.randomUUID(),
        barangId,
        type: item.type,
        url: item.url,
        fileName: item.fileName,
        sizeBytes: item.sizeBytes,
        sortOrder: item.sortOrder
      }))
    )
    .returning();

  return created;
}

export async function deleteAdminBarangMedia(unitId: string, barangId: string, mediaId: string) {
  await assertBarangForUnit(barangId, unitId);
  const [deleted] = await db
    .delete(mediaBarang)
    .where(and(eq(mediaBarang.id, mediaId), eq(mediaBarang.barangId, barangId)))
    .returning();

  if (!deleted) {
    throw new Error("Media barang tidak ditemukan.");
  }

  return deleted;
}
