import { and, desc, eq, sql } from "drizzle-orm";

import { serializeAdminPemasaran } from "@/lib/admin-unit/serializers";
import { validatePemasaranPayload } from "@/lib/admin-unit/validation";
import { db } from "@/lib/db/client";
import { barang, bids, pemasaran, riwayatStatusBarang } from "@/lib/db/schema";

async function getBarangForUnit(barangId: string, unitId: string) {
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

export async function publishAdminBarang(unitId: string, userId: string, barangId: string, input: Parameters<typeof validatePemasaranPayload>[0]) {
  const item = await getBarangForUnit(barangId, unitId);
  if (item.status !== "jaminan" && item.status !== "gagal") {
    throw new Error("Barang hanya bisa dipasarkan dari status jaminan atau gagal.");
  }

  const payload = validatePemasaranPayload(input);
  const now = new Date();
  const endsAt =
    payload.mode === "vickrey" && payload.durationDays
      ? new Date(now.getTime() + payload.durationDays * 24 * 60 * 60 * 1000)
      : null;

  const [{ nextIteration }] = await db
    .select({
      nextIteration: sql<number>`coalesce(max(${pemasaran.iteration}), 0) + 1`
    })
    .from(pemasaran)
    .where(eq(pemasaran.barangId, barangId));

  const [created] = await db
    .insert(pemasaran)
    .values({
      id: crypto.randomUUID(),
      barangId,
      mode: payload.mode,
      price: payload.mode === "fixed_price" ? payload.price : null,
      basePrice: payload.mode === "vickrey" ? payload.price : null,
      durationDays: payload.mode === "vickrey" ? payload.durationDays : null,
      startsAt: now,
      endsAt,
      iteration: Number(nextIteration ?? 1),
      status: "aktif",
      createdByUserId: userId
    })
    .returning();

  await db.update(barang).set({ status: "dipasarkan", updatedAt: new Date() }).where(eq(barang.id, barangId));
  await db.insert(riwayatStatusBarang).values({
    id: crypto.randomUUID(),
    barangId,
    oldStatus: item.status,
    newStatus: "dipasarkan",
    changedByUserId: userId,
    note: "Barang dipublikasikan ke katalog."
  });

  return serializeAdminPemasaran(created, { lotName: item.name });
}

export async function listAdminPemasaran(unitId: string) {
  const rows = await db
    .select({
      marketing: pemasaran,
      item: barang,
      bidCount: sql<number>`count(${bids.id})`
    })
    .from(pemasaran)
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .leftJoin(bids, eq(bids.pemasaranId, pemasaran.id))
    .where(eq(barang.unitId, unitId))
    .groupBy(pemasaran.id, barang.id)
    .orderBy(desc(pemasaran.createdAt));

  return rows.map((row) =>
    serializeAdminPemasaran(row.marketing, {
      lotName: row.item.name,
      bidCount: Number(row.bidCount ?? 0)
    })
  );
}

export async function getAdminPemasaranById(unitId: string, pemasaranId: string) {
  const [row] = await db
    .select({
      marketing: pemasaran,
      item: barang,
      bidCount: sql<number>`count(${bids.id})`
    })
    .from(pemasaran)
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .leftJoin(bids, eq(bids.pemasaranId, pemasaran.id))
    .where(and(eq(pemasaran.id, pemasaranId), eq(barang.unitId, unitId)))
    .groupBy(pemasaran.id, barang.id)
    .limit(1);

  if (!row) {
    throw new Error("Sesi pemasaran tidak ditemukan.");
  }

  return serializeAdminPemasaran(row.marketing, {
    lotName: row.item.name,
    bidCount: Number(row.bidCount ?? 0)
  });
}
