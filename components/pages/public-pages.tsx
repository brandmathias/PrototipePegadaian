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
import { LotMediaGallery } from "@/components/shared/lot-media-gallery";
import { SectionHeading } from "@/components/shared/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BuyerBid } from "@/lib/contracts/buyer";
import type { Lot } from "@/lib/contracts/catalog";
import { getBlacklistRestrictionPolicy } from "@/lib/blacklist/restrictions";
import { currency } from "@/lib/formatters/currency";
import { formatAppDate } from "@/lib/timezone";

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

  return `Akun sedang dibatasi sampai ${formatAppDate(status.blacklist.until)}. Selama blacklist aktif, Anda tidak dapat mengirim bid baru.`;
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
  const serverNow = new Date().toISOString();
  const blacklistPolicy = getBlacklistRestrictionPolicy(buyerStatus?.blacklist.totalViolations ?? 0);
  const hasActiveRestriction = Boolean(buyerStatus?.blacklist.active);
  const isActionBlocked =
    hasActiveRestriction &&
    ((isVickrey && blacklistPolicy.blocksVickrey) || (!isVickrey && blacklistPolicy.blocksFixedPrice));

  return (
    <div className="container space-y-10 py-10 md:space-y-12 md:py-12">
      <div className="grid gap-8 xl:grid-cols-[1.12fr_0.88fr]">
        <div className="space-y-5">
          <LotMediaGallery
            category={lot.category}
            className="min-h-[22rem] rounded-[2rem] md:min-h-[34rem]"
            title={lot.name}
            media={lot.media}
            showVideoControls
          />
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
                        serverNow={serverNow}
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
                  <p className="mt-3 text-lg font-bold text-foreground">Bid sudah terkunci</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {bidState.note}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-primary">
                    <span className="rounded-full bg-primary/10 px-3 py-1">
                      {typeof bidState.bidAmount === "number"
                        ? `Bid ${currency.format(bidState.bidAmount)}`
                        : "Hash bid tersimpan"}
                    </span>
                    {bidState.paymentAmount ? (
                      <span className="rounded-full bg-primary/10 px-3 py-1">
                        Harga bayar Vickrey {currency.format(bidState.paymentAmount)}
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {getBlacklistLabel(buyerStatus) ? (
                <div className="rounded-[1.5rem] border border-tertiary-container/25 bg-tertiary-container/10 p-5 text-sm leading-relaxed text-muted-foreground">
                  {getBlacklistLabel(buyerStatus)}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                {isVickrey ? (
                  bidState ? (
                    <Link href="/riwayat-bid">
                      <Button className="min-w-[12rem]">Pantau Riwayat Bid</Button>
                    </Link>
                  ) : isActionBlocked ? (
                    <Button className="min-w-[12rem]" disabled>
                      Lelang Sedang Dibatasi
                    </Button>
                  ) : (
                    <Link href={`/katalog/${lot.id}/bid`}>
                      <Button className="min-w-[12rem]">Ikut Lelang Sekarang</Button>
                    </Link>
                  )
                ) : isActionBlocked ? (
                  <Button className="min-w-[12rem]" disabled>
                    Pembelian Sedang Dibatasi
                  </Button>
                ) : (
                  <Link href={`/katalog/${lot.id}/beli`}>
                    <Button className="min-w-[12rem]">
                      Beli Sekarang
                    </Button>
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
  buyerId,
  buyerStatus = null
}: {
  lot: Lot | null;
  bidState: BuyerBid | null;
  buyerId?: string | null;
  buyerStatus?: BuyerPublicStatus;
}) {
  if (!lot) notFound();
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
        title="Kirim penawaran untuk sesi Vickrey"
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

export function LoginPage() {
  const loginStats = [
    { label: "Katalog aktif", value: "10K+" },
    { label: "Unit terhubung", value: "47+" },
    { label: "Transaksi aman", value: "98%" }
  ];

  return (
    <main className="grid min-h-[100dvh] w-full overflow-hidden bg-[#03140d] text-white lg:grid-cols-[1.08fr_0.92fr]">
      <section
        className="relative hidden min-h-[100dvh] overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-end xl:p-16"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(2, 15, 10, 0.04) 0%, rgba(2, 23, 13, 0.22) 42%, rgba(1, 13, 8, 0.92) 100%), linear-gradient(90deg, rgba(44, 27, 8, 0.12), rgba(0, 54, 31, 0.22)), url('/uploads/Gambar%20Wallpaper%20Login.png')",
          backgroundPosition: "center",
          backgroundSize: "cover"
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(255,207,91,0.24),transparent_26%),radial-gradient(circle_at_80%_14%,rgba(5,67,40,0.38),transparent_28%)]" />
        <div className="absolute left-12 top-12 flex items-center gap-2 rounded-full border border-white/12 bg-black/18 px-4 py-2 text-[0.66rem] font-black uppercase tracking-[0.26em] text-white/86 backdrop-blur-md xl:left-16 xl:top-16">
          <Landmark className="size-3.5 text-amber-200" />
          Pegadaian Lelang
        </div>
        <div className="absolute inset-x-0 bottom-0 h-[70%] bg-[linear-gradient(0deg,rgba(0,14,8,0.96)_0%,rgba(0,18,10,0.78)_46%,transparent_100%)]" />
        <div className="relative max-w-[700px] space-y-7">
          <div className="space-y-3">
            <h1 className="font-headline text-[clamp(3.25rem,5.4vw,5.65rem)] font-black leading-[0.95] tracking-[-0.055em]">
              Beli langsung atau ikut lelang dalam satu akun.
            </h1>
            <p className="max-w-xl text-base leading-8 text-white/74">
              Temukan barang bernilai, pilih harga tetap untuk proses cepat,
              atau ikuti Vickrey Auction dengan penawaran tertutup yang aman.
            </p>
          </div>

          <div className="grid max-w-2xl grid-cols-3 gap-4">
            {loginStats.map((item) => (
              <div
                className="rounded-3xl border border-white/12 bg-white/[0.08] px-5 py-4 backdrop-blur-md"
                key={item.label}
              >
                <div className="font-headline text-3xl font-black tracking-tight text-amber-200">
                  {item.value}
                </div>
                <div className="mt-1 text-[0.68rem] font-bold uppercase tracking-[0.13em] text-white/62">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_92%_10%,rgba(232,181,48,0.24),transparent_26%),radial-gradient(circle_at_14%_86%,rgba(23,155,91,0.22),transparent_30%),linear-gradient(145deg,#04331e_0%,#062414_44%,#03150c_100%)] px-6 py-10 sm:px-12 lg:px-14 xl:px-20">
        <div className="absolute -right-28 top-10 size-80 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-56 w-full bg-[radial-gradient(circle_at_100%_100%,rgba(13,143,83,0.30),transparent_52%)]" />
        <div className="absolute inset-y-0 left-0 hidden w-px bg-white/10 lg:block" />

        <div className="relative w-full max-w-[560px]">
          <div className="mb-9 space-y-6">
            <div className="flex items-center gap-3">
              <span className="grid size-14 place-items-center rounded-3xl border border-amber-200/18 bg-amber-200/10 text-amber-100">
                <Landmark className="size-6" />
              </span>
              <div>
                <p className="font-headline text-xl font-black leading-none tracking-tight">
                  Pegadaian Lelang
                </p>
                <p className="mt-2 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-emerald-100/58">
                  Akun pembeli
                </p>
              </div>
            </div>
            <div>
              <h2 className="font-headline text-4xl font-black tracking-tight xl:text-5xl">
                Masuk ke akun Anda
              </h2>
              <p className="mt-4 max-w-xl text-base leading-8 text-emerald-50/66">
                Lanjutkan ke katalog, transaksi, riwayat bid, dan nota dengan
                akun pembeli yang sudah terdaftar.
              </p>
            </div>
          </div>
          <Suspense fallback={<div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-emerald-50/70">Menyiapkan formulir masuk...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}

export function RegisterPage() {
  return (
    <main className="grid min-h-[100dvh] w-full overflow-hidden bg-[#03140d] text-white lg:grid-cols-[0.92fr_1.08fr]">
      <section className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_12%_12%,rgba(232,181,48,0.20),transparent_25%),radial-gradient(circle_at_88%_80%,rgba(23,155,91,0.20),transparent_30%),linear-gradient(145deg,#032216_0%,#062414_52%,#03150c_100%)] px-6 py-10 sm:px-12 lg:px-14 xl:px-20">
        <div className="absolute -left-24 top-8 size-80 rounded-full bg-amber-300/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-56 w-full bg-[radial-gradient(circle_at_0%_100%,rgba(13,143,83,0.28),transparent_52%)]" />
        <div className="relative w-full max-w-[650px]">
          <div className="mb-9 space-y-6">
            <div className="flex items-center gap-3">
              <span className="grid size-14 place-items-center rounded-3xl border border-amber-200/18 bg-amber-200/10 text-amber-100">
                <Landmark className="size-6" />
              </span>
              <div>
                <p className="font-headline text-xl font-black leading-none tracking-tight">
                  Pegadaian Lelang
                </p>
                <p className="mt-2 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-emerald-100/58">
                  Registrasi pembeli
                </p>
              </div>
            </div>
            <div>
              <h1 className="font-headline text-4xl font-black tracking-tight xl:text-5xl">
                Buat akun pembeli baru
              </h1>
              <p className="mt-4 max-w-xl text-base leading-8 text-emerald-50/66">
                Satu akun untuk melihat katalog harga tetap, mengikuti Vickrey,
                memantau pembayaran, dan menyimpan riwayat transaksi.
              </p>
            </div>
          </div>
          <Suspense fallback={<div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-emerald-50/70">Menyiapkan formulir registrasi...</div>}>
            <RegisterForm />
          </Suspense>
        </div>
      </section>

      <section
        className="relative hidden min-h-[100dvh] overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-end xl:p-16"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(2, 15, 10, 0.08) 0%, rgba(2, 23, 13, 0.18) 38%, rgba(1, 13, 8, 0.90) 100%), linear-gradient(90deg, rgba(0, 54, 31, 0.18), rgba(44, 27, 8, 0.12)), url('/uploads/Gambar%20Wallpaper%20Register.png')",
          backgroundPosition: "center",
          backgroundSize: "cover"
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(255,207,91,0.22),transparent_26%),radial-gradient(circle_at_20%_14%,rgba(5,67,40,0.36),transparent_28%)]" />
        <div className="absolute left-12 top-12 flex items-center gap-2 rounded-full border border-white/12 bg-black/18 px-4 py-2 text-[0.66rem] font-black uppercase tracking-[0.26em] text-white/86 backdrop-blur-md xl:left-16 xl:top-16">
          <Landmark className="size-3.5 text-amber-200" />
          Pegadaian Lelang
        </div>
        <div className="absolute inset-x-0 bottom-0 h-[70%] bg-[linear-gradient(0deg,rgba(0,14,8,0.96)_0%,rgba(0,18,10,0.78)_46%,transparent_100%)]" />
        <div className="relative max-w-[680px] space-y-7">
          <h2 className="font-headline text-[clamp(3.05rem,5vw,5.35rem)] font-black leading-[0.96] tracking-[-0.055em]">
            Akses katalog, transaksi, dan nota dalam satu tempat.
          </h2>
          <div className="grid max-w-2xl grid-cols-3 gap-4">
            {[
              { label: "Harga tetap", value: "Beli" },
              { label: "Vickrey", value: "Bid" },
              { label: "Nota", value: "Arsip" }
            ].map((item) => (
              <div
                className="rounded-3xl border border-white/12 bg-white/[0.08] px-5 py-4 backdrop-blur-md"
                key={item.label}
              >
                <div className="font-headline text-2xl font-black tracking-tight text-amber-200">
                  {item.value}
                </div>
                <div className="mt-1 text-[0.68rem] font-bold uppercase tracking-[0.13em] text-white/62">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
