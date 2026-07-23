import { and, eq, inArray } from "drizzle-orm";

import { getAdminInventoryMetrics } from "@/lib/admin-unit/operational-metrics";
import { db } from "@/lib/db/client";
import { barang } from "@/lib/db/schema";

export async function getAdminLayoutMetrics(unitId: string) {
  const inventoryRows = await db
    .select({
      dueDate: barang.dueDate,
      status: barang.status
    })
    .from(barang)
    .where(and(eq(barang.unitId, unitId), inArray(barang.status, ["gadai", "jaminan"])));

  return {
    inventoryMetrics: getAdminInventoryMetrics(
      inventoryRows.map((item) => ({
        dueAt: item.dueDate?.toISOString() ?? null,
        status: item.status
      }))
    )
  };
}
