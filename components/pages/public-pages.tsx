import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  CalendarDays,
  Clock3,
  Landmark,
  Maximize2,
  MapPin,
  RefreshCcw,
  RotateCcw,
  ShieldCheck,
  type LucideIcon
} from "lucide-react";

import { AuctionCountdownTiles } from "@/components/buyer/auction-countdown-tiles";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { PurchaseWorkflow } from "@/components/buyer/purchase-workflow";
import { VickreyBidForm } from "@/components/buyer/vickrey-bid-form";
import { DetailFavoriteToggle } from "@/components/shared/detail-favorite-toggle";
import { LotMediaGallery } from "@/components/shared/lot-media-gallery";
import { LotRealtimeStats } from "@/components/shared/lot-realtime-stats";
import { SectionHeading } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";
import type { BuyerBid } from "@/lib/contracts/buyer";
import type { Lot } from "@/lib/contracts/catalog";
import { getBlacklistRestrictionPolicy } from "@/lib/blacklist/restrictions";
import { currency } from "@/lib/formatters/currency";
import { formatAppDate, formatAppDateTime } from "@/lib/timezone";

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

function formatOptionalDate(value?: string) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return formatAppDate(date);
}

type DetailInfoItem = {
  icon: LucideIcon;
  label: string;
  value: string;
};

function getPriceChangeCopy(lot: Lot, isVickrey: boolean) {
  const normalized = lot.category.toLowerCase();

  if (isVickrey) {
    return "Harga akhir mengikuti hasil lelang tertutup dan verifikasi unit.";
  }

  if (normalized.includes("emas") || normalized.includes("perhiasan") || normalized.includes("logam")) {
    return "Sesuai pergerakan harga emas dan kurs harian.";
  }

  return "Mengikuti appraisal terbaru dan pembaruan unit.";
}

export function LotDetailPage({
  initialFavorited = false,
  lot,
  bidState,
  buyerStatus = null,
  wishlistSyncEnabled = false
}: {
  initialFavorited?: boolean;
  lot: Lot | null;
  bidState: BuyerBid | null;
  buyerStatus?: BuyerPublicStatus;
  wishlistSyncEnabled?: boolean;
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
  const modeLabel = isVickrey ? "Lelang Vickrey" : "Harga Tetap";
  const priceLabel = isVickrey ? "Harga dasar" : "Harga terkini";
  const auctionEndLabel = formatOptionalDate(lot.endsAt);
  const specificationRows = lot.specs;
  const priceContext: DetailInfoItem[] = [
    {
      icon: ShieldCheck,
      label: "Harga dapat berubah",
      value: getPriceChangeCopy(lot, isVickrey)
    },
    {
      icon: CalendarDays,
      label: "Stok terbatas",
      value: "Produk premium dengan ketersediaan terbatas."
    },
    {
      icon: RefreshCcw,
      label: "Update terakhir",
      value: lot.updatedAt ? formatAppDateTime(lot.updatedAt) : "Mengikuti pembaruan unit."
    }
  ];
  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-[#183f32]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#ffffff_0%,#f8faf8_100%)]" />

      <div className="container relative space-y-10 py-8 md:space-y-12 md:py-12">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#8a8172]">
          <Link className="transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-[#b8892f]" href="/katalog">
            Katalog
          </Link>
          <span className="text-[#c9b991]">/</span>
          <span>{lot.category}</span>
          <span className="text-[#c9b991]">/</span>
          <span className="text-[#b8892f]">{lot.name}</span>
        </nav>

        <section className="grid gap-8 xl:grid-cols-[minmax(0,1.08fr)_minmax(25rem,0.92fr)] xl:items-start">
          <div className="space-y-6">
            <div className="relative rounded-[1.9rem] bg-white p-1 shadow-[0_28px_90px_rgba(8,69,50,0.08)]">
              <LotMediaGallery
                category={lot.category}
                className="min-h-[22rem] rounded-[calc(1.9rem-0.25rem)] border-transparent bg-[#f7f8f6] shadow-none md:min-h-[34rem]"
                title={lot.name}
                media={lot.media}
                priority
                showCategoryBadge={false}
                showVideoControls
                variant="pdp"
              />
              <div className="pointer-events-none absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-white/[0.94] px-4 py-2 text-sm font-semibold text-[#264139] shadow-[0_18px_42px_rgba(8,69,50,0.08)] backdrop-blur md:left-6 md:top-6">
                <RotateCcw className="size-4 text-[#075f42]" />
                360&deg; View
              </div>
              <button
                aria-label="Perbesar media barang"
                className="absolute right-5 top-5 grid size-10 place-items-center rounded-full bg-white/[0.94] text-[#264139] shadow-[0_18px_42px_rgba(8,69,50,0.08)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-[#f7faf8] md:right-6 md:top-6"
                type="button"
              >
                <Maximize2 className="size-4" />
              </button>
            </div>
          </div>

          <aside className="xl:sticky xl:top-24">
            <div className="relative space-y-7 overflow-hidden rounded-[1.9rem] bg-[#042d24] p-6 text-white shadow-[0_30px_90px_rgba(3,45,36,0.26)] ring-1 ring-[#e8c36a]/20 md:p-8">
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(140deg,rgba(232,195,106,0.16),transparent_34%),radial-gradient(circle_at_88%_70%,rgba(232,195,106,0.12),transparent_28%)]" />
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="relative rounded-full bg-[#0d6b4c] px-4 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-[#ecfff8] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
                  {modeLabel}
                </span>
                <span className="relative rounded-full bg-[#71590d] px-4 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-[#ffdf7c] shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
                  {lot.status}
                </span>
              </div>

              <div className="relative space-y-3">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#d8aa3f]">
                  {lot.code}
                </p>
                <h1 className="max-w-xl font-headline text-4xl font-black leading-[1.05] tracking-tight text-white md:text-5xl">
                  {lot.name}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#d9e3dc]">
                  <MapPin className="size-4 text-[#f0bd51]" />
                  <span>{lot.unitName}</span>
                  <span className="text-[#6f857b]">/</span>
                  <span>{lot.location}</span>
                </div>
              </div>

              <div className="relative space-y-3 border-y border-white/10 py-5">
                <h2 className="font-headline text-lg font-bold text-white">Deskripsi Barang</h2>
                <p className="max-w-2xl text-sm leading-7 text-[#c4d2cb]">{lot.description}</p>
              </div>

              <div className="relative space-y-3">
                <p className="text-[0.68rem] font-black uppercase tracking-[0.24em] text-[#c4d2cb]">
                  {priceLabel}
                </p>
                <div className="grid gap-4">
                  <p className="font-headline text-4xl font-black tracking-tight text-[#f0bd51] drop-shadow-[0_10px_24px_rgba(240,189,81,0.18)] md:text-5xl">
                    {currency.format(lot.price)}
                  </p>
                  <LotRealtimeStats
                    className="flex flex-wrap items-center gap-3 text-xs text-[#c4d2cb]"
                    iconClassName="text-[#d9e3dc]"
                    initialStats={lot.insights}
                    itemClassName="gap-1.5"
                    lotId={lot.id}
                    mode={lot.mode}
                    separatorClassName="h-4 w-px bg-[#e8c36a]/45"
                    showFixedStatus
                    showSeparators
                    status={lot.status}
                    trackView
                    valueClassName="font-semibold text-white"
                    watchLabel="Watchlist"
                  />
                  {showAuctionCountdown ? (
                    <div className="grid gap-2 rounded-[1rem] bg-[#fff7f8] px-3 py-3 shadow-[0_16px_42px_rgba(8,69,50,0.05)]">
                      <div className="inline-flex items-center gap-2 text-sm font-bold text-[#5c625b]">
                        <Clock3 className="size-4 text-[#d72b43]" />
                        <span className="text-[#7a756d]">Berakhir dalam</span>
                      </div>
                      <AuctionCountdownTiles
                        expiredLabel="Menunggu hasil"
                        fallbackLabel={lot.countdown}
                        serverNow={serverNow}
                        targetAt={lot.endsAt}
                      />
                      {auctionEndLabel ? (
                        <p className="pl-6 text-xs font-medium text-[#7d766d]">{auctionEndLabel}</p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>

              {bidState ? (
                <div className="relative rounded-[1.35rem] bg-white/8 p-5 ring-1 ring-white/10">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#f0bd51]">
                    Aktivitas akun Anda
                  </p>
                  <p className="mt-3 text-lg font-black text-white">Bid sudah terkunci</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#c4d2cb]">
                    {bidState.note}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-[#f0bd51]">
                    <span className="rounded-full bg-white/10 px-3 py-1.5">
                      {typeof bidState.bidAmount === "number"
                        ? `Bid ${currency.format(bidState.bidAmount)}`
                        : "Hash bid tersimpan"}
                    </span>
                    {bidState.paymentAmount ? (
                      <span className="rounded-full bg-white/10 px-3 py-1.5">
                        Harga bayar Vickrey {currency.format(bidState.paymentAmount)}
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {getBlacklistLabel(buyerStatus) ? (
                <div className="relative rounded-[1.35rem] bg-[#fff0f2] p-5 text-sm leading-relaxed text-[#9f1239]">
                  {getBlacklistLabel(buyerStatus)}
                </div>
              ) : null}

              <div className="relative flex gap-3">
                {isVickrey ? (
                  bidState ? (
                    <Link className="flex-1" href="/riwayat-bid">
                      <Button className="h-[3.25rem] w-full rounded-[0.9rem] bg-[#e8b64d] px-6 text-base font-black text-[#08251d] shadow-[0_18px_38px_rgba(232,182,77,0.18)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-[#f0c96d]">
                        Pantau Riwayat Bid
                      </Button>
                    </Link>
                  ) : isActionBlocked ? (
                    <Button
                      className="h-[3.25rem] flex-1 rounded-[0.9rem] bg-[#d9d1c2] px-6 text-base font-black text-[#726958]"
                      disabled
                    >
                      Lelang Sedang Dibatasi
                    </Button>
                  ) : (
                    <Link className="flex-1" href={`/katalog/${lot.id}/bid`}>
                      <Button className="h-[3.25rem] w-full rounded-[0.9rem] bg-[#e8b64d] px-6 text-base font-black text-[#08251d] shadow-[0_18px_38px_rgba(232,182,77,0.18)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-[#f0c96d]">
                        Ikut Lelang Sekarang
                      </Button>
                    </Link>
                  )
                ) : isActionBlocked ? (
                  <Button
                    className="h-[3.25rem] flex-1 rounded-[0.9rem] bg-[#d9d1c2] px-6 text-base font-black text-[#726958]"
                    disabled
                  >
                    Pembelian Sedang Dibatasi
                  </Button>
                ) : (
                  <Link className="flex-1" href={`/katalog/${lot.id}/beli`}>
                    <Button className="h-[3.25rem] w-full rounded-[0.9rem] bg-[#e8b64d] px-6 text-base font-black text-[#08251d] shadow-[0_18px_38px_rgba(232,182,77,0.18)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-[#f0c96d]">
                      Beli Sekarang
                    </Button>
                  </Link>
                )}
                <DetailFavoriteToggle
                  className="h-[3.25rem] w-[3.5rem] shrink-0 rounded-[0.9rem] border border-[#e8c36a]/45 bg-transparent text-white shadow-[0_14px_32px_rgba(0,0,0,0.16)] hover:bg-white/10 [&_svg]:!size-6"
                  initialFavorited={initialFavorited}
                  itemName={lot.name}
                  lotId={lot.id}
                  wishlistSyncEnabled={wishlistSyncEnabled}
                />
              </div>
            </div>
          </aside>
        </section>

        <section className="space-y-6 pb-12">
          <div className="relative overflow-hidden rounded-[1.6rem] bg-[#042d24] p-6 text-white shadow-[0_24px_80px_rgba(8,69,50,0.16)] ring-1 ring-[#e8c36a]/20 md:p-7">
            <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,#e8c36a,transparent)]" />
            <h2 className="font-headline text-xl font-black tracking-tight text-white">Konteks Transaksi</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {priceContext.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    className="grid gap-3 md:grid-cols-[auto_minmax(0,1fr)] md:border-r md:border-[#e8c36a]/16 md:pr-6 md:last:border-r-0"
                    key={item.label}
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#0b4a3a] text-[#e8b64d] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                      <Icon className="size-5" />
                    </span>
                    <div>
                      <p className="text-sm font-black text-white">{item.label}</p>
                      <p className="mt-1 text-xs leading-5 text-[#c4d2cb]">{item.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[1.6rem] bg-[#052b22] p-6 text-white shadow-[0_24px_80px_rgba(8,69,50,0.14)] ring-1 ring-[#e8c36a]/18 md:p-7">
            <div className="pointer-events-none absolute inset-y-10 left-1/2 hidden w-px bg-[linear-gradient(180deg,transparent,#e8c36a,transparent)] opacity-80 md:block" />
            <h2 className="font-headline text-xl font-black tracking-tight text-white">Spesifikasi Produk</h2>
            <div className="mt-1 h-px w-28 bg-[#e8b64d]" />

            {specificationRows.length > 0 ? (
              <dl className="mt-5 grid gap-x-12 gap-y-4 md:grid-cols-2">
                {specificationRows.map((spec) => (
                  <div className="grid grid-cols-[minmax(0,0.82fr)_auto_minmax(0,1fr)] items-baseline gap-4" key={`${spec.label}-${spec.value}`}>
                    <dt className="text-sm font-semibold text-[#c4d2cb]">{spec.label}</dt>
                    <span className="text-[#e8b64d]">•</span>
                    <dd className="text-sm font-bold leading-6 text-white">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-5 text-sm leading-7 text-[#c4d2cb]">
                Spesifikasi produk belum dilengkapi oleh admin unit.
              </p>
            )}
          </div>
        </section>
      </div>
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
