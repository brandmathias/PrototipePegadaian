import Link from "next/link";
import { ArrowRight, Clock3, MapPin } from "lucide-react";

import { LiveCountdown } from "@/components/buyer/live-countdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Lot } from "@/lib/contracts/catalog";
import { currency } from "@/lib/formatters/currency";
import { LotFigure } from "./lot-figure";

type LotCardProps = {
  lot: Lot;
};

export function LotCard({ lot }: LotCardProps) {
  const showAuctionCountdown = lot.mode === "vickrey" && (lot.countdown || lot.endsAt);

  return (
    <Card className="group overflow-hidden rounded-[1.75rem] bg-surface-lowest p-0 transition-transform duration-300 hover:-translate-y-1">
      <LotFigure category={lot.category} className="rounded-b-none rounded-t-[1.75rem]" />
      <div className="space-y-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={lot.mode === "vickrey" ? "accent" : "default"}>
              {lot.mode === "vickrey" ? "Vickrey" : "Fixed Price"}
            </Badge>
            <Badge variant="muted">{lot.code}</Badge>
          </div>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3.5" />
            {lot.city}
          </span>
        </div>
        <div className="space-y-2">
          <h3 className="font-headline text-xl font-bold tracking-tight text-foreground">
            {lot.name}
          </h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{lot.description}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            {lot.mode === "vickrey" ? "Harga Dasar" : "Harga Jual"}
          </p>
          <p className="font-headline text-2xl font-extrabold tracking-tight text-primary">
            {currency.format(lot.price)}
          </p>
          {showAuctionCountdown ? (
            <p className="inline-flex items-center gap-1 text-xs font-medium text-tertiary-container">
              <Clock3 className="size-3.5" />
              <LiveCountdown
                expiredLabel="Menunggu hasil"
                fallbackLabel={lot.countdown}
                prefix="Sesi berakhir"
                targetAt={lot.endsAt}
              />
            </p>
          ) : null}
        </div>
        <div className="rounded-2xl border border-border/70 bg-white/80 p-4 text-sm leading-relaxed text-muted-foreground">
          {lot.mode === "vickrey"
            ? "Masukkan bid tertutup sebelum batas waktu. Jika menang, pembayaran dilanjutkan dari halaman transaksi."
            : "Pilih metode pembayaran setelah konfirmasi pembelian. Bukti transfer atau pembayaran langsung diverifikasi manual oleh unit."}
        </div>
        <div className="rounded-2xl bg-surface-low p-4 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">{lot.unitName}</p>
          <p className="mt-1">{lot.location}</p>
        </div>
        <Link href={`/katalog/${lot.id}`}>
          <Button className="w-full" variant="default">
            {lot.mode === "vickrey" ? "Lihat Detail & Ikut Lelang" : "Lihat Detail & Beli"}
            <ArrowRight className="size-4" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}
