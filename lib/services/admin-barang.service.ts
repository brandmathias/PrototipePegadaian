import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { serializeAdminBarang } from "@/lib/admin-unit/serializers";
import {
  validateAdminBarangPayload,
  validatePerpanjanganPayload,
  validateTebusPayload
} from "@/lib/admin-unit/validation";
import { db } from "@/lib/db/client";
import { barang, mediaBarang, pemasaran, riwayatPerpanjangan, riwayatStatusBarang } from "@/lib/db/schema";

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

export async function listAdminBarang(unitId: string) {
  const rows = await db.select().from(barang).where(eq(barang.unitId, unitId)).orderBy(desc(barang.createdAt));

  if (rows.length === 0) {
    return [];
  }

  const ids = rows.map((item) => item.id);
  const mediaCounts = await db
    .select({
      barangId: mediaBarang.barangId,
      count: sql<number>`count(*)`
    })
    .from(mediaBarang)
    .where(inArray(mediaBarang.barangId, ids))
    .groupBy(mediaBarang.barangId);
  const activeMarketing = await db
    .select()
    .from(pemasaran)
    .where(and(inArray(pemasaran.barangId, ids), eq(pemasaran.status, "aktif")));

  const mediaMap = new Map(mediaCounts.map((row) => [row.barangId, Number(row.count)]));
  const marketingMap = new Map(activeMarketing.map((row) => [row.barangId, row.mode]));

  return rows.map((row) =>
    serializeAdminBarang(row, {
      mediaCount: mediaMap.get(row.id) ?? 0,
      marketingMode: marketingMap.get(row.id) ?? null
    })
  );
}

export async function getAdminBarangById(unitId: string, barangId: string) {
  const row = await assertBarangForUnit(barangId, unitId);
  const media = await db.select().from(mediaBarang).where(eq(mediaBarang.barangId, barangId)).orderBy(mediaBarang.sortOrder);
  const [activeMarketing] = await db
    .select()
    .from(pemasaran)
    .where(and(eq(pemasaran.barangId, barangId), eq(pemasaran.status, "aktif")))
    .limit(1);

  return {
    ...serializeAdminBarang(row, {
      mediaCount: media.length,
      marketingMode: activeMarketing?.mode ?? null
    }),
    media
  };
}

export async function createAdminBarang(unitId: string, userId: string, input: Parameters<typeof validateAdminBarangPayload>[0]) {
  const payload = validateAdminBarangPayload(input);
  const [created] = await db
    .insert(barang)
    .values({
      id: crypto.randomUUID(),
      unitId,
      code: makeBarangCode(),
      name: payload.name,
      category: payload.category,
      condition: payload.condition,
      description: payload.description,
      appraisalValue: payload.appraisalValue,
      loanValue: payload.loanValue,
      ownerName: payload.ownerName,
      customerNumber: payload.customerNumber,
      pawnedAt: toUtcDate(payload.pawnedAt),
      dueDate: toUtcDate(payload.dueDate),
      status: "gadai",
      createdByUserId: userId
    })
    .returning();

  await recordStatusChange({
    barangId: created.id,
    oldStatus: null,
    newStatus: "gadai",
    userId,
    note: "Barang gadai baru dicatat oleh admin unit."
  });

  return serializeAdminBarang(created);
}

export async function updateAdminBarang(unitId: string, barangId: string, input: Parameters<typeof validateAdminBarangPayload>[0]) {
  const current = await assertBarangForUnit(barangId, unitId);

  if (!["gadai", "jaminan"].includes(current.status)) {
    throw new Error("Barang hanya dapat diedit saat status gadai atau jaminan.");
  }

  const payload = validateAdminBarangPayload(input);
  const [updated] = await db
    .update(barang)
    .set({
      name: payload.name,
      category: payload.category,
      condition: payload.condition,
      description: payload.description,
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

  return serializeAdminBarang(updated);
}

export async function extendAdminBarang(unitId: string, userId: string, barangId: string, input: { newDueDate?: unknown; note?: unknown }) {
  const current = await assertBarangForUnit(barangId, unitId);
  if (current.status !== "gadai") {
    throw new Error("Perpanjangan hanya bisa dilakukan untuk barang gadai.");
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
    oldStatus: "gadai",
    newStatus: "gadai",
    userId,
    note: "Tanggal jatuh tempo barang gadai diperpanjang."
  });

  return serializeAdminBarang(updated);
}

export async function redeemAdminBarang(unitId: string, userId: string, barangId: string, input: { reference?: unknown; redeemedAt?: unknown }) {
  const current = await assertBarangForUnit(barangId, unitId);
  if (current.status !== "gadai") {
    throw new Error("Penebusan hanya bisa dicatat untuk barang gadai.");
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
  await assertBarangForUnit(barangId, unitId);
  const url = String(input.url ?? "").trim();
  if (!url) {
    throw new Error("URL media wajib diisi.");
  }

  const [created] = await db
    .insert(mediaBarang)
    .values({
      id: crypto.randomUUID(),
      barangId,
      type: input.type === "video" ? "video" : "foto",
      url,
      fileName: String(input.fileName ?? "").trim(),
      sizeBytes: Number(input.sizeBytes ?? 0),
      sortOrder: Number(input.sortOrder ?? 0)
    })
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
