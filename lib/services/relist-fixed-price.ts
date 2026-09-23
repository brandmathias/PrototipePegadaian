import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { barang, buyerWishlist, pemasaran, pemasaranViews, riwayatStatusBarang } from "@/lib/db/schema";

type TransactionDb = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function relistFailedFixedPriceMarketing(
  tx: TransactionDb,
  input: {
    barangId: string;
    itemStatus: string;
    marketing: {
      id: string;
      iteration: number;
      price: string | number;
      createdAt: Date;
      createdByUserId: string;
    };
    now: Date;
    failedByUserId?: string | null;
    failureNote: string;
  }
) {
  const [archived] = await tx
    .update(pemasaran)
    .set({ status: "gagal", updatedAt: input.now })
    .where(and(eq(pemasaran.id, input.marketing.id), eq(pemasaran.status, "aktif"), eq(pemasaran.mode, "fixed_price")))
    .returning({ id: pemasaran.id });

  if (!archived) return;

  const relistedAt = new Date(input.now.getTime() + 1);
  const relistedMarketingId = randomUUID();
  await tx.insert(pemasaran).values({
    id: relistedMarketingId,
    barangId: input.barangId,
    mode: "fixed_price",
    price: String(input.marketing.price),
    basePrice: null,
    durationDays: null,
    durationSeconds: null,
    startsAt: input.marketing.createdAt,
    endsAt: null,
    iteration: Number(input.marketing.iteration ?? 0) + 1,
    status: "aktif",
    createdByUserId: input.marketing.createdByUserId,
    createdAt: input.marketing.createdAt,
    updatedAt: relistedAt
  });

  await tx.update(barang).set({ status: "dipasarkan", updatedAt: relistedAt }).where(eq(barang.id, input.barangId));
  await tx.update(buyerWishlist).set({ pemasaranId: relistedMarketingId }).where(eq(buyerWishlist.pemasaranId, input.marketing.id));
  await tx.update(pemasaranViews).set({ pemasaranId: relistedMarketingId }).where(eq(pemasaranViews.pemasaranId, input.marketing.id));
  await tx.insert(riwayatStatusBarang).values({
    id: randomUUID(),
    barangId: input.barangId,
    oldStatus: input.itemStatus,
    newStatus: "gagal",
    changedByUserId: input.failedByUserId ?? null,
    note: input.failureNote,
    createdAt: input.now
  });
  await tx.insert(riwayatStatusBarang).values({
    id: randomUUID(),
    barangId: input.barangId,
    oldStatus: "gagal",
    newStatus: "dipasarkan",
    changedByUserId: null,
    note: "Barang dipublikasikan kembali ke katalog sebagai sesi Harga Tetap.",
    createdAt: relistedAt
  });
}
