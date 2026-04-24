import { AdminTransactionsPage } from "@/components/pages/admin-pages";
import { getAdminUnitPageContext } from "@/lib/admin-unit/page-context";
import { listAdminTransactions } from "@/lib/services/admin-transaction.service";

export default async function Page() {
  const { unitId } = await getAdminUnitPageContext();
  const transactions = await listAdminTransactions(unitId);

  return <AdminTransactionsPage transactions={transactions} />;
}
