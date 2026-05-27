import { and, asc, desc, eq, inArray } from "drizzle-orm";

import { serializePublicLot } from "@/lib/buyer/serializers";
import { db } from "@/lib/db/client";
import { barang, mediaBarang, pemasaran, unitAccounts, units } from "@/lib/db/schema";
import { getLotStatsByIds } from "@/lib/services/public-lot-stats.service";

function publicLotSelection() {
  return {
    marketingId: pemasaran.id,
    marketingMode: pemasaran.mode,
    marketingPrice: pemasaran.price,
    marketingBasePrice: pemasaran.basePrice,
    startsAt: pemasaran.startsAt,
    endsAt: pemasaran.endsAt,
    itemId: barang.id,
    itemCode: barang.code,
    itemName: barang.name,
    category: barang.category,
    condition: barang.condition,
    description: barang.description,
    specifications: barang.specifications,
    updatedAt: barang.updatedAt,
    unitName: units.name,
    unitAddress: units.address,
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

export async function listPublicLots() {
  return listPublicLotsWithLimit();
}

export async function listPublicLotsWithLimit(limit?: number) {
  const baseQuery = db
    .select(publicLotSelection())
    .from(pemasaran)
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .innerJoin(units, eq(units.id, barang.unitId))
    .leftJoin(unitAccounts, and(eq(unitAccounts.unitId, barang.unitId), eq(unitAccounts.isActive, true)))
    .where(and(eq(pemasaran.status, "aktif"), eq(barang.status, "dipasarkan"), eq(units.isActive, true)))
    .orderBy(desc(pemasaran.createdAt));

  const limitedRows = await (typeof limit === "number" ? baseQuery.limit(limit) : baseQuery);

  const [mediaByBarangId, statsByMarketingId] = await Promise.all([
    getMediaByBarangId(limitedRows.map((row) => row.itemId)),
    getLotStatsByIds(limitedRows.map((row) => row.marketingId))
  ]);

  return limitedRows.map((row) =>
    serializePublicLot({
      ...row,
      insights: statsByMarketingId.get(row.marketingId),
      media: mediaByBarangId.get(row.itemId) ?? []
    })
  );
}

export async function getPublicLotById(pemasaranId: string) {
  const [row] = await db
    .select(publicLotSelection())
    .from(pemasaran)
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .innerJoin(units, eq(units.id, barang.unitId))
    .leftJoin(unitAccounts, and(eq(unitAccounts.unitId, barang.unitId), eq(unitAccounts.isActive, true)))
    .where(and(eq(pemasaran.id, pemasaranId), eq(pemasaran.status, "aktif"), eq(units.isActive, true)))
    .limit(1);

  if (!row) {
    return null;
  }

  const [mediaByBarangId, statsByMarketingId] = await Promise.all([
    getMediaByBarangId([row.itemId]),
    getLotStatsByIds([row.marketingId])
  ]);

  return serializePublicLot({
    ...row,
    insights: statsByMarketingId.get(row.marketingId),
    media: mediaByBarangId.get(row.itemId) ?? []
  });
}
