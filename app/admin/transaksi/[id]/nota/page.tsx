import { AdminTransactionReceiptPage } from "@/components/pages/admin-transaction-pages";
import { getAdminUnitPageContext } from "@/lib/admin-unit/page-context";
import { getAdminTransactionById } from "@/lib/services/admin-transaction.service";

export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ output?: string }>;
}) {
  const { id } = await params;
  const query = searchParams ? await searchParams : undefined;
  const { unitId } = await getAdminUnitPageContext();
  const transaction = await getAdminTransactionById(unitId, id);

  return <AdminTransactionReceiptPage outputMode={query?.output} transaction={transaction} />;
}
