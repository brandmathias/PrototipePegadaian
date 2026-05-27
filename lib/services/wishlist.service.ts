import { randomUUID } from "node:crypto";

import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";

import { serializePublicLot } from "@/lib/buyer/serializers";
import type { BuyerWishlist, BuyerWishlistItem } from "@/lib/contracts/wishlist";
import { db } from "@/lib/db/client";
import { barang, buyerWishlist, mediaBarang, pemasaran, unitAccounts, units } from "@/lib/db/schema";
import { getLotStatsByIds } from "@/lib/services/public-lot-stats.service";
import { formatAppDateTime } from "@/lib/timezone";

function wishlistLotSelection() {
  return {
    wishlistId: buyerWishlist.id,
    wishlistCreatedAt: buyerWishlist.createdAt,
    marketingId: pemasaran.id,
    marketingMode: pemasaran.mode,
    marketingPrice: pemasaran.price,
    marketingBasePrice: pemasaran.basePrice,
    marketingStatus: pemasaran.status,
    startsAt: pemasaran.startsAt,
    endsAt: pemasaran.endsAt,
    itemId: barang.id,
    itemCode: barang.code,
    itemName: barang.name,
    itemStatus: barang.status,
    category: barang.category,
    condition: barang.condition,
    description: barang.description,
    specifications: barang.specifications,
    updatedAt: barang.updatedAt,
    unitName: units.name,
    unitAddress: units.address,
    unitIsActive: units.isActive,
    account: unitAccounts
  };
}

async function getMediaByBarangId(barangIds: string[]) {
  if (!barangIds.length) {
    return new Map<string, Array<{ id: string; type: string; url: string; fileName: string | null }>>();
  }

  const rows = await db
    .select({
      id: mediaBarang.id,
      barangId: mediaBarang.barangId,
      type: mediaBarang.type,
      url: mediaBarang.url,
      fileName: mediaBarang.fileName,
      sortOrder: mediaBarang.sortOrder
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
  }, new Map<string, Array<{ id: string; type: string; url: string; fileName: string | null }>>());
}

type WishlistAvailabilityRow = {
  unitIsActive: boolean;
  itemStatus: string;
  marketingStatus: string;
  marketingMode: string;
  endsAt: Date | null;
};

function getUnavailableReason(row: WishlistAvailabilityRow, now: Date) {
  if (row.unitIsActive === false) {
    return "Unit sedang tidak aktif";
  }

  if (row.itemStatus !== "dipasarkan") {
    return "Barang sudah tidak tersedia";
  }

  if (row.marketingStatus !== "aktif") {
    return "Sesi pemasaran sudah tidak aktif";
  }

  if (row.marketingMode === "vickrey" && row.endsAt && row.endsAt.getTime() <= now.getTime()) {
    return "Lelang sudah berakhir";
  }

  return null;
}

function serializeWishlistItem(
  row: Awaited<ReturnType<typeof getWishlistRows>>[number],
  media: Array<{ id: string; type: string; url: string; fileName: string | null }>,
  now: Date,
  insights?: BuyerWishlistItem["lot"]["insights"]
): BuyerWishlistItem {
  const unavailableReason = getUnavailableReason(row, now);
  const lot = serializePublicLot({
    ...row,
    insights,
    media
  });

  return {
    likedAt: formatAppDateTime(row.wishlistCreatedAt),
    isAvailable: !unavailableReason,
    ...(unavailableReason ? { unavailableReason } : {}),
    lot: unavailableReason ? { ...lot, status: "Tidak tersedia" } : lot
  };
}

async function getWishlistRows(userId: string) {
  return db
    .select(wishlistLotSelection())
    .from(buyerWishlist)
    .innerJoin(pemasaran, eq(pemasaran.id, buyerWishlist.pemasaranId))
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .innerJoin(units, eq(units.id, barang.unitId))
    .leftJoin(unitAccounts, and(eq(unitAccounts.unitId, barang.unitId), eq(unitAccounts.isActive, true)))
    .where(eq(buyerWishlist.userId, userId))
    .orderBy(desc(buyerWishlist.createdAt));
}

export async function getBuyerWishlistIds(userId: string) {
  const rows = await db
    .select({ pemasaranId: buyerWishlist.pemasaranId })
    .from(buyerWishlist)
    .where(eq(buyerWishlist.userId, userId));

  return rows.map((row) => row.pemasaranId);
}

export async function getBuyerWishlistCount(userId: string) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(buyerWishlist)
    .where(eq(buyerWishlist.userId, userId))
    .limit(1);

  return Number(row?.count ?? 0);
}

export async function listBuyerWishlist(userId: string): Promise<BuyerWishlist> {
  const rows = await getWishlistRows(userId);
  const [mediaByBarangId, statsByMarketingId] = await Promise.all([
    getMediaByBarangId(rows.map((row) => row.itemId)),
    getLotStatsByIds(rows.map((row) => row.marketingId))
  ]);
  const now = new Date();
  const items = rows.map((row) =>
    serializeWishlistItem(row, mediaByBarangId.get(row.itemId) ?? [], now, statsByMarketingId.get(row.marketingId))
  );

  return {
    activeItems: items.filter((item) => item.isAvailable),
    unavailableItems: items.filter((item) => !item.isAvailable)
  };
}

export async function toggleBuyerWishlist(userId: string, pemasaranId: string) {
  const [existing] = await db
    .select({ id: buyerWishlist.id })
    .from(buyerWishlist)
    .where(and(eq(buyerWishlist.userId, userId), eq(buyerWishlist.pemasaranId, pemasaranId)))
    .limit(1);

  if (existing) {
    await db
      .delete(buyerWishlist)
      .where(and(eq(buyerWishlist.userId, userId), eq(buyerWishlist.pemasaranId, pemasaranId)));

    return {
      favorited: false,
      count: await getBuyerWishlistCount(userId)
    };
  }

  await db
    .insert(buyerWishlist)
    .values({
      id: randomUUID(),
      userId,
      pemasaranId
    })
    .onConflictDoNothing({
      target: [buyerWishlist.userId, buyerWishlist.pemasaranId]
    });

  return {
    favorited: true,
    count: await getBuyerWishlistCount(userId)
  };
}

export async function removeBuyerWishlist(userId: string, pemasaranId: string) {
  await db
    .delete(buyerWishlist)
    .where(and(eq(buyerWishlist.userId, userId), eq(buyerWishlist.pemasaranId, pemasaranId)));

  return {
    favorited: false,
    count: await getBuyerWishlistCount(userId)
  };
}
