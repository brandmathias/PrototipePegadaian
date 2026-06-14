import { and, eq, inArray } from "drizzle-orm";

import {
  getAdminInventoryMetrics,
  isAdminMarketingActionable
} from "@/lib/admin-unit/operational-metrics";
import { db } from "@/lib/db/client";
import { barang, pemasaran } from "@/lib/db/schema";

function toDateInput(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : "-";
}

export async function getAdminLayoutMetrics(unitId: string) {
  const [inventoryRows, marketingRows] = await Promise.all([
    db
      .select({
        dueDate: barang.dueDate,
        status: barang.status
      })
      .from(barang)
      .where(and(eq(barang.unitId, unitId), inArray(barang.status, ["gadai", "jaminan"]))),
    db
      .select({
        endingAt: pemasaran.endsAt,
        mode: pemasaran.mode,
        status: pemasaran.status
      })
      .from(pemasaran)
      .innerJoin(barang, eq(barang.id, pemasaran.barangId))
      .where(and(eq(barang.unitId, unitId), eq(pemasaran.mode, "vickrey"), inArray(pemasaran.status, ["aktif", "gagal"])))
  ]);

  return {
    inventoryMetrics: getAdminInventoryMetrics(
      inventoryRows.map((item) => ({
        dueDate: toDateInput(item.dueDate),
        status: item.status
      }))
    ),
    marketingActionCount: marketingRows.filter((item) =>
      isAdminMarketingActionable({
        endingAt: item.endingAt?.toISOString() ?? null,
        mode: item.mode,
        status: item.status
      })
    ).length
  };
}
