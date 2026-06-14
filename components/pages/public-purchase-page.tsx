import { notFound } from "next/navigation";

import { PurchaseWorkflow } from "@/components/buyer/purchase-workflow";
import { SectionHeading } from "@/components/shared/section-heading";
import type { Lot } from "@/lib/contracts/catalog";

export function PurchasePage({ lot }: { lot: Lot | null }) {
  if (!lot) notFound();
  if (lot.mode !== "fixed_price") notFound();

  return (
    <div className="container space-y-8 py-10 md:space-y-10 md:py-12">
      <SectionHeading
        description="Fixed price menggunakan transfer bank. Buat transaksi, lalu selesaikan pembayaran dari workflow detail transaksi."
        eyebrow="Pembayaran Harga Tetap"
        title="Detail pembayaran"
      />
      <PurchaseWorkflow lot={lot} />
    </div>
  );
}
