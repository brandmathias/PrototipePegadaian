import { listAdminBarang } from "@/lib/services/admin-barang.service";
import { listAdminBlacklist } from "@/lib/services/admin-blacklist.service";
import { listAdminTransactions } from "@/lib/services/admin-transaction.service";
import { db } from "@/lib/db/client";
import { unitAccounts, units } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function getAdminDashboardData(unitId: string) {
  const [inventory, transactions, blacklist, [unit], [activeAccount]] = await Promise.all([
    listAdminBarang(unitId),
    listAdminTransactions(unitId),
    listAdminBlacklist(unitId),
    db.select().from(units).where(eq(units.id, unitId)).limit(1),
    db
      .select()
      .from(unitAccounts)
      .where(and(eq(unitAccounts.unitId, unitId), eq(unitAccounts.isActive, true)))
      .limit(1)
  ]);

  return {
    summary: {
      unitName: unit?.name ?? "Admin Unit",
      subtitle: "Ringkasan operasional unit",
      activeBank: activeAccount
        ? `${activeAccount.bankName} ${activeAccount.accountNumber}`
        : "Rekening aktif belum tersedia"
    },
    inventory,
    transactions,
    blacklist
  };
}
