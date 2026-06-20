import { AdminTransactionReceiptPage } from "@/components/pages/admin-transaction-pages";
import { getAppPathFromRequestHeaders, getSuperAdminSessionUser } from "@/lib/auth/session";
import { getSuperAdminTransactionById } from "@/lib/services/admin-transaction.service";

export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ output?: string }>;
}) {
  const { id } = await params;
  const query = searchParams ? await searchParams : undefined;
  const currentPath = await getAppPathFromRequestHeaders();

  await getSuperAdminSessionUser(currentPath);

  const transaction = await getSuperAdminTransactionById(id);

  return (
    <AdminTransactionReceiptPage
      backHref="/superadmin/monitoring-unit"
      backLabel="Kembali ke monitoring"
      outputMode={query?.output}
      transaction={transaction}
    />
  );
}
