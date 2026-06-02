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
      ? "/admin/pemasaran"
      : from === "history"
        ? "/admin/barang/riwayat"
        : from === "vickrey"
          ? "/admin/pemasaran"
          : "/admin/pemasaran";
  const backLabel =
    from === "verification"
      ? "Kembali ke pemasaran"
      : from === "history"
        ? "Kembali ke riwayat barang"
        : from === "vickrey"
          ? "Kembali ke pemasaran"
          : "Kembali ke pemasaran";

  return (
    <AdminTransactionDetailWorkspacePage
      backHref={backHref}
      backLabel={backLabel}
      serverNow={new Date().toISOString()}
      transaction={transaction}
    />
  );
}
