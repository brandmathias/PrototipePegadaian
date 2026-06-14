import Link from "next/link";
import { notFound } from "next/navigation";

import { VickreyBidForm } from "@/components/buyer/vickrey-bid-form";
import { SectionHeading } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";
import type { BuyerBid } from "@/lib/contracts/buyer";
import type { Lot } from "@/lib/contracts/catalog";

type BuyerPublicStatus = {
  blacklist: {
    active: boolean;
    until: Date | null;
    totalViolations: number;
  };
} | null;

export function BidPage({
  lot,
  bidState,
  buyerId,
  buyerStatus = null
}: {
  lot: Lot | null;
  bidState: BuyerBid | null;
  buyerId?: string | null;
  buyerStatus?: BuyerPublicStatus;
}) {
  if (!lot || lot.mode !== "vickrey") {
    notFound();
  }

  const serverNow = new Date().toISOString();

  return (
    <div className="container space-y-8 py-10 md:space-y-10 md:py-12">
      <SectionHeading
        action={
          <Link href={`/katalog/${lot.id}`}>
            <Button variant="secondary">Kembali ke Detail Lelang</Button>
          </Link>
        }
        description="Masukkan bid tertutup dengan nominal minimal sama dengan harga dasar. Hasil lelang baru dibuka sistem setelah sesi berakhir."
        eyebrow="Bid Tertutup"
        title="Kirim penawaran untuk sesi Lelang Tertutup"
      />
      <VickreyBidForm
        buyerId={buyerId}
        existingBidAmount={bidState?.bidAmount}
        existingBidStatus={bidState?.status}
        hasExistingBid={Boolean(bidState)}
        isBlacklisted={Boolean(buyerStatus?.blacklist.active)}
        blacklistUntil={buyerStatus?.blacklist.until ?? null}
        blacklistViolations={buyerStatus?.blacklist.totalViolations ?? 0}
        lot={lot}
        serverNow={serverNow}
      />
    </div>
  );
}
