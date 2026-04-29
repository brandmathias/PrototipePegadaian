import { and, eq, inArray, isNotNull, sql } from "drizzle-orm";

import { serializePublicLot } from "@/lib/buyer/serializers";
import { db } from "@/lib/db/client";
import { barang, pemasaran, transaksi, unitAccounts, units } from "@/lib/db/schema";

type LandingStat = {
  label: string;
  value: string;
};

type PublicHomeLotShape = {
  marketingId: string;
  marketingMode: string;
  marketingPrice: string | null;
  marketingBasePrice: string | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  itemId: string;
  itemCode: string;
  itemName: string;
  category: string;
  condition: string;
  description: string;
  unitName: string;
  unitAddress: string;
  account: {
    bankName: string | null;
    accountNumber: string | null;
    accountHolderName: string | null;
    branchName?: string | null;
  } | null;
};

function formatCount(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function publicHomeSelection() {
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

export async function getPublicHomeData() {
  const [summary] = await db
    .select({
      activeLots: sql<number>`count(distinct ${pemasaran.id}) filter (where ${pemasaran.status} = 'aktif' and ${barang.status} = 'dipasarkan')`,
      activeUnits: sql<number>`count(distinct ${units.id}) filter (where ${units.isActive} = true)`,
      activeVickrey: sql<number>`count(distinct ${pemasaran.id}) filter (where ${pemasaran.status} = 'aktif' and ${pemasaran.mode} = 'vickrey' and ${pemasaran.endsAt} is not null and ${pemasaran.endsAt} > now())`,
      verifiedTransactions: sql<number>`count(distinct ${transaksi.id}) filter (where ${transaksi.status} = 'lunas')`
    })
    .from(pemasaran)
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .innerJoin(units, eq(units.id, barang.unitId))
    .leftJoin(transaksi, eq(transaksi.pemasaranId, pemasaran.id));

  const featuredRows = await db
    .select(publicHomeSelection())
    .from(pemasaran)
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .innerJoin(units, eq(units.id, barang.unitId))
    .leftJoin(unitAccounts, and(eq(unitAccounts.unitId, barang.unitId), eq(unitAccounts.isActive, true)))
    .where(
      and(
        eq(pemasaran.status, "aktif"),
        eq(barang.status, "dipasarkan"),
        eq(units.isActive, true),
        isNotNull(pemasaran.createdAt)
      )
    )
    .orderBy(
      sql`case when ${pemasaran.mode} = 'vickrey' then 0 else 1 end`,
      sql`${pemasaran.endsAt} asc nulls last`,
      sql`${pemasaran.createdAt} desc`
    )
    .limit(3);

  const featuredLots = featuredRows.map((row) => serializePublicLot(row as PublicHomeLotShape));

  const stats: LandingStat[] = [
    { label: "Barang dipasarkan", value: formatCount(Number(summary?.activeLots ?? 0)) },
    { label: "Unit aktif", value: formatCount(Number(summary?.activeUnits ?? 0)) },
    { label: "Lelang aktif", value: formatCount(Number(summary?.activeVickrey ?? 0)) },
    { label: "Transaksi lunas", value: formatCount(Number(summary?.verifiedTransactions ?? 0)) }
  ];

  return {
    featuredLots,
    stats
  };
}
