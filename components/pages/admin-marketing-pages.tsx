"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Clock3,
  FileText,
  Gavel,
  MapPin,
  ReceiptText,
  ShieldCheck,
  UsersRound,
  WalletCards,
} from "lucide-react";

import { AdminLiveCountdown } from "@/components/admin/admin-live-countdown";
import { AdminPaginationFooter, useAdminPagination } from "@/components/admin/admin-pagination";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { LotMediaGallery } from "@/components/shared/lot-media-gallery";
import { LotFigure } from "@/components/shared/lot-figure";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { currency } from "@/lib/formatters/currency";
import { formatAppDateTime } from "@/lib/timezone";

type MarketingMedia = {
  id: string;
  type: string;
  url: string;
  fileName?: string;
};

export type MarketingSession = {
  id: string;
  lotId: string;
  lot: string;
  code?: string;
  category?: string;
  condition?: string;
  status: string;
  mode: string;
  media?: MarketingMedia[];
  primaryMedia?: MarketingMedia | null;
  startsAt?: string | null;
  ending?: string;
  endingAt?: string;
  revealDeadline?: string | null;
  revealDeadlineAt?: string | null;
  participants?: number;
  revealedBidCount?: number;
  pendingRevealCount?: number;
  price?: number | null;
  transactionId?: string | null;
  transactionStatus?: string | null;
  buyerName?: string | null;
  paymentMethod?: string | null;
  proofUrl?: string | null;
  reference?: string | null;
  soldAt?: string | null;
  paymentDeadline?: string | null;
  basePrice?: number | null;
  finalPrice?: number | null;
  winner?: string | null;
  visibility?: string;
  note?: string;
  bids?: Array<{
    id: string;
    bidderId: string;
    bidderName: string;
    submittedAtLabel: string;
    isRevealed?: boolean;
    rank: number;
    isWinner: boolean;
    determinesFinalPrice: boolean;
  }>;
};

function humanize(value?: string | null) {
  if (!value) {
    return "-";
  }

  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/(^|\s)\p{L}/gu, (match) => match.toUpperCase());
}

function toBuyerMedia(
  media: MarketingMedia[] = []
): Array<{ id: string; type: "foto" | "video"; url: string; fileName: string }> {
  return media.map((item) => ({
    id: item.id,
    type: (item.type === "video" ? "video" : "foto") as "foto" | "video",
    url: item.url,
    fileName: item.fileName || ""
  }));
}

function SessionHeader({
  eyebrow,
  title,
  description,
  accent = "green",
  action
}: {
  eyebrow: string;
  title: string;
  description: string;
  accent?: "green" | "amber";
  action?: ReactNode;
}) {
  const tone =
    accent === "green"
      ? "bg-gradient-to-br from-[#eef7f1] via-white to-[#f8fbf8]"
      : "bg-gradient-to-br from-[#fff7e8] via-white to-[#fffaf1]";

  return (
    <section className={`overflow-hidden rounded-[1.85rem] border border-black/10 p-5 sm:p-6 ${tone}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.22em] text-black/45 sm:text-xs">
            {eyebrow}
          </p>
          <h2 className="mt-3 font-headline text-[2.3rem] font-black tracking-tight text-black/88 sm:text-[2.7rem] lg:text-[3rem]">
            {title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-black/65 sm:text-base">{description}</p>
        </div>
        {action ? <div className="flex flex-wrap gap-3">{action}</div> : null}
      </div>
    </section>
  );
}

function SessionMetric({
  label,
  value,
  tone = "green"
}: {
  label: string;
  value: ReactNode;
  tone?: "green" | "amber" | "neutral";
}) {
  const styles =
    tone === "green"
      ? "border-[#dce9df] bg-[#f6fbf7]"
      : tone === "amber"
        ? "border-[#eadbbc] bg-[#fffaf0]"
        : "border-black/10 bg-white";

  return (
    <div className={`rounded-2xl border p-4 ${styles}`}>
      <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-black/45">{label}</p>
      <div className="mt-2 text-base font-semibold text-black/82">{value}</div>
    </div>
  );
}

function EmptyPanel({ text }: { text: string }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-black/10 bg-white p-5 text-sm leading-7 text-black/55">
      {text}
    </div>
  );
}

function dateLabel(value?: string | null) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return formatAppDateTime(date);
}

const VICKREY_PAYMENT_STATUSES = new Set([
  "MENUNGGU_PEMBAYARAN",
  "BUKTI_DIUNGGAH",
  "DITOLAK_BUKTI",
  "MENUNGGU_KONFIRMASI_LANGSUNG"
]);

function getVickreyStage(auction: MarketingSession) {
  const transactionStatus = auction.transactionStatus ?? "";

  if (auction.visibility === "TERKUNCI") {
    return {
      label: "Sesi aktif",
      detail: "Bid tersegel. Admin hanya memantau jumlah peserta dan countdown.",
      tone: "amber" as const,
      icon: Clock3
    };
  }

  if (auction.visibility === "MENUNGGU_REVEAL") {
    return {
      label: "Menunggu reveal",
      detail: "Deadline lewat. Buyer perlu reveal nominal sebelum pemenang dihitung.",
      tone: "amber" as const,
      icon: ShieldCheck
    };
  }

  if (VICKREY_PAYMENT_STATUSES.has(transactionStatus)) {
    return {
      label: transactionStatus === "BUKTI_DIUNGGAH" ? "Perlu verifikasi" : "Antrian pembayaran",
      detail: auction.buyerName
        ? `${auction.buyerName} masuk alur pembayaran pemenang.`
        : "Transaksi pemenang sudah terbentuk dan menunggu tindak lanjut.",
      tone: "green" as const,
      icon: WalletCards
    };
  }

  if (transactionStatus === "LUNAS" || transactionStatus === "SELESAI") {
    return {
      label: transactionStatus === "SELESAI" ? "Selesai" : "Terverifikasi",
      detail: "Pembayaran pemenang sudah diputuskan dan arsip transaksi tersedia.",
      tone: "green" as const,
      icon: BadgeCheck
    };
  }

  if (!auction.winner && auction.visibility === "HASIL_DIBUKA") {
    return {
      label: "Gagal / tanpa pemenang",
      detail: "Tidak ada transaksi pemenang yang perlu diverifikasi.",
      tone: "neutral" as const,
      icon: AlertTriangle
    };
  }

  return {
    label: "Hasil dibuka",
    detail: "Pemenang dan harga final sudah bisa ditinjau.",
    tone: "green" as const,
    icon: ShieldCheck
  };
}

function getVickreySummary(auctions: MarketingSession[]) {
  return {
    active: auctions.filter((auction) => auction.visibility === "TERKUNCI").length,
    pendingReveal: auctions.filter((auction) => auction.visibility === "MENUNGGU_REVEAL").length,
    revealed: auctions.filter((auction) => auction.visibility === "HASIL_DIBUKA").length,
    paymentQueue: auctions.filter((auction) => VICKREY_PAYMENT_STATUSES.has(auction.transactionStatus ?? "")).length,
    completed: auctions.filter((auction) => ["LUNAS", "SELESAI"].includes(auction.transactionStatus ?? "")).length
  };
}

function FixedPriceCard({ auction }: { auction: MarketingSession }) {
  const transactionLabel = auction.transactionStatus ? humanize(auction.transactionStatus) : "Belum ada transaksi";
  const paymentMethod = auction.paymentMethod ? humanize(auction.paymentMethod) : "-";
  const media = toBuyerMedia(auction.media ?? []);

  return (
    <Card className="group w-full max-w-[23.5rem] overflow-hidden rounded-[1.55rem] bg-white p-0 transition-transform duration-300 hover:-translate-y-1">
      <LotFigure
        category={auction.category || "Lainnya"}
        className="aspect-[4/3] rounded-b-none rounded-t-[1.55rem]"
        media={media}
      />
      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">Fixed Price</Badge>
            <Badge variant="muted">{auction.code || "BRG"}</Badge>
          </div>
          <AdminStatusBadge status={auction.status as any} />
        </div>

        <div className="space-y-2">
          <h3 className="font-headline text-lg font-bold tracking-tight text-foreground">{auction.lot}</h3>
          <p className="line-clamp-2 text-[0.92rem] text-muted-foreground">
            {auction.note || "Pilih sesi untuk memeriksa pembayaran dan kelanjutan verifikasi."}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            Harga Jual
          </p>
          <p className="font-headline text-[1.65rem] font-extrabold tracking-tight text-primary">
            {currency.format(auction.price ?? 0)}
          </p>
          <p className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Clock3 className="size-3.5 text-[#d72b43]" />
            {transactionLabel}
          </p>
        </div>

        <div className="rounded-2xl border border-border/70 bg-white/80 p-3 text-sm leading-relaxed text-muted-foreground">
          <p className="font-semibold text-foreground">{auction.buyerName || "Belum ada pembeli"}</p>
          <p className="mt-1">{paymentMethod === "-" ? "Menunggu pembeli memilih metode bayar." : paymentMethod}</p>
        </div>

        <div className="rounded-2xl bg-surface-low p-3 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">{auction.category || "Kategori belum diisi"}</p>
          <p className="mt-1">{auction.condition || "Kondisi belum diisi"}</p>
        </div>

        <Link href={`/admin/pemasaran/fixed-price/${auction.id}`}>
          <Button className="h-11 w-full" variant="default">
            Lihat Sesi
            <ArrowRight className="size-4" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}

function VickreyCard({ auction }: { auction: MarketingSession }) {
  const visibilityLabel = humanize(auction.visibility);
  const media = toBuyerMedia(auction.media ?? []);
  const stage = getVickreyStage(auction);
  const StageIcon = stage.icon;
  const waitingReveal = auction.visibility === "MENUNGGU_REVEAL";
  const serverNow = new Date().toISOString();

  return (
    <Card className="group w-full max-w-[23.5rem] overflow-hidden rounded-[1.55rem] bg-white p-0 transition-transform duration-300 hover:-translate-y-1">
      <LotFigure
        category={auction.category || "Lainnya"}
        className="aspect-[4/3] rounded-b-none rounded-t-[1.55rem]"
        media={media}
      />
      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="accent">Vickrey</Badge>
            <Badge variant="muted">{auction.code || "BRG"}</Badge>
          </div>
          <AdminStatusBadge status={auction.status as any} />
        </div>

        <div className="space-y-2">
          <h3 className="font-headline text-lg font-bold tracking-tight text-foreground">{auction.lot}</h3>
          <p className="line-clamp-2 text-[0.92rem] text-muted-foreground">
            {auction.note || "Pantau sesi lelang, peserta, dan pembukaan hasil setelah deadline."}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            Harga Dasar
          </p>
          <p className="font-headline text-[1.65rem] font-extrabold tracking-tight text-primary">
            {currency.format(auction.basePrice ?? 0)}
          </p>
          <p className="inline-flex items-center gap-1 text-xs font-medium text-tertiary-container">
            <Clock3 className="size-3.5 text-[#d72b43]" />
            <AdminLiveCountdown
              className="text-xs font-medium"
              expiredLabel={waitingReveal ? "Batas reveal terlewati" : "Deadline terlewati"}
              fallbackLabel={waitingReveal ? auction.revealDeadline ?? "-" : auction.ending || "-"}
              prefix={waitingReveal ? "Batas reveal" : undefined}
              serverNow={serverNow}
              targetAt={waitingReveal ? auction.revealDeadlineAt ?? undefined : auction.endingAt}
            />
          </p>
        </div>

        <div className="rounded-2xl border border-border/70 bg-white/80 p-3 text-sm leading-relaxed text-muted-foreground">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-[#fff7dc] text-[#8a5b00]">
              <StageIcon className="size-4" />
            </span>
            <div>
              <p className="font-semibold text-foreground">{stage.label}</p>
              <p className="mt-1">{stage.detail}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-surface-low p-3 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">
            {auction.winner ||
              (waitingReveal
                ? `${auction.revealedBidCount ?? 0}/${auction.participants ?? 0} reveal`
                : `${auction.participants ?? 0} peserta`)}
          </p>
          <p className="mt-1">
            {auction.finalPrice ? currency.format(auction.finalPrice) : visibilityLabel}
          </p>
        </div>

        {auction.transactionId && VICKREY_PAYMENT_STATUSES.has(auction.transactionStatus ?? "") ? (
          <Link href={`/admin/transaksi/${auction.transactionId}?from=vickrey`}>
            <Button className="h-11 w-full" variant="secondary">
              <WalletCards className="size-4" />
              Kelola transaksi pemenang
            </Button>
          </Link>
        ) : null}

        <Link href={`/admin/pemasaran/vickrey-auction/${auction.id}`}>
          <Button className="h-11 w-full" variant="default">
            Lihat Sesi
            <ArrowRight className="size-4" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}

export function AdminFixedPriceListPage({
  auctions,
  emptyDescription = "Belum ada sesi fixed price untuk unit ini."
}: {
  auctions: MarketingSession[];
  emptyDescription?: string;
}) {
  const pagination = useAdminPagination(auctions, "fixed-price");

  return (
    <div className="space-y-6">
      <SessionHeader
        accent="green"
        description="Pantau sesi penjualan harga tetap, media barang, dan status pembayaran tanpa unsur lelang."
        eyebrow="Admin Unit / Pemasaran"
        title="Fixed Price"
      />

      {auctions.length ? (
        <section className="overflow-hidden rounded-[1.7rem] border border-black/8 bg-white/50 shadow-[0_22px_70px_-60px_rgba(8,69,50,0.42)]">
          <div className="grid justify-start gap-4 p-4 [grid-template-columns:repeat(auto-fit,minmax(18.5rem,23.5rem))]">
            {pagination.visibleItems.map((auction) => (
              <FixedPriceCard auction={auction} key={auction.id} />
            ))}
          </div>
          <AdminPaginationFooter
            itemLabel="sesi"
            pageIndex={pagination.pageIndex}
            pageSize={pagination.pageSize}
            totalItems={pagination.totalItems}
            onPageIndexChange={pagination.setPageIndex}
            onPageSizeChange={pagination.setPageSize}
          />
        </section>
      ) : (
        <EmptyPanel text={emptyDescription} />
      )}
    </div>
  );
}

export function AdminVickreyAuctionListPage({
  auctions,
  emptyDescription = "Belum ada sesi vickrey auction untuk unit ini."
}: {
  auctions: MarketingSession[];
  emptyDescription?: string;
}) {
  const summary = getVickreySummary(auctions);
  const paymentQueue = auctions.filter((auction) => VICKREY_PAYMENT_STATUSES.has(auction.transactionStatus ?? ""));
  const serverNow = new Date().toISOString();
  const pagination = useAdminPagination(auctions, "vickrey-auction");

  return (
    <div className="space-y-6">
      <SessionHeader
        accent="amber"
        description="Ruang kerja lelang tertutup untuk memantau sesi aktif, pembukaan hasil, pembayaran pemenang, dan arsip tanpa membuka nominal bid sebelum deadline."
        eyebrow="Admin Unit / Pemasaran"
        title="Vickrey Auction"
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SessionMetric
          label="Sesi aktif"
          tone="amber"
          value={
            <span className="inline-flex items-center gap-2">
              <Clock3 className="size-4 text-[#8a5b00]" />
              {summary.active} sesi
            </span>
          }
        />
        <SessionMetric
          label="Menunggu reveal"
          tone="amber"
          value={
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="size-4 text-[#8a5b00]" />
              {summary.pendingReveal} sesi
            </span>
          }
        />
        <SessionMetric
          label="Hasil dibuka"
          tone="neutral"
          value={
            <span className="inline-flex items-center gap-2">
              <Gavel className="size-4 text-[#0a6a49]" />
              {summary.revealed} sesi
            </span>
          }
        />
        <SessionMetric
          label="Antrian pembayaran"
          tone="green"
          value={
            <span className="inline-flex items-center gap-2">
              <WalletCards className="size-4 text-[#0a6a49]" />
              {summary.paymentQueue} sesi
            </span>
          }
        />
        <SessionMetric
          label="Terverifikasi"
          tone="green"
          value={
            <span className="inline-flex items-center gap-2">
              <BadgeCheck className="size-4 text-[#0a6a49]" />
              {summary.completed} transaksi
            </span>
          }
        />
      </div>

      {paymentQueue.length ? (
        <section className="rounded-[1.4rem] border border-[#dce9df] bg-[#f6fbf7] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0a6a49]/65">
                Antrian pembayaran
              </p>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-foreground">
                Pemenang Vickrey yang perlu dipantau
              </h3>
            </div>
            <Badge variant="default">{paymentQueue.length} sesi</Badge>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {paymentQueue.map((auction) => (
              <div className="rounded-2xl border border-[#dce9df] bg-white p-4" key={auction.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{auction.lot}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {auction.buyerName || "Pemenang"} - {humanize(auction.transactionStatus)}
                    </p>
                  </div>
                  <p className="font-headline text-lg font-extrabold text-primary">
                    {currency.format(auction.finalPrice ?? auction.basePrice ?? 0)}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                  <span>
                    <AdminLiveCountdown
                      expiredLabel="Batas bayar terlewati"
                      fallbackLabel={dateLabel(auction.paymentDeadline)}
                      prefix="Sisa"
                      serverNow={serverNow}
                      targetAt={auction.paymentDeadline}
                    />
                  </span>
                  {auction.transactionId ? (
                    <Link href={`/admin/transaksi/${auction.transactionId}?from=vickrey`}>
                      <Button size="sm" variant="secondary">
                        <WalletCards className="size-4" />
                        Buka transaksi pemenang
                      </Button>
                    </Link>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {auctions.length ? (
        <section className="overflow-hidden rounded-[1.7rem] border border-black/8 bg-white/50 shadow-[0_22px_70px_-60px_rgba(8,69,50,0.42)]">
          <div className="grid justify-start gap-4 p-4 [grid-template-columns:repeat(auto-fit,minmax(18.5rem,23.5rem))]">
            {pagination.visibleItems.map((auction) => (
              <VickreyCard auction={auction} key={auction.id} />
            ))}
          </div>
          <AdminPaginationFooter
            itemLabel="sesi"
            pageIndex={pagination.pageIndex}
            pageSize={pagination.pageSize}
            totalItems={pagination.totalItems}
            onPageIndexChange={pagination.setPageIndex}
            onPageSizeChange={pagination.setPageSize}
          />
        </section>
      ) : (
        <EmptyPanel text={emptyDescription} />
      )}
    </div>
  );
}

export function AdminFixedPriceDetailPage({
  auction
}: {
  auction: MarketingSession;
}) {
  const media = auction.media ?? [];
  const sold = auction.transactionStatus === "LUNAS";
  const buyerMedia = toBuyerMedia(media);
  const serverNow = new Date().toISOString();

  return (
    <div className="space-y-6">
      <SessionHeader
        accent="green"
        description="Halaman ini menampilkan media barang, status pembayaran, dan langkah admin berikutnya untuk sesi harga tetap."
        eyebrow="Admin Unit / Detail Pemasaran"
        title={auction.lot}
        action={<AdminStatusBadge className="text-[0.95rem]" status={auction.status as any} />}
      />

      <div className="grid gap-8 xl:grid-cols-[1.12fr_0.88fr]">
        <div className="space-y-5">
          <LotMediaGallery
            category={auction.category || "Lainnya"}
            className="min-h-[22rem] rounded-[2rem] md:min-h-[34rem]"
            media={buyerMedia}
            showVideoControls
            title={auction.lot}
          />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="border border-border/70 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Kode barang</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{auction.code || "-"}</p>
            </Card>
            <Card className="border border-border/70 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Kategori</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{auction.category || "-"}</p>
            </Card>
            <Card className="border border-border/70 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Kondisi</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{auction.condition || "-"}</p>
            </Card>
            <Card className="border border-border/70 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Harga tetap</p>
              <p className="mt-2 text-sm font-semibold text-primary">{currency.format(auction.price ?? 0)}</p>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="overflow-hidden border border-border/70 bg-white">
            <CardContent className="space-y-6 p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default">Fixed Price</Badge>
                <Badge variant="muted">{auction.code || "BRG"}</Badge>
              </div>
              <div className="space-y-2">
                <h1 className="font-headline text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
                  {auction.lot}
                </h1>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {auction.note || "Pantau verifikasi pembayaran dan penyelesaian sesi harga tetap."}
                </p>
                <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="size-4 text-primary" />
                  {auction.buyerName ? `Pembeli: ${auction.buyerName}` : "Belum ada pembeli"}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
                  {sold ? "Transaksi selesai" : "Status transaksi"}
                </p>
                <p className="mt-3 font-headline text-5xl font-extrabold tracking-tight text-primary">
                  {currency.format(auction.price ?? 0)}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {auction.transactionStatus ? humanize(auction.transactionStatus) : "Belum ada transaksi"}
                </p>
              </div>

              <div className="rounded-2xl border border-border/70 bg-surface-low p-4 text-sm leading-relaxed text-muted-foreground">
                {auction.paymentMethod ? (
                  <p>
                    Metode bayar: <span className="font-semibold text-foreground">{humanize(auction.paymentMethod)}</span>
                  </p>
                ) : (
                  <p>Menunggu pembeli memilih metode bayar.</p>
                )}
                <p className="mt-2">
                  {auction.paymentDeadline ? (
                    <AdminLiveCountdown
                      className="font-semibold text-foreground"
                      expiredLabel="Batas waktu terlewati"
                      fallbackLabel={auction.paymentDeadline || "-"}
                      prefix="Sisa"
                      serverNow={serverNow}
                      targetAt={auction.paymentDeadline}
                    />
                  ) : (
                    "Tidak ada batas verifikasi aktif."
                  )}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <SessionMetric label="Dipasarkan sejak" tone="neutral" value={dateLabel(auction.startsAt)} />
                <SessionMetric label="Referensi" tone="neutral" value={auction.reference || "-"} />
              </div>

              <div className="rounded-2xl bg-surface-low p-4 text-sm leading-relaxed text-muted-foreground">
                {auction.proofUrl ? (
                  <a
                    className="inline-flex items-center gap-2 font-semibold text-primary underline-offset-4 hover:underline"
                    href={auction.proofUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <FileText className="size-4" />
                    Lihat bukti pembayaran
                  </a>
                ) : (
                  <p>Belum ada bukti pembayaran yang diunggah.</p>
                )}
              </div>

              <Link href={`/admin/pemasaran/fixed-price/${auction.id}`}>
                <Button className="w-full" variant="default">
                  Lihat sesi
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border border-border/70 bg-[#fbfefb]">
            <CardHeader>
              <CardTitle className="text-xl sm:text-[1.45rem]">Langkah Berikutnya</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-7 text-black/70">
              {sold ? (
                <p>Transaksi selesai. Admin dapat mencetak nota dan menutup alur penjualan.</p>
              ) : auction.transactionStatus ? (
                <p>Periksa bukti pembayaran lalu verifikasi agar sesi berpindah ke status terjual.</p>
              ) : (
                <p>Belum ada pembeli yang memulai pembayaran. Pantau sesi ini sampai ada transaksi masuk.</p>
              )}
              {auction.note ? <p>{auction.note}</p> : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function VickreyPaymentPanel({ auction }: { auction: MarketingSession }) {
  if (auction.visibility !== "HASIL_DIBUKA") {
    return null;
  }

  const hasTransaction = Boolean(auction.transactionId);
  const statusLabel = auction.transactionStatus ? humanize(auction.transactionStatus) : "Belum ada transaksi";
  const serverNow = new Date().toISOString();

  return (
    <Card className="border border-border/70 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl sm:text-[1.45rem]">
          <WalletCards className="size-5 text-primary" />
          Pembayaran Pemenang
        </CardTitle>
        <CardDescription>
          {hasTransaction
            ? "Transaksi pemenang terbaca dari database. Untuk lelang Vickrey, pembayaran diproses langsung di unit."
            : "Belum ada transaksi pemenang yang perlu diverifikasi dari sesi ini."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <SessionMetric label="Pemenang" tone="neutral" value={auction.buyerName || auction.winner || "-"} />
          <SessionMetric label="Status pembayaran" tone="green" value={statusLabel} />
          <SessionMetric
            label="Metode"
            tone="neutral"
            value={auction.paymentMethod ? humanize(auction.paymentMethod) : "-"}
          />
          <SessionMetric
            label="Batas bayar"
            tone="amber"
            value={
              auction.paymentDeadline ? (
                <AdminLiveCountdown
                  expiredLabel="Batas bayar terlewati"
                  fallbackLabel={dateLabel(auction.paymentDeadline)}
                  prefix="Sisa"
                  serverNow={serverNow}
                  targetAt={auction.paymentDeadline}
                />
              ) : (
                "-"
              )
            }
          />
        </div>

        <div className="rounded-2xl border border-border/70 bg-surface-low p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Harga final Vickrey
              </p>
              <p className="mt-1 font-headline text-2xl font-extrabold text-primary">
                {currency.format(auction.finalPrice ?? auction.basePrice ?? 0)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {auction.transactionId ? (
                <Link href={`/admin/transaksi/${auction.transactionId}?from=vickrey`}>
                  <Button variant="default">
                    <WalletCards className="size-4" />
                    Buka transaksi pemenang
                  </Button>
                </Link>
              ) : null}
              {auction.proofUrl ? (
                <Link href={auction.proofUrl} rel="noreferrer" target="_blank">
                  <Button variant="secondary">
                    <ReceiptText className="size-4" />
                    Buka bukti pembayaran
                  </Button>
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminVickreyAuctionDetailPage({
  auction
}: {
  auction: MarketingSession;
}) {
  const bidRows = Array.isArray(auction.bids) ? auction.bids : [];
  const revealed = auction.visibility === "HASIL_DIBUKA";
  const waitingReveal = auction.visibility === "MENUNGGU_REVEAL";
  const showBidRows = revealed || waitingReveal;
  const buyerMedia = toBuyerMedia(auction.media ?? []);
  const serverNow = new Date().toISOString();

  return (
    <div className="space-y-6">
      <SessionHeader
        accent="amber"
        description="Halaman ini menjaga aturan sealed-bid tetap jelas, lalu menampilkan hasil setelah deadline terlewati."
        eyebrow="Admin Unit / Detail Pemasaran"
        title={auction.lot}
        action={<AdminStatusBadge className="text-[0.95rem]" status={auction.status as any} />}
      />

      <div className="grid gap-8 xl:grid-cols-[1.12fr_0.88fr]">
        <div className="space-y-5">
          <LotMediaGallery
            category={auction.category || "Lainnya"}
            className="min-h-[22rem] rounded-[2rem] md:min-h-[34rem]"
            media={buyerMedia}
            showVideoControls
            title={auction.lot}
          />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="border border-border/70 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Kode barang</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{auction.code || "-"}</p>
            </Card>
            <Card className="border border-border/70 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Kategori</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{auction.category || "-"}</p>
            </Card>
            <Card className="border border-border/70 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Kondisi</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{auction.condition || "-"}</p>
            </Card>
            <Card className="border border-border/70 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Harga dasar</p>
              <p className="mt-2 text-sm font-semibold text-primary">{currency.format(auction.basePrice ?? 0)}</p>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="overflow-hidden border border-border/70 bg-white">
            <CardContent className="space-y-6 p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="accent">Vickrey Auction</Badge>
                <Badge variant="muted">{auction.code || "BRG"}</Badge>
              </div>
              <div className="space-y-2">
                <h1 className="font-headline text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
                  {auction.lot}
                </h1>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {auction.note || "Pantau sesi lelang, peserta, dan pembukaan hasil setelah deadline."}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
                  {revealed ? "Hasil terbuka" : waitingReveal ? "Menunggu reveal" : "Hasil terkunci"}
                </p>
                <p className="mt-3 font-headline text-5xl font-extrabold tracking-tight text-primary">
                  {currency.format(auction.basePrice ?? 0)}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {revealed
                    ? "Hasil final sudah terbentuk dan transaksi pemenang dapat dipantau."
                    : waitingReveal
                      ? "Deadline lewat. Sistem menunggu buyer reveal nominal tanpa membuka nilai ke admin."
                      : "Nominal bid tetap tersembunyi sampai deadline selesai."}
                </p>
              </div>

              <div className="rounded-2xl border border-border/70 bg-surface-low p-4 text-sm leading-relaxed text-muted-foreground">
                <p className="inline-flex items-center gap-2">
                  <UsersRound className="size-4 text-[#8a5b00]" />
                  {auction.participants ?? 0} peserta
                </p>
                <p className="mt-2">
                  <AdminLiveCountdown
                    className="font-semibold text-foreground"
                    expiredLabel={waitingReveal ? "Batas reveal terlewati" : "Deadline terlewati"}
                    fallbackLabel={waitingReveal ? auction.revealDeadline ?? "-" : auction.ending || "-"}
                    prefix="Sisa"
                    serverNow={serverNow}
                    targetAt={waitingReveal ? auction.revealDeadlineAt ?? undefined : auction.endingAt}
                  />
                </p>
                <p className="mt-2">{humanize(auction.visibility)}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <SessionMetric label="Dipasarkan sejak" tone="neutral" value={dateLabel(auction.startsAt)} />
                <SessionMetric label="Berakhir pada" tone="neutral" value={dateLabel(auction.endingAt)} />
              </div>

              <Link href={`/admin/pemasaran/vickrey-auction/${auction.id}`}>
                <Button className="w-full" variant="default">
                  Lihat sesi
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border border-border/70 bg-[#fffaf2]">
            <CardHeader>
              <CardTitle className="text-xl sm:text-[1.45rem]">Aturan Hasil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-[#ead8b5] bg-white p-5">
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[#8a5b00]/55">
                  {revealed ? "Hasil terbuka" : waitingReveal ? "Reveal window" : "Hasil terkunci"}
                </p>
                <p className="mt-2 text-lg font-semibold text-black/85">
                  {revealed
                    ? "Pemenang dan harga final sudah terbentuk"
                    : waitingReveal
                      ? "Menunggu buyer reveal nominal"
                      : "Nominal bid belum dapat dibuka"}
                </p>
                <p className="mt-2 text-sm leading-6 text-black/60">
                  {revealed
                    ? "Admin melihat pemenang, harga final, dan status pembayaran setelah settlement selesai."
                    : waitingReveal
                      ? "Buyer perlu membuka nominal dari sisi akunnya. Admin tetap tidak menerima nominal individual sebelum settlement."
                      : "Selama sesi aktif, admin hanya melihat jumlah peserta dan status sesi tanpa nominal bid."}
                </p>
              </div>

              <SessionMetric label="Pemenang" tone="neutral" value={auction.winner || "-"} />
              <SessionMetric label="Harga final" tone="neutral" value={auction.finalPrice ? currency.format(auction.finalPrice) : "-"} />
            </CardContent>
          </Card>

          <VickreyPaymentPanel auction={auction} />

          <Card className="border border-border/70">
            <CardHeader>
              <CardTitle className="text-xl sm:text-[1.45rem]">Daftar Bid</CardTitle>
            </CardHeader>
            <CardContent>
              {showBidRows ? (
                bidRows.length ? (
                  <div className="overflow-x-auto rounded-[1.35rem] border border-black/10">
                    <table className="w-full min-w-[48rem] text-left">
                      <thead className="bg-[#fff6e5] text-xs uppercase tracking-[0.16em] text-black/45">
                        <tr>
                          <th className="px-4 py-3">Urutan</th>
                          <th className="px-4 py-3">Peserta</th>
                          <th className="px-4 py-3">Nilai bid</th>
                          <th className="px-4 py-3">Waktu</th>
                          <th className="px-4 py-3">Peran</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bidRows.map((bid) => (
                          <tr className="border-t border-black/8 text-sm text-black/70" key={bid.id}>
                            <td className="px-4 py-3 font-semibold text-[#8a5b00]">#{bid.rank}</td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-semibold text-black/85">{bid.bidderName}</p>
                                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-black/38">
                                  ID {bid.bidderId}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-black/55">
                                Tidak dikirim ke admin
                              </span>
                            </td>
                            <td className="px-4 py-3 text-black/55">{bid.submittedAtLabel}</td>
                            <td className="px-4 py-3">
                              {waitingReveal ? (
                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                  bid.isRevealed ? "bg-[#eef7f1] text-[#0a6a49]" : "bg-[#fff7dc] text-[#8a5b00]"
                                }`}>
                                  {bid.isRevealed ? "Sudah reveal" : "Belum reveal"}
                                </span>
                              ) : bid.isWinner ? (
                                <span className="inline-flex rounded-full bg-[#eef7f1] px-3 py-1 text-xs font-semibold text-[#0a6a49]">
                                  Pemenang (B1)
                                </span>
                              ) : (
                                <span className="inline-flex rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-black/55">
                                  Peserta
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyPanel text={waitingReveal ? "Deadline lewat, tetapi belum ada commitment bid untuk direveal." : "Deadline sudah lewat, tetapi belum ada bid yang tercatat untuk sesi ini."} />
                )
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-[#ead8b5] bg-[#fffcf7] p-5 text-sm leading-7 text-black/55">
                  Nominal bid tetap terkunci sampai waktu penutupan terlewati.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
