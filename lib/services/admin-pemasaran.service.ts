import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";

import { serializeAdminPemasaran } from "@/lib/admin-unit/serializers";
import { validatePemasaranPayload } from "@/lib/admin-unit/validation";
import { db } from "@/lib/db/client";
import { barang, bids, mediaBarang, pemasaran, riwayatStatusBarang, transaksi, users } from "@/lib/db/schema";
import { processExpiredVickreyAuctions } from "@/lib/services/cron.service";

const VICKREY_REVEAL_WINDOW_SECONDS = 600;

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

async function getMarketingMediaByBarangIds(barangIds: string[]) {
  if (!barangIds.length) {
    return new Map<string, Array<{ id: string; type: string; url: string; fileName?: string }>>();
  }

  const rows = await db
    .select({
      id: mediaBarang.id,
      barangId: mediaBarang.barangId,
      type: mediaBarang.type,
      url: mediaBarang.url,
      fileName: mediaBarang.fileName,
      sortOrder: mediaBarang.sortOrder,
      createdAt: mediaBarang.createdAt
    })
    .from(mediaBarang)
    .where(inArray(mediaBarang.barangId, barangIds))
    .orderBy(asc(mediaBarang.sortOrder), asc(mediaBarang.createdAt));

  return rows.reduce((map, media) => {
    const collection = map.get(media.barangId) ?? [];
    collection.push({
      id: media.id,
      type: media.type,
      url: media.url,
      fileName: media.fileName
    });
    map.set(media.barangId, collection);
    return map;
  }, new Map<string, Array<{ id: string; type: string; url: string; fileName?: string }>>());
}

async function getLatestTransactionsByPemasaranIds(pemasaranIds: string[]) {
  if (!pemasaranIds.length) {
    return new Map<
      string,
      {
        id?: string | null;
        buyerName?: string | null;
        paymentMethod?: string | null;
        status?: string | null;
        proofUrl?: string | null;
        reference?: string | null;
        soldAt?: Date | null;
        paymentDeadline?: Date | null;
      }
    >();
  }

  const rows = await db
    .select({
      id: transaksi.id,
      pemasaranId: transaksi.pemasaranId,
      status: transaksi.status,
      paymentMethod: transaksi.paymentMethod,
      proofUrl: transaksi.proofUrl,
      reference: transaksi.referenceNumber,
      paymentDeadline: transaksi.paymentDeadline,
      soldAt: transaksi.verifiedAt,
      buyerName: users.name,
      createdAt: transaksi.createdAt
    })
    .from(transaksi)
    .innerJoin(users, eq(users.id, transaksi.userId))
    .where(inArray(transaksi.pemasaranId, pemasaranIds))
    .orderBy(desc(transaksi.createdAt));

  return rows.reduce((map, row) => {
    if (!map.has(row.pemasaranId)) {
      map.set(row.pemasaranId, {
        id: row.id,
        buyerName: row.buyerName,
        paymentMethod: row.paymentMethod,
        status: row.status,
        proofUrl: row.proofUrl,
        reference: row.reference,
        soldAt: row.soldAt,
        paymentDeadline: row.paymentDeadline
      });
    }
    return map;
  }, new Map<
    string,
    {
      id?: string | null;
      buyerName?: string | null;
      paymentMethod?: string | null;
      status?: string | null;
      proofUrl?: string | null;
      reference?: string | null;
      soldAt?: Date | null;
      paymentDeadline?: Date | null;
    }
  >());
}

async function getParticipantPreviewsByPemasaranIds(pemasaranIds: string[]) {
  if (!pemasaranIds.length) {
    return new Map<
      string,
      Array<{
        bidderId: string;
        bidderName: string;
        bidderImage?: string | null;
      }>
    >();
  }

  const rows = await db
    .select({
      pemasaranId: bids.pemasaranId,
      bidderId: users.id,
      bidderName: users.name,
      bidderImage: users.image,
      createdAt: bids.createdAt
    })
    .from(bids)
    .innerJoin(users, eq(users.id, bids.userId))
    .where(inArray(bids.pemasaranId, pemasaranIds))
    .orderBy(asc(bids.createdAt));

  return rows.reduce(
    (map, row) => {
      const collection = map.get(row.pemasaranId) ?? [];
      const alreadyIncluded = collection.some((entry) => entry.bidderId === row.bidderId);

      if (!alreadyIncluded && collection.length < 10) {
        collection.push({
          bidderId: row.bidderId,
          bidderName: row.bidderName ?? "Peserta",
          bidderImage: row.bidderImage ?? null
        });
        map.set(row.pemasaranId, collection);
      }

      return map;
    },
    new Map<
      string,
      Array<{
        bidderId: string;
        bidderName: string;
        bidderImage?: string | null;
      }>
    >()
  );
}

export async function publishAdminBarang(unitId: string, userId: string, barangId: string, input: Parameters<typeof validatePemasaranPayload>[0]) {
  const item = await getBarangForUnit(barangId, unitId);
  if (item.status !== "jaminan" && item.status !== "gagal" && item.status !== "gadai") {
    throw new Error("Barang hanya bisa dipasarkan dari status jaminan atau gagal.");
  }

  const payload = validatePemasaranPayload(input);
  const now = new Date();
  let derivedDurationDays: number | null = null;
  let derivedDurationSeconds: number | null = null;
  let endsAt: Date | null = null;
  let revealEndsAt: Date | null = null;

  if (payload.mode === "vickrey") {
    derivedDurationDays = Math.floor(payload.totalSeconds / 86_400);
    derivedDurationSeconds = payload.totalSeconds;
    endsAt = new Date(now.getTime() + payload.totalSeconds * 1000);
    revealEndsAt = new Date(endsAt.getTime() + VICKREY_REVEAL_WINDOW_SECONDS * 1000);
  }

  const [{ nextIteration }] = await db
    .select({
      nextIteration: sql<number>`coalesce(max(${pemasaran.iteration}), 0) + 1`
    })
    .from(pemasaran)
    .where(eq(pemasaran.barangId, barangId));

  const created = await db.transaction(async (tx) => {
    const [createdMarketing] = await tx
      .insert(pemasaran)
      .values({
        id: crypto.randomUUID(),
        barangId,
        mode: payload.mode,
        price: payload.mode === "fixed_price" ? payload.price : null,
        basePrice: payload.mode === "vickrey" ? payload.price : null,
        durationDays: derivedDurationDays,
        durationSeconds: derivedDurationSeconds,
        startsAt: now,
        endsAt,
        revealEndsAt,
        iteration: Number(nextIteration ?? 1),
        status: "aktif",
        createdByUserId: userId
      })
      .returning();

    await tx.update(barang).set({ status: "dipasarkan", updatedAt: new Date() }).where(eq(barang.id, barangId));
    await tx.insert(riwayatStatusBarang).values({
      id: crypto.randomUUID(),
      barangId,
      oldStatus: item.status,
      newStatus: "dipasarkan",
      changedByUserId: userId,
      note: "Barang dipublikasikan ke katalog."
    });

    return createdMarketing;
  });

  return serializeAdminPemasaran(created, { lotName: item.name });
}

export async function listAdminPemasaran(unitId: string) {
  await processExpiredVickreyAuctions();

  const rows = await db
    .select({
      marketing: pemasaran,
      item: barang,
      bidCount: sql<number>`count(${bids.id})`,
      winnerName: users.name
    })
    .from(pemasaran)
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .leftJoin(bids, eq(bids.pemasaranId, pemasaran.id))
    .leftJoin(users, eq(users.id, pemasaran.winnerId))
    .where(eq(barang.unitId, unitId))
    .groupBy(pemasaran.id, barang.id, users.name)
    .orderBy(desc(pemasaran.createdAt));

  const [mediaByBarangId, transactionByPemasaranId, participantPreviewsByPemasaranId] = await Promise.all([
    getMarketingMediaByBarangIds(rows.map((row) => row.item.id)),
    getLatestTransactionsByPemasaranIds(rows.map((row) => row.marketing.id)),
    getParticipantPreviewsByPemasaranIds(rows.map((row) => row.marketing.id))
  ]);

  return rows.map((row) =>
    serializeAdminPemasaran(row.marketing, {
      lotName: row.item.name,
      lotCode: row.item.code,
      lotCategory: row.item.category,
      lotCondition: row.item.condition,
      media: mediaByBarangId.get(row.item.id) ?? [],
      bidCount: Number(row.bidCount ?? 0),
      winnerName: row.winnerName ?? null,
      transaction: transactionByPemasaranId.get(row.marketing.id) ?? null,
      participantPreviews: participantPreviewsByPemasaranId.get(row.marketing.id) ?? []
    })
  );
}

export async function getAdminPemasaranById(unitId: string, pemasaranId: string) {
  await processExpiredVickreyAuctions();

  const [row] = await db
    .select({
      marketing: pemasaran,
      item: barang,
      bidCount: sql<number>`count(${bids.id})`,
      winnerName: users.name
    })
    .from(pemasaran)
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .leftJoin(bids, eq(bids.pemasaranId, pemasaran.id))
    .leftJoin(users, eq(users.id, pemasaran.winnerId))
    .where(and(eq(pemasaran.id, pemasaranId), eq(barang.unitId, unitId)))
    .groupBy(pemasaran.id, barang.id, users.name)
    .limit(1);

  if (!row) {
    throw new Error("Sesi pemasaran tidak ditemukan.");
  }

  const [mediaByBarangId, transactionByPemasaranId] = await Promise.all([
    getMarketingMediaByBarangIds([row.item.id]),
    getLatestTransactionsByPemasaranIds([row.marketing.id])
  ]);

  const shouldRevealBids = !row.marketing.endsAt || row.marketing.endsAt.getTime() <= Date.now();
  const bidRows = shouldRevealBids
      ? await db
        .select({
          bid: {
            id: bids.id,
            userId: bids.userId,
            createdAt: bids.createdAt,
            revealedAt: bids.revealedAt
          },
          bidderName: users.name
        })
        .from(bids)
        .innerJoin(users, eq(users.id, bids.userId))
        .where(eq(bids.pemasaranId, row.marketing.id))
        .orderBy(asc(bids.createdAt))
    : [];

  return serializeAdminPemasaran(row.marketing, {
    lotName: row.item.name,
    lotCode: row.item.code,
    lotCategory: row.item.category,
    lotCondition: row.item.condition,
    media: mediaByBarangId.get(row.item.id) ?? [],
    bidCount: Number(row.bidCount ?? 0),
    winnerName: row.winnerName ?? null,
    transaction: transactionByPemasaranId.get(row.marketing.id) ?? null,
    bids: bidRows
  });
}
