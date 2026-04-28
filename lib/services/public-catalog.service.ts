import { and, desc, eq } from "drizzle-orm";

import { serializePublicLot } from "@/lib/buyer/serializers";
import { db } from "@/lib/db/client";
import { barang, pemasaran, unitAccounts, units } from "@/lib/db/schema";

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

export async function listPublicLots() {
  const rows = await db
    .select(publicLotSelection())
    .from(pemasaran)
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .innerJoin(units, eq(units.id, barang.unitId))
    .leftJoin(unitAccounts, and(eq(unitAccounts.unitId, barang.unitId), eq(unitAccounts.isActive, true)))
    .where(and(eq(pemasaran.status, "aktif"), eq(barang.status, "dipasarkan"), eq(units.isActive, true)))
    .orderBy(desc(pemasaran.createdAt));

  return rows.map(serializePublicLot);
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

  return row ? serializePublicLot(row) : null;
}
