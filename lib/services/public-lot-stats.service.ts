import { randomUUID } from "node:crypto";

import { eq, inArray, sql } from "drizzle-orm";

import type { LotInsights } from "@/lib/contracts/catalog";
import { db } from "@/lib/db/client";
import { bids, buyerWishlist, pemasaranViews } from "@/lib/db/schema";

export const EMPTY_LOT_INSIGHTS: LotInsights = {
  likes: 0,
  participants: 0,
  views: 0
};

function createStatsMap(ids: string[]) {
  return new Map(ids.map((id) => [id, { ...EMPTY_LOT_INSIGHTS }]));
}

function normalizeCount(value: unknown) {
  return Number(value ?? 0);
}

export function reconcileLotInsights(insights: LotInsights): LotInsights {
  return {
    ...insights,
    views: Math.max(insights.views, insights.participants)
  };
}

export async function getLotStatsByIds(pemasaranIds: string[]) {
  const uniqueIds = Array.from(new Set(pemasaranIds.filter(Boolean)));
  const stats = createStatsMap(uniqueIds);

  if (!uniqueIds.length) {
    return stats;
  }

  const [viewRows, likeRows, participantRows] = await Promise.all([
    db
      .select({
        count: sql<number>`count(*)::int`,
        pemasaranId: pemasaranViews.pemasaranId
      })
      .from(pemasaranViews)
      .where(inArray(pemasaranViews.pemasaranId, uniqueIds))
      .groupBy(pemasaranViews.pemasaranId),
    db
      .select({
        count: sql<number>`count(*)::int`,
        pemasaranId: buyerWishlist.pemasaranId
      })
      .from(buyerWishlist)
      .where(inArray(buyerWishlist.pemasaranId, uniqueIds))
      .groupBy(buyerWishlist.pemasaranId),
    db
      .select({
        count: sql<number>`count(*)::int`,
        pemasaranId: bids.pemasaranId
      })
      .from(bids)
      .where(inArray(bids.pemasaranId, uniqueIds))
      .groupBy(bids.pemasaranId)
  ]);

  for (const row of viewRows) {
    const current = stats.get(row.pemasaranId);
    if (current) current.views = normalizeCount(row.count);
  }

  for (const row of likeRows) {
    const current = stats.get(row.pemasaranId);
    if (current) current.likes = normalizeCount(row.count);
  }

  for (const row of participantRows) {
    const current = stats.get(row.pemasaranId);
    if (current) current.participants = normalizeCount(row.count);
  }

  for (const [pemasaranId, insights] of stats) {
    stats.set(pemasaranId, reconcileLotInsights(insights));
  }

  return stats;
}

export async function getLotStats(pemasaranId: string) {
  const stats = await getLotStatsByIds([pemasaranId]);
  return stats.get(pemasaranId) ?? { ...EMPTY_LOT_INSIGHTS };
}

export async function recordLotView(pemasaranId: string, viewerKey: string) {
  const normalizedViewerKey = viewerKey.trim().slice(0, 160);

  if (!normalizedViewerKey) {
    return getLotStats(pemasaranId);
  }

  await db
    .insert(pemasaranViews)
    .values({
      id: randomUUID(),
      pemasaranId,
      viewerKey: normalizedViewerKey
    })
    .onConflictDoUpdate({
      set: {
        updatedAt: sql`now()`
      },
      target: [pemasaranViews.pemasaranId, pemasaranViews.viewerKey]
    });

  return getLotStats(pemasaranId);
}
