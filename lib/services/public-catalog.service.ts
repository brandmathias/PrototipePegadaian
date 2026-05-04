import { and, asc, desc, eq, inArray } from "drizzle-orm";

import { serializePublicLot } from "@/lib/buyer/serializers";
import { db } from "@/lib/db/client";
import { barang, mediaBarang, pemasaran, unitAccounts, units } from "@/lib/db/schema";

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
  const rows = await db
    .select(publicLotSelection())
    .from(pemasaran)
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .innerJoin(units, eq(units.id, barang.unitId))
    .leftJoin(unitAccounts, and(eq(unitAccounts.unitId, barang.unitId), eq(unitAccounts.isActive, true)))
    .where(and(eq(pemasaran.status, "aktif"), eq(barang.status, "dipasarkan"), eq(units.isActive, true)))
    .orderBy(desc(pemasaran.createdAt));

  const mediaByBarangId = await getMediaByBarangId(rows.map((row) => row.itemId));

  return rows.map((row) =>
    serializePublicLot({
      ...row,
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

  const mediaByBarangId = await getMediaByBarangId([row.itemId]);

  return serializePublicLot({
    ...row,
    media: mediaByBarangId.get(row.itemId) ?? []
  });
}
