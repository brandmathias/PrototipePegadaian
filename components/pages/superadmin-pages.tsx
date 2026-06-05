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
  PieChart,
  Plus,
  SearchX,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldBan,
  TrendingDown,
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

export type SuperAdminValidatedTrendRangeKey = "week" | "month" | "year";

export type SuperAdminValidatedTrendRange = {
  label: string;
  points: SuperAdminValidatedTrendPoint[];
  summary: {
    averageAmount: number;
    dominantMode: string;
    dominantPercent: number;
    fixedPriceAmount: number;
    totalAmount: number;
    transactionCount: number;
    vickreyAmount: number;
  };
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
  validatedTransactionValue?: number;
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
    validatedTrendRanges?: Record<
      SuperAdminValidatedTrendRangeKey,
      SuperAdminValidatedTrendRange
    >;
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
const dashboardChartWidth = 760;
const dashboardChartHeight = 230;
const dashboardChartFrame = {
  top: 36,
  right: 666,
  bottom: 184,
  left: 76,
};
const dashboardChartTickCount = 4;
const dashboardTrendRangeOptions: Array<{
  key: SuperAdminValidatedTrendRangeKey;
  label: string;
}> = [
  { key: "week", label: "Minggu Ini" },
  { key: "month", label: "Bulan Ini" },
  { key: "year", label: "Tahun Ini" },
];

type SuperAdminDashboardCard = {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: "green" | "amber";
};

function formatDashboardCount(value: number) {
  return dashboardNumberFormatter.format(value);
}

function formatFullCurrency(value: number) {
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}

function formatLeaderboardCurrency(value: number) {
  if (value >= 1_000_000_000) {
    return `Rp ${(value / 1_000_000_000).toLocaleString("id-ID", {
      maximumFractionDigits: 1,
    })} M`;
  }

  if (value >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toLocaleString("id-ID", {
      maximumFractionDigits: 1,
    })} Jt`;
  }

  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
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

function summarizeDashboardTrend(points: SuperAdminValidatedTrendPoint[]) {
  const totalAmount = points.reduce(
    (sum, point) => sum + Number(point.amount ?? 0),
    0,
  );
  const transactionCount = points.reduce(
    (sum, point) => sum + getTrendVolume(point),
    0,
  );
  const vickreyAmount = points.reduce(
    (sum, point) => sum + getTrendVickreyAmount(point),
    0,
  );
  const fixedPriceAmount = points.reduce(
    (sum, point) => sum + getTrendFixedPriceAmount(point),
    0,
  );
  const dominantMode =
    vickreyAmount >= fixedPriceAmount ? "Vickrey Auction" : "Fixed Price";
  const dominantAmount = Math.max(vickreyAmount, fixedPriceAmount);
  const modeTotal = vickreyAmount + fixedPriceAmount;

  return {
    averageAmount: transactionCount > 0 ? totalAmount / transactionCount : 0,
    dominantMode,
    dominantPercent:
      modeTotal > 0 ? Math.round((dominantAmount / modeTotal) * 100) : 0,
    fixedPriceAmount,
    totalAmount,
    transactionCount,
    vickreyAmount,
  };
}

function clampChartValue(value: number, maxValue: number) {
  return Math.min(Math.max(value, 0), maxValue);
}

function getNiceAmountAxisMax(value: number) {
  const valueInMillions = Math.max(value / 1_000_000, 1);
  const rawStep = valueInMillions / dashboardChartTickCount;
  const exponent = Math.floor(Math.log10(rawStep));
  const base = 10 ** exponent;
  const ratio = rawStep / base;
  const factor =
    ratio <= 1
      ? 1
      : ratio <= 2
        ? 2
        : ratio <= 2.5
          ? 2.5
          : ratio <= 5
            ? 5
            : ratio <= 7.5
              ? 7.5
              : 10;
  const stepInMillions = factor * base;

  return stepInMillions * dashboardChartTickCount * 1_000_000;
}

function buildChartTicks({
  formatter,
  maxValue,
}: {
  formatter: (value: number) => string;
  maxValue: number;
}) {
  return Array.from({ length: dashboardChartTickCount + 1 }, (_, index) => {
    const value = (maxValue / dashboardChartTickCount) * index;
    const ratio = value / maxValue;
    const y =
      dashboardChartFrame.bottom -
      ratio * (dashboardChartFrame.bottom - dashboardChartFrame.top);

    return {
      displayValue: formatter(value),
      value,
      y,
    };
  });
}

function formatAmountTick(value: number) {
  return Math.round(value / 1_000_000).toLocaleString("id-ID");
}

function makeBottomRoundedRectPath({
  height,
  radius,
  width,
  x,
  y,
}: {
  height: number;
  radius: number;
  width: number;
  x: number;
  y: number;
}) {
  const r = Math.min(radius, width / 2, height);
  const right = x + width;
  const bottom = y + height;

  return [
    `M ${x} ${y}`,
    `L ${right} ${y}`,
    `L ${right} ${bottom - r}`,
    `Q ${right} ${bottom} ${right - r} ${bottom}`,
    `L ${x + r} ${bottom}`,
    `Q ${x} ${bottom} ${x} ${bottom - r}`,
    "Z",
  ].join(" ");
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
    return { dot: "bg-[#ef4444]", rail: "bg-[#ef4444]" };
  }

  if (tone === "orange") {
    return { dot: "bg-[#f97316]", rail: "bg-[#f97316]" };
  }

  return { dot: "bg-[#f59e0b]", rail: "bg-[#f59e0b]" };
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
  });
  const [activeTrendRange, setActiveTrendRange] =
    useState<SuperAdminValidatedTrendRangeKey>("year");
  const [activeTrendIndex, setActiveTrendIndex] = useState<number | null>(null);
  const snapshotItems = governance?.snapshot ?? [];
  const yearTrendPoints =
    governance?.validatedTrend?.length === 12
      ? governance.validatedTrend
      : governance?.validatedTrend ?? [];
  const fallbackTrendRange = {
    label: "Tahun Ini",
    points: yearTrendPoints,
    summary: summarizeDashboardTrend(yearTrendPoints),
  };
  const trendRanges =
    governance?.validatedTrendRanges ??
    ({
      week: { ...fallbackTrendRange, label: "Minggu Ini" },
      month: { ...fallbackTrendRange, label: "Bulan Ini" },
      year: fallbackTrendRange,
    } satisfies Record<
      SuperAdminValidatedTrendRangeKey,
      SuperAdminValidatedTrendRange
    >);
  const activeTrendRangeData =
    trendRanges[activeTrendRange] ?? trendRanges.year ?? fallbackTrendRange;
  const trendPoints = activeTrendRangeData.points;
  const trendSummary =
    activeTrendRangeData.summary ?? summarizeDashboardTrend(trendPoints);
  const currentPeriodAmount = Number(trendSummary.totalAmount ?? 0);
  const currentPeriodVolume = Number(trendSummary.transactionCount ?? 0);
  const currentPeriodVickrey = Number(trendSummary.vickreyAmount ?? 0);
  const currentPeriodFixedPrice = Number(trendSummary.fixedPriceAmount ?? 0);
  const currentPeriodAverage = Number(trendSummary.averageAmount ?? 0);
  const currentPeriodDominantMode =
    trendSummary.dominantMode ??
    (currentPeriodVickrey >= currentPeriodFixedPrice
      ? "Vickrey Auction"
      : "Fixed Price");
  const currentPeriodDominantPercent = Number(
    trendSummary.dominantPercent ?? 0,
  );
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
  const amountAxisMax = getNiceAmountAxisMax(maxVisibleAmount);
  const amountTicks = buildChartTicks({
    formatter: formatAmountTick,
    maxValue: amountAxisMax,
  });
  const slotWidth =
    (dashboardChartFrame.right - dashboardChartFrame.left) /
    Math.max(trendPoints.length, 1);
  const chartHeight = dashboardChartFrame.bottom - dashboardChartFrame.top;
  const chartPoints = trendPoints.map((point, index) => {
    const x = dashboardChartFrame.left + slotWidth * index + slotWidth / 2;
    const volume = getTrendVolume(point);
    const vickreyAmount = chartVisibility.vickrey
      ? getTrendVickreyAmount(point)
      : 0;
    const fixedPriceAmount = chartVisibility.fixedPrice
      ? getTrendFixedPriceAmount(point)
      : 0;
    const totalAmount = vickreyAmount + fixedPriceAmount;
    const y =
      dashboardChartFrame.bottom -
      (clampChartValue(totalAmount, amountAxisMax) / amountAxisMax) *
        chartHeight;

    return {
      ...point,
      leftPercent: (x / dashboardChartWidth) * 100,
      topPercent: (y / dashboardChartHeight) * 100,
      totalAmount,
      x,
      volume,
    };
  });
  const activeTrendPoint =
    activeTrendIndex !== null ? chartPoints[activeTrendIndex] : null;
  const averageTransaction =
    currentPeriodVolume > 0 ? currentPeriodAverage : 0;
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
        formatCompactCurrency(currentPeriodAmount),
      icon: WalletCards,
      tone: "green",
    },
  ];
  const complianceLevels = governance?.complianceLevels ?? [];
  const topTransactionUnitRows = [...unitRows]
    .sort(
      (left, right) =>
        Number(right.validatedTransactionValue ?? 0) -
          Number(left.validatedTransactionValue ?? 0) ||
        right.soldItems - left.soldItems ||
        left.unitName.localeCompare(right.unitName),
    )
    .slice(0, 3);
  const bottomTransactionUnitRows = [...unitRows]
    .sort(
      (left, right) =>
        Number(left.validatedTransactionValue ?? 0) -
          Number(right.validatedTransactionValue ?? 0) ||
        left.soldItems - right.soldItems ||
        left.unitName.localeCompare(right.unitName),
    )
    .slice(0, 3);

  return (
    <div className="space-y-5 md:space-y-6">
      <section className="-mx-4 -mt-5 overflow-visible border-b border-[#eef3f0] bg-white sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8">
        <p className="sr-only">Dashboard Nasional</p>
        <p className="sr-only">Superadmin Nasional</p>
        <div className="relative h-[16.5rem] overflow-hidden bg-[#f8fbfc] sm:h-[17.75rem] lg:h-[18.5rem]">
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
          <div className="relative z-[1] flex h-full items-start px-4 pt-6 sm:px-6 sm:pt-7 lg:px-8 lg:pt-8">
            <div className="max-w-[45rem]">
              <p className="text-[0.84rem] font-black leading-none text-[#17221d] sm:text-[0.9rem]">
                Selamat datang kembali,
              </p>
              <h1 className="mt-2 font-headline text-[2.25rem] font-black leading-[0.98] tracking-tight text-[#07593f] sm:text-[3.05rem] lg:text-[3.55rem]">
                Halo, Superadmin Nasional
              </h1>
              <p className="mt-4 max-w-[39rem] text-[0.98rem] font-semibold leading-7 text-[#647067] sm:text-[1.05rem]">
                Anda siap memantau kinerja unit, meninjau pelanggaran, dan
                mengendalikan keputusan lintas cabang dari satu pusat kendali
                yang ringkas.
              </p>
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#cfe2d8] bg-white/78 px-4 py-2 text-[0.72rem] font-black uppercase tracking-[0.22em] text-[#07593f] shadow-[0_18px_38px_-34px_rgba(15,23,42,0.38)]">
                <ShieldCheck aria-hidden="true" className="size-4" strokeWidth={2} />
                Akses Superadmin
              </div>
            </div>
          </div>
        </div>

        <section
          aria-label="Snapshot Nasional"
          className="relative z-[1] -mt-[1.1rem] px-4 pb-6 sm:-mt-[1.3rem] sm:px-6 lg:-mt-[1.55rem] lg:px-8"
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

      <section className="relative rounded-[1.05rem] border border-[#dce6e1] bg-white px-4 py-4 shadow-[0_18px_48px_-42px_rgba(15,23,42,0.24)] sm:px-5 sm:py-5">
        <div className="grid gap-3 xl:grid-cols-[0.27fr_0.33fr_0.4fr] xl:items-center">
          <h2 className="font-headline text-[1.05rem] font-black leading-tight text-[#17221d] sm:text-[1.18rem]">
            Tren Nilai Transaksi Tervalidasi
          </h2>

          <div className="flex flex-wrap items-center gap-5 text-[0.7rem] font-black text-[#3f4f48] xl:justify-center">
            <button
              aria-pressed={chartVisibility.vickrey}
              className={`inline-flex items-center gap-2 rounded-md px-1.5 py-1 transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[#f5f8f6] active:scale-[0.98] ${
                chartVisibility.vickrey ? "opacity-100" : "opacity-40"
              }`}
              onClick={() =>
                setChartVisibility((current) => ({
                  ...current,
                  vickrey: !current.vickrey,
                }))
              }
              type="button"
            >
              <span className="size-2.5 rounded-[0.18rem] bg-[#005626]" />
              Vickrey Auction (Rp)
            </button>
            <button
              aria-pressed={chartVisibility.fixedPrice}
              className={`inline-flex items-center gap-2 rounded-md px-1.5 py-1 transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[#f5f8f6] active:scale-[0.98] ${
                chartVisibility.fixedPrice ? "opacity-100" : "opacity-40"
              }`}
              onClick={() =>
                setChartVisibility((current) => ({
                  ...current,
                  fixedPrice: !current.fixedPrice,
                }))
              }
              type="button"
            >
              <span className="size-2.5 rounded-[0.18rem] bg-[#9bd191]" />
              Fixed Price (Rp)
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            {dashboardTrendRangeOptions.map((option) => {
              const active = activeTrendRange === option.key;

              return (
                <button
                  aria-pressed={active}
                  className={`inline-flex min-w-[5.9rem] items-center justify-center rounded-[0.82rem] border px-3 py-2 text-[0.76rem] font-black transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.98] ${
                    active
                      ? "border-[#179353] bg-[linear-gradient(180deg,#1a9b56,#13844a)] text-white shadow-[0_16px_32px_-22px_rgba(19,132,74,0.65)]"
                      : "border-[#ebeeea] bg-white text-[#2a352f] shadow-[0_10px_24px_-22px_rgba(15,23,42,0.34)] hover:border-[#d7e4da] hover:bg-[#fbfcfb]"
                  }`}
                  key={option.key}
                  onClick={() => {
                    setActiveTrendRange(option.key);
                    setActiveTrendIndex(null);
                  }}
                  type="button"
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid gap-5 lg:grid-cols-[0.29fr_0.71fr] lg:gap-6">
          <aside className="space-y-4 border-b border-[#edf2ee] pb-4 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5">
            <p className="font-headline text-[0.88rem] font-black text-[#17221d]">
              Performa {activeTrendRangeData.label}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-headline text-[1.95rem] font-black leading-none text-[#00563b] sm:text-[2.2rem]">
                {formatFullCurrency(currentPeriodAmount)}
              </p>
              <span className="rounded-full bg-[#dff5e7] px-2.5 py-1 text-xs font-black text-[#006747]">
                {formatDashboardCount(currentPeriodVolume)} transaksi
              </span>
            </div>
            <div className="h-px bg-[#e8eeea]" />

            <dl className="grid gap-3 text-sm">
              <div className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#edf8f1] text-[#118850] ring-1 ring-[#d7ecd9]">
                  <TrendingUp className="size-5" strokeWidth={1.8} />
                </span>
                <div>
                  <dt className="text-[0.8rem] font-semibold text-[#647067]">
                    Rata-rata Transaksi
                  </dt>
                  <dd className="mt-0.5 font-headline text-[1rem] font-black text-[#17221d]">
                    {formatCompactCurrency(averageTransaction)}
                  </dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#edf8f1] text-[#118850] ring-1 ring-[#d7ecd9]">
                  <PieChart className="size-5" strokeWidth={1.8} />
                </span>
                <div>
                  <dt className="text-[0.8rem] font-semibold text-[#647067]">
                    Dominasi Mode
                  </dt>
                  <dd className="mt-0.5 font-headline text-[1rem] font-black text-[#17221d]">
                    {currentPeriodVickrey + currentPeriodFixedPrice > 0
                      ? `${currentPeriodDominantMode} (${currentPeriodDominantPercent}%)`
                      : "Belum ada transaksi"}
                  </dd>
                </div>
              </div>
            </dl>
          </aside>

          {trendPoints.length === 0 ? (
            <EmptyState
              className="p-6"
              description="Transaksi lunas atau selesai akan membentuk tren nasional di area ini."
              icon={TrendingUp}
              title="Belum ada tren tervalidasi"
            />
          ) : (
            <div className="relative min-h-[15rem]">
              <svg
                aria-label="Grafik tren nilai transaksi tervalidasi"
                className="h-[15rem] w-full"
                preserveAspectRatio="none"
                role="img"
                viewBox={`0 0 ${dashboardChartWidth} ${dashboardChartHeight}`}
              >
                <text
                  fill="#53635d"
                  fontSize="11"
                  fontWeight="800"
                  x={dashboardChartFrame.left - 6}
                  y="16"
                >
                  Nilai (Rp Juta)
                </text>
                {amountTicks.map((tick) => (
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
                      fill="#53635d"
                      fontSize="11"
                      fontWeight="800"
                      textAnchor="end"
                      x={dashboardChartFrame.left - 12}
                      y={tick.y + 4}
                    >
                      {tick.displayValue}
                    </text>
                  </g>
                ))}
                <line
                  stroke="#d8e2dc"
                  strokeWidth="1.2"
                  x1={dashboardChartFrame.left}
                  x2={dashboardChartFrame.right}
                  y1={dashboardChartFrame.bottom}
                  y2={dashboardChartFrame.bottom}
                />

                {chartPoints.map((point, index) => {
                  const active = activeTrendIndex === index;
                  const xCenter = point.x;
                  const barWidth = Math.min(29, Math.max(19, slotWidth * 0.42));
                  const x = xCenter - barWidth / 2;
                  const vickreyAmount = chartVisibility.vickrey
                    ? getTrendVickreyAmount(point)
                    : 0;
                  const fixedPriceAmount = chartVisibility.fixedPrice
                    ? getTrendFixedPriceAmount(point)
                    : 0;
                  const totalAmount = vickreyAmount + fixedPriceAmount;
                  const totalHeight =
                    totalAmount > 0
                      ? Math.max(
                          (clampChartValue(totalAmount, amountAxisMax) /
                            amountAxisMax) *
                            chartHeight,
                          7,
                        )
                      : 0;
                  const fixedHeight =
                    totalAmount > 0
                      ? (fixedPriceAmount / totalAmount) * totalHeight
                      : 0;
                  const vickreyHeight = totalHeight - fixedHeight;
                  const totalY = dashboardChartFrame.bottom - totalHeight;
                  const vickreyY = dashboardChartFrame.bottom - vickreyHeight;
                  const hasStackedSegments =
                    fixedHeight > 0 && vickreyHeight > 0;
                  const darkSegmentY = hasStackedSegments
                    ? vickreyY - 0.35
                    : vickreyY;
                  const darkSegmentHeight = hasStackedSegments
                    ? vickreyHeight + 0.35
                    : vickreyHeight;

                  return (
                    <g key={point.label}>
                      {fixedHeight > 0 ? (
                        <rect
                          fill={active ? "#87ca7f" : "#9bd191"}
                          height={hasStackedSegments ? totalHeight : fixedHeight}
                          opacity={active ? 1 : 0.96}
                          rx="6"
                          width={barWidth}
                          x={x}
                          y={hasStackedSegments ? totalY : dashboardChartFrame.bottom - fixedHeight}
                        />
                      ) : null}
                      {vickreyHeight > 0 ? (
                        hasStackedSegments ? (
                          <path
                            d={makeBottomRoundedRectPath({
                              height: darkSegmentHeight,
                              radius: 6,
                              width: barWidth,
                              x,
                              y: darkSegmentY,
                            })}
                            fill={active ? "#00451f" : "#005626"}
                            opacity={active ? 1 : 0.98}
                          />
                        ) : (
                          <rect
                            fill={active ? "#00451f" : "#005626"}
                            height={vickreyHeight}
                            opacity={active ? 1 : 0.96}
                            rx="6"
                            width={barWidth}
                            x={x}
                            y={vickreyY}
                          />
                        )
                      ) : null}
                      <text
                        fill={active ? "#00563b" : "#465850"}
                        fontSize="11"
                        fontWeight={active ? "900" : "760"}
                        textAnchor="middle"
                        x={xCenter}
                        y="214"
                      >
                        {point.label}
                      </text>
                    </g>
                  );
                })}

                {activeTrendPoint ? (
                  <g>
                    <line
                      stroke="#f59e0b"
                      strokeDasharray="4 6"
                      strokeOpacity="0.32"
                      strokeWidth="1.5"
                      x1={activeTrendPoint.x}
                      x2={activeTrendPoint.x}
                      y1={dashboardChartFrame.top}
                      y2={dashboardChartFrame.bottom}
                    />
                  </g>
                ) : null}
              </svg>

              {chartPoints.map((point, index) => (
                <button
                  aria-label={`${point.label}: Vickrey ${formatFullCurrency(getTrendVickreyAmount(point))}, Fixed Price ${formatFullCurrency(getTrendFixedPriceAmount(point))}, Volume ${formatDashboardCount(point.volume)} transaksi`}
                  className="absolute rounded-lg outline-none transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:ring-2 focus-visible:ring-[#18a65a] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  key={`${point.label}-hotspot`}
                  onBlur={() => setActiveTrendIndex(null)}
                  onFocus={() => setActiveTrendIndex(index)}
                  onMouseEnter={() => setActiveTrendIndex(index)}
                  onMouseLeave={() => setActiveTrendIndex(null)}
                  style={{
                    height: `${(chartHeight / dashboardChartHeight) * 100}%`,
                    left: `${((dashboardChartFrame.left + slotWidth * index) / dashboardChartWidth) * 100}%`,
                    top: `${(dashboardChartFrame.top / dashboardChartHeight) * 100}%`,
                    width: `${(slotWidth / dashboardChartWidth) * 100}%`,
                  }}
                  type="button"
                />
              ))}

              {activeTrendPoint ? (
                <div
                  className="pointer-events-none absolute z-[3] w-[16.25rem] -translate-x-1/2 -translate-y-full rounded-[0.95rem] border border-[#cfe7d8] bg-white px-3.5 py-3 text-left shadow-[0_22px_50px_-30px_rgba(0,82,45,0.45)] ring-1 ring-white/70 transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  role="tooltip"
                  style={{
                    left: `clamp(7rem, ${activeTrendPoint.leftPercent}%, calc(100% - 7rem))`,
                    top: `clamp(8.4rem, calc(${activeTrendPoint.topPercent}% - 0.7rem), calc(100% - 0.5rem))`,
                  }}
                >
                  <div className="absolute left-1/2 top-full size-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-[#cfe7d8] bg-white" />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-[#6a7d73]">
                        {activeTrendPoint.label}
                      </p>
                      <p className="mt-1 font-headline text-[1.15rem] font-black leading-none text-[#00563b]">
                        {formatFullCurrency(activeTrendPoint.amount)}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#fff7e6] px-2.5 py-1 text-[0.68rem] font-black text-[#c97900]">
                      {formatDashboardCount(activeTrendPoint.volume)} trx
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 text-[0.75rem] font-bold text-[#52615d]">
                    <div className="flex items-center justify-between gap-3 rounded-[0.72rem] bg-[#f5faf7] px-2.5 py-2">
                      <span className="inline-flex items-center gap-2">
                        <span className="size-2.5 rounded-[0.18rem] bg-[#005626]" />
                        Vickrey
                      </span>
                      <span className="font-black text-[#00563b]">
                        {formatFullCurrency(getTrendVickreyAmount(activeTrendPoint))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-[0.72rem] bg-[#f6fbf5] px-2.5 py-2">
                      <span className="inline-flex items-center gap-2">
                        <span className="size-2.5 rounded-[0.18rem] bg-[#9bd191]" />
                        Fixed Price
                      </span>
                      <span className="font-black text-[#3f8d42]">
                        {formatFullCurrency(getTrendFixedPriceAmount(activeTrendPoint))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-[0.72rem] bg-[#fff9ef] px-2.5 py-2">
                      <span className="inline-flex items-center gap-2">
                        <span className="size-2.5 rounded-full border-2 border-[#f59e0b] bg-white" />
                        Volume
                      </span>
                      <span className="font-black text-[#c97900]">
                        {formatDashboardCount(activeTrendPoint.volume)} transaksi
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="h-full border border-[#d9e7df] bg-white">
          <CardHeader className="px-5 pb-2 pt-5">
            <CardTitle className="text-[1.02rem] leading-6">
              Status Kepatuhan Ekosistem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-5 pb-5 pt-1">
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

                return (
                  <div
                    className="relative overflow-hidden rounded-[0.72rem] py-2 pl-5 pr-2 transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[#f8fbf9]"
                    key={level.label}
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute left-0 top-2 h-[calc(100%-1rem)] w-1.5 rounded-r-full ${tone.rail}`}
                    />
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`size-2.5 shrink-0 rounded-full ${tone.dot}`}
                          />
                          <p className="text-[0.78rem] font-black leading-4 text-[#17221d]">
                            {level.label}
                          </p>
                        </div>
                        <p className="ml-[1.125rem] mt-0.5 text-[0.66rem] font-semibold leading-4 text-[#647067]">
                          {level.description}
                        </p>
                      </div>
                      <p className="shrink-0 font-headline text-base font-black leading-4 text-[#17221d]">
                        {level.count}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="h-full border border-[#d9e7df] bg-white">
          <CardHeader className="px-5 pb-2 pt-5">
            <CardTitle className="text-[1.02rem] leading-6">
              Leaderboard Kinerja Unit
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-1">
            {unitRows.length === 0 ? (
              <EmptyState
                className="p-5"
                description="Unit akan tampil setelah transaksi tervalidasi tercatat dari cabang terkait."
                icon={Building2}
                title="Belum ada kinerja unit yang tercatat"
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 md:divide-x md:divide-[#dfe8e3]">
                <div className="min-w-0 md:pr-4">
                  <div className="mb-4 flex h-8 items-center gap-1.5">
                    <TrendingUp
                      aria-hidden="true"
                      className="size-4 shrink-0 text-[#1faa55]"
                      strokeWidth={2.3}
                    />
                    <p className="min-w-0 whitespace-nowrap text-[0.74rem] font-black leading-none text-[#17221d] 2xl:text-[0.82rem]">
                      Top 3 Cabang{" "}
                      <span className="text-[0.65rem] font-semibold text-[#647067] 2xl:text-[0.74rem]">
                        (Nilai Transaksi Tertinggi)
                      </span>
                    </p>
                  </div>
                  <div className="grid gap-3">
                    {topTransactionUnitRows.map((row, index) => (
                      <div
                        className="grid min-h-8 grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-3"
                        key={`top-${row.id}`}
                      >
                        <span className="grid size-8 place-items-center rounded-full bg-[#daf5e1] text-[0.78rem] font-black text-[#0b7a3c] ring-1 ring-[#bcecc8]">
                          {index + 1}
                        </span>
                        <p className="min-w-0 truncate text-[0.82rem] font-semibold text-[#33463e]">
                          {row.unitName}
                        </p>
                        <p className="whitespace-nowrap text-right text-[0.82rem] font-black text-[#006747]">
                          {formatLeaderboardCurrency(
                            Number(row.validatedTransactionValue ?? 0),
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="min-w-0 md:pl-4">
                  <div className="mb-4 flex h-8 items-center gap-1.5">
                    <TrendingDown
                      aria-hidden="true"
                      className="size-4 shrink-0 text-[#ef4444]"
                      strokeWidth={2.3}
                    />
                    <p className="min-w-0 whitespace-nowrap text-[0.74rem] font-black leading-none text-[#17221d] 2xl:text-[0.82rem]">
                      Bottom 3 Cabang{" "}
                      <span className="text-[0.65rem] font-semibold text-[#647067] 2xl:text-[0.74rem]">
                        (Nilai Transaksi Terendah)
                      </span>
                    </p>
                  </div>
                  <div className="grid gap-3">
                    {bottomTransactionUnitRows.map((row, index) => (
                      <div
                        className="grid min-h-8 grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-3"
                        key={`bottom-${row.id}`}
                      >
                        <span className="grid size-8 place-items-center rounded-full bg-[#ffe1e1] text-[0.78rem] font-black text-[#dc2626] ring-1 ring-[#ffc9c9]">
                          {index + 1}
                        </span>
                        <p className="min-w-0 truncate text-[0.82rem] font-semibold text-[#33463e]">
                          {row.unitName}
                        </p>
                        <p className="whitespace-nowrap text-right text-[0.82rem] font-black text-[#1f2937]">
                          {formatLeaderboardCurrency(
                            Number(row.validatedTransactionValue ?? 0),
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
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
