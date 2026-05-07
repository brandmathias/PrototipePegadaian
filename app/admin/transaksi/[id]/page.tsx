import { AdminTransactionDetailWorkspacePage } from "@/components/pages/admin-transaction-pages";
import { getAdminUnitPageContext } from "@/lib/admin-unit/page-context";
import { getAdminTransactionById } from "@/lib/services/admin-transaction.service";

export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const query = searchParams ? await searchParams : undefined;
  const { unitId } = await getAdminUnitPageContext();
  const transaction = await getAdminTransactionById(unitId, id);
  const from = query?.from;
  const backHref =
    from === "verification"
      ? "/admin/transaksi/verifikasi-pembayaran"
      : from === "history"
        ? "/admin/transaksi/riwayat"
        : "/admin/transaksi";
  const backLabel =
    from === "verification"
      ? "Kembali ke verifikasi pembayaran"
      : from === "history"
        ? "Kembali ke riwayat"
        : "Kembali ke transaksi";

  return (
    <AdminTransactionDetailWorkspacePage
      backHref={backHref}
      backLabel={backLabel}
      transaction={transaction}
    />
  );
}
