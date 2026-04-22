"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Clock3, Gavel, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { currency, userSummary, type Lot } from "@/lib/mock-data";

type VickreyBidFormProps = {
  lot: Lot;
  existingBidAmount?: number;
  existingBidStatus?: string;
};

export function VickreyBidForm({
  lot,
  existingBidAmount,
  existingBidStatus
}: VickreyBidFormProps) {
  const [bidAmount, setBidAmount] = useState(
    existingBidAmount ? String(existingBidAmount) : String(lot.price)
  );

  const numericBid = Number(bidAmount || 0);
  const invalidBid = Number.isNaN(numericBid) || numericBid < lot.price;
  const blocked = userSummary.blacklist.active;

  const helperText = useMemo(() => {
    if (blocked) {
      return `Akun sedang dibatasi sampai ${userSummary.blacklist.until}. Selama masa blacklist aktif, Anda tidak dapat ikut lelang Vickrey.`;
    }

    if (existingBidAmount) {
      return `Bid terakhir Anda sebesar ${currency.format(existingBidAmount)} dan saat ini tercatat dengan status ${existingBidStatus?.toLowerCase()}.`;
    }

    if (invalidBid) {
      return `Nominal penawaran minimal harus sama atau lebih tinggi dari harga dasar ${currency.format(lot.price)}.`;
    }

    return "Penawaran bersifat tertutup dan baru dibuka sistem setelah sesi lelang berakhir.";
  }, [blocked, existingBidAmount, existingBidStatus, invalidBid, lot.price]);

  return (
    <Card className="overflow-hidden border border-border/70 bg-white">
      <CardHeader className="space-y-3 border-b border-border/60 bg-surface-low/60">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-secondary">
          Lelang Vickrey
        </p>
        <CardTitle>Masukkan penawaran tertutup Anda</CardTitle>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Sesuai PRD, bid tertinggi memenangkan lelang, tetapi harga yang dibayar mengikuti
          penawar tertinggi kedua. Jika hanya ada satu penawar, pembayaran tetap mengikuti
          harga dasar.
        </p>
      </CardHeader>

      <CardContent className="grid gap-6 p-6 lg:grid-cols-[0.86fr_1.14fr]">
        <div className="space-y-5">
          <div className="rounded-[1.75rem] border border-border/70 bg-surface-low p-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Ringkasan sesi lelang
            </p>
            <h3 className="mt-3 text-xl font-bold text-foreground">{lot.name}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {lot.code} | {lot.unitName}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                Harga dasar {currency.format(lot.price)}
              </div>
              {lot.countdown ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-tertiary-container/10 px-4 py-2 text-sm font-semibold text-tertiary-container">
                  <Clock3 className="size-4" />
                  {lot.countdown}
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-primary/10 bg-primary/[0.03] p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 size-5 text-primary" />
              <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                <p className="font-semibold text-foreground">Yang perlu Anda perhatikan</p>
                <p>Penawaran tidak terlihat peserta lain selama sesi masih berjalan.</p>
                <p>Bid yang sudah dikonfirmasi tidak dapat diubah atau dibatalkan.</p>
                <p>Pemenang wajib menyelesaikan pembayaran maksimal 24 jam setelah hasil keluar.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[1.75rem] border border-border/70 bg-white p-5">
            <label
              className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground"
              htmlFor="bid-amount"
            >
              Nominal penawaran
            </label>
            <div className="mt-3">
              <Input
                id="bid-amount"
                min={lot.price}
                onChange={(event) => setBidAmount(event.target.value)}
                placeholder="Masukkan nominal bid"
                type="number"
                value={bidAmount}
              />
            </div>
            <div className="mt-4 rounded-2xl bg-surface-low p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Ringkasan bid
              </p>
              <p className="mt-3 font-headline text-4xl font-extrabold tracking-tight text-primary">
                {currency.format(Number.isNaN(numericBid) ? 0 : numericBid)}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Sistem menyimpan nominal bid secara tertutup dan hanya memproses hasil saat
                deadline berakhir.
              </p>
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-border/70 p-4">
              {blocked || invalidBid ? (
                <AlertTriangle className="mt-0.5 size-5 text-tertiary-container" />
              ) : (
                <Gavel className="mt-0.5 size-5 text-primary" />
              )}
              <p className="text-sm leading-relaxed text-muted-foreground">{helperText}</p>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-border/70 bg-surface-low p-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Setelah bid tersimpan
            </p>
            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-3">
                <span className="mt-1 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  1
                </span>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Anda bisa memantau status bid dari halaman riwayat bid pribadi.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-1 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  2
                </span>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Jika menang, sistem membuat transaksi pembayaran secara otomatis.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-1 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  3
                </span>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Jika tidak menang, riwayat bid tetap tersimpan sebagai arsip pribadi Anda.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button className="min-w-[14rem]" disabled={blocked || invalidBid}>
              Konfirmasi Bid Tertutup
            </Button>
            <Button variant="secondary">Lihat Riwayat Bid</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
