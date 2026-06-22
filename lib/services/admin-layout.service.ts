import { and, eq, inArray } from "drizzle-orm";

import { getAdminInventoryMetrics } from "@/lib/admin-unit/operational-metrics";
import { db } from "@/lib/db/client";
import { barang } from "@/lib/db/schema";

function toDateInput(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : "-";
}

export async function getAdminLayoutMetrics(unitId: string) {
  const inventoryRows = await db
    .select({
      dueDate: barang.dueDate,
      status: barang.status
    })
    .from(barang)
    .where(and(eq(barang.unitId, unitId), inArray(barang.status, ["gadai", "jaminan", "gagal"])));

  return {
    inventoryMetrics: getAdminInventoryMetrics(
      inventoryRows.map((item) => ({
        dueDate: toDateInput(item.dueDate),
        status: item.status
      }))
    )
  };
}
