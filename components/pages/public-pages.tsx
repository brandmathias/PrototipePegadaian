import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  Clock3,
  Gavel,
  Landmark,
  MapPin
} from "lucide-react";

import { LiveCountdown } from "@/components/buyer/live-countdown";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { PurchaseWorkflow } from "@/components/buyer/purchase-workflow";
import { VickreyBidForm } from "@/components/buyer/vickrey-bid-form";
import { LotFigure } from "@/components/shared/lot-figure";
import { SectionHeading } from "@/components/shared/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BuyerBid } from "@/lib/contracts/buyer";
import type { Lot } from "@/lib/contracts/catalog";
import { currency } from "@/lib/formatters/currency";

type BuyerPublicStatus = {
  blacklist: {
    active: boolean;
    until: Date | null;
    totalViolations: number;
  };
} | null;

function getBlacklistLabel(status: BuyerPublicStatus) {
  if (!status?.blacklist.active) {
    return null;
  }

  if (!status.blacklist.until) {
    return "Akun sedang dibatasi untuk mengikuti lelang Vickrey.";
  }

  return `Akun sedang dibatasi sampai ${new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "Asia/Makassar"
  }).format(status.blacklist.until)}. Selama blacklist aktif, Anda tidak dapat mengirim bid baru.`;
}

export function LotDetailPage({
  lot,
  bidState,
  buyerStatus = null
}: {
  lot: Lot | null;
  bidState: BuyerBid | null;
  buyerStatus?: BuyerPublicStatus;
}) {
  if (!lot) {
    notFound();
  }

  const isVickrey = lot.mode === "vickrey";
  const showAuctionCountdown = isVickrey && (lot.countdown || lot.endsAt);

  return (
    <div className="container space-y-10 py-10 md:space-y-12 md:py-12">
      <div className="grid gap-8 xl:grid-cols-[1.12fr_0.88fr]">
        <div className="space-y-5">
          <LotFigure category={lot.category} className="min-h-[22rem] rounded-[2rem] md:min-h-[34rem]" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {lot.specs.map((spec) => (
              <Card className="border border-border/70 p-4" key={spec.label}>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                  {spec.label}
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">{spec.value}</p>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={isVickrey ? "accent" : "default"}>
                {isVickrey ? "Vickrey Auction" : "Fixed Price"}
              </Badge>
              <Badge variant="muted">{lot.code}</Badge>
              <Badge variant="muted">Kondisi {lot.condition}</Badge>
            </div>
            <h1 className="font-headline text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
              {lot.name}
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground">{lot.description}</p>
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="size-4 text-primary" />
              {lot.location} | Diselenggarakan oleh {lot.unitName}
            </div>
          </div>

          <Card className="overflow-hidden border border-border/70 bg-white">
            <CardContent className="space-y-6 p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
                  {isVickrey ? "Harga dasar lelang" : "Harga jual"}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <p className="font-headline text-5xl font-extrabold tracking-tight text-primary">
                    {currency.format(lot.price)}
                  </p>
                  {showAuctionCountdown ? (
                    <div className="inline-flex items-center gap-2 rounded-full bg-tertiary-container/10 px-4 py-2 text-sm font-semibold text-tertiary-container">
                      <Clock3 className="size-4" />
                      <LiveCountdown
                        expiredLabel="Menunggu hasil"
                        fallbackLabel={lot.countdown}
                        targetAt={lot.endsAt}
                      />
                    </div>
                  ) : null}
                </div>
              </div>

              {isVickrey ? (
                <div className="rounded-[1.5rem] border border-accent/35 bg-accent/15 p-5">
                  <div className="flex items-start gap-3">
                    <Gavel className="mt-1 size-5 text-accent-foreground" />
                    <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                      <p className="font-semibold text-foreground">Alur lelang tertutup</p>
                      <p>Bid tidak terlihat peserta lain selama sesi lelang masih aktif.</p>
                      <p>
                        Pemenang membayar harga penawar tertinggi kedua dan diberi waktu
                        maksimal 24 jam untuk menyelesaikan pembayaran.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-[1.5rem] border border-primary/15 bg-primary/[0.03] p-5">
                  <div className="flex items-start gap-3">
                    <Landmark className="mt-1 size-5 text-primary" />
                    <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                      <p className="font-semibold text-foreground">Alur fixed price</p>
                      <p>User memilih metode pembayaran dan sistem langsung membuat transaksi.</p>
                      <p>
                        Setelah itu pembeli diarahkan ke halaman transaksi untuk unggah bukti
                        transfer atau datang langsung ke unit Pegadaian.
                      </p>
                    </div>
                  </div>
                </div>
              )}

      {bidState ? (
                <div className="rounded-[1.5rem] border border-primary/15 bg-primary/[0.03] p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
                    Aktivitas akun Anda
                  </p>
                  <p className="mt-3 text-lg font-bold text-foreground">
                    Bid {currency.format(bidState.bidAmount)}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {bidState.note}
                  </p>
                </div>
              ) : null}

              {getBlacklistLabel(buyerStatus) ? (
                <div className="rounded-[1.5rem] border border-tertiary-container/25 bg-tertiary-container/10 p-5 text-sm leading-relaxed text-muted-foreground">
                  {getBlacklistLabel(buyerStatus)}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                {isVickrey ? (
                  <Link href={`/katalog/${lot.id}/bid`}>
                    <Button className="min-w-[12rem]">Ikut Lelang Sekarang</Button>
                  </Link>
                ) : (
                  <Link href={`/katalog/${lot.id}/beli`}>
                    <Button className="min-w-[12rem]">Beli Sekarang</Button>
                  </Link>
                )}
                <Link href="/transaksi">
                  <Button variant="secondary">Lihat Transaksi Saya</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <section className="space-y-5">
        <SectionHeading
          description="Halaman detail ini merangkum informasi inti yang dibutuhkan pembeli: media barang, spesifikasi, unit penyelenggara, mode transaksi, dan arahan pembayaran atau bidding."
          eyebrow="Informasi lengkap"
          title="Spesifikasi barang dan konteks transaksi"
        />
        <Card className="overflow-hidden border border-border/70 bg-white">
          <table className="w-full text-left text-sm">
            <tbody>
              {lot.specs.map((spec) => (
                <tr className="border-t border-border/70 first:border-t-0" key={spec.label}>
                  <td className="w-[32%] bg-surface-low px-6 py-4 font-semibold text-muted-foreground">
                    {spec.label}
                  </td>
                  <td className="px-6 py-4">{spec.value}</td>
                </tr>
              ))}
              <tr className="border-t border-border/70">
                <td className="bg-surface-low px-6 py-4 font-semibold text-muted-foreground">
                  Unit Pegadaian
                </td>
                <td className="px-6 py-4">{lot.unitName}</td>
              </tr>
              <tr className="border-t border-border/70">
                <td className="bg-surface-low px-6 py-4 font-semibold text-muted-foreground">
                  Mode
                </td>
                <td className="px-6 py-4">
                  {isVickrey ? "Lelang tertutup Vickrey" : "Pembelian fixed price"}
                </td>
              </tr>
            </tbody>
          </table>
        </Card>
      </section>
    </div>
  );
}

export function PurchasePage({ lot }: { lot: Lot | null }) {
  if (!lot) notFound();

  return (
    <div className="container space-y-8 py-10 md:space-y-10 md:py-12">
      <SectionHeading
        action={
          <Link href={`/katalog/${lot.id}`}>
            <Button variant="secondary">Kembali ke Detail Barang</Button>
          </Link>
        }
        description="Pilih metode pembayaran yang paling sesuai, lalu lanjutkan ke transaksi agar pembayaran bisa diselesaikan sesuai alur fixed price di PRD."
        eyebrow="Pembelian Fixed Price"
        title="Konfirmasi pembelian barang"
      />
      <PurchaseWorkflow lot={lot} />
    </div>
  );
}

export function BidPage({
  lot,
  bidState,
  buyerStatus = null
}: {
  lot: Lot | null;
  bidState: BuyerBid | null;
  buyerStatus?: BuyerPublicStatus;
}) {
  if (!lot) notFound();

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
        title="Kirim penawaran untuk sesi Vickrey"
      />
      <VickreyBidForm
        existingBidAmount={bidState?.bidAmount}
        existingBidStatus={bidState?.status}
        isBlacklisted={Boolean(buyerStatus?.blacklist.active)}
        blacklistUntil={buyerStatus?.blacklist.until ?? null}
        lot={lot}
      />
    </div>
  );
}

export function LoginPage() {
  return (
    <Card className="w-full border border-border/70 bg-white/95 p-8 shadow-[0_26px_80px_rgba(14,40,30,0.10)] md:p-10">
      <div className="mb-8 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-secondary">
          Autentikasi pembeli
        </p>
        <h1 className="mt-3 font-headline text-3xl font-extrabold tracking-tight text-primary">
          Masuk ke akun pembeli
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Gunakan akun yang sudah terdaftar untuk melihat transaksi, riwayat bid, dan
          nota pembayaran.
        </p>
      </div>
      <Suspense fallback={<div className="rounded-2xl bg-surface-low p-4 text-sm text-muted-foreground">Menyiapkan formulir masuk...</div>}>
        <LoginForm />
      </Suspense>
    </Card>
  );
}

export function RegisterPage() {
  return (
    <Card className="w-full border border-border/70 bg-white/95 p-8 shadow-[0_26px_80px_rgba(14,40,30,0.10)] md:p-10">
      <SectionHeading
        description="Lengkapi data dasar pembeli untuk membuka akses ke katalog, lelang, dan alur transaksi setelah akun aktif."
        eyebrow="Registrasi pembeli"
        title="Buat akun pembeli baru"
      />
      <Suspense fallback={<div className="rounded-2xl bg-surface-low p-4 text-sm text-muted-foreground">Menyiapkan formulir registrasi...</div>}>
        <RegisterForm />
      </Suspense>
    </Card>
  );
}
