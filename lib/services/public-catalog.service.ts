import { and, asc, desc, eq, gt, inArray, isNull, lte, ne, notExists, or } from "drizzle-orm";

import { serializePublicLot } from "@/lib/buyer/serializers";
import { db } from "@/lib/db/client";
import { barang, mediaBarang, pemasaran, transaksi, unitAccounts, units } from "@/lib/db/schema";
import { getLotStatsByIds } from "@/lib/services/public-lot-stats.service";

const FIXED_PRICE_CATALOG_LOCKED_TRANSACTION_STATUSES = [
  "bukti_diunggah",
  "menunggu_konfirmasi_langsung",
  "lunas",
  "selesai"
];

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

function fixedPriceCatalogAvailabilityPredicate() {
  return or(
    ne(pemasaran.mode, "fixed_price"),
    notExists(
      db
        .select({ id: transaksi.id })
        .from(transaksi)
        .where(
          and(
            eq(transaksi.pemasaranId, pemasaran.id),
            inArray(transaksi.status, FIXED_PRICE_CATALOG_LOCKED_TRANSACTION_STATUSES)
          )
        )
    )
  );
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
    .where(
      and(
        eq(pemasaran.status, "aktif"),
        eq(barang.status, "dipasarkan"),
        eq(units.isActive, true),
        fixedPriceCatalogAvailabilityPredicate()
      )
    )
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

export async function listOngoingVickreyLotsWithLimit(limit?: number) {
  const now = new Date();
  const baseQuery = db
    .select(publicLotSelection())
    .from(pemasaran)
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .innerJoin(units, eq(units.id, barang.unitId))
    .leftJoin(unitAccounts, and(eq(unitAccounts.unitId, barang.unitId), eq(unitAccounts.isActive, true)))
    .where(
      and(
        eq(pemasaran.status, "aktif"),
        eq(pemasaran.mode, "vickrey"),
        or(isNull(pemasaran.startsAt), lte(pemasaran.startsAt, now)),
        gt(pemasaran.endsAt, now),
        eq(barang.status, "dipasarkan"),
        eq(units.isActive, true)
      )
    )
    .orderBy(asc(pemasaran.endsAt), desc(pemasaran.createdAt));

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
    .where(
      and(
        eq(pemasaran.id, pemasaranId),
        eq(pemasaran.status, "aktif"),
        eq(barang.status, "dipasarkan"),
        eq(units.isActive, true),
        fixedPriceCatalogAvailabilityPredicate()
      )
    )
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
