import { and, asc, desc, eq, gt, inArray, isNull, lte, ne, notExists, or, sql } from "drizzle-orm";

import { FIXED_PRICE_TRANSACTION_CATALOG_HIDDEN_STATUSES } from "@/lib/buyer/fixed-price-visibility";
import { serializePublicLot } from "@/lib/buyer/serializers";
import { db } from "@/lib/db/client";
import { barang, mediaBarang, pemasaran, transaksi, unitAccounts, units } from "@/lib/db/schema";
import { getLotStatsByIds } from "@/lib/services/public-lot-stats.service";

function publicLotSelection() {
  return {
    marketingId: pemasaran.id,
    marketingMode: pemasaran.mode,
    marketingCreatedAt: pemasaran.createdAt,
    marketingIteration: pemasaran.iteration,
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
    unitDomicile: units.domicile,
    account: unitAccounts
  };
}

export function sortPublicCatalogRowsByLatestListing<
  T extends { marketingCreatedAt: Date; marketingId: string; marketingIteration?: number | null }
>(rows: T[]) {
  return [...rows].sort((left, right) => {
    const publishedTimeDifference = right.marketingCreatedAt.getTime() - left.marketingCreatedAt.getTime();
    if (publishedTimeDifference !== 0) {
      return publishedTimeDifference;
    }

    const iterationDifference = Number(right.marketingIteration ?? 0) - Number(left.marketingIteration ?? 0);
    if (iterationDifference !== 0) {
      return iterationDifference;
    }

    return right.marketingId.localeCompare(left.marketingId);
  });
}

function fixedPriceCatalogAvailabilityPredicate(now: Date) {
  return or(
    ne(pemasaran.mode, "fixed_price"),
    notExists(
      db
        .select({ id: transaksi.id })
        .from(transaksi)
        .where(
          and(
            eq(transaksi.pemasaranId, pemasaran.id),
            or(
              inArray(transaksi.status, FIXED_PRICE_TRANSACTION_CATALOG_HIDDEN_STATUSES),
              and(
                eq(transaksi.paymentMethod, "midtrans"),
                eq(transaksi.status, "menunggu_pembayaran"),
                gt(transaksi.paymentDeadline, now)
              )
            )
          )
        )
    )
  );
}

function vickreyCatalogAvailabilityPredicate(now: Date) {
  return or(ne(pemasaran.mode, "vickrey"), gt(pemasaran.endsAt, now));
}

function isVickreyCatalogAvailableAt(mode: string, endsAt: Date | null, now: Date) {
  return mode !== "vickrey" || Boolean(endsAt && endsAt.getTime() > now.getTime());
}

export type PublicCatalogUnitMetrics = {
  total: number;
  fixedPrice: number;
  vickrey: number;
};

export async function getPublicCatalogUnitMetrics(
  unitId: string
): Promise<PublicCatalogUnitMetrics> {
  const now = new Date();
  const visibleMarketing = await db
    .select({
      id: pemasaran.id,
      mode: pemasaran.mode,
      endsAt: pemasaran.endsAt
    })
    .from(pemasaran)
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .innerJoin(units, eq(units.id, barang.unitId))
    .where(
      and(
        eq(barang.unitId, unitId),
        eq(pemasaran.status, "aktif"),
        eq(barang.status, "dipasarkan"),
        eq(units.isActive, true),
        fixedPriceCatalogAvailabilityPredicate(now),
        vickreyCatalogAvailabilityPredicate(now)
      )
    );

  return visibleMarketing.filter((marketing) => isVickreyCatalogAvailableAt(marketing.mode, marketing.endsAt, now)).reduce<PublicCatalogUnitMetrics>(
    (metrics, marketing) => {
      metrics.total += 1;
      if (marketing.mode === "fixed_price") {
        metrics.fixedPrice += 1;
      } else if (marketing.mode === "vickrey") {
        metrics.vickrey += 1;
      }
      return metrics;
    },
    { total: 0, fixedPrice: 0, vickrey: 0 }
  );
}

async function getMediaByBarangId(
  barangIds: string[],
  options: { maxItemsPerBarang?: number } = {}
) {
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

  const maxItemsPerBarang = options.maxItemsPerBarang ?? Number.POSITIVE_INFINITY;

  return rows.reduce((map, media) => {
    const collection = map.get(media.barangId) ?? [];
    if (collection.length >= maxItemsPerBarang) {
      map.set(media.barangId, collection);
      return map;
    }

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
        eq(barang.status, "dipasarkan"),
        eq(units.isActive, true),
        fixedPriceCatalogAvailabilityPredicate(now),
        vickreyCatalogAvailabilityPredicate(now)
      )
    )
    .orderBy(
      desc(pemasaran.createdAt),
      desc(pemasaran.iteration),
      desc(pemasaran.id)
    );

  const limitedRows = await (typeof limit === "number" ? baseQuery.limit(limit) : baseQuery);
  const sortedRows = sortPublicCatalogRowsByLatestListing(
    limitedRows.filter((row) => isVickreyCatalogAvailableAt(row.marketingMode, row.endsAt, now))
  );

  const [mediaByBarangId, statsByMarketingId] = await Promise.all([
    getMediaByBarangId(sortedRows.map((row) => row.itemId), { maxItemsPerBarang: 1 }),
    getLotStatsByIds(sortedRows.map((row) => row.marketingId))
  ]);

  return sortedRows.map((row) =>
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
    getMediaByBarangId(limitedRows.map((row) => row.itemId), { maxItemsPerBarang: 1 }),
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

export async function getPublicLotById(
  pemasaranId: string,
  options: { includeUnavailableFixedPrice?: boolean } = {}
) {
  const now = new Date();
  const fixedPriceAvailabilityPredicate = options.includeUnavailableFixedPrice
    ? undefined
    : fixedPriceCatalogAvailabilityPredicate(now);
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
        fixedPriceAvailabilityPredicate,
        vickreyCatalogAvailabilityPredicate(now)
      )
    )
    .limit(1);

  if (!row || !isVickreyCatalogAvailableAt(row.marketingMode, row.endsAt, now)) {
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
