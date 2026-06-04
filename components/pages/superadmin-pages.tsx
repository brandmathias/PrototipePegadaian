"use client";

import Image from "next/image";
import Link from "next/link";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Pencil,
  Building2,
  Clock3,
  ClipboardCheck,
  Eye,
  CreditCard,
  Landmark,
  ListChecks,
  Package,
  Plus,
  SearchX,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldBan,
  TrendingUp,
  type LucideIcon,
  UserCog,
  WalletCards,
  X,
} from "lucide-react";

import { AdminLiveCountdown } from "@/components/admin/admin-live-countdown";
import { BlacklistReviewQueue } from "@/components/superadmin/blacklist-review-queue";
import {
  AdminUnitForm,
  DeactivateAdminButton,
} from "@/components/superadmin/admin-form";
import { CabutBlacklistForm } from "@/components/superadmin/cabut-blacklist-form";
import {
  ActivateRekeningButton,
  RekeningForm,
} from "@/components/superadmin/rekening-form";
import {
  DeactivateUnitButton,
  UnitForm,
} from "@/components/superadmin/unit-form";
import { SectionHeading } from "@/components/shared/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";

export type SuperAdminMetric = {
  label: string;
  value: string;
  detail: string;
};

export type SuperAdminSpotlight = {
  label: string;
  value: string;
};

export type SuperAdminPriority = {
  id: string;
  title: string;
  detail: string;
  href: string;
  action: string;
  countdownLabel?: string;
  countdownAt?: string;
  expiredLabel?: string;
};

export type SuperAdminSummary = {
  headline: string;
  metrics: SuperAdminMetric[];
  spotlight: SuperAdminSpotlight[];
  priorities: SuperAdminPriority[];
};

export type SuperAdminUnitAccount = {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branch: string;
  status: string;
};

export type SuperAdminUnitListItem = {
  id: string;
  code: string;
  name: string;
  address: string;
  status: string;
  adminCount: number;
  accountCount: number;
  activeAccount: SuperAdminUnitAccount | null;
};

export type SuperAdminUnitDetail = {
  id: string;
  code: string;
  name: string;
  address: string;
  status: string;
  isActive: boolean;
  adminCount: number;
  accountCount: number;
  activeAccount: SuperAdminUnitAccount | null;
  accounts: SuperAdminUnitAccount[];
  admins: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    status: string;
  }>;
};

export type SuperAdminAdminItem = {
  id: string;
  name: string;
  unitId: string | null;
  unit: string;
  email: string;
  phone: string;
  status: string;
  lastLogin: string;
};

export type SuperAdminMonitoringItem = {
  id: string;
  unitId: string;
  href?: string;
  unit: string;
  scope: string;
  status: string;
  activity: string;
  detail: string;
  countdownLabel?: string;
  countdownAt?: string;
  expiredLabel?: string;
};

export type SuperAdminGovernanceSnapshotItem = {
  label: string;
  value: string;
  detail: string;
};

export type SuperAdminLifecycleItem = {
  label: string;
  value: number;
};

export type SuperAdminValidatedTrendPoint = {
  label: string;
  amount: number;
  count: number;
  vickreyAmount?: number;
  fixedPriceAmount?: number;
  volume?: number;
};

export type SuperAdminComplianceLevel = {
  label: string;
  description: string;
  count: number;
  tone: "amber" | "orange" | "red";
};

export type SuperAdminMonitoringUnitRow = {
  id: string;
  unitName: string;
  unitCode: string;
  collateralItems: number;
  marketedItems: number;
  soldItems: number;
  followUpItems: number;
  heldTransactions: number;
  activeViolations: number;
  status: string;
};

export type SuperAdminMonitoringData = {
  summary: SuperAdminSummary;
  governance?: {
    snapshot: SuperAdminGovernanceSnapshotItem[];
    lifecycle: SuperAdminLifecycleItem[];
    validatedTrend: SuperAdminValidatedTrendPoint[];
    complianceLevels?: SuperAdminComplianceLevel[];
    validatedTransactionValueLabel?: string;
  };
  unitRows?: SuperAdminMonitoringUnitRow[];
  unitsNeedAttention: SuperAdminMonitoringItem[];
  pendingMonitoring: SuperAdminMonitoringItem[];
};

export type SuperAdminBlacklistItem = {
  id: string;
  userId: string;
  name: string;
  email: string;
  unit: string;
  total: number;
  until: string;
  reason: string;
  status: string;
  countdownLabel?: string;
  countdownAt?: string;
  expiredLabel?: string;
};

export type SuperAdminBlacklistReviewCase = {
  id: string;
  buyerName: string;
  buyerEmail: string;
  itemName: string;
  unitName: string;
  status: string;
  submittedAt: string;
  buyerStatement: string;
  adminRecommendation: string | null;
  adminRecommendationNote: string | null;
  level: number;
  lockedAccount: boolean;
  hasAdminRecommendation: boolean;
  priorityScore: number;
  attachments: Array<{
    id: string;
    fileUrl: string;
    fileName: string;
    mimeType: string;
  }>;
};

function StatusBadge({ value }: { value: string }) {
  const normalized = value.toLowerCase();

  if (
    normalized.includes("aktif") ||
    normalized.includes("normal") ||
    normalized.includes("selesai")
  ) {
    return <Badge variant="default">{value}</Badge>;
  }

  if (normalized.includes("review") || normalized.includes("tindak")) {
    return <Badge variant="accent">{value}</Badge>;
  }

  return <Badge variant="danger">{value}</Badge>;
}

function SuperAdminCountdown({
  countdownAt,
  countdownLabel,
  className,
  expiredLabel = "Waktu terlewati",
  prefix = "Sisa waktu",
  serverNow,
}: {
  countdownAt?: string;
  countdownLabel?: string;
  expiredLabel?: string;
  prefix?: string;
  className?: string;
  serverNow?: string;
}) {
  if (!countdownAt && !countdownLabel) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-sm font-medium text-primary">
      <Clock3 className="size-4 shrink-0 text-[#d72b43]" />
      <AdminLiveCountdown
        className={className}
        expiredLabel={expiredLabel}
        fallbackLabel={countdownLabel ?? expiredLabel}
        prefix={prefix}
        serverNow={serverNow}
        targetAt={countdownAt}
      />
    </div>
  );
}

function SuperAdminDialog({
  children,
  description,
  onClose,
  open,
  title,
  width = "max-w-3xl",
}: {
  children: ReactNode;
  description?: string;
  onClose: () => void;
  open: boolean;
  title: string;
  width?: string;
}) {
  useEffect(() => {
    if (!open || typeof document === "undefined") {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  const titleId = `superadmin-dialog-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return createPortal(
    <div className="fixed inset-0 z-[150] overflow-y-auto px-4 py-6 sm:px-6 lg:py-8">
      <button
        aria-label="Tutup pop up"
        className="fixed inset-0 bg-[#07131e]/62 backdrop-blur-[5px]"
        onClick={onClose}
        type="button"
      />
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className={`relative z-[151] mx-auto w-full ${width}`}
        role="dialog"
      >
        <div className="overflow-hidden rounded-[1.35rem] border border-[#d8e4de] bg-white shadow-[0_42px_118px_-46px_rgba(3,21,14,0.84),0_18px_38px_-28px_rgba(8,69,50,0.24)]">
          <div className="flex items-start justify-between gap-4 border-b border-[#edf2ee] bg-white px-5 py-5 sm:px-6">
            <div>
              <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-primary/60">
                Panel Superadmin
              </p>
              <h2
                className="mt-2 font-headline text-2xl font-extrabold tracking-tight text-foreground"
                id={titleId}
              >
                {title}
              </h2>
              {description ? (
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {description}
                </p>
              ) : null}
            </div>
            <button
              aria-label="Tutup"
              className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-surface-low hover:text-foreground active:scale-[0.98]"
              onClick={onClose}
              type="button"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="max-h-[calc(100dvh-11rem)] overflow-y-auto p-5 sm:p-6">
            {children}
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}

function EditableAccountCard({
  unitId,
  account,
}: {
  unitId: string;
  account: SuperAdminUnitAccount;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="rounded-[1.5rem] border border-border/70 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="font-semibold text-foreground">{account.bankName}</p>
          <p className="text-sm text-muted-foreground">
            {account.accountNumber}
          </p>
        </div>
        <StatusBadge value={account.status} />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        {account.accountHolder}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{account.branch}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <ActivateRekeningButton account={account} unitId={unitId} />
        <Button
          onClick={() => setEditing((value) => !value)}
          type="button"
          variant="secondary"
        >
          <Pencil className="size-4" />
          {editing ? "Tutup Edit" : "Edit Rekening"}
        </Button>
      </div>
      {editing ? (
        <div className="mt-4">
          <RekeningForm
            accountId={account.id}
            initialValue={{
              bankName: account.bankName,
              accountNumber: account.accountNumber,
              accountHolderName: account.accountHolder,
              branchName: account.branch,
              isActive: account.status === "AKTIF",
            }}
            mode="update"
            unitId={unitId}
          />
        </div>
      ) : null}
    </div>
  );
}

function EditableAdminCard({
  admin,
  units,
}: {
  admin: SuperAdminAdminItem;
  units: Array<{ id: string; name: string; code: string }>;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <Card className="border border-border/70 bg-white" key={admin.id}>
      <CardContent className="grid gap-5 p-6 lg:grid-cols-[1.12fr_0.88fr] lg:items-start">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-semibold text-foreground">{admin.name}</p>
            <StatusBadge value={admin.status} />
          </div>
          <p className="text-sm text-muted-foreground">{admin.email}</p>
          <p className="text-sm text-muted-foreground">{admin.phone}</p>
          <p className="text-sm text-muted-foreground">{admin.unit}</p>
          {editing ? (
            <AdminUnitForm
              adminId={admin.id}
              initialValue={{
                name: admin.name,
                email: admin.email,
                phoneNumber: admin.phone === "-" ? "" : admin.phone,
                unitId: admin.unitId ?? units[0]?.id ?? "",
                isActive: admin.status === "Aktif",
              }}
              mode="update"
              units={units}
            />
          ) : null}
        </div>
        <div className="space-y-4 rounded-[1.5rem] border border-border/70 bg-surface-low/60 p-5">
          <p className="text-sm text-muted-foreground">
            Login terakhir: {admin.lastLogin}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setEditing((value) => !value)}
              type="button"
              variant="secondary"
            >
              <Pencil className="size-4" />
              {editing ? "Tutup Edit" : "Edit Admin"}
            </Button>
            <DeactivateAdminButton
              adminId={admin.id}
              disabled={admin.status !== "Aktif"}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatCompactCurrency(value: number) {
  if (value >= 1_000_000_000) {
    return `Rp ${(value / 1_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} M`;
  }

  if (value >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
  }

  return `Rp ${value.toLocaleString("id-ID")}`;
}

const SUPERADMIN_DASHBOARD_HERO_IMAGE =
  "/uploads/superadmin-dashboard/hero.png";
const dashboardNumberFormatter = new Intl.NumberFormat("id-ID");
const dashboardMonthLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
] as const;
const dashboardChartWidth = 760;
const dashboardChartHeight = 264;
const dashboardChartFrame = {
  top: 34,
  right: 668,
  bottom: 204,
  left: 76,
};

type SuperAdminDashboardCard = {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: "green" | "amber";
};

function formatDashboardCount(value: number) {
  return dashboardNumberFormatter.format(value);
}

function findMetric(metrics: SuperAdminMetric[], label: string) {
  return metrics.find(
    (metric) => metric.label.toLowerCase() === label.toLowerCase(),
  );
}

function findSnapshot(
  snapshotItems: SuperAdminGovernanceSnapshotItem[],
  label: string,
) {
  return snapshotItems.find(
    (item) => item.label.toLowerCase() === label.toLowerCase(),
  );
}

function findSpotlight(spotlight: SuperAdminSpotlight[], label: string) {
  return spotlight.find((item) =>
    item.label.toLowerCase().includes(label.toLowerCase()),
  );
}

function extractLeadingNumber(value: string | undefined) {
  const match = value?.match(/^[\d.,]+/);
  return match?.[0] ?? value ?? "0";
}

function getTrendVickreyAmount(point: SuperAdminValidatedTrendPoint) {
  const hasSplit =
    point.vickreyAmount !== undefined || point.fixedPriceAmount !== undefined;
  return hasSplit ? Number(point.vickreyAmount ?? 0) : point.amount;
}

function getTrendFixedPriceAmount(point: SuperAdminValidatedTrendPoint) {
  return Number(point.fixedPriceAmount ?? 0);
}

function getTrendVolume(point: SuperAdminValidatedTrendPoint) {
  return Number(point.volume ?? point.count ?? 0);
}

function buildChartTicks(maxValue: number, steps = 4) {
  const safeMax = Math.max(maxValue, 1);
  return Array.from({ length: steps + 1 }, (_, index) => {
    const value = Math.round((safeMax / steps) * index);
    const ratio = value / safeMax;
    const y =
      dashboardChartFrame.bottom -
      ratio * (dashboardChartFrame.bottom - dashboardChartFrame.top);

    return { value, y };
  });
}

function formatChartAmountTick(value: number) {
  if (value >= 1_000_000) {
    return `${Math.round(value / 1_000_000)}`;
  }

  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}`;
  }

  return `${value}`;
}

function getMonthRangeLabel(value: Date) {
  const firstDate = `01 ${dashboardMonthLabels[value.getMonth()]}`;
  const lastDate = new Date(value.getFullYear(), value.getMonth() + 1, 0);
  const lastDay = String(lastDate.getDate()).padStart(2, "0");

  return `${firstDate} - ${lastDay} ${dashboardMonthLabels[value.getMonth()]}`;
}

function getDashboardCardToneClasses(tone: SuperAdminDashboardCard["tone"]) {
  if (tone === "amber") {
    return {
      icon: "bg-[#fff7e6] text-[#c97900] ring-[#f6d89d]",
      value: "text-[#c97900]",
    };
  }

  return {
    icon: "bg-[#edf8f1] text-[#006747] ring-[#bfe7c4]",
    value: "text-[#006747]",
  };
}

function getComplianceToneClasses(tone: SuperAdminComplianceLevel["tone"]) {
  if (tone === "red") {
    return { dot: "bg-[#dc2626]", bar: "bg-[#dc2626]" };
  }

  if (tone === "orange") {
    return { dot: "bg-[#f97316]", bar: "bg-[#f97316]" };
  }

  return { dot: "bg-[#f59e0b]", bar: "bg-[#f59e0b]" };
}

export function SuperAdminDashboardPage({
  summary,
  governance,
  unitRows = [],
  serverNow,
}: SuperAdminMonitoringData & { serverNow?: string }) {
  const [chartVisibility, setChartVisibility] = useState({
    vickrey: true,
    fixedPrice: true,
    volume: true,
  });
  const dashboardNow = serverNow ? new Date(serverNow) : new Date();
  const snapshotItems = governance?.snapshot ?? [];
  const trendPoints =
    governance?.validatedTrend?.length === 12
      ? governance.validatedTrend
      : governance?.validatedTrend ?? [];
  const activeUnitMetric = findMetric(summary.metrics, "Unit Aktif");
  const activeViolationSpotlight = findSpotlight(
    summary.spotlight,
    "Pembatasan aktif",
  );
  const soldSnapshot = findSnapshot(snapshotItems, "Terjual");
  const validatedSnapshot = findSnapshot(
    snapshotItems,
    "Nilai Transaksi Tervalidasi",
  );
  const currentMonthPoint =
    trendPoints[dashboardNow.getMonth()] ?? trendPoints[trendPoints.length - 1];
  const currentMonthAmount = Number(currentMonthPoint?.amount ?? 0);
  const currentMonthVolume = getTrendVolume(currentMonthPoint ?? { label: "", amount: 0, count: 0 });
  const currentMonthVickrey = getTrendVickreyAmount(
    currentMonthPoint ?? { label: "", amount: 0, count: 0 },
  );
  const currentMonthFixedPrice = getTrendFixedPriceAmount(
    currentMonthPoint ?? { label: "", amount: 0, count: 0 },
  );
  const modeTotal = currentMonthVickrey + currentMonthFixedPrice;
  const dominantMode =
    currentMonthVickrey >= currentMonthFixedPrice
      ? "Vickrey Auction"
      : "Fixed Price";
  const dominantAmount =
    currentMonthVickrey >= currentMonthFixedPrice
      ? currentMonthVickrey
      : currentMonthFixedPrice;
  const dominantPercent =
    modeTotal > 0 ? Math.round((dominantAmount / modeTotal) * 100) : 0;
  const maxVisibleAmount = Math.max(
    ...trendPoints.map((point) => {
      const vickreyAmount = chartVisibility.vickrey
        ? getTrendVickreyAmount(point)
        : 0;
      const fixedPriceAmount = chartVisibility.fixedPrice
        ? getTrendFixedPriceAmount(point)
        : 0;

      return vickreyAmount + fixedPriceAmount;
    }),
    1,
  );
  const maxVisibleVolume = Math.max(
    ...trendPoints.map((point) =>
      chartVisibility.volume ? getTrendVolume(point) : 0,
    ),
    1,
  );
  const amountTicks = buildChartTicks(maxVisibleAmount);
  const volumeTicks = buildChartTicks(maxVisibleVolume);
  const slotWidth =
    (dashboardChartFrame.right - dashboardChartFrame.left) /
    Math.max(trendPoints.length, 1);
  const linePoints = chartVisibility.volume
    ? trendPoints
        .map((point, index) => {
          const x = dashboardChartFrame.left + slotWidth * index + slotWidth / 2;
          const y =
            dashboardChartFrame.bottom -
            (getTrendVolume(point) / maxVisibleVolume) *
              (dashboardChartFrame.bottom - dashboardChartFrame.top);
          return `${x},${y}`;
        })
        .join(" ")
    : "";
  const averageTransaction =
    currentMonthVolume > 0 ? currentMonthAmount / currentMonthVolume : 0;
  const trendPeriodLabel = getMonthRangeLabel(dashboardNow);
  const dashboardCards: SuperAdminDashboardCard[] = [
    {
      label: "Unit Aktif Nasional",
      value: activeUnitMetric?.value ?? "0",
      icon: Building2,
      tone: "green",
    },
    {
      label: "Pelanggaran Aktif",
      value: extractLeadingNumber(activeViolationSpotlight?.value),
      icon: ShieldAlert,
      tone: "amber",
    },
    {
      label: "Barang Terjual",
      value: soldSnapshot?.value ?? "0",
      icon: Package,
      tone: "green",
    },
    {
      label: "Total Tervalidasi",
      value:
        governance?.validatedTransactionValueLabel ??
        validatedSnapshot?.value ??
        formatCompactCurrency(currentMonthAmount),
      icon: WalletCards,
      tone: "green",
    },
  ];
  const complianceLevels = governance?.complianceLevels ?? [];
  const maxComplianceCount = Math.max(
    ...complianceLevels.map((level) => level.count),
    1,
  );
  const leaderboardRows = [...unitRows]
    .sort(
      (left, right) =>
        right.soldItems - left.soldItems ||
        left.unitName.localeCompare(right.unitName),
    )
    .slice(0, 3);

  return (
    <div className="space-y-5 md:space-y-6">
      <section className="-mx-4 -mt-5 overflow-visible border-b border-[#eef3f0] bg-white sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8">
        <p className="sr-only">Dashboard Nasional</p>
        <p className="sr-only">Superadmin Nasional</p>
        <div className="relative h-[12.5rem] overflow-hidden bg-[#f8fbfc] sm:h-[14.25rem] lg:h-[15.25rem]">
          <Image
            alt="Gedung Pegadaian untuk Dashboard Nasional Superadmin"
            className="pointer-events-none object-cover object-center"
            fill
            priority
            sizes="(min-width: 1024px) calc(100vw - 16rem), 100vw"
            src={SUPERADMIN_DASHBOARD_HERO_IMAGE}
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,#ffffff_0%,rgba(255,255,255,0.96)_24%,rgba(255,255,255,0.58)_49%,rgba(255,255,255,0.05)_100%)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.94)_86%,#ffffff_100%)]" />
        </div>

        <section
          aria-label="Snapshot Nasional"
          className="relative z-[1] -mt-[4.35rem] px-4 pb-5 sm:-mt-[4.55rem] sm:px-6 lg:-mt-[4.85rem] lg:px-8"
        >
          <p className="sr-only">Snapshot Nasional</p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-4">
            {dashboardCards.map((card) => {
              const Icon = card.icon;
              const tone = getDashboardCardToneClasses(card.tone);

              return (
                <article
                  className="group flex min-h-[5.85rem] items-center gap-4 rounded-[0.95rem] border border-[#dce6e1] bg-white/92 p-3.5 shadow-[0_18px_38px_-30px_rgba(15,23,42,0.28)] transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-white sm:min-h-[5.9rem] sm:p-4"
                  key={card.label}
                >
                  <span
                    className={`grid size-12 shrink-0 place-items-center rounded-[0.85rem] ring-1 ${tone.icon}`}
                  >
                    <Icon
                      aria-hidden="true"
                      className="size-6"
                      strokeWidth={1.9}
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[0.76rem] font-bold leading-5 text-[#647067]">
                      {card.label}
                    </p>
                    <p
                      className={`mt-1 truncate font-headline text-[1.6rem] font-black leading-none sm:text-[1.78rem] ${tone.value}`}
                    >
                      {card.value}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </section>

      <section className="overflow-hidden rounded-[1.6rem] border border-[#d9e7df] bg-white shadow-[0_24px_70px_-58px_rgba(8,69,50,0.34)]">
        <div className="grid lg:grid-cols-[0.24fr_0.76fr]">
          <aside className="border-b border-[#edf2ee] bg-white p-5 sm:p-6 lg:border-b-0 lg:border-r lg:p-7">
            <p className="font-headline text-[0.98rem] font-black text-[#17221d]">
              Performa Bulan Ini
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p className="font-headline text-[2.15rem] font-black leading-none text-[#006747]">
                {formatCompactCurrency(currentMonthAmount)}
              </p>
              <span className="rounded-full bg-[#e7f5ed] px-3 py-1 text-xs font-black text-[#006747]">
                {formatDashboardCount(currentMonthVolume)} transaksi
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold leading-6 text-[#647067]">
              {trendPeriodLabel}
            </p>

            <dl className="mt-7 grid gap-4 text-sm">
              <div>
                <dt className="font-semibold text-[#647067]">
                  Rata-rata Transaksi
                </dt>
                <dd className="mt-1 font-headline text-lg font-black text-[#17221d]">
                  {formatCompactCurrency(averageTransaction)}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-[#647067]">Dominasi Mode</dt>
                <dd className="mt-1 font-headline text-lg font-black text-[#17221d]">
                  {modeTotal > 0
                    ? `${dominantMode} (${dominantPercent}%)`
                    : "Belum ada transaksi"}
                </dd>
              </div>
            </dl>
          </aside>

          <div className="p-5 sm:p-6 lg:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-[#6d887a]">
                  Combo Chart
                </p>
                <h2 className="mt-2 font-headline text-[1.05rem] font-black tracking-tight text-[#17221d] sm:text-[1.12rem]">
                  Tren Nilai Transaksi Tervalidasi
                </h2>
              </div>
              <div className="flex flex-wrap gap-2 text-[0.72rem] font-black text-[#52615d]">
                <button
                  aria-pressed={chartVisibility.vickrey}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98] ${
                    chartVisibility.vickrey
                      ? "border-[#d8e4de] bg-white text-[#31443e] shadow-[0_10px_26px_-24px_rgba(8,69,50,0.55)]"
                      : "border-[#e7eeea] bg-[#f8fbf9] text-[#91a097]"
                  }`}
                  onClick={() =>
                    setChartVisibility((current) => ({
                      ...current,
                      vickrey: !current.vickrey,
                    }))
                  }
                  type="button"
                >
                  <span className="size-2 rounded-full bg-[#004a23]" />
                  Vickrey Auction
                </button>
                <button
                  aria-pressed={chartVisibility.fixedPrice}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98] ${
                    chartVisibility.fixedPrice
                      ? "border-[#d8e4de] bg-white text-[#31443e] shadow-[0_10px_26px_-24px_rgba(8,69,50,0.55)]"
                      : "border-[#e7eeea] bg-[#f8fbf9] text-[#91a097]"
                  }`}
                  onClick={() =>
                    setChartVisibility((current) => ({
                      ...current,
                      fixedPrice: !current.fixedPrice,
                    }))
                  }
                  type="button"
                >
                  <span className="size-2 rounded-full bg-[#86efac]" />
                  Fixed Price
                </button>
                <button
                  aria-pressed={chartVisibility.volume}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98] ${
                    chartVisibility.volume
                      ? "border-[#f4ddb0] bg-white text-[#31443e] shadow-[0_10px_26px_-24px_rgba(245,158,11,0.6)]"
                      : "border-[#f8ebcc] bg-[#fff9ef] text-[#b89957]"
                  }`}
                  onClick={() =>
                    setChartVisibility((current) => ({
                      ...current,
                      volume: !current.volume,
                    }))
                  }
                  type="button"
                >
                  <span className="size-2 rounded-full bg-[#f59e0b]" />
                  Volume
                </button>
              </div>
            </div>

            {trendPoints.length === 0 ? (
              <EmptyState
                className="mt-5 p-6"
                description="Transaksi lunas atau selesai akan membentuk tren nasional di area ini."
                icon={TrendingUp}
                title="Belum ada tren tervalidasi"
              />
            ) : (
              <div className="mt-5 overflow-hidden rounded-[1.45rem] border border-[#edf2ee] bg-[#fbfdfb] px-4 py-5 sm:px-5">
                <svg
                  aria-label="Grafik tren nilai transaksi tervalidasi"
                  className="h-[17rem] w-full sm:h-[18rem]"
                  preserveAspectRatio="none"
                  role="img"
                  viewBox={`0 0 ${dashboardChartWidth} ${dashboardChartHeight}`}
                >
                  <text
                    fill="#647067"
                    fontSize="11"
                    fontWeight="700"
                    x={dashboardChartFrame.left - 6}
                    y="16"
                  >
                    Nilai (Rp Juta)
                  </text>
                  <text
                    fill="#647067"
                    fontSize="11"
                    fontWeight="700"
                    textAnchor="end"
                    x={dashboardChartWidth - 8}
                    y="16"
                  >
                    Volume (Transaksi)
                  </text>
                  {amountTicks.map((tick) => {
                    return (
                      <g key={`amount-${tick.value}`}>
                        <line
                          stroke="#e5ebe7"
                          strokeDasharray="4 7"
                          strokeWidth="1"
                          x1={dashboardChartFrame.left}
                          x2={dashboardChartFrame.right}
                          y1={tick.y}
                          y2={tick.y}
                        />
                        <text
                          fill="#647067"
                          fontSize="11"
                          fontWeight="700"
                          textAnchor="end"
                          x={dashboardChartFrame.left - 10}
                          y={tick.y + 4}
                        >
                          {formatChartAmountTick(tick.value)}
                        </text>
                      </g>
                    );
                  })}
                  {volumeTicks.map((tick) => (
                    <text
                      fill="#647067"
                      fontSize="11"
                      fontWeight="700"
                      key={`volume-${tick.value}`}
                      x={dashboardChartFrame.right + 12}
                      y={tick.y + 4}
                    >
                      {tick.value}
                    </text>
                  ))}
                  {trendPoints.map((point, index) => {
                    const xCenter =
                      dashboardChartFrame.left +
                      slotWidth * index +
                      slotWidth / 2;
                    const barWidth = Math.min(34, Math.max(16, slotWidth * 0.44));
                    const x = xCenter - barWidth / 2;
                    const vickreyAmount = chartVisibility.vickrey
                      ? getTrendVickreyAmount(point)
                      : 0;
                    const fixedPriceAmount = chartVisibility.fixedPrice
                      ? getTrendFixedPriceAmount(point)
                      : 0;
                    const totalAmount = vickreyAmount + fixedPriceAmount;
                    const chartHeight =
                      dashboardChartFrame.bottom - dashboardChartFrame.top;
                    const totalHeight =
                      totalAmount > 0
                        ? Math.max(
                            (totalAmount / maxVisibleAmount) * chartHeight,
                            8,
                          )
                        : 0;
                    const fixedHeight =
                      totalAmount > 0
                        ? (fixedPriceAmount / totalAmount) * totalHeight
                        : 0;
                    const vickreyHeight = totalHeight - fixedHeight;
                    const vickreyY =
                      dashboardChartFrame.bottom - vickreyHeight;
                    const fixedY = vickreyY - fixedHeight;

                    return (
                      <g key={point.label}>
                        <title>{`${point.label}: ${formatCompactCurrency(point.amount)}, ${getTrendVolume(point)} transaksi`}</title>
                        {vickreyHeight > 0 ? (
                          <rect
                            className="transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                            fill="#005626"
                            height={vickreyHeight}
                            rx="6"
                            width={barWidth}
                            x={x}
                            y={vickreyY}
                          />
                        ) : null}
                        {fixedHeight > 0 ? (
                          <rect
                            className="transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                            fill="#9cd59f"
                            height={fixedHeight}
                            rx="6"
                            width={barWidth}
                            x={x}
                            y={fixedY}
                          />
                        ) : null}
                        <text
                          fill="#647067"
                          fontSize="11"
                          fontWeight="700"
                          textAnchor="middle"
                          x={xCenter}
                          y="236"
                        >
                          {point.label}
                        </text>
                      </g>
                    );
                  })}
                  {linePoints ? (
                    <polyline
                      className="transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                      fill="none"
                      points={linePoints}
                      stroke="#f59e0b"
                      strokeLinecap="round"
                      strokeWidth="3"
                    />
                  ) : null}
                  {trendPoints.map((point, index) => {
                    if (!chartVisibility.volume) {
                      return null;
                    }

                    const x =
                      dashboardChartFrame.left +
                      slotWidth * index +
                      slotWidth / 2;
                    const y =
                      dashboardChartFrame.bottom -
                      (getTrendVolume(point) / maxVisibleVolume) *
                        (dashboardChartFrame.bottom - dashboardChartFrame.top);

                    return (
                      <circle
                        className="transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                        cx={x}
                        cy={y}
                        fill="#ffffff"
                        key={`${point.label}-volume`}
                        r="5"
                        stroke="#f59e0b"
                        strokeWidth="3"
                      />
                    );
                  })}
                </svg>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="border border-[#d9e7df] bg-white">
          <CardHeader>
            <CardTitle>Status Kepatuhan Ekosistem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {complianceLevels.length === 0 ? (
              <EmptyState
                className="p-5"
                description="Level kepatuhan akan muncul setelah ada data pembatasan aktif."
                icon={ShieldAlert}
                title="Belum ada pembatasan aktif"
              />
            ) : (
              complianceLevels.map((level) => {
                const tone = getComplianceToneClasses(level.tone);
                const width = Math.max(
                  (level.count / maxComplianceCount) * 100,
                  level.count > 0 ? 8 : 0,
                );

                return (
                  <div key={level.label}>
                    <div className="mb-2 flex items-start justify-between gap-4">
                      <div className="flex min-w-0 gap-3">
                        <span
                          className={`mt-1.5 size-2.5 shrink-0 rounded-full ${tone.dot}`}
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-[#17221d]">
                            {level.label}
                          </p>
                          <p className="mt-1 text-xs font-semibold leading-5 text-[#647067]">
                            {level.description}
                          </p>
                        </div>
                      </div>
                      <p className="font-headline text-xl font-black text-[#17221d]">
                        {level.count}
                      </p>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#edf2ee]">
                      <div
                        className={`h-1.5 rounded-full ${tone.bar}`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="border border-[#d9e7df] bg-white">
          <CardHeader>
            <CardTitle>Leaderboard Barang Terjual</CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboardRows.length === 0 ? (
              <EmptyState
                className="p-5"
                description="Unit akan tampil setelah barang terjual tercatat dari transaksi sah."
                icon={Building2}
                title="Belum ada unit dengan barang terjual"
              />
            ) : (
              <div className="space-y-3">
                {leaderboardRows.map((row, index) => (
                  <div
                    className="flex items-center justify-between gap-4 rounded-[1rem] border border-[#edf2ee] bg-[#fbfdfb] p-4"
                    key={row.id}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#edf8f1] text-sm font-black text-[#006747] ring-1 ring-[#bfe7c4]">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#17221d]">
                          {row.unitName}
                        </p>
                        <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[#647067]">
                          {row.unitCode}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-headline text-xl font-black text-[#006747]">
                        {formatDashboardCount(row.soldItems)}
                      </p>
                      <p className="text-xs font-semibold text-[#647067]">
                        barang terjual
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function SuperAdminUnitsPage({
  units,
}: {
  units: SuperAdminUnitListItem[];
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");

  const filteredUnits = useMemo(() => {
    return units.filter((unit) => {
      const matchesQuery =
        query.length === 0 ||
        unit.name.toLowerCase().includes(query.toLowerCase()) ||
        unit.code.toLowerCase().includes(query.toLowerCase()) ||
        unit.address.toLowerCase().includes(query.toLowerCase());

      const matchesStatus =
        statusFilter === "Semua" || unit.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [query, statusFilter, units]);

  return (
    <div className="space-y-8 md:space-y-10">
      <SectionHeading
        eyebrow="Kelola Unit"
        title="Direktori unit Pegadaian"
        description="Kelola data unit, cek status kesiapan operasional, dan pastikan setiap unit memiliki rekening aktif serta admin yang terhubung."
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <Card className="border border-border/70 bg-white">
            <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_220px]">
              <Input
                name="unitSearch"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari unit, alamat, atau kode unit..."
                value={query}
              />
              <select
                aria-label="Filter status unit"
                className="h-11 rounded-xl border border-border/70 bg-white px-4 text-sm outline-none"
                onChange={(event) => setStatusFilter(event.target.value)}
                value={statusFilter}
              >
                <option value="Semua">Semua status</option>
                <option value="Aktif">Aktif</option>
                <option value="Perlu Review">Perlu Review</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>
            </CardContent>
          </Card>

          <div className="grid gap-5">
            {filteredUnits.length === 0 ? (
              <EmptyState
                description="Coba ubah kata kunci atau filter status. Unit yang cocok dengan pencarian Anda akan muncul di sini."
                icon={SearchX}
                title="Belum ada unit yang sesuai"
              />
            ) : (
              filteredUnits.map((unit) => (
                <Card
                  className="border border-border/70 bg-white"
                  key={unit.id}
                >
                  <CardContent className="grid gap-5 p-6 xl:grid-cols-[1.08fr_0.92fr] xl:items-center">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-xl font-bold text-foreground">
                          {unit.name}
                        </p>
                        <StatusBadge value={unit.status} />
                        <Badge variant="muted">{unit.code}</Badge>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {unit.address}
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl bg-surface-low p-4">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                            Admin Aktif
                          </p>
                          <p className="mt-2 font-semibold text-foreground">
                            {unit.adminCount}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-surface-low p-4">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                            Rekening Tersimpan
                          </p>
                          <p className="mt-2 font-semibold text-foreground">
                            {unit.accountCount}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 rounded-[1.5rem] border border-border/70 bg-surface-low/60 p-5">
                      <div className="flex items-center gap-3">
                        <WalletCards className="size-5 text-primary" />
                        <div>
                          <p className="font-semibold text-foreground">
                            Rekening aktif unit
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Dipakai sebagai rekening tujuan pembayaran
                            transaksi.
                          </p>
                        </div>
                      </div>
                      <div className="rounded-2xl bg-white p-4">
                        {unit.activeAccount ? (
                          <>
                            <p className="font-semibold text-foreground">
                              {unit.activeAccount.bankName}
                            </p>
                            <p className="mt-2 text-sm text-muted-foreground">
                              {unit.activeAccount.accountNumber}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {unit.activeAccount.accountHolder}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Belum ada rekening aktif untuk unit ini.
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Link href={`/superadmin/unit/${unit.id}`}>
                          <Button variant="secondary">Detail Unit</Button>
                        </Link>
                        <Link href={`/superadmin/unit/${unit.id}/rekening`}>
                          <Button>
                            <CreditCard className="size-4" />
                            Kelola Rekening
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        <UnitForm />
      </div>
    </div>
  );
}

export function SuperAdminUnitDetailPage({
  unit,
}: {
  unit: SuperAdminUnitDetail | null;
}) {
  if (!unit) {
    return (
      <Card className="border border-border/70 bg-white p-8">
        <p className="text-muted-foreground">Unit tidak ditemukan.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-8 md:space-y-10">
      <SectionHeading
        eyebrow="Detail Unit"
        title={unit.name}
        description="Lihat status unit, admin yang bertugas, dan rekening aktif saat ini dalam satu tempat."
        action={
          <div className="flex flex-wrap gap-3">
            <Link href={`/superadmin/unit/${unit.id}/rekening`}>
              <Button>
                <WalletCards className="size-4" />
                Kelola Rekening
              </Button>
            </Link>
            <DeactivateUnitButton disabled={!unit.isActive} unitId={unit.id} />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Kode Unit", value: unit.code },
          { label: "Status", value: unit.status },
          { label: "Admin Aktif", value: String(unit.adminCount) },
          { label: "Jumlah Rekening", value: String(unit.accountCount) },
        ].map((item) => (
          <Card
            className="border border-border/70 bg-white p-5"
            key={item.label}
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {item.label}
            </p>
            <p className="mt-4 text-2xl font-extrabold text-primary">
              {item.value}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <UnitForm
          initialValue={{
            code: unit.code,
            name: unit.name,
            address: unit.address,
            isActive: unit.isActive,
          }}
          mode="update"
          unitId={unit.id}
        />

        <Card className="border border-border/70 bg-white">
          <CardHeader>
            <CardTitle>Admin yang ditugaskan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {unit.admins.length === 0 ? (
              <EmptyState
                className="p-6"
                description="Tambahkan admin unit agar operasional harian, verifikasi transaksi, dan pengelolaan aset bisa mulai berjalan."
                icon={UserCog}
                title="Belum ada admin yang ditugaskan"
              />
            ) : (
              unit.admins.map((admin) => (
                <div
                  className="rounded-[1.5rem] border border-border/70 p-5"
                  key={admin.id}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="font-semibold text-foreground">
                        {admin.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {admin.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {admin.phone}
                      </p>
                    </div>
                    <StatusBadge value={admin.status} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function SuperAdminUnitAccountsPage({
  unit,
}: {
  unit: SuperAdminUnitDetail | null;
}) {
  if (!unit) {
    return (
      <Card className="border border-border/70 bg-white p-8">
        <p className="text-muted-foreground">Unit tidak ditemukan.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-8 md:space-y-10">
      <SectionHeading
        eyebrow="Rekening Unit"
        title={`Kelola rekening ${unit.name}`}
        description="Setiap unit boleh memiliki lebih dari satu rekening. Superadmin menentukan rekening aktif yang dipakai untuk pembayaran."
      />

      <div className="grid gap-6 xl:grid-cols-[0.98fr_1.02fr]">
        <Card className="border border-border/70 bg-white">
          <CardHeader>
            <CardTitle>Rekening aktif saat ini</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[1.5rem] border border-primary/15 bg-primary/[0.03] p-5">
              {unit.activeAccount ? (
                <div className="flex items-start gap-3">
                  <Landmark className="mt-1 size-5 text-primary" />
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground">
                      {unit.activeAccount.bankName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {unit.activeAccount.accountNumber}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {unit.activeAccount.accountHolder}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {unit.activeAccount.branch}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Belum ada rekening aktif untuk unit ini.
                </p>
              )}
            </div>

            <div className="space-y-4">
              {unit.accounts.length === 0 ? (
                <EmptyState
                  className="p-6"
                  description="Tambahkan rekening baru untuk unit ini. Anda tetap bisa menyimpan lebih dari satu rekening dan mengatur salah satunya sebagai rekening aktif."
                  icon={WalletCards}
                  title="Belum ada rekening unit"
                />
              ) : (
                unit.accounts.map((account) => (
                  <EditableAccountCard
                    account={account}
                    key={account.id}
                    unitId={unit.id}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <RekeningForm unitId={unit.id} />
      </div>
    </div>
  );
}

export function SuperAdminAdminsPage({
  admins,
  units,
}: {
  admins: SuperAdminAdminItem[];
  units: Array<{ id: string; name: string; code: string }>;
}) {
  const [query, setQuery] = useState("");

  const filteredAdmins = useMemo(() => {
    return admins.filter((admin) => {
      return (
        query.length === 0 ||
        admin.name.toLowerCase().includes(query.toLowerCase()) ||
        admin.email.toLowerCase().includes(query.toLowerCase()) ||
        admin.unit.toLowerCase().includes(query.toLowerCase())
      );
    });
  }, [admins, query]);

  return (
    <div className="space-y-8 md:space-y-10">
      <SectionHeading
        eyebrow="Kelola Admin Unit"
        title="Akun admin unit"
        description="Buat akun admin baru, tempatkan ke unit yang tepat, dan nonaktifkan akun yang sudah tidak bertugas."
      />

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
          <Card className="border border-border/70 bg-white">
            <CardContent className="p-5">
              <Input
                name="adminSearch"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari admin, email, atau unit..."
                value={query}
              />
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {filteredAdmins.length === 0 ? (
              <EmptyState
                description="Coba kata kunci lain atau buat akun admin unit baru agar daftar ini mulai terisi."
                icon={SearchX}
                title="Belum ada admin yang sesuai pencarian"
              />
            ) : (
              filteredAdmins.map((admin) => (
                <EditableAdminCard admin={admin} key={admin.id} units={units} />
              ))
            )}
          </div>
        </div>

        <AdminUnitForm units={units} />
      </div>
    </div>
  );
}

export function SuperAdminManagementPage({
  units,
  admins,
}: {
  units: SuperAdminUnitListItem[];
  admins: SuperAdminAdminItem[];
}) {
  const [query, setQuery] = useState("");
  const [activePanel, setActivePanel] = useState<"unit" | "admin" | null>(null);
  const unitOptions = units.map((unit) => ({
    id: unit.id,
    name: unit.name,
    code: unit.code,
  }));
  const filteredUnits = useMemo(() => {
    const normalized = query.toLowerCase();

    return units.filter((unit) => {
      return (
        normalized.length === 0 ||
        unit.name.toLowerCase().includes(normalized) ||
        unit.code.toLowerCase().includes(normalized) ||
        unit.address.toLowerCase().includes(normalized)
      );
    });
  }, [query, units]);

  return (
    <div className="space-y-8 md:space-y-10">
      <SectionHeading
        eyebrow="Manajemen Unit"
        title="Manajemen Unit"
        description="Kelola unit, rekening aktif utama, dan admin unit dari satu workspace ringkas."
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card className="border border-border/70 bg-white">
            <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center">
              <Input
                name="managementSearch"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari unit, kode, atau alamat..."
                value={query}
              />
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => setActivePanel("unit")}>
                  <Plus className="size-4" />
                  Tambah Unit
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setActivePanel("admin")}
                >
                  <UserCog className="size-4" />
                  Tambah Admin
                </Button>
                <Link href="/superadmin/admin">
                  <Button variant="secondary">
                    <ListChecks className="size-4" />
                    Direktori Admin
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/70 bg-white">
            <CardHeader>
              <CardTitle>Unit, rekening, dan admin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredUnits.length === 0 ? (
                <EmptyState
                  className="p-6"
                  description="Coba kata kunci lain atau tambahkan unit baru melalui tombol tambah unit."
                  icon={SearchX}
                  title="Belum ada unit yang sesuai"
                />
              ) : (
                filteredUnits.map((unit) => (
                  <div
                    className="rounded-[1.25rem] border border-border/70 p-5"
                    key={unit.id}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="font-semibold text-foreground">
                            {unit.name}
                          </p>
                          <StatusBadge value={unit.status} />
                        </div>
                        <p className="text-sm font-semibold text-muted-foreground">
                          {unit.code}
                        </p>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {unit.address}
                        </p>
                      </div>
                      <div className="grid min-w-[220px] gap-2 text-sm text-muted-foreground">
                        <p>
                          Admin aktif:{" "}
                          <span className="font-bold text-foreground">
                            {unit.adminCount}
                          </span>
                        </p>
                        <p>
                          Rekening tersimpan:{" "}
                          <span className="font-bold text-foreground">
                            {unit.accountCount}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 rounded-2xl bg-surface-low/70 p-4 text-sm text-muted-foreground">
                      {unit.activeAccount ? (
                        <p>
                          Rekening utama:{" "}
                          <span className="font-semibold text-foreground">
                            {unit.activeAccount.bankName}
                          </span>{" "}
                          {unit.activeAccount.accountNumber}
                        </p>
                      ) : (
                        <p>Belum ada rekening utama aktif.</p>
                      )}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link href={`/superadmin/unit/${unit.id}`}>
                        <Button size="sm" variant="secondary">
                          Detail Unit
                        </Button>
                      </Link>
                      <Link href={`/superadmin/unit/${unit.id}/rekening`}>
                        <Button size="sm" variant="secondary">
                          <WalletCards className="size-4" />
                          Rekening
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border border-border/70 bg-white">
            <CardHeader>
              <CardTitle>Admin unit aktif</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {admins.length === 0 ? (
                <EmptyState
                  className="p-6"
                  description="Admin unit yang dibuat akan muncul di sini sebagai ringkasan cepat."
                  icon={UserCog}
                  title="Belum ada admin unit"
                />
              ) : (
                admins.slice(0, 5).map((admin) => (
                  <div
                    className="rounded-2xl border border-border/70 p-4"
                    key={admin.id}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">
                          {admin.name}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {admin.unit}
                        </p>
                      </div>
                      <StatusBadge value={admin.status} />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <SuperAdminDialog
        description="Wizard 2 langkah untuk membuat data unit dan rekening aktif utama. Rekening utama wajib diisi sebelum unit disimpan."
        onClose={() => setActivePanel(null)}
        open={activePanel === "unit"}
        title="Tambah unit baru"
      >
        <UnitForm showTitle={false} />
      </SuperAdminDialog>

      <SuperAdminDialog
        description="Buat akun admin unit dan hubungkan langsung ke unit yang sudah tersedia."
        onClose={() => setActivePanel(null)}
        open={activePanel === "admin"}
        title="Tambah admin unit"
      >
        <AdminUnitForm showTitle={false} units={unitOptions} />
      </SuperAdminDialog>
    </div>
  );
}

export function SuperAdminPolicyPage() {
  const followUpItems = [
    "Fixed price yang bukti pembayarannya ditolak admin unit masuk Perlu Tindak Lanjut dan bukan pelanggaran buyer.",
    "Lelang Vickrey tanpa bid masuk Perlu Tindak Lanjut dan bukan pelanggaran buyer.",
    "Pemasaran gagal tanpa insiden tidak bayar 24 jam masuk Perlu Tindak Lanjut dan bukan pelanggaran buyer.",
  ];

  return (
    <div className="space-y-8 md:space-y-10">
      <SectionHeading
        eyebrow="Read-only"
        title="Kebijakan Pelanggaran"
        description="Referensi ringkas untuk menjaga keputusan Superadmin konsisten dengan aturan sistem."
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border border-border/70 bg-white">
          <CardHeader>
            <CardTitle>Aturan pelanggaran buyer aktif</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
            <div className="rounded-[1.25rem] border border-primary/15 bg-primary/[0.03] p-5">
              <p className="font-semibold text-foreground">
                Pelanggaran buyer hanya terjadi saat pemenang lelang tidak
                menyelesaikan pembayaran dalam 24 jam.
              </p>
              <p className="mt-2">
                Sistem membuat insiden dari transaksi Vickrey yang melewati
                batas pembayaran dan memicu pembatasan sesuai level akumulasi.
              </p>
            </div>
            <p>
              Halaman ini read-only. Perubahan kebijakan harus dilakukan lewat
              perubahan kode dan audit produk, bukan lewat input bebas di UI.
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-white">
          <CardHeader>
            <CardTitle>Masuk Perlu Tindak Lanjut</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {followUpItems.map((item) => (
              <div
                className="flex items-start gap-3 rounded-[1.25rem] border border-border/70 p-4"
                key={item}
              >
                <Shield className="mt-0.5 size-4 shrink-0 text-primary" />
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function SuperAdminMonitoringPage({
  data,
  serverNow,
}: {
  data: SuperAdminMonitoringData;
  serverNow?: string;
}) {
  const unitRows = data.unitRows ?? [];
  const [selectedUnitRow, setSelectedUnitRow] =
    useState<SuperAdminMonitoringUnitRow | null>(null);

  return (
    <div className="space-y-8 md:space-y-10">
      <SectionHeading
        eyebrow="Komparasi Unit"
        title="Monitoring Unit"
        description="Bandingkan kondisi unit secara ringkas: lifecycle barang, transaksi tertahan, tindak lanjut operasional, dan pelanggaran buyer aktif."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {data.summary.metrics.map((metric) => (
          <Card
            className="border border-border/70 bg-white p-5"
            key={metric.label}
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {metric.label}
            </p>
            <p className="mt-4 text-3xl font-extrabold text-primary">
              {metric.value}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {metric.detail}
            </p>
          </Card>
        ))}
      </div>

      <Card className="border border-border/70 bg-white">
        <CardHeader>
          <CardTitle>Tabel komparasi unit</CardTitle>
        </CardHeader>
        <CardContent>
          {unitRows.length === 0 ? (
            <EmptyState
              className="p-6"
              description="Data unit komparatif akan muncul setelah layanan monitoring mengirim agregasi per unit."
              icon={Building2}
              title="Belum ada data unit"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[940px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border/70 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    <th className="py-3 pr-4" scope="col">
                      Unit
                    </th>
                    <th className="px-4 py-3" scope="col">
                      Barang Jaminan
                    </th>
                    <th className="px-4 py-3" scope="col">
                      Sedang Dipasarkan
                    </th>
                    <th className="px-4 py-3" scope="col">
                      Terjual
                    </th>
                    <th className="px-4 py-3" scope="col">
                      Perlu Tindak Lanjut
                    </th>
                    <th className="px-4 py-3" scope="col">
                      Transaksi Tertahan
                    </th>
                    <th className="px-4 py-3" scope="col">
                      Pelanggaran Aktif
                    </th>
                    <th className="px-4 py-3" scope="col">
                      Status Unit
                    </th>
                    <th className="py-3 pl-4" scope="col">
                      Aksi Detail
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {unitRows.map((row) => (
                    <tr
                      className="border-b border-border/60 last:border-0"
                      key={row.id}
                    >
                      <td className="py-4 pr-4">
                        <p className="font-semibold text-foreground">
                          {row.unitName}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-muted-foreground">
                          {row.unitCode}
                        </p>
                      </td>
                      <td className="px-4 py-4 font-semibold text-foreground">
                        {row.collateralItems}
                      </td>
                      <td className="px-4 py-4 font-semibold text-foreground">
                        {row.marketedItems}
                      </td>
                      <td className="px-4 py-4 font-semibold text-foreground">
                        {row.soldItems}
                      </td>
                      <td className="px-4 py-4 font-semibold text-foreground">
                        {row.followUpItems}
                      </td>
                      <td className="px-4 py-4 font-semibold text-foreground">
                        {row.heldTransactions}
                      </td>
                      <td className="px-4 py-4 font-semibold text-foreground">
                        {row.activeViolations}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge value={row.status} />
                      </td>
                      <td className="py-4 pl-4">
                        <Button
                          size="sm"
                          type="button"
                          variant="secondary"
                          onClick={() => setSelectedUnitRow(row)}
                        >
                          <Eye className="size-4" />
                          Detail
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <SuperAdminDialog
        description="Ringkasan lifecycle, transaksi tertahan, dan status operasional unit."
        onClose={() => setSelectedUnitRow(null)}
        open={selectedUnitRow !== null}
        title={selectedUnitRow?.unitName ?? "Detail unit"}
      >
        {selectedUnitRow ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3 rounded-[1rem] border border-border/70 bg-surface-low/60 p-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  {selectedUnitRow.unitCode}
                </p>
                <p className="mt-2 text-lg font-bold text-foreground">
                  {selectedUnitRow.unitName}
                </p>
              </div>
              <StatusBadge value={selectedUnitRow.status} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  label: "Barang jaminan",
                  value: selectedUnitRow.collateralItems,
                  icon: Landmark,
                },
                {
                  label: "Sedang dipasarkan",
                  value: selectedUnitRow.marketedItems,
                  icon: ClipboardCheck,
                },
                {
                  label: "Terjual",
                  value: selectedUnitRow.soldItems,
                  icon: TrendingUp,
                },
                {
                  label: "Perlu tindak lanjut",
                  value: selectedUnitRow.followUpItems,
                  icon: AlertTriangle,
                },
                {
                  label: "Transaksi tertahan",
                  value: selectedUnitRow.heldTransactions,
                  icon: Clock3,
                },
                {
                  label: "Pelanggaran aktif",
                  value: selectedUnitRow.activeViolations,
                  icon: ShieldBan,
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    className="flex items-center justify-between gap-4 rounded-[1rem] border border-border/70 bg-white p-4"
                    key={item.label}
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="size-4" />
                      </span>
                      <p className="text-sm font-semibold text-muted-foreground">
                        {item.label}
                      </p>
                    </div>
                    <p className="text-xl font-extrabold text-foreground">
                      {item.value}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href={`/superadmin/unit/${selectedUnitRow.id}`}>
                <Button>
                  <Building2 className="size-4" />
                  Buka Detail Unit
                </Button>
              </Link>
              <Link href={`/superadmin/unit/${selectedUnitRow.id}/rekening`}>
                <Button variant="secondary">
                  <WalletCards className="size-4" />
                  Kelola Rekening
                </Button>
              </Link>
            </div>
          </div>
        ) : null}
      </SuperAdminDialog>

      <div className="grid gap-4">
        {data.pendingMonitoring.length === 0 ? (
          <EmptyState
            description="Tidak ada unit, rekening, akun admin, atau transaksi yang membutuhkan perhatian cepat saat ini."
            icon={Shield}
            title="Monitoring sedang tenang"
          />
        ) : (
          data.pendingMonitoring.map((item) => (
            <Card className="border border-border/70 bg-white" key={item.id}>
              <CardContent className="grid gap-4 p-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="muted">{item.scope}</Badge>
                    <StatusBadge value={item.status} />
                  </div>
                  <p className="text-lg font-bold text-foreground">
                    {item.unit}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.activity}
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.detail}
                  </p>
                  <SuperAdminCountdown
                    className="text-sm font-semibold text-primary"
                    countdownAt={item.countdownAt}
                    countdownLabel={item.countdownLabel}
                    expiredLabel={item.expiredLabel}
                    serverNow={serverNow}
                  />
                </div>
                <div className="space-y-3 rounded-[1.5rem] border border-border/70 bg-surface-low/60 p-5">
                  <p className="text-sm text-muted-foreground">
                    Tinjau unit ini untuk memastikan rekening aktif, admin
                    aktif, dan status operasionalnya tetap sinkron.
                  </p>
                  <Link href={item.href ?? `/superadmin/unit/${item.unitId}`}>
                    <Button variant="secondary">Buka Unit Terkait</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export function SuperAdminBlacklistPage({
  entries,
  reviewCases = [],
  serverNow,
}: {
  entries: SuperAdminBlacklistItem[];
  reviewCases?: SuperAdminBlacklistReviewCase[];
  serverNow?: string;
}) {
  const [blacklistActionOpen, setBlacklistActionOpen] = useState(false);
  const activeRestriction = entries.find((entry) => entry.status === "Aktif");
  const expiringEntry = entries.find(
    (entry) => entry.status === "Aktif" && entry.countdownAt,
  );

  return (
    <div className="space-y-8 md:space-y-10">
      <SectionHeading
        eyebrow="Review & Pelanggaran"
        title="Review & Pelanggaran"
        description="Pusat keputusan untuk review buyer, pembatasan aktif, dan riwayat keputusan pelanggaran pembayaran Vickrey."
      />

      <BlacklistReviewQueue cases={reviewCases} />

      <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
        <Card className="border border-border/70 bg-white">
          <CardHeader>
            <CardTitle>Pembatasan Aktif</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {entries.length === 0 ? (
              <EmptyState
                className="p-6"
                description="Saat ini belum ada akun dengan blacklist aktif. Daftar ini akan terisi otomatis jika ada pelanggaran lintas unit."
                icon={ShieldBan}
                title="Belum ada blacklist aktif"
              />
            ) : (
              entries.map((item) => (
                <div
                  className="rounded-[1.5rem] border border-border/70 p-5"
                  key={item.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-2">
                      <p className="font-semibold text-foreground">
                        {item.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.unit}
                      </p>
                    </div>
                    <StatusBadge value={item.status} />
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {item.reason}
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {item.total} pelanggaran | Berlaku sampai {item.until}
                  </p>
                  <div className="mt-3">
                    <SuperAdminCountdown
                      className="text-sm font-semibold text-primary"
                      countdownAt={item.countdownAt}
                      countdownLabel={item.countdownLabel}
                      expiredLabel={item.expiredLabel}
                      serverNow={serverNow}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border border-border/70 bg-white">
            <CardHeader>
              <CardTitle>Riwayat Keputusan & Aksi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[1.5rem] border border-border/70 bg-surface-low/60 p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-1 size-5 text-accent-foreground" />
                  <div>
                    <p className="font-semibold text-foreground">
                      Cabut pembatasan lebih awal
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      Tuliskan alasan pencabutan agar riwayat keputusan tetap
                      tersimpan di sistem.
                    </p>
                  </div>
                </div>
              </div>

              {expiringEntry ? (
                <div className="rounded-[1.5rem] border border-primary/15 bg-primary/[0.04] p-5">
                  <p className="text-sm font-semibold text-foreground">
                    Masa blokir terdekat untuk ditinjau
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {expiringEntry.name} dari {expiringEntry.unit}
                  </p>
                  <div className="mt-3">
                    <SuperAdminCountdown
                      className="text-sm font-semibold text-primary"
                      countdownAt={expiringEntry.countdownAt}
                      countdownLabel={expiringEntry.countdownLabel}
                      expiredLabel={expiringEntry.expiredLabel}
                      serverNow={serverNow}
                    />
                  </div>
                </div>
              ) : null}

              {activeRestriction ? (
                <Button
                  type="button"
                  onClick={() => setBlacklistActionOpen(true)}
                >
                  <ShieldCheck className="size-4" />
                  Cabut Pembatasan
                </Button>
              ) : (
                <EmptyState
                  className="p-6"
                  description="Tidak ada akun aktif yang perlu dicabut blokirnya. Jika ada kasus baru, tombol tindakan akan muncul di sini."
                  icon={ShieldBan}
                  title="Belum ada aksi blacklist yang perlu diproses"
                />
              )}
            </CardContent>
          </Card>

          <Card className="border border-border/70 bg-white">
            <CardHeader>
              <CardTitle>Pengingat kebijakan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                Pelanggaran buyer aktif hanya dibuat saat pemenang lelang
                Vickrey tidak membayar dalam 24 jam.
              </p>
              <p>
                Level 1 menahan bid Vickrey, level 2 menahan transaksi baru, dan
                level 3 memerlukan review manual.
              </p>
              <p>
                Fixed price ditolak, lelang tanpa bid, dan pemasaran gagal masuk
                tindak lanjut operasional.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <SuperAdminDialog
        description="Gunakan hanya ketika hasil review atau bukti manual sudah cukup untuk mencabut pembatasan lebih awal."
        onClose={() => setBlacklistActionOpen(false)}
        open={blacklistActionOpen && Boolean(activeRestriction)}
        title="Cabut pembatasan"
      >
        {activeRestriction ? (
          <CabutBlacklistForm userId={activeRestriction.userId} />
        ) : null}
      </SuperAdminDialog>
    </div>
  );
}
