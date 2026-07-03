"use client";

import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CalendarClock,
  CarFront,
  CheckCircle2,
  Clock3,
  FileText,
  FileCheck2,
  FileWarning,
  Gavel,
  Gem,
  Hash,
  Landmark,
  Medal,
  Megaphone,
  MonitorSmartphone,
  Ban,
  Package,
  Package2,
  PackagePlus,
  PencilLine,
  Phone,
  Printer,
  Ruler,
  Save,
  RotateCcw,
  Scale,
  ScrollText,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  UserRound,
  ReceiptText,
  UploadCloud,
  Wallet,
  WalletCards,
} from "lucide-react";

import { AdminLiveCountdown } from "@/components/admin/admin-live-countdown";
import { AdminPageHero } from "@/components/admin/admin-page-hero";
import { AdminBlacklistList } from "@/components/admin/admin-blacklist-list";
import { AdminBarangDetailMediaViewer } from "@/components/admin-unit/admin-barang-detail-media-viewer";
import { AdminUnitActionButton } from "@/components/admin-unit/admin-unit-action-button";
import {
  AdminProfileWorkspace,
  type AdminProfileData,
} from "@/components/admin/admin-profile-workspace";
import { AdminBarangEditForm } from "@/components/admin-unit/admin-barang-edit-form";
import { AdminBarangMediaManager } from "@/components/admin-unit/admin-barang-media-manager";
import { AdminExtensionForm } from "@/components/admin-unit/admin-extension-form";
import { AdminInventoryCreateForm } from "@/components/admin-unit/admin-inventory-create-form";
import { AdminMarketingForm } from "@/components/admin-unit/admin-marketing-form";
import { AdminRedeemForm } from "@/components/admin-unit/admin-redeem-form";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { SuperadminBlacklistDetailWorkspace } from "@/components/superadmin/superadmin-blacklist-detail-workspace";
import {
  AdminInventoryHistoryWorkspace,
  AdminInventoryWorkspace,
} from "@/components/admin/admin-inventory-workspace";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getAdminInventoryMetrics } from "@/lib/admin-unit/operational-metrics";
import { getBarangSpecificationRows } from "@/lib/admin-unit/specifications";
import { currency } from "@/lib/formatters/currency";
import { cn } from "@/lib/utils";

type AdminInventoryItem = Record<string, any>;
type AdminBarangMedia = {
  id: string;
  type: string;
  url: string;
  fileName?: string;
  sizeBytes?: number;
};
type AdminBarangHistoryActionKey =
  | "input_baru"
  | "perpanjangan"
  | "jaminan"
  | "ditebus"
  | "dipasarkan"
  | "menunggu_pembayaran"
  | "terjual"
  | "gagal"
  | "perubahan_status";

function isImageBarangMedia(media: AdminBarangMedia | null | undefined) {
  if (!media) {
    return false;
  }

  return media.type !== "video" && !/\.(mp4|mov|webm|mkv)$/i.test(media.url);
}

type AdminAuctionItem = Record<string, any> & {
  bids?: Array<{
    id: string;
    bidderId: string;
    bidderName: string;
    submittedAt: string;
    submittedAtLabel: string;
    rank: number;
    isWinner: boolean;
    determinesFinalPrice: boolean;
  }>;
};
type AdminTransactionItem = Record<string, any>;
type AdminBlacklistItem = Record<string, any>;

function dateAfter(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

function AdminPageIntro({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <section className="hero-surface section-reveal p-5 sm:p-6 lg:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-4xl">
          <p className="page-heading-eyebrow">{eyebrow}</p>
          <h2 className="page-heading-title mt-3 font-headline text-3xl font-black tracking-tight text-[#0a6a49] sm:text-4xl lg:text-[2.85rem]">
            {title}
          </h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-foreground/72 sm:text-lg">
            {description}
          </p>
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </section>
  );
}

function AdminHeroPill({
  icon: Icon,
  children,
  tone = "default"
}: {
  icon?: ComponentType<{ className?: string }>;
  children: ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-[0.72rem] font-bold uppercase tracking-[0.16em] shadow-[0_16px_34px_-28px_rgba(8,69,50,0.35)] ring-1 backdrop-blur",
        tone === "danger"
          ? "bg-rose-50/92 text-rose-700 ring-rose-200"
          : "bg-white/75 text-[#0a6a49] ring-[#8fd0a9]/65"
      )}
    >
      {Icon ? <Icon className="size-4" /> : null}
      {children}
    </div>
  );
}

function PanelTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dce9df] px-5 py-5 sm:px-6">
      <div>
        <h3 className="font-headline text-[1.55rem] font-black text-black/85 sm:text-[1.8rem]">
          {title}
        </h3>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-black/60 sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-black/50 sm:text-xs">
      {children}
    </label>
  );
}

function DetailTile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-[#fbfbfb] p-4 sm:p-5">
      <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-black/45 sm:text-xs">
        {label}
      </p>
      <div className="mt-2 text-base font-semibold text-black/80 sm:text-lg">
        {value}
      </div>
    </div>
  );
}

function formatDisplayLabel(value: unknown) {
  const normalized = String(value ?? "-")
    .replace(/_/g, " ")
    .trim();

  if (!normalized || normalized === "-") {
    return "-";
  }

  return normalized
    .toLowerCase()
    .replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
}

function getCategoryIcon(category: unknown) {
  const normalized = String(category ?? "").toLowerCase();

  if (normalized.includes("emas") || normalized.includes("perhias")) {
    return Gem;
  }
  if (normalized.includes("logam")) {
    return Medal;
  }
  if (normalized.includes("kendara") || normalized.includes("motor") || normalized.includes("mobil")) {
    return CarFront;
  }
  if (normalized.includes("elektronik") || normalized.includes("televisi") || normalized.includes("gadget")) {
    return MonitorSmartphone;
  }
  return Package2;
}

function getSpecificationIcon(category: unknown, label: string) {
  const normalizedCategory = String(category ?? "").toLowerCase();
  const normalizedLabel = label.toLowerCase();

  if (normalizedCategory.includes("emas") || normalizedCategory.includes("perhias")) {
    if (normalizedLabel.includes("berat")) return Scale;
    if (normalizedLabel.includes("kadar")) return Sparkles;
    if (normalizedLabel.includes("panjang") || normalizedLabel.includes("diameter")) return Ruler;
    if (normalizedLabel.includes("sertifikat")) return ShieldCheck;
    return Gem;
  }

  if (normalizedCategory.includes("logam")) {
    if (normalizedLabel.includes("berat")) return Scale;
    if (normalizedLabel.includes("sertifikat")) return ShieldCheck;
    return Medal;
  }

  if (normalizedCategory.includes("kendara")) {
    if (normalizedLabel.includes("nomor")) return Hash;
    if (normalizedLabel.includes("dokumen")) return FileText;
    return CarFront;
  }

  if (normalizedCategory.includes("elektronik")) {
    if (normalizedLabel.includes("garansi")) return ShieldCheck;
    if (normalizedLabel.includes("kapasitas") || normalizedLabel.includes("spesifikasi")) return FileText;
    return MonitorSmartphone;
  }

  if (normalizedLabel.includes("ukuran")) return Ruler;
  if (normalizedLabel.includes("material")) return Sparkles;
  return Package2;
}

function splitTimelineStamp(label: string | null | undefined) {
  const normalized = String(label ?? "").trim();
  if (!normalized) {
    return { date: "-", time: "" };
  }

  const parts = normalized.split(",");
  if (parts.length >= 2) {
    return {
      date: parts[0].trim(),
      time: parts.slice(1).join(",").trim(),
    };
  }

  return { date: normalized, time: "" };
}

const TIMELINE_MONTH_INDEX: Record<string, number> = {
  januari: 0,
  jan: 0,
  februari: 1,
  feb: 1,
  maret: 2,
  mar: 2,
  april: 3,
  apr: 3,
  mei: 4,
  juni: 5,
  jun: 5,
  juli: 6,
  jul: 6,
  agustus: 7,
  agu: 7,
  ags: 7,
  september: 8,
  sep: 8,
  oktober: 9,
  okt: 9,
  november: 10,
  nov: 10,
  desember: 11,
  des: 11,
};

function parseTimelineTime(label: string | null | undefined) {
  const normalized = String(label ?? "").trim();
  if (!normalized || normalized === "-") return Number.POSITIVE_INFINITY;

  const localizedMatch = normalized.match(
    /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})(?:,\s*(\d{1,2})[.:](\d{2})(?::(\d{2}))?)?/,
  );

  if (localizedMatch) {
    const [, day, monthLabel, year, hour = "0", minute = "0", second = "0"] = localizedMatch;
    const month = TIMELINE_MONTH_INDEX[monthLabel.toLowerCase()];

    if (typeof month === "number") {
      return new Date(
        Number(year),
        month,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second),
      ).getTime();
    }
  }

  const parsed = Date.parse(normalized);
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
}

function sortTimelineEntries<T extends { createdAtLabel?: string | null }>(entries: T[]) {
  return entries
    .map((entry, index) => ({
      entry,
      index,
      time: parseTimelineTime(entry.createdAtLabel),
    }))
    .sort((left, right) => left.time - right.time || left.index - right.index)
    .map(({ entry }) => entry);
}

function AdminAuctionDeadline({
  auction,
  prefix,
  className,
}: {
  auction: AdminAuctionItem;
  prefix?: string;
  className?: string;
}) {
  const serverNow = new Date().toISOString();

  return (
    <AdminLiveCountdown
      className={className}
      expiredLabel="Deadline terlewati"
      fallbackLabel={auction.ending}
      prefix={prefix}
      serverNow={serverNow}
      targetAt={auction.endingAt}
    />
  );
}

function AdminTransactionDeadline({
  transaction,
  prefix,
  className,
}: {
  transaction: AdminTransactionItem;
  prefix?: string;
  className?: string;
}) {
  const serverNow = new Date().toISOString();

  return (
    <AdminLiveCountdown
      className={className}
      expiredLabel="Batas waktu terlewati"
      fallbackLabel={transaction.deadline}
      prefix={prefix}
      serverNow={serverNow}
      targetAt={transaction.deadlineAt}
    />
  );
}

function EmptyPanel({ text }: { text: string }) {
  return (
    <div className="feedback-pop rounded-[1.4rem] border border-dashed border-black/10 bg-[#fcfcfa] p-5 text-sm text-black/55">
      {text}
    </div>
  );
}

function AdminBarangMediaGallery({ media }: { media: AdminBarangMedia[] }) {
  if (!media.length) {
    return (
      <div className="rounded-[1.4rem] border border-dashed border-black/10 bg-[#fcfcfa] p-5 text-sm text-black/55">
        Belum ada foto atau video yang tersimpan untuk barang ini.
      </div>
    );
  }

  return (
    <Card className="rounded-2xl border border-black/10">
      <CardHeader>
        <CardTitle className="text-xl sm:text-[1.45rem]">
          Galeri Foto & Video
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Media ini akan menjadi bahan utama saat barang ditayangkan ke katalog.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {media.map((item) => {
          const isVideo =
            item.type === "video" || item.url.match(/\.(mp4|mov|webm)$/i);
          return (
            <div
              className="overflow-hidden rounded-2xl border border-black/10 bg-white"
              key={item.id}
            >
              <div className="aspect-video bg-[#edf3ef]">
                {isVideo ? (
                  <video
                    className="size-full object-cover"
                    controls
                    src={item.url}
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={item.fileName || "Foto barang"}
                    className="size-full object-cover"
                    src={item.url}
                  />
                )}
              </div>
              <div className="p-3 text-xs font-semibold uppercase tracking-[0.14em] text-black/45">
                {isVideo ? "Video" : "Foto"}{" "}
                {item.fileName ? `- ${item.fileName}` : ""}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function WorkflowActionCard({
  title,
  description,
  href,
  icon: Icon,
  variant = "secondary",
}: {
  title: string;
  description: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  variant?: "default" | "secondary";
}) {
  return (
    <div className="interactive-card section-reveal rounded-[1.5rem] border border-black/10 bg-[#fafaf8] p-5">
      <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-white text-[#0a6a49] shadow-sm">
        <Icon className="size-5" />
      </div>
      <h4 className="mt-4 text-lg font-bold text-black/85">{title}</h4>
      <p className="mt-2 text-sm leading-6 text-black/60">{description}</p>
      <div className="mt-5">
        <Link href={href}>
          <Button className="w-full rounded-2xl" variant={variant}>
            Lanjutkan proses
          </Button>
        </Link>
      </div>
    </div>
  );
}

function DetailActionButton({
  title,
  href,
  icon: Icon,
  variant = "secondary",
}: {
  title: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  variant?: "default" | "secondary";
}) {
  const isPrimary = variant === "default";

  return (
    <Link href={href}>
      <Button
        className={cn(
          "h-[3.35rem] min-w-[10.75rem] rounded-[1.05rem] px-4 text-[0.92rem] font-semibold shadow-none sm:min-w-[11.5rem]",
          isPrimary
            ? "bg-[#006747] text-white hover:bg-[#005238]"
            : "border border-[#0a9f62] bg-white text-[#0a7d51] hover:bg-[#f7fbf8]"
        )}
        variant={isPrimary ? "default" : "ghost"}
      >
        <Icon className="size-4.5" />
        {title}
      </Button>
    </Link>
  );
}

function InventoryMetricCard({
  label,
  value,
  description,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  description: string;
  icon: ComponentType<{ className?: string }>;
  tone?: "default" | "success" | "warning";
}) {
  return (
    <div className="rounded-[1.7rem] border border-[#cfe5d6] bg-white p-1.5 shadow-[0_22px_70px_-58px_rgba(8,69,50,0.45)]">
      <div className="flex h-full items-center gap-4 rounded-[calc(1.7rem-0.375rem)] border border-[#edf4ef] bg-[linear-gradient(145deg,#ffffff,#fbfaf5)] p-4">
        <span
          className={cn(
            "grid size-12 shrink-0 place-items-center rounded-[1.15rem] border",
            tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-[#0a6a49]"
              : tone === "warning"
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-[#dce9df] bg-[#f2f6f2] text-[#0a6a49]",
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-black/45">
            {label}
          </p>
          <p className="mt-1 font-headline text-3xl font-black tracking-[-0.04em] text-[#13211c]">
            {value}
          </p>
          <p className="mt-1 text-sm leading-5 text-black/56">{description}</p>
        </div>
      </div>
    </div>
  );
}

export function AdminInventoryPage({ items }: { items: AdminInventoryItem[] }) {
  const inventoryMetrics = getAdminInventoryMetrics(items);

  return (
    <div className="-mx-4 -my-5 min-h-[calc(100dvh-8rem)] space-y-5 bg-white px-4 py-5 sm:-mx-6 sm:-my-6 sm:px-6 sm:py-6 lg:-mx-8 lg:-my-8 lg:px-8 lg:py-8">
      <AdminPageHero
        description="Kelola barang jaminan, baca tahap operasional terbaru, dan buka detail saat admin perlu mengambil keputusan berikutnya."
        eyebrow="Admin Unit / Barang"
        icon={Package}
        rightRail={
          <>
            <AdminHeroPill icon={BadgeCheck}>Workspace operasional barang</AdminHeroPill>
            <Link href="/admin/barang/tambah">
              <Button className="h-12 w-full rounded-2xl px-5 text-sm shadow-[0_18px_32px_-24px_rgba(10,106,73,0.55)] sm:w-auto sm:text-base">
                <PackagePlus className="size-4" />
                Tambah Barang
              </Button>
            </Link>
          </>
        }
        title="Daftar Barang Unit"
      />

      <section className="grid gap-4 md:grid-cols-3">
        <InventoryMetricCard
          description="Seluruh barang yang tercatat pada unit aktif."
          icon={PackagePlus}
          label="Total Barang"
          value={inventoryMetrics.total}
        />
        <InventoryMetricCard
          description="Barang jatuh tempo atau pemasaran gagal yang siap ditayangkan kembali."
          icon={BadgeCheck}
          label="Siap Dipasarkan"
          tone="success"
          value={inventoryMetrics.readyForMarketing}
        />
        <InventoryMetricCard
          description="Barang dengan batas jatuh tempo dalam tujuh hari."
          icon={CalendarClock}
          label="Jatuh Tempo Dekat"
          tone="warning"
          value={inventoryMetrics.dueSoon}
        />
      </section>

      <AdminInventoryWorkspace items={items} />
    </div>
  );
}

export function AdminInventoryHistoryPage({
  history,
}: {
  history: Array<{
    id: string;
    barangId: string;
    barangCode: string;
    barangName: string;
    category: string;
    condition: string;
    description: string | null;
    specifications: unknown;
    ownerName: string;
    customerNumber: string;
    actionKey: AdminBarangHistoryActionKey;
    actionLabel: string;
    actionTone: "default" | "success" | "warning" | "danger";
    note: string;
    actorName: string;
    actorRole: string | null;
    createdAt: string;
    createdAtLabel: string;
  }>;
}) {
  return (
    <div className="-mx-4 -my-5 min-h-[calc(100dvh-8rem)] space-y-5 bg-[#ffffff] px-4 py-5 print:m-0 print:min-h-0 print:space-y-0 print:p-0 sm:-mx-6 sm:-my-6 sm:px-6 sm:py-6 lg:-mx-8 lg:-my-8 lg:px-8 lg:py-8">
      <section className="relative overflow-hidden rounded-[2.35rem] bg-[radial-gradient(circle_at_top_left,rgba(193,255,226,0.95),transparent_28%),linear-gradient(135deg,#fffdfa_0%,#f6f4ee_42%,#ffffff_100%)] px-6 py-6 shadow-[0_28px_90px_-72px_rgba(8,69,50,0.42)] print:hidden sm:px-7 lg:px-8">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[28rem] bg-[radial-gradient(circle_at_center,rgba(9,111,78,0.12),transparent_62%)] lg:block" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-start gap-4 md:items-center">
            <span className="grid size-16 shrink-0 place-items-center rounded-[1.35rem] bg-[linear-gradient(180deg,#fdfcf8,#edf7ef)] text-[#0a6a49] shadow-[0_20px_45px_-28px_rgba(10,106,73,0.38),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-[#8fd0a9]/65">
              <ScrollText className="size-7" />
            </span>
            <div className="min-w-0">
              <p className="page-heading-eyebrow">Admin Unit / Riwayat Barang</p>
              <h2 className="mt-2 font-headline text-3xl font-black tracking-[-0.04em] text-[#13211c] sm:text-4xl">
                Riwayat Barang
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-black/60 sm:text-base">
                Jejak aktivitas sistem dan pengguna terkait pengelolaan barang,
                jaminan, dan proses lelang dari unit aktif.
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/75 px-4 py-2 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#0a6a49] shadow-[0_16px_34px_-28px_rgba(8,69,50,0.35)] ring-1 ring-[#8fd0a9]/65 backdrop-blur">
            <Clock3 className="size-4" />
            {history.length} catatan aktivitas
          </div>
        </div>
      </section>

      <AdminInventoryHistoryWorkspace history={history} />
    </div>
  );
}

export function AdminInventoryCreatePage() {
  return (
    <div className="space-y-6">
      <AdminPageIntro
        eyebrow="Admin Unit / Input Barang"
        title="Tambahkan Barang Gadai"
        description="Gunakan formulir ini untuk mencatat barang masuk beserta appraisal, informasi nasabah, jadwal jatuh tempo, dan media pendukung sebelum lanjut ke proses berikutnya."
      />

      <AdminInventoryCreateForm />
    </div>
  );
}

export function AdminInventoryDetailPage({
  itemId: _itemId,
  item,
  history = [],
}: {
  itemId?: string;
  item: AdminInventoryItem;
  history?: Array<{
    id: string;
    barangId: string;
    actionLabel: string;
    actionKey: AdminBarangHistoryActionKey;
    note: string;
    actorName: string;
    createdAtLabel: string;
  }>;
}) {
  const jaminanActions = [
    {
      title: "Catat Perpanjangan",
      description:
        "Perbarui jatuh tempo bila nasabah memperpanjang masa gadai sebelum barang dipasarkan.",
      href: `/admin/barang/${item.id}/perpanjang`,
      icon: CalendarClock,
      variant: "secondary" as const,
    },
    {
      title: "Catat Penebusan",
      description:
        "Tutup alur barang bila nasabah sudah melunasi kewajiban dan mengambil barangnya.",
      href: `/admin/barang/${item.id}/tebus`,
      icon: ReceiptText,
      variant: "secondary" as const,
    },
    {
      title: "Pasarkan Barang",
      description:
        "Pilih harga tetap atau Lelang Tertutup, lalu tayangkan ke katalog pembeli.",
      href: `/admin/barang/${item.id}/pasarkan`,
      icon: Megaphone,
    },
  ];

  const actions =
    item.status === "GADAI" || item.status === "JAMINAN"
      ? jaminanActions
      : item.status === "GAGAL"
        ? [
            {
              title: "Lelang Lagi",
              description:
                "Buka popup pemasaran untuk membuat sesi baru setelah detail barang dievaluasi ulang.",
              href: `/admin/barang/${item.id}/pasarkan`,
              icon: RotateCcw,
            },
          ]
        : item.status === "DIPASARKAN"
          ? [
              {
                title: "Buka Sesi Pemasaran",
                description:
                  "Lihat perkembangan sesi, tenggat waktu, dan status keterbukaan hasil.",
                href: "/admin/pemasaran",
                icon: Gavel,
              },
            ]
          : item.status === "MENUNGGU_PEMBAYARAN"
            ? [
                {
                  title: "Buka Antrian Pembayaran",
                  description:
                    "Amankan penyelesaian pembayaran sebelum tenggat 24 jam terlewati.",
                  href: "/admin/transaksi",
                  icon: Wallet,
                },
              ]
            : [];
  const media = Array.isArray(item.media)
    ? (item.media as AdminBarangMedia[])
    : [];
  const specificationRows = getBarangSpecificationRows(
    String(item.category ?? ""),
    item.specifications ?? {},
  );
  const firstMeaningfulSpec =
    specificationRows.find((row) =>
      ["berat", "merek", "jenis", "tipe"].some((query) =>
        row.label.toLowerCase().includes(query),
      ),
    ) ?? specificationRows[0];
  const secondMeaningfulSpec =
    specificationRows.find((row) =>
      ["kadar", "kapasitas", "model", "tahun", "material"].some((query) =>
        row.label.toLowerCase().includes(query),
      ),
    ) ?? specificationRows[1];
  const timelineSourceEntries =
    history.length > 0
      ? history
      : [
          {
            id: `${item.id}-received`,
            barangId: String(item.id),
            actionLabel: "Barang Diterima Unit",
            actionKey: "input_baru" as const,
            note: "Barang hasil input gadai dicatat sebagai aset jaminan unit.",
            actorName: "Admin Unit",
            createdAtLabel: item.pawnedAt || item.date || "-",
          },
        ];
  const timelineEntries = sortTimelineEntries(timelineSourceEntries);
  const summaryMetrics = [
    {
      label: "Kategori",
      value: formatDisplayLabel(item.category),
      icon: Package2,
    },
    {
      label: "Kondisi",
      value: formatDisplayLabel(item.condition),
      icon: ShieldCheck,
    },
    {
      label: "Nilai Taksiran",
      value: currency.format(item.appraisalValue),
      icon: Landmark,
    },
  ];
  const topInfoRows = [
    firstMeaningfulSpec
      ? {
          label: firstMeaningfulSpec.label,
          value: firstMeaningfulSpec.value || "-",
          icon: getSpecificationIcon(item.category, firstMeaningfulSpec.label),
        }
      : null,
    secondMeaningfulSpec &&
    secondMeaningfulSpec.label !== firstMeaningfulSpec?.label
      ? {
          label: secondMeaningfulSpec.label,
          value: secondMeaningfulSpec.value || "-",
          icon: getSpecificationIcon(item.category, secondMeaningfulSpec.label),
        }
      : null,
    specificationRows.find(
      (row) =>
        ![firstMeaningfulSpec?.label, secondMeaningfulSpec?.label].includes(row.label),
    )
      ? {
          label:
            specificationRows.find(
              (row) =>
                ![firstMeaningfulSpec?.label, secondMeaningfulSpec?.label].includes(row.label),
            )?.label || "Detail",
          value:
            specificationRows.find(
              (row) =>
                ![firstMeaningfulSpec?.label, secondMeaningfulSpec?.label].includes(row.label),
            )?.value || "-",
          icon: getSpecificationIcon(
            item.category,
            specificationRows.find(
              (row) =>
                ![firstMeaningfulSpec?.label, secondMeaningfulSpec?.label].includes(row.label),
            )?.label || "Detail",
          ),
        }
      : null,
    { label: "Jatuh Tempo", value: item.dueDate || "-", icon: CalendarClock },
  ].filter(Boolean) as Array<{
    label: string;
    value: string;
    icon: ComponentType<{ className?: string }>;
  }>;
  const bottomInfoRows = [
    { label: "Tanggal Gadai", value: item.pawnedAt || "-", icon: CalendarDays },
    { label: "Nama Nasabah", value: item.ownerName || "-", icon: UserRound },
    { label: "Nomor Telepon Nasabah", value: item.customerNumber || "-", icon: Phone },
  ];

  return (
    <div className="space-y-5">
      <AdminPageHero
        description="Gunakan halaman ini untuk melihat posisi barang saat ini, memeriksa data pendukung, dan melanjutkan langkah yang memang tersedia."
        eyebrow="Admin Unit / Detail Barang"
        icon={Package}
        rightRail={
          <AdminHeroPill icon={ShieldCheck}>
            Status {formatDisplayLabel(item.status)}
          </AdminHeroPill>
        }
        title={item.name}
      />

      <div className="flex flex-wrap justify-end gap-3">
        {actions.length ? (
          actions.map((action) => (
            <DetailActionButton
              href={action.href}
              icon={action.icon}
              key={action.title}
              title={action.title}
              variant={"variant" in action && action.variant === "secondary" ? "secondary" : "default"}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-black/10 bg-white px-4 py-3 text-sm text-black/55">
            Tidak ada aksi lanjutan yang perlu dijalankan dari halaman ini.
          </div>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_21.5rem]">
        <div>
          <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
            <div className="space-y-5 p-4 lg:p-5">
              <div className="relative overflow-hidden rounded-[1.35rem] border border-[#dcebe2] bg-[linear-gradient(135deg,rgba(223,242,232,0.88)_0%,rgba(246,250,247,0.94)_48%,rgba(255,255,255,0.98)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] lg:p-5">
                <div className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-[#006747]/[0.055]" />

                <div className="relative mb-3 flex justify-end">
                  <Link href={`/admin/barang/${item.id}/edit`}>
                    <Button
                      className="h-10 rounded-xl border border-[#0a9f62]/55 bg-white/80 px-3.5 text-[0.82rem] font-semibold text-[#0a7d51] shadow-[0_10px_24px_rgba(8,69,50,0.06)] transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-white"
                      variant="ghost"
                    >
                      <PencilLine className="size-4" />
                      Edit Data Barang
                    </Button>
                  </Link>
                </div>

                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start">
                  <div className="w-full shrink-0 lg:w-[18rem]">
                    <AdminBarangDetailMediaViewer
                      category={formatDisplayLabel(item.category)}
                      media={media}
                      title={String(item.name ?? "Barang")}
                    />
                  </div>

                  <div className="min-w-0 flex-1 space-y-4">
                    <div>
                      <h2 className="font-headline text-[2rem] font-black tracking-[-0.04em] text-[#14213d] sm:text-[2.45rem]">
                        {item.name}
                      </h2>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[0.95rem] text-[#667085]">
                        <span className="font-medium">Kode Barang:</span>
                        <span className="font-medium text-[#0a9f62]">{item.code}</span>
                      </div>
                    </div>

                    <div className="grid gap-2.5 sm:max-w-[32rem] sm:grid-cols-[0.95fr_0.92fr_1.42fr]">
                      {summaryMetrics.map((metric) => (
                        <div
                          className="rounded-[0.95rem] border border-white/75 bg-white/82 px-3 py-3 shadow-[0_12px_26px_rgba(8,69,50,0.055),inset_0_1px_0_rgba(255,255,255,0.9)]"
                          key={metric.label}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="grid size-9 shrink-0 place-items-center rounded-full border border-[#cfeadd] bg-[#f4fbf7] text-[#099561] shadow-[inset_0_1px_0_rgba(255,255,255,0.86)]">
                              <metric.icon className="size-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="whitespace-nowrap text-[0.68rem] font-semibold leading-4 text-[#667085]">
                                {metric.label}
                              </p>
                              <p
                                className={cn(
                                  "mt-0.5 whitespace-nowrap font-bold leading-5 text-[#14213d]",
                                  metric.label === "Nilai Taksiran"
                                    ? "text-[0.82rem] xl:text-[0.88rem]"
                                    : "text-[0.93rem]"
                                )}
                              >
                                {metric.value}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-[#eef1ee]" />

              <div className="space-y-0 rounded-2xl border border-[#eef1ee] bg-white">
                <div className="grid gap-0 border-b border-[#eef1ee] sm:grid-cols-2 xl:grid-cols-4">
                  {topInfoRows.map((row, index) => (
                    <div
                      className={cn(
                        "flex items-start gap-3 px-4 py-4",
                        index < topInfoRows.length - 1 ? "xl:border-r xl:border-[#eef1ee]" : null,
                      )}
                      key={row.label}
                    >
                      <span className="mt-0.5 grid size-7 shrink-0 place-items-center text-[#0a9f62]">
                        <row.icon className="size-4.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[0.72rem] font-medium text-[#667085]">
                          {row.label}
                        </p>
                        <p className="mt-1.5 text-[0.98rem] font-medium text-[#14213d]">
                          {row.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-0 sm:grid-cols-2 xl:grid-cols-3">
                  {bottomInfoRows.map((row, index) => (
                    <div
                      className={cn(
                        "flex items-start gap-3 px-4 py-4",
                        index < bottomInfoRows.length - 1 ? "xl:border-r xl:border-[#eef1ee]" : null,
                      )}
                      key={row.label}
                    >
                      <span className="mt-0.5 grid size-7 shrink-0 place-items-center text-[#0a9f62]">
                        <row.icon className="size-4.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[0.72rem] font-medium text-[#667085]">
                          {row.label}
                        </p>
                        <p className="mt-1.5 text-[0.98rem] font-medium text-[#14213d]">
                          {row.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[#eaeeeb] bg-[linear-gradient(180deg,#ffffff,#fafcfa)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)]">
                <div className="flex items-start gap-3.5">
                  <span className="grid size-11 shrink-0 place-items-center rounded-[0.9rem] border border-[#ddf1e6] bg-[#f7fbf8] text-[#0a9f62]">
                    <FileText className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[1.05rem] font-medium text-[#0d8b56]">
                      Deskripsi Barang
                    </h3>
                    <div className="scrollbar-none mt-3 space-y-2.5 overflow-y-auto text-justify text-[0.96rem] leading-7 text-[#5f6f86]">
                      <p>
                        {item.description || "Belum ada deskripsi barang yang dicatat."}
                      </p>
                      {specificationRows.length > 0 ? (
                        <p>
                          {specificationRows
                            .slice(0, 3)
                            .map((row) => `${row.label}: ${row.value}`)
                            .join(". ")}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="min-h-0">
          <aside className="flex h-full max-h-[min(44rem,calc(100vh-8rem))] min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
            <div className="px-4 py-4">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full border border-[#e3efe7] bg-[#f8fcf9] text-[#0a9f62]">
                  <ShoppingBag className="size-4.5" />
                </span>
                <h3 className="text-[1.28rem] font-medium tracking-[-0.02em] text-[#14213d]">
                  Riwayat Kronologi Aset
                </h3>
              </div>
            </div>

            <div className="scrollbar-none relative min-h-0 flex-1 overflow-y-auto px-4 pb-4">
              <div className="absolute bottom-5 left-[2.95rem] top-2 w-px bg-[#dceddf]" />
              {timelineEntries.map((entry) => {
                const iconMap = {
                  input_baru: PackagePlus,
                  perpanjangan: CalendarClock,
                  jaminan: Package2,
                  ditebus: ReceiptText,
                  dipasarkan: Gavel,
                  menunggu_pembayaran: Clock3,
                  terjual: BadgeCheck,
                  gagal: FileWarning,
                  perubahan_status: FileText,
                };
                const EntryIcon = iconMap[entry.actionKey];
                const stamp = splitTimelineStamp(entry.createdAtLabel);

                return (
                  <div
                    className="relative grid grid-cols-[2.8rem_minmax(0,1fr)_5.4rem] gap-3 py-3.5"
                    key={entry.id}
                  >
                    <div className="relative flex justify-center">
                      <span className="grid size-9 place-items-center rounded-full border border-[#e3efe7] bg-[#f8fcf9] text-[#0a9f62] shadow-[0_8px_18px_rgba(15,23,42,0.03)]">
                        <EntryIcon className="size-4" />
                      </span>
                      <span className="absolute -right-1 top-3 size-2.5 rounded-full bg-[#099561] ring-4 ring-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[0.93rem] font-medium leading-6 text-[#14213d]">
                        {entry.actionLabel}
                      </h3>
                      <p className="mt-1.5 text-[0.88rem] leading-6 text-[#667085]">
                        {entry.note}
                      </p>
                      <p className="mt-1 text-[0.74rem] font-semibold leading-5 text-[#0a6a49]">
                        Aktor Internal: {entry.actorName || "Sistem Otomatis"}
                      </p>
                    </div>
                    <div className="pt-0.5 text-right text-[0.82rem] leading-6 text-[#667085]">
                      <p>{stamp.date}</p>
                      <p>{stamp.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export function AdminInventoryEditPage({
  itemId: _itemId,
  item,
}: {
  itemId?: string;
  item: AdminInventoryItem;
}) {
  const media = Array.isArray(item.media)
    ? (item.media as AdminBarangMedia[])
    : [];
  const editFormId = `admin-barang-edit-${String(item.id)}`;
  const auditCode = String(item.code ?? item.itemCode ?? "Kode SBG belum tersedia");
  const auditValue = Number(item.appraisalValue ?? item.price ?? 0);
  const normalizedStatus = String(item.status ?? "").toUpperCase();
  const correctionOnly =
    !["GADAI", "JAMINAN", "GAGAL"].includes(normalizedStatus) &&
    !(
      normalizedStatus === "DIPASARKAN" &&
      String(item.marketingMode ?? "").toLowerCase() === "fixed_price"
    );

  return (
    <div className="space-y-5">
      <nav className="flex flex-wrap items-center gap-2 text-[0.72rem] font-bold text-slate-400">
        <Link className="transition hover:text-[#006747]" href="/admin">
          Dashboard
        </Link>
        <span>/</span>
        <Link className="transition hover:text-[#006747]" href="/admin/barang">
          Kelola Barang
        </Link>
        <span>/</span>
        <span className="text-[#006747]">Edit Data & Media Barang</span>
      </nav>

      <section className="overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white shadow-[0_18px_54px_-48px_rgba(15,23,42,0.42)]">
        <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-[#006747] ring-1 ring-emerald-100">
              <ShieldCheck className="size-5" strokeWidth={2.1} />
            </span>
            <div>
              <h2 className="text-[0.86rem] font-black uppercase tracking-[0.08em] text-slate-900">
                Informasi Referensi Barang
              </h2>
              <p className="mt-1 max-w-[34rem] text-sm leading-6 text-slate-500">
                Kode barang tetap terkunci. Data nasabah dan nilai taksiran dapat dikoreksi tanpa mengubah alur transaksi.
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:min-w-[28rem]">
            <div className="border-l border-emerald-100 pl-4">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-slate-500">Kode Barang</p>
              <p className="mt-1 font-headline text-[1rem] font-black text-[#006747]">{auditCode}</p>
            </div>
            <div className="border-l border-emerald-100 pl-4">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-slate-500">Nilai Taksiran</p>
              <p className="mt-1 font-headline text-[1rem] font-black text-[#006747]">
                {auditValue > 0 ? currency.format(auditValue) : "-"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div
        className={cn(
          "grid gap-4 xl:items-start",
          correctionOnly
            ? "xl:grid-cols-1"
            : "xl:grid-cols-[minmax(0,1.05fr)_minmax(23rem,0.95fr)]"
        )}
      >
        <AdminBarangEditForm
          correctionOnly={correctionOnly}
          formId={editFormId}
          item={{
            id: String(item.id),
            name: String(item.name ?? ""),
            category: String(item.category ?? "emas"),
            condition: String(item.condition ?? "baik"),
            appraisalValue: item.appraisalValue ?? item.price ?? "",
            description: String(item.description ?? ""),
            ownerName: String(item.ownerName ?? ""),
            customerNumber: String(item.customerNumber ?? ""),
            pawnedAt: String(
              item.pawnedAt ?? new Date().toISOString().slice(0, 10),
            ),
            dueDate: String(item.dueDate ?? dateAfter(30)),
            marketingMode: item.marketingMode ?? null,
            marketingPrice: item.marketingPrice ?? null,
            specifications: item.specifications ?? {},
          }}
          showSubmit={false}
        />

        {!correctionOnly ? (
          <div className="rounded-[1.35rem] border border-slate-200/80 bg-white p-5 shadow-[0_18px_54px_-46px_rgba(15,23,42,0.46)] sm:p-6 xl:sticky xl:top-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-xl bg-emerald-50 text-[#006747]">
                <UploadCloud className="size-4" strokeWidth={2.1} />
              </span>
              <h3 className="text-[0.95rem] font-black uppercase tracking-[0.08em] text-slate-900">
                Edit Media Barang
              </h3>
            </div>
            <AdminBarangMediaManager barangId={item.id} media={media} />
          </div>
        ) : null}
      </div>

      <footer className="flex flex-col-reverse gap-3 rounded-[1.15rem] border border-slate-200 bg-white p-4 shadow-[0_16px_42px_-38px_rgba(15,23,42,0.42)] sm:flex-row sm:items-center sm:justify-between">
        <Link
          className="inline-flex h-12 min-w-[7rem] items-center justify-center rounded-[0.82rem] border border-[#dbe4df] bg-white px-9 text-[0.92rem] font-bold text-[#26342e] transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#f6faf8]"
          href={`/admin/barang/${item.id}`}
        >
          Batal
        </Link>
        <Button
          className="h-11 min-w-[14rem] rounded-xl bg-[#006747] px-6 text-sm font-black text-white shadow-[0_18px_32px_-22px_rgba(0,103,71,0.7)] transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-[#005238] active:scale-[0.98]"
          form={editFormId}
          type="submit"
        >
          <Save className="size-4" strokeWidth={2.2} />
          Simpan Perubahan
        </Button>
      </footer>
    </div>
  );
}

function WorkflowFormShell({
  eyebrow,
  title,
  description,
  children,
  itemId,
  itemStatus,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  itemId: string;
  itemStatus: any;
}) {
  return (
    <div className="space-y-6">
      <AdminPageIntro
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={
          <>
            <AdminStatusBadge className="text-[0.95rem]" status={itemStatus} />
            <Link href={`/admin/barang/${itemId}`}>
              <Button className="rounded-2xl" variant="secondary">
                Kembali ke Detail Barang
              </Button>
            </Link>
          </>
        }
      />
      {children}
    </div>
  );
}

export function AdminInventoryExtendPage({
  itemId: _itemId,
  item,
}: {
  itemId?: string;
  item: AdminInventoryItem;
}) {
  return (
    <div className="space-y-5">
      <AdminInventoryDetailPage item={item} />
      <AdminExtensionForm currentDueDate={item.dueDate} itemId={item.id} />
    </div>
  );
}

export function AdminInventoryRedeemPage({
  itemId: _itemId,
  item,
}: {
  itemId?: string;
  item: AdminInventoryItem;
}) {
  const redemptionPreviewImageUrl =
    item.previewImageUrl ??
    (Array.isArray(item.media)
      ? (item.media as AdminBarangMedia[]).find(isImageBarangMedia)?.url
      : null) ??
    null;

  return (
    <div className="space-y-5">
      <AdminInventoryDetailPage item={item} />
      <AdminRedeemForm
        customerNumber={item.customerNumber}
        itemCode={item.code}
        itemId={item.id}
        itemName={item.name}
        ownerName={item.ownerName}
        previewImageUrl={redemptionPreviewImageUrl}
        redemptionAmount={Number(item.appraisalValue ?? 0)}
      />
    </div>
  );
}

export function AdminInventoryConvertPage({
  itemId: _itemId,
  item,
}: {
  itemId?: string;
  item: AdminInventoryItem;
}) {
  return (
    <WorkflowFormShell
      description="Gunakan halaman ini saat barang tidak ditebus sampai jatuh tempo dan perlu dipindahkan menjadi aset unit."
      eyebrow="Admin Unit / Pindahkan ke Aset Unit"
      itemId={item.id}
      itemStatus={item.status}
      title="Pindahkan ke Aset Unit"
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_0.92fr]">
        <Card className="rounded-2xl border border-black/10 bg-white">
          <PanelTitle title="Ringkasan Barang Jatuh Tempo" />
          <CardContent className="grid gap-4 p-6 md:grid-cols-2">
            <DetailTile label="Nama Barang" value={item.name} />
            <DetailTile label="Jatuh Tempo" value={item.dueDate} />
            <DetailTile label="Nomor Nasabah" value={item.customerNumber} />
            <DetailTile
              label="Status Saat Ini"
              value={<AdminStatusBadge status={item.status} />}
            />
            <div className="md:col-span-2 rounded-2xl bg-[#f6faf7] p-5 text-sm leading-7 text-black/70">
              Pastikan tidak ada proses tebus atau perpanjangan yang masih
              berjalan sebelum status barang diubah.
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border border-black/10 bg-[#f8faf8]">
          <CardHeader>
            <CardTitle className="text-xl">Konfirmasi Perubahan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-black/70">
            <p>
              - Perubahan di halaman ini memindahkan barang dari masa gadai ke
              aset unit.
            </p>
            <p>- Setelah dipindahkan, barang tidak kembali ke tahap gadai.</p>
            <p>
              - Langkah berikutnya adalah menyiapkan skema penjualan saat barang
              siap ditawarkan.
            </p>
            <AdminUnitActionButton
              className="mt-4 w-full rounded-2xl"
              confirmDescription="Barang akan dipindahkan ke aset unit dan langkah berikutnya adalah menyiapkannya untuk pemasaran."
              confirmLabel="Pindahkan sekarang"
              confirmTitle="Jadikan barang sebagai aset unit"
              endpoint={`/api/admin/barang/${item.id}/jadikan-jaminan`}
              pendingDescription="Status barang sedang dipindahkan dari masa tebus ke aset unit."
              pendingTitle="Memindahkan ke aset unit"
              redirectTo={`/admin/barang/${item.id}`}
              successDescription="Barang sudah berpindah ke aset unit dan siap disiapkan untuk pemasaran."
              successTitle="Barang menjadi aset unit"
            >
              Pindahkan ke aset unit
            </AdminUnitActionButton>
          </CardContent>
        </Card>
      </div>
    </WorkflowFormShell>
  );
}

export function AdminInventoryMarketPage({
  itemId: _itemId,
  item,
}: {
  itemId?: string;
  item: AdminInventoryItem;
}) {
  const serverNow = new Date().toISOString();

  return (
    <div className="space-y-5">
      <AdminInventoryDetailPage item={item} />
      <AdminMarketingForm
        barangId={item.id}
        cancelHref={`/admin/barang/${item.id}`}
        defaultPrice={Number(item.price ?? item.appraisalValue ?? 1000000)}
        endpoint={`/api/admin/barang/${item.id}/pasarkan`}
        heroIcon={<Megaphone className="size-6 text-white" strokeWidth={2.2} />}
        presentation="modal"
        redirectTo="/admin/pemasaran"
        serverNow={serverNow}
        submitLabel="Tayangkan ke katalog"
        successDescription="Barang sudah aktif di katalog sesuai mode pemasaran yang dipilih."
        successTitle="Barang tayang di katalog"
      />
    </div>
  );
}

export function AdminMarketingHubPage({
  fixedPriceCount,
  vickreyCount,
}: {
  fixedPriceCount: number;
  vickreyCount: number;
}) {
  return (
    <div className="space-y-6">
      <AdminPageHero
        description="Pilih jalur pemasaran yang mau dipantau. Harga Tetap untuk harga tetap, Lelang Tertutup untuk sesi lelang tertutup."
        eyebrow="Admin Unit / Pemasaran"
        icon={Megaphone}
        rightRail={<AdminHeroPill icon={BadgeCheck}>Workspace pemasaran unit</AdminHeroPill>}
        title="Pemasaran"
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="rounded-2xl border border-black/10">
          <CardContent className="space-y-4 p-6">
            <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-[#eef6f1] text-[#0a6a49]">
              <ShoppingBag className="size-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-black/85">Harga Tetap</h3>
              <p className="mt-2 text-sm leading-6 text-black/60">
                {fixedPriceCount} sesi aktif atau tersimpan di jalur harga
                tetap.
              </p>
            </div>
            <Link href="/admin/pemasaran/fixed-price">
              <Button className="w-full rounded-2xl">Buka Harga Tetap</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-black/10">
          <CardContent className="space-y-4 p-6">
            <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-[#fff3d9] text-[#8a5b00]">
              <Gavel className="size-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-black/85">
                Lelang Tertutup
              </h3>
              <p className="mt-2 text-sm leading-6 text-black/60">
                {vickreyCount} sesi aktif atau tersimpan di jalur lelang
                tertutup.
              </p>
            </div>
            <Link href="/admin/pemasaran/vickrey-auction">
              <Button className="w-full rounded-2xl" variant="secondary">
                Buka Lelang Tertutup
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function AdminAuctionListPage({
  auctions,
  eyebrow = "Admin Unit / Pemasaran",
  title = "Pemasaran",
  description = "Pilih jalur pemasaran yang mau dipantau.",
  emptyTitle = "Belum ada sesi pemasaran",
  emptyDescription = "Belum ada sesi yang cocok di halaman ini.",
}: {
  auctions: AdminAuctionItem[];
  eyebrow?: string;
  title?: string;
  description?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const visibleAuctions = auctions;

  return (
    <div className="space-y-6">
      <AdminPageHero
        description={description}
        eyebrow={eyebrow}
        icon={Megaphone}
        rightRail={<AdminHeroPill icon={Clock3}>Pantau sesi pemasaran</AdminHeroPill>}
        title={title}
      />

      {visibleAuctions.length ? (
        <div className="grid gap-5 lg:grid-cols-3">
          {visibleAuctions.map((auction) => (
            <Card
              className="rounded-2xl border border-black/10"
              key={auction.id}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl sm:text-[1.35rem]">
                      {auction.lot}
                    </CardTitle>
                    <CardDescription className="mt-2 text-sm sm:text-base">
                      {auction.id}
                    </CardDescription>
                  </div>
                  <AdminStatusBadge status={auction.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-7 text-black/70 sm:text-base">
                <p>Mode: {auction.mode}</p>
                <p>Peserta: {auction.participants} user</p>
                <p>
                  <AdminAuctionDeadline auction={auction} prefix="Sisa waktu" />
                </p>
                <p>Visibilitas bid: {auction.visibility}</p>
                <p>{auction.note}</p>
                <Link
                  className="inline-flex items-center gap-2 font-semibold text-[#0a6a49]"
                  href={`/admin/lelang/${auction.id}`}
                >
                  Lihat sesi
                  <ArrowRight className="size-4" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyPanel text={`${emptyTitle}. ${emptyDescription}`} />
      )}
    </div>
  );
}

export function AdminAuctionDetailPage({
  auctionId: _auctionId,
  auction,
}: {
  auctionId?: string;
  auction: AdminAuctionItem;
}) {
  const bidRows = Array.isArray(auction.bids) ? auction.bids : [];

  return (
    <div className="space-y-6">
      <AdminPageIntro
        eyebrow="Admin Unit / Detail Pemasaran"
        title={auction.lot}
        description="Gunakan halaman ini untuk memahami kondisi sesi, aturan keterbukaan hasil, dan ringkasan hasil setelah periode berakhir."
        actions={
          <AdminStatusBadge
            className="text-[0.95rem]"
            status={auction.status}
          />
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Card className="rounded-2xl border border-black/10">
          <CardHeader>
            <CardTitle className="text-xl sm:text-[1.45rem]">
              Ringkasan Sesi
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <DetailTile label="ID Pemasaran" value={auction.id} />
            <DetailTile label="Mode" value={auction.mode} />
            <DetailTile
              label="Sisa Waktu"
              value={<AdminAuctionDeadline auction={auction} />}
            />
            <DetailTile
              label="Peserta"
              value={`${auction.participants} peserta`}
            />
            <DetailTile label="Keterbukaan Hasil" value={auction.visibility} />
            <DetailTile
              label="Status"
              value={<AdminStatusBadge status={auction.status} />}
            />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-black/10">
          <CardHeader>
            <CardTitle className="text-xl sm:text-[1.45rem]">
              Aturan Buka Hasil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-black/70 sm:text-base">
            <p>
              Halaman admin tidak menampilkan nominal bid sebelum waktu
              penutupan terlewati. Selama sesi aktif, admin hanya melihat jumlah
              peserta dan status sesi, tanpa mengetahui nilai penawaran.
            </p>
            <div className="rounded-2xl bg-[#f5f8f6] p-5">
              <p className="font-semibold text-black/80">Kondisi saat ini</p>
              <p className="mt-2">{auction.note}</p>
              {auction.visibility === "HASIL_DIBUKA" ? (
                <div className="mt-4 space-y-2">
                  <p>Pemenang: {auction.winner ?? "-"}</p>
                  <p>
                    Harga akhir:{" "}
                    {auction.finalPrice
                      ? currency.format(auction.finalPrice)
                      : "-"}
                  </p>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border border-black/10">
        <CardHeader>
          <CardTitle className="text-xl sm:text-[1.45rem]">
            Daftar Bid Sesi Ini
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {auction.visibility === "HASIL_DIBUKA" ? (
            bidRows.length ? (
              <div className="overflow-x-auto rounded-[1.4rem] border border-black/10">
                <table className="w-full min-w-[52rem] text-left">
                  <thead className="bg-[#f5f6f4] text-xs uppercase tracking-[0.16em] text-black/50">
                    <tr>
                      <th className="px-5 py-4">Urutan</th>
                      <th className="px-5 py-4">Peserta</th>
                      <th className="px-5 py-4">Nilai Bid</th>
                      <th className="px-5 py-4">Dikirim Pada</th>
                      <th className="px-5 py-4">Peran Hasil</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bidRows.map((bid: any) => (
                      <tr
                        className="border-t border-[#e0ebe3] text-sm text-black/72 sm:text-base"
                        key={bid.id}
                      >
                        <td className="px-5 py-4 font-semibold text-[#0a6a49]">
                          #{bid.rank}
                        </td>
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-semibold text-black/85">
                              {bid.bidderName}
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-black/40">
                              ID {bid.bidderId}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-black/55">
                            Tidak dikirim ke admin
                          </span>
                        </td>
                        <td className="px-5 py-4 text-black/55">
                          {bid.submittedAtLabel}
                        </td>
                        <td className="px-5 py-4">
                          {bid.isWinner ? (
                            <span className="inline-flex rounded-full bg-[#e7f6ef] px-3 py-1 text-xs font-semibold text-[#0a6a49]">
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
              <div className="rounded-[1.4rem] border border-dashed border-black/10 bg-[#fcfcfa] p-5 text-sm text-black/55">
                Deadline sudah lewat, tetapi belum ada bid yang tercatat untuk
                sesi ini.
              </div>
            )
          ) : (
            <div className="rounded-[1.4rem] border border-dashed border-black/10 bg-[#fcfcfa] p-5 text-sm leading-7 text-black/55">
              Daftar nominal bid baru dibuka setelah deadline terlewati. Selama
              sesi aktif, admin unit hanya dapat melihat jumlah peserta tanpa
              nilai penawaran.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminTransactionsPage({
  transactions,
}: {
  transactions: AdminTransactionItem[];
}) {
  const filters = [
    "SEMUA",
    "MENUNGGU_PEMBAYARAN",
    "BUKTI_DIUNGGAH",
    "MENUNGGU_KONFIRMASI_LANGSUNG",
    "DITOLAK_BUKTI",
    "LUNAS",
  ];

  return (
    <div className="space-y-6">
      <AdminPageHero
        description="Kelola seluruh penyelesaian pembayaran dari penjualan langsung maupun hasil lelang, lalu terbitkan nota saat transaksi sudah benar-benar selesai."
        eyebrow="Admin Unit / Transaksi"
        icon={WalletCards}
        rightRail={<AdminHeroPill icon={FileCheck2}>Antrian pembayaran unit</AdminHeroPill>}
        title="Kelola Pembayaran & Nota"
      />

      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
        <PanelTitle
          action={
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  className="rounded-full border border-black/15 px-3 py-2 text-xs font-semibold text-black/65 sm:text-sm"
                  key={filter}
                  type="button"
                >
                  {filter}
                </button>
              ))}
            </div>
          }
          description="Fokuskan pekerjaan pada transaksi yang benar-benar membutuhkan respons admin unit."
          title="Daftar Transaksi Unit"
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[78rem] text-left lg:min-w-[88rem]">
            <thead className="bg-[#f3f3f3] text-xs uppercase tracking-[0.12em] text-black/50 sm:text-sm">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Pembeli</th>
                <th className="px-6 py-4">Barang</th>
                <th className="px-6 py-4">Mode</th>
                <th className="px-6 py-4">Metode</th>
                <th className="px-6 py-4">Deadline</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr
                  className="border-t border-black/10 text-sm sm:text-base"
                  key={transaction.id}
                >
                  <td className="px-6 py-4 font-semibold text-[#0a6a49]">
                    {transaction.id}
                  </td>
                  <td className="px-6 py-4">{transaction.buyer}</td>
                  <td className="px-6 py-4">{transaction.lot}</td>
                  <td className="px-6 py-4 text-black/65">
                    {transaction.pemasaranMode}
                  </td>
                  <td className="px-6 py-4 text-black/65">
                    {transaction.method}
                  </td>
                  <td className="px-6 py-4 text-black/65">
                    <AdminTransactionDeadline transaction={transaction} />
                  </td>
                  <td className="px-6 py-4">
                    <AdminStatusBadge status={transaction.status} />
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      className="inline-flex items-center gap-2 rounded-xl border border-black/15 px-3 py-2 text-xs font-semibold text-[#0a6a49] sm:text-sm"
                      href="/admin/pemasaran"
                    >
                      Buka pemasaran
                      <ArrowRight className="size-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function AdminTransactionDetailPage({
  transactionId: _transactionId,
  transaction,
}: {
  transactionId?: string;
  transaction: AdminTransactionItem;
}) {
  const isReceiptPaymentVerified = transaction.status === "LUNAS" || transaction.status === "SELESAI";
  const receiptLockMessage =
    isReceiptPaymentVerified && !transaction.handoverProofFile
      ? "Nota baru dapat dicetak setelah dokumentasi serah-terima barang fisik diunggah."
      : null;
  const canPrint = Boolean(transaction.printableReceipt);
  const canVerifyTransfer =
    transaction.status === "BUKTI_DIUNGGAH" &&
    transaction.method === "TRANSFER_BANK";
  const canConfirmDirect =
    transaction.status === "MENUNGGU_KONFIRMASI_LANGSUNG";
  const canTakePaymentAction = canVerifyTransfer || canConfirmDirect;

  return (
    <div className="space-y-6">
      <AdminPageIntro
        eyebrow="Admin Unit / Detail Transaksi"
        title={transaction.id}
        description="Semua konteks pembayaran, dokumen pendukung, dan keputusan verifikasi dirangkum di satu halaman agar tindak lanjut lebih cepat."
        actions={
          <AdminStatusBadge
            className="text-[0.95rem]"
            status={transaction.status}
          />
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <div className="space-y-6">
          <Card className="rounded-2xl border border-black/10">
            <CardHeader>
              <CardTitle className="text-xl sm:text-[1.45rem]">
                Ringkasan Transaksi
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <DetailTile label="Pembeli" value={transaction.buyer} />
              <DetailTile label="Barang" value={transaction.lot} />
              <DetailTile
                label="Mode Pemasaran"
                value={transaction.pemasaranMode}
              />
              <DetailTile label="Metode Bayar" value={transaction.method} />
              <DetailTile
                label="Total Bayar"
                value={currency.format(transaction.total)}
              />
              <DetailTile
                label="Sisa Waktu"
                value={<AdminTransactionDeadline transaction={transaction} />}
              />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-black/10">
            <CardHeader>
              <CardTitle className="text-xl sm:text-[1.45rem]">
                {transaction.method === "TRANSFER_BANK"
                  ? "Bukti Pembayaran"
                  : "Panduan Bayar di Unit"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {transaction.method === "TRANSFER_BANK" ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <DetailTile
                      label="Bank Tujuan"
                      value={transaction.bankName}
                    />
                    <DetailTile
                      label="Nomor Rekening"
                      value={transaction.accountNumber}
                    />
                    <div className="md:col-span-2">
                      <DetailTile
                        label="Atas Nama"
                        value={transaction.accountName}
                      />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-dashed border-[#9fcab8] bg-[#f4faf6] p-8 text-center text-sm text-black/50 sm:p-10 sm:text-base">
                    {transaction.proofFile
                      ? `Bukti yang diterima: ${transaction.proofFile}`
                      : "Belum ada bukti pembayaran yang diunggah oleh pembeli."}
                  </div>
                  {transaction.rejectionReason ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-700">
                      Catatan penolakan sebelumnya:{" "}
                      {transaction.rejectionReason}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="rounded-2xl bg-[#f5f8f6] p-5 text-sm leading-7 text-black/70 sm:text-base">
                  Pembeli memilih bayar langsung di unit. Pastikan dana
                  benar-benar diterima sebelum transaksi ditandai selesai.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl border border-black/10">
            <CardHeader>
              <CardTitle className="text-xl sm:text-[1.45rem]">
                Tindakan Lanjutan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {canTakePaymentAction ? (
                <>
                  <div className="space-y-2">
                    <FieldLabel>Nomor referensi internal</FieldLabel>
                    <Input
                      className="h-12"
                      defaultValue={
                        transaction.reference === "-"
                          ? ""
                          : transaction.reference
                      }
                      placeholder="Contoh: REF-MND-8821"
                    />
                  </div>
                  {canVerifyTransfer ? (
                    <div className="space-y-2">
                      <FieldLabel>Alasan penolakan</FieldLabel>
                      <Textarea
                        className="min-h-28"
                        placeholder="Isi bila bukti transfer perlu dikembalikan ke pembeli."
                      />
                    </div>
                  ) : null}

                  {canVerifyTransfer ? (
                    <>
                      <AdminUnitActionButton
                        className="h-12 w-full rounded-2xl"
                        confirmDescription="Setelah diverifikasi, transaksi akan ditandai lunas dan barang otomatis masuk status terjual."
                        confirmLabel="Setujui pembayaran"
                        confirmTitle="Verifikasi pembayaran transfer"
                        endpoint={`/api/admin/transaksi/${transaction.id}/verifikasi`}
                        pendingDescription="Bukti transfer sedang diperiksa dan status transaksi akan diperbarui."
                        pendingTitle="Memverifikasi pembayaran"
                        payload={{
                          reference:
                            transaction.reference === "-"
                              ? `REF-${Date.now().toString().slice(-6)}`
                              : transaction.reference,
                        }}
                        refresh
                        successDescription="Transaksi sudah lunas dan barang ditandai terjual."
                        successTitle="Pembayaran disetujui"
                      >
                        <FileCheck2 className="size-4" />
                        Setujui pembayaran transfer
                      </AdminUnitActionButton>
                      <AdminUnitActionButton
                        className="h-12 w-full rounded-2xl"
                        confirmDescription="Pembeli akan diminta mengunggah bukti transfer yang baru atau lebih jelas."
                        confirmLabel="Kembalikan bukti"
                        confirmTitle="Kembalikan bukti pembayaran"
                        confirmVariant="destructive"
                        endpoint={`/api/admin/transaksi/${transaction.id}/tolak-bukti`}
                        pendingDescription="Sistem sedang mengirimkan catatan revisi agar pembeli memperbaiki bukti transfer."
                        pendingTitle="Mengembalikan bukti pembayaran"
                        payload={{
                          reason:
                            "Bukti pembayaran perlu diperbaiki oleh pembeli.",
                        }}
                        refresh
                        successDescription="Pembeli perlu mengunggah bukti pembayaran yang benar."
                        successTitle="Bukti pembayaran dikembalikan"
                        variant="destructive"
                      >
                        <FileWarning className="size-4" />
                        Kembalikan untuk perbaikan
                      </AdminUnitActionButton>
                    </>
                  ) : null}

                  {canConfirmDirect ? (
                    <AdminUnitActionButton
                      className="h-12 w-full rounded-2xl"
                      confirmDescription="Gunakan ini hanya jika dana benar-benar sudah diterima langsung oleh petugas unit."
                      confirmLabel="Ya, dana sudah diterima"
                      confirmTitle="Konfirmasi bayar langsung di unit"
                      endpoint={`/api/admin/transaksi/${transaction.id}/konfirmasi-langsung`}
                      pendingDescription="Status pembayaran langsung sedang ditutup sebagai transaksi selesai."
                      pendingTitle="Mengonfirmasi bayar langsung"
                      payload={{
                        reference:
                          transaction.reference === "-"
                            ? `CASH-${Date.now().toString().slice(-6)}`
                            : transaction.reference,
                      }}
                      refresh
                      successDescription="Pembayaran langsung sudah dikonfirmasi oleh unit."
                      successTitle="Pembayaran langsung selesai"
                      variant="secondary"
                    >
                      <Wallet className="size-4" />
                      Selesaikan bayar di unit
                    </AdminUnitActionButton>
                  ) : null}
                </>
              ) : null}

              {canPrint ? (
                <AdminUnitActionButton
                  className="h-12 w-full rounded-2xl"
                  pendingLabel="Membuka cetak..."
                  successTitle="Nota siap dicetak"
                  successDescription="Preview nota dibuka agar bisa langsung dicetak atau disimpan."
                  variant="accent"
                >
                  <Printer className="size-4" />
                  Cetak nota
                </AdminUnitActionButton>
              ) : (
                <div className="rounded-2xl border border-dashed border-black/10 bg-[#fbfbfa] p-4 text-sm text-black/55">
                  {canTakePaymentAction
                    ? "Nota baru dapat dicetak setelah transaksi selesai diverifikasi."
                    : receiptLockMessage
                      ? receiptLockMessage
                    : "Tidak ada tindakan pembayaran yang tersedia untuk status transaksi saat ini."}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function AdminBlacklistPage({
  entries,
}: {
  entries: AdminBlacklistItem[];
}) {
  return (
    <div className="space-y-6">
      <AdminPageHero
        description="Fokus pada kasus gagal bayar yang perlu dipantau, status pembatasan aktif, dan riwayat pelanggaran pembayaran di unit."
        eyebrow="Admin Unit / Pelanggaran"
        icon={Ban}
        title="Pelanggaran Pengguna"
      />

      <AdminBlacklistList entries={entries} />
    </div>
  );
}

export function AdminBlacklistDetailPage({
  userId: _userId,
  entry,
  serverNow,
}: {
  userId?: string;
  entry: AdminBlacklistItem;
  serverNow?: string;
}) {
  return (
    <SuperadminBlacklistDetailWorkspace
      entry={entry}
      scope="admin-unit"
      serverNow={serverNow ?? new Date().toISOString()}
    />
  );
}

export function AdminProfilePage({ profile }: { profile: AdminProfileData }) {
  return <AdminProfileWorkspace profile={profile} />;
}
