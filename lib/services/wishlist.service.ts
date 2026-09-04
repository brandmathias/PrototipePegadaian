import { randomUUID } from "node:crypto";

import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";

import { serializePublicLot } from "@/lib/buyer/serializers";
import type { BuyerWishlist, BuyerWishlistItem } from "@/lib/contracts/wishlist";
import { db } from "@/lib/db/client";
import { barang, buyerWishlist, mediaBarang, pemasaran, unitAccounts, units } from "@/lib/db/schema";
import { getLotStatsByIds } from "@/lib/services/public-lot-stats.service";
import { publicCatalogVisibilityConditions } from "@/lib/services/public-catalog.service";
import { revalidateLotInsightsViews } from "@/lib/services/revalidate-lot-insights-views";
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

function isCatalogVisibleWishlistRow(
  row: Awaited<ReturnType<typeof getWishlistRows>>[number],
  now: Date
) {
  return (
    row.unitIsActive &&
    row.itemStatus === "dipasarkan" &&
    row.marketingStatus === "aktif" &&
    (row.marketingMode !== "vickrey" || Boolean(row.endsAt && row.endsAt.getTime() > now.getTime()))
  );
}

function serializeWishlistItem(
  row: Awaited<ReturnType<typeof getWishlistRows>>[number],
  media: Array<{ id: string; type: string; url: string; fileName: string | null }>,
  insights?: BuyerWishlistItem["lot"]["insights"]
): BuyerWishlistItem {
  const lot = serializePublicLot({
    ...row,
    insights,
    media
  });

  return {
    likedAt: formatAppDateTime(row.wishlistCreatedAt),
    isAvailable: true,
    lot
  };
}

async function getWishlistRows(userId: string, now: Date) {
  return db
    .select(wishlistLotSelection())
    .from(buyerWishlist)
    .innerJoin(pemasaran, eq(pemasaran.id, buyerWishlist.pemasaranId))
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .innerJoin(units, eq(units.id, barang.unitId))
    .leftJoin(unitAccounts, and(eq(unitAccounts.unitId, barang.unitId), eq(unitAccounts.isActive, true)))
    .where(and(eq(buyerWishlist.userId, userId), publicCatalogVisibilityConditions(now)))
    .orderBy(desc(buyerWishlist.createdAt));
}

export async function getBuyerWishlistIds(userId: string) {
  const now = new Date();
  const rows = await db
    .select({ pemasaranId: buyerWishlist.pemasaranId })
    .from(buyerWishlist)
    .innerJoin(pemasaran, eq(pemasaran.id, buyerWishlist.pemasaranId))
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .innerJoin(units, eq(units.id, barang.unitId))
    .where(and(eq(buyerWishlist.userId, userId), publicCatalogVisibilityConditions(now)));

  return rows.map((row) => row.pemasaranId);
}

export async function isBuyerWishlistItem(userId: string, pemasaranId: string) {
  const now = new Date();
  const [row] = await db
    .select({ id: buyerWishlist.id })
    .from(buyerWishlist)
    .innerJoin(pemasaran, eq(pemasaran.id, buyerWishlist.pemasaranId))
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .innerJoin(units, eq(units.id, barang.unitId))
    .where(
      and(
        eq(buyerWishlist.userId, userId),
        eq(buyerWishlist.pemasaranId, pemasaranId),
        publicCatalogVisibilityConditions(now)
      )
    )
    .limit(1);

  return Boolean(row);
}

export async function getBuyerWishlistCount(userId: string) {
  const now = new Date();
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(buyerWishlist)
    .innerJoin(pemasaran, eq(pemasaran.id, buyerWishlist.pemasaranId))
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .innerJoin(units, eq(units.id, barang.unitId))
    .where(and(eq(buyerWishlist.userId, userId), publicCatalogVisibilityConditions(now)))
    .limit(1);

  return Number(row?.count ?? 0);
}

export async function listBuyerWishlist(userId: string): Promise<BuyerWishlist> {
  const now = new Date();
  const rows = (await getWishlistRows(userId, now)).filter((row) => isCatalogVisibleWishlistRow(row, now));
  const [mediaByBarangId, statsByMarketingId] = await Promise.all([
    getMediaByBarangId(rows.map((row) => row.itemId)),
    getLotStatsByIds(rows.map((row) => row.marketingId))
  ]);
  const items = rows.map((row) =>
    serializeWishlistItem(row, mediaByBarangId.get(row.itemId) ?? [], statsByMarketingId.get(row.marketingId))
  );

  return {
    activeItems: items,
    unavailableItems: []
  };
}

async function isCatalogWishlistEligible(pemasaranId: string) {
  const [row] = await db
    .select({ id: pemasaran.id })
    .from(pemasaran)
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .innerJoin(units, eq(units.id, barang.unitId))
    .where(and(eq(pemasaran.id, pemasaranId), publicCatalogVisibilityConditions(new Date())))
    .limit(1);

  return Boolean(row);
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

    revalidateLotInsightsViews();

    return {
      favorited: false,
      count: await getBuyerWishlistCount(userId)
    };
  }

  if (!(await isCatalogWishlistEligible(pemasaranId))) {
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

  revalidateLotInsightsViews();

  return {
    favorited: true,
    count: await getBuyerWishlistCount(userId)
  };
}

export async function removeBuyerWishlist(userId: string, pemasaranId: string) {
  await db
    .delete(buyerWishlist)
    .where(and(eq(buyerWishlist.userId, userId), eq(buyerWishlist.pemasaranId, pemasaranId)));

  revalidateLotInsightsViews();

  return {
    favorited: false,
    count: await getBuyerWishlistCount(userId)
  };
}
