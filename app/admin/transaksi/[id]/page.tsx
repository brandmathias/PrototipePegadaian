import { AdminTransactionDetailPage } from "@/components/pages/admin-pages";
import { getAdminUnitPageContext } from "@/lib/admin-unit/page-context";
import { getAdminTransactionById } from "@/lib/services/admin-transaction.service";

export default async function Page({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { unitId } = await getAdminUnitPageContext();
  const transaction = await getAdminTransactionById(unitId, id);

  return <AdminTransactionDetailPage transaction={transaction} transactionId={id} />;
}
