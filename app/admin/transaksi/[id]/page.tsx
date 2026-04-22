import { AdminTransactionDetailPage } from "@/components/pages/admin-pages";

export default async function Page({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <AdminTransactionDetailPage transactionId={id} />;
}
