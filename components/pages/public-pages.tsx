import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type CSSProperties } from "react";
import {
  Clock3,
  CreditCard,
  Gavel,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  type LucideIcon
} from "lucide-react";

import { AuctionCountdownTiles } from "@/components/buyer/auction-countdown-tiles";
import { FixedPriceBuyButton } from "@/components/buyer/fixed-price-buy-button";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { PurchaseWorkflow } from "@/components/buyer/purchase-workflow";
import { VickreyBidForm } from "@/components/buyer/vickrey-bid-form";
import { BRAND_NAME, BrandLockup, BrandMark } from "@/components/shared/brand";
import { DetailFavoriteToggle } from "@/components/shared/detail-favorite-toggle";
import { LotMediaGallery } from "@/components/shared/lot-media-gallery";
import { LotRealtimeStats } from "@/components/shared/lot-realtime-stats";
import { SectionHeading } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";
import { getBuyerTransactionsHref } from "@/lib/buyer/transaction-links";
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
  vickreyBidLock?: {
    active: boolean;
    lotId: string | null;
    lotName: string | null;
  };
} | null;

function getBlacklistLabel(status: BuyerPublicStatus) {
  if (!status?.blacklist.active) {
    return null;
  }

  if (!status.blacklist.until) {
    return "Akun sedang dibatasi untuk mengikuti Lelang Tertutup.";
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

function AuthBrandCluster({
  accentLabel,
  mode = "panel"
}: {
  accentLabel?: string;
  mode?: "hero" | "panel";
}) {
  if (mode === "hero") {
    return (
      <div className="relative inline-flex flex-col gap-4">
        <div className="pointer-events-none absolute -left-7 top-1/2 h-20 w-20 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(247,240,224,0.46),rgba(247,240,224,0.18)_42%,transparent_76%)] blur-3xl" />
        <div className="pointer-events-none absolute -left-2 top-1 h-10 w-20 bg-[linear-gradient(90deg,rgba(240,210,135,0.58),transparent)] blur-2xl" />
        <BrandMark className="relative z-[1] size-10 drop-shadow-[0_18px_30px_rgba(0,0,0,0.36)] sm:size-11" />
        {accentLabel ? (
          <div className="relative z-[1] flex items-center gap-3 pl-1">
            <span className="h-px w-11 bg-[linear-gradient(90deg,rgba(240,210,135,0.88),rgba(240,210,135,0.18),transparent)]" />
            <span className="text-[0.58rem] font-semibold uppercase tracking-[0.24em] text-[#f0d287]/95">
              {accentLabel}
            </span>
          </div>
        ) : (
          <span className="relative z-[1] ml-1 h-px w-16 bg-[linear-gradient(90deg,rgba(240,210,135,0.88),rgba(240,210,135,0.26),transparent)]" />
        )}
      </div>
    );
  }

  return (
    <div className="relative inline-flex max-w-full flex-col gap-5">
      <div className="pointer-events-none absolute -left-7 -top-3 h-24 w-24 rounded-full bg-[#f0d287]/24 blur-3xl" />
      <div className="pointer-events-none absolute -left-5 -top-4 h-24 w-[24rem] rounded-full bg-[radial-gradient(circle_at_24%_50%,rgba(249,243,230,0.34),rgba(249,243,230,0.18)_36%,transparent_72%)] blur-2xl" />
      <div className="pointer-events-none absolute inset-x-3 top-0 h-16 rounded-full bg-[linear-gradient(90deg,rgba(247,241,227,0.32),rgba(247,241,227,0.12),transparent_78%)] blur-2xl" />
      <div className="pointer-events-none absolute -left-1 top-4 h-16 w-[20rem] bg-[linear-gradient(90deg,rgba(240,210,135,0.22),rgba(240,210,135,0.08),transparent_78%)] blur-xl" />
      <BrandLockup
        className="relative z-[1] max-w-full drop-shadow-[0_20px_32px_rgba(0,0,0,0.24)]"
        markClassName="size-[3.75rem]"
        nameClassName="h-[3.1rem] max-w-[19.5rem] brightness-[1.08] contrast-[1.08]"
      />
      {accentLabel ? (
        <div className="relative z-[1] flex items-center gap-3 pl-1">
          <span className="h-px w-12 bg-[linear-gradient(90deg,rgba(240,210,135,0.92),rgba(240,210,135,0.18),transparent)]" />
          <span className="text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-[#f0d287]/90">
            {accentLabel}
          </span>
        </div>
      ) : (
        <span className="relative z-[1] ml-1 h-px w-36 bg-[linear-gradient(90deg,rgba(240,210,135,0.92),rgba(240,210,135,0.24),transparent)]" />
      )}
    </div>
  );
}

function getVickreyBidLockLabel(status: BuyerPublicStatus) {
  if (!status?.vickreyBidLock?.active) {
    return null;
  }

  return status.vickreyBidLock.lotName
    ? `Anda masih memiliki bid aktif pada lelang lain (${status.vickreyBidLock.lotName}). Tunggu hasil lelang tersebut sebelum mengikuti lelang baru.`
    : "Anda masih memiliki bid aktif pada lelang lain. Tunggu hasil lelang tersebut sebelum mengikuti lelang baru.";
}

function getPriceChangeCopy(isVickrey: boolean) {
  if (isVickrey) {
    return "Harga akhir menyesuaikan hasil lelang dan verifikasi transaksi.";
  }

  return "Sesuai pergerakan harga emas dan kurs harian.";
}

export function LotDetailPage({
  initialFavorited = false,
  lot,
  buyerId = null,
  bidState,
  buyerStatus = null,
  wishlistSyncEnabled = false
}: {
  initialFavorited?: boolean;
  lot: Lot | null;
  buyerId?: string | null;
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
  const hasOtherVickreyBidLock =
    isVickrey &&
    Boolean(buyerStatus?.vickreyBidLock?.active) &&
    buyerStatus?.vickreyBidLock?.lotId !== lot.id;
  const modeLabel = isVickrey ? "Lelang Tertutup" : "Harga Tetap";
  const priceLabel = isVickrey ? "Harga dasar" : "Harga terkini";
  const auctionEndLabel = formatOptionalDate(lot.endsAt);
  const specificationRows = lot.specs;
  const transactionContext: DetailInfoItem[] = [
    {
      icon: ShoppingCart,
      label: "Metode Penjualan",
      value: isVickrey
        ? "Barang ini dijual dengan mekanisme lelang. Produk tidak melalui proses harga tetap."
        : "Barang ini dijual dengan harga tetap. Produk tidak melalui proses lelang."
    },
    {
      icon: CreditCard,
      label: "Pembayaran",
      value: isVickrey
        ? "Pembayaran dilakukan setelah pemenang dikonfirmasi dan transaksi berhasil diverifikasi."
        : "Pembayaran dilakukan setelah checkout dengan harga tetap. Konfirmasi otomatis setelah transaksi berhasil."
    },
    {
      icon: ShieldCheck,
      label: "Harga dapat berubah",
      value: getPriceChangeCopy(isVickrey)
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
                allowFullscreen
                category={lot.category}
                className="min-h-[22rem] rounded-[calc(1.9rem-0.25rem)] border-transparent bg-[#f7f8f6] shadow-none md:min-h-[34rem]"
                title={lot.name}
                media={lot.media}
                priority
                showCategoryBadge={false}
                showVideoControls
                variant="pdp"
              />
            </div>
          </div>

          <aside className="xl:sticky xl:top-24">
            <div className="relative space-y-7 overflow-hidden rounded-[1.9rem] bg-white p-6 text-[#183f32] shadow-[0_30px_90px_rgba(3,45,36,0.12)] ring-1 ring-[#e8e2d6] md:p-8">
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(140deg,rgba(232,195,106,0.08),transparent_34%),radial-gradient(circle_at_88%_70%,rgba(0,74,35,0.05),transparent_28%)]" />
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="relative rounded-full bg-[#0d6b4c] px-4 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-[#ecfff8] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
                  {modeLabel}
                </span>
                <span className="relative rounded-full bg-[#f7f2e8] px-4 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-[#9a6a00] shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
                  {lot.status}
                </span>
              </div>

              <div className="relative space-y-3">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#d8aa3f]">
                  {lot.code}
                </p>
                <h1 className="max-w-xl font-headline text-4xl font-black leading-[1.05] tracking-tight text-[#0f4735] md:text-5xl">
                  {lot.name}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#5f6f68]">
                  <MapPin className="size-4 text-[#f0bd51]" />
                  <span>{lot.unitName}</span>
                  <span className="text-[#c9b991]">/</span>
                  <span>{lot.location}</span>
                </div>
              </div>

              <div className="relative space-y-3 border-y border-[#ece5d9] py-5">
                <h2 className="font-headline text-lg font-bold text-[#0f4735]">Deskripsi Barang</h2>
                <p className="max-w-2xl text-sm leading-7 text-[#617068]">{lot.description}</p>
              </div>

              <div className="relative space-y-3">
                <p className="text-[0.68rem] font-black uppercase tracking-[0.24em] text-[#9d7b2f]">
                  {priceLabel}
                </p>
                <div className="grid gap-4">
                  <p className="font-headline text-4xl font-black tracking-tight text-[#0f4735] md:text-5xl">
                    {currency.format(lot.price)}
                  </p>
                  <LotRealtimeStats
                    className="flex flex-wrap items-center gap-3 text-sm text-[#617068]"
                    iconClassName="size-4 text-[#617068]"
                    initialStats={lot.insights}
                    itemClassName="gap-2"
                    labelClassName="text-sm font-medium text-[#617068]"
                    lotId={lot.id}
                    mode={lot.mode}
                    separatorClassName="h-5 w-px bg-[#e8c36a]/45"
                    showSeparators
                    trackView
                    valueClassName="text-base font-semibold text-[#183f32]"
                    watchLabel="Watchlist"
                  />
                  {showAuctionCountdown ? (
                    <div className="grid gap-3 rounded-[1.35rem] border border-[#f4d9df] bg-[linear-gradient(180deg,#fff9fa,#fff3f5)] px-4 py-4 shadow-[0_24px_56px_-42px_rgba(215,43,67,0.42)] md:px-5 md:py-5">
                      <div className="inline-flex items-center gap-2.5 text-sm font-bold text-[#5c625b]">
                        <span className="grid size-8 place-items-center rounded-full bg-white text-[#d72b43] shadow-[0_12px_24px_-18px_rgba(215,43,67,0.48)]">
                          <Clock3 className="size-4" />
                        </span>
                        <span className="text-[0.72rem] uppercase tracking-[0.16em] text-[#a25b68]">
                          Berakhir dalam
                        </span>
                      </div>
                      <AuctionCountdownTiles
                        className="mx-auto"
                        expiredLabel="Menunggu hasil"
                        fallbackLabel={lot.countdown}
                        size="hero"
                        serverNow={serverNow}
                        targetAt={lot.endsAt}
                      />
                      {auctionEndLabel ? (
                        <p className="text-center text-xs font-semibold text-[#8b7b74]">{auctionEndLabel}</p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>

              {bidState ? (
                <div className="relative rounded-[1.35rem] bg-[#f8faf8] p-5 ring-1 ring-[#e8e2d6]">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#9d7b2f]">
                    Aktivitas akun Anda
                  </p>
                  <p className="mt-3 text-lg font-black text-[#0f4735]">Bid sudah terkunci</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#617068]">
                    {bidState.note}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-[#9d7b2f]">
                    <span className="rounded-full bg-[#f7f2e8] px-3 py-1.5">
                      {typeof bidState.bidAmount === "number"
                        ? `Bid ${currency.format(bidState.bidAmount)}`
                        : "Hash bid tersimpan"}
                    </span>
                    {bidState.paymentAmount ? (
                      <span className="rounded-full bg-[#f7f2e8] px-3 py-1.5">
                        Harga akhir lelang {currency.format(bidState.paymentAmount)}
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

              {!isActionBlocked && hasOtherVickreyBidLock && getVickreyBidLockLabel(buyerStatus) ? (
                <div className="relative rounded-[1.35rem] bg-[#fff7ed] p-5 text-sm leading-relaxed text-[#9a3412]">
                  {getVickreyBidLockLabel(buyerStatus)}
                </div>
              ) : null}

              <div className="relative flex gap-3">
                {isVickrey ? (
                  bidState ? (
                    <Link
                      className="flex-1"
                      href={getBuyerTransactionsHref({ tab: "bids", lotId: lot.id })}
                    >
                      <Button className="h-10 w-full rounded-md text-sm font-black" variant="default">
                        Pantau Transaksi
                        <Gavel className="size-4" />
                      </Button>
                    </Link>
                  ) : isActionBlocked ? (
                    <Button
                      className="h-11 flex-1 rounded-md bg-[#d9d1c2] px-6 text-base font-black text-[#726958]"
                      disabled
                    >
                      Lelang Sedang Dibatasi
                    </Button>
                  ) : hasOtherVickreyBidLock ? (
                    <Button
                      className="h-11 flex-1 rounded-md bg-[#d9d1c2] px-6 text-base font-black text-[#726958]"
                      disabled
                    >
                      Bid Lelang Lain Aktif
                    </Button>
                  ) : (
                    <div className="flex-1">
                      <VickreyBidForm
                        buyerId={buyerId}
                        bidLockLotName={buyerStatus?.vickreyBidLock?.lotName ?? null}
                        blacklistUntil={buyerStatus?.blacklist.until ?? null}
                        blacklistViolations={buyerStatus?.blacklist.totalViolations ?? 0}
                        isBidLockedByOtherAuction={hasOtherVickreyBidLock}
                        isBlacklisted={Boolean(buyerStatus?.blacklist.active)}
                        lot={lot}
                        triggerClassName="h-10 w-full rounded-md text-sm font-black"
                        triggerLabel="Ikut Lelang"
                        variant="trigger"
                      />
                    </div>
                  )
                ) : isActionBlocked ? (
                  <Button
                    className="h-11 flex-1 rounded-md bg-[#d9d1c2] px-6 text-base font-black text-[#726958]"
                    disabled
                  >
                    Pembelian Sedang Dibatasi
                  </Button>
                ) : (
                  <div className="flex-1">
                    <FixedPriceBuyButton lotId={lot.id} />
                  </div>
                )}
                <DetailFavoriteToggle
                  className="h-[3.25rem] w-[3.5rem] shrink-0 rounded-[0.9rem] border border-[#e8e2d6] bg-white text-[#0f4735] shadow-[0_14px_32px_rgba(0,0,0,0.08)] hover:bg-[#f7faf8] [&_svg]:!size-6"
                  initialFavorited={initialFavorited}
                  itemName={lot.name}
                  lotId={lot.id}
                  wishlistSyncEnabled={wishlistSyncEnabled}
                />
              </div>
            </div>
          </aside>
        </section>

        <section className="grid gap-6 pb-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-stretch">
          <div className="relative h-full overflow-hidden rounded-[1.6rem] bg-white p-6 text-[#183f32] shadow-[0_24px_80px_rgba(8,69,50,0.08)] ring-1 ring-[#ece5d9] md:p-7 lg:order-2">
            <p className="text-[11px] font-black uppercase tracking-[0.32em] text-[#d8aa3f]">Konteks Transaksi</p>
            <h2 className="mt-3 font-serif text-[2rem] font-semibold tracking-[-0.01em] text-[#0f4735]">
              Informasi Transaksi
            </h2>
            <p className="mt-3 max-w-2xl text-[13px] leading-7 text-[#617068]">
              Barang ini merupakan bagian dari inventori unit terkait. Pembayaran dan pembaruan
              harga mengikuti ketentuan transaksi yang berlaku.
            </p>

            <div className="mt-7 grid gap-5 sm:grid-cols-3">
              {transactionContext.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    className="grid gap-3 text-center sm:border-r sm:border-[#ece5d9] sm:px-3 sm:last:border-r-0"
                    key={item.label}
                  >
                    <span className="mx-auto grid size-14 shrink-0 place-items-center rounded-full bg-[#f5f1e7] text-[#0f5d43] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                      <Icon className="size-5" />
                    </span>
                    <div>
                      <p className="font-serif text-[15px] font-semibold tracking-[-0.01em] text-[#0f5d43]">{item.label}</p>
                      <p className="mt-1 text-[12px] leading-6 text-[#617068]">{item.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative h-full overflow-hidden rounded-[1.6rem] bg-white p-6 text-[#183f32] shadow-[0_24px_80px_rgba(8,69,50,0.08)] ring-1 ring-[#ece5d9] md:p-7 lg:order-1">
            <p className="text-[11px] font-black uppercase tracking-[0.32em] text-[#d8aa3f]">Informasi Lengkap</p>
            <h2 className="mt-3 font-serif text-[2rem] font-semibold tracking-[-0.01em] text-[#0f4735]">Spesifikasi Produk</h2>
            <p className="mt-3 max-w-2xl text-[13px] leading-7 text-[#617068]">
              Detail berikut mengikuti data barang pada sistem {BRAND_NAME}.
              Susunannya dibuat tanpa garis tabel agar tetap ringan dan mudah dipindai.
            </p>

            {specificationRows.length > 0 ? (
              <dl className="mt-7 grid gap-x-12 gap-y-4 md:grid-cols-2">
                {specificationRows.map((spec) => (
                  <div className="grid grid-cols-[minmax(0,0.82fr)_auto_minmax(0,1fr)] items-baseline gap-4" key={`${spec.label}-${spec.value}`}>
                    <dt className="font-serif text-[14px] font-medium tracking-[-0.01em] text-[#7a817d]">{spec.label}</dt>
                    <span className="text-[#e8b64d]">&bull;</span>
                    <dd className="font-serif text-[15px] font-semibold leading-6 tracking-[-0.01em] text-[#0f4735]">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-5 text-sm leading-7 text-[#617068]">
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
  const hasOtherVickreyBidLock =
    Boolean(buyerStatus?.vickreyBidLock?.active) && buyerStatus?.vickreyBidLock?.lotId !== lot.id;

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
        bidLockLotName={buyerStatus?.vickreyBidLock?.lotName ?? null}
        isBlacklisted={Boolean(buyerStatus?.blacklist.active)}
        isBidLockedByOtherAuction={hasOtherVickreyBidLock}
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
        className="relative hidden min-h-[100dvh] overflow-hidden bg-center bg-cover p-12 text-white lg:flex lg:flex-col lg:justify-end lg:bg-[image:var(--login-hero-image)] xl:p-16"
        style={{
          "--login-hero-image":
            "linear-gradient(180deg, rgba(2, 15, 10, 0.04) 0%, rgba(2, 23, 13, 0.22) 42%, rgba(1, 13, 8, 0.92) 100%), linear-gradient(90deg, rgba(44, 27, 8, 0.12), rgba(0, 54, 31, 0.22)), url('/uploads/Gambar%20Wallpaper%20Login.png')"
        } as CSSProperties}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(255,207,91,0.24),transparent_26%),radial-gradient(circle_at_80%_14%,rgba(5,67,40,0.38),transparent_28%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[70%] bg-[linear-gradient(0deg,rgba(0,14,8,0.96)_0%,rgba(0,18,10,0.78)_46%,transparent_100%)]" />
        <div className="relative max-w-[700px] space-y-7">
          <div className="space-y-3">
            <h1 className="font-headline text-[clamp(3.25rem,5.4vw,5.65rem)] font-black leading-[0.95] tracking-[-0.055em]">
              Beli langsung atau ikut lelang dalam satu akun.
            </h1>
            <p className="max-w-xl text-base leading-8 text-white/74">
              Temukan barang bernilai, pilih harga tetap untuk proses cepat,
              atau ikuti Lelang Tertutup dengan penawaran tertutup yang aman.
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
            <AuthBrandCluster />
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
          <div className="mt-5 rounded-[1.15rem] border border-amber-200/18 bg-amber-200/10 p-4 text-sm leading-6 text-emerald-50/72">
            Akun sedang terkunci karena blacklist? Hubungi admin unit terkait untuk pengecekan manual.
          </div>
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
            <AuthBrandCluster accentLabel="Registrasi Pembeli" />
            <div>
              <h1 className="font-headline text-4xl font-black tracking-tight xl:text-5xl">
                Buat akun pembeli baru
              </h1>
              <p className="mt-4 max-w-xl text-base leading-8 text-emerald-50/66">
                Satu akun untuk melihat katalog harga tetap, mengikuti Lelang Tertutup,
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
        className="relative hidden min-h-[100dvh] overflow-hidden bg-center bg-cover p-12 text-white lg:flex lg:flex-col lg:justify-end lg:bg-[image:var(--register-hero-image)] xl:p-16"
        style={{
          "--register-hero-image":
            "linear-gradient(180deg, rgba(2, 15, 10, 0.08) 0%, rgba(2, 23, 13, 0.18) 38%, rgba(1, 13, 8, 0.90) 100%), linear-gradient(90deg, rgba(0, 54, 31, 0.18), rgba(44, 27, 8, 0.12)), url('/uploads/Gambar%20Wallpaper%20Register.png')"
        } as CSSProperties}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(255,207,91,0.22),transparent_26%),radial-gradient(circle_at_20%_14%,rgba(5,67,40,0.36),transparent_28%)]" />
        <div className="absolute left-12 top-12 xl:left-16 xl:top-16">
          <AuthBrandCluster accentLabel="Registrasi Pembeli" mode="hero" />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-[70%] bg-[linear-gradient(0deg,rgba(0,14,8,0.96)_0%,rgba(0,18,10,0.78)_46%,transparent_100%)]" />
        <div className="relative max-w-[680px] space-y-7">
          <h2 className="font-headline text-[clamp(3.05rem,5vw,5.35rem)] font-black leading-[0.96] tracking-[-0.055em]">
            Akses katalog lengkap dan kelola transaksi dalam satu tempat.
          </h2>
        </div>
      </section>
    </main>
  );
}
