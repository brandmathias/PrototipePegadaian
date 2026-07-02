"use client";

import Image from "next/image";
import Link from "next/link";
import {
  type FocusEvent as ReactFocusEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Ban,
  BarChart3,
  CheckCircle2,
  Pencil,
  Building2,
  CalendarClock,
  CalendarDays,
  CarFront,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  CreditCard,
  FileText,
  FileWarning,
  Gavel,
  Gem,
  Hash,
  Info,
  Landmark,
  ListChecks,
  Mail,
  Megaphone,
  Medal,
  MonitorSmartphone,
  MoreVertical,
  Package,
  Package2,
  PackagePlus,
  Printer,
  Phone,
  PieChart,
  Plus,
  RefreshCcw,
  RefreshCw,
  ReceiptText,
  Ruler,
  Search,
  SearchX,
  Scale,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldBan,
  ShoppingBag,
  Sparkles,
  LockKeyhole,
  Trophy,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
  UserCog,
  UserRound,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";

import { AdminPageHero } from "@/components/admin/admin-page-hero";
import { AdminSelect, type AdminSelectOption } from "@/components/admin/admin-select";
import { AdminBarangDetailMediaViewer } from "@/components/admin-unit/admin-barang-detail-media-viewer";
import { AdminLiveCountdown } from "@/components/admin/admin-live-countdown";
import {
  AdminUnitForm,
  DeactivateAdminButton,
} from "@/components/superadmin/admin-form";
import {
  ActivateRekeningButton,
  DeleteRekeningButton,
  RekeningForm,
} from "@/components/superadmin/rekening-form";
import {
  UnitForm,
} from "@/components/superadmin/unit-form";
import { HandoverProofCard } from "@/components/shared/handover-proof-card";
import { BankLogoMark, getBankDisplayName } from "@/components/shared/bank-logo";
import { CompactTransactionProgress } from "@/components/shared/compact-transaction-progress";
import { DetailActionLink } from "@/components/shared/detail-action-link";
import { MarketingPerformancePanel } from "@/components/shared/marketing-performance-panel";
import {
  ReportRangeDropdown,
  type ReportCustomRange,
  type ReportRangeOption,
} from "@/components/shared/report-range-dropdown";
import { SectionHeading } from "@/components/shared/section-heading";
import WelcomeBrushBadge from "@/components/shared/welcome-brush-badge";
import { TransactionReceiptDocument } from "@/components/shared/transaction-receipt-document";
import { TransactionReceiptInlinePrint } from "@/components/shared/transaction-receipt-inline-print";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { getBarangSpecificationRows } from "@/lib/admin-unit/specifications";
import type { LotInsights } from "@/lib/contracts/catalog";
import { formatAppDateTime } from "@/lib/timezone";
import { cn } from "@/lib/utils";

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
  items?: SuperAdminUnitBarangItem[];
};

export type SuperAdminUnitBarangItem = {
  id: string;
  code: string;
  name: string;
  category: string;
  imageUrl?: string | null;
  marketingModeLabel: string;
  operationalStatus: string;
  operationalTone: "amber" | "blue" | "emerald" | "red" | "slate";
  value: number;
};

export type SuperAdminUnitBarangDetailMedia = {
  id: string;
  type: string;
  url: string;
  fileName?: string;
};

export type SuperAdminUnitBarangMarketingSession = {
  id: string;
  lotId: string;
  lot: string;
  code?: string;
  category?: string;
  condition?: string;
  description?: string;
  unitName?: string | null;
  unitAddress?: string | null;
  status: string;
  mode: string;
  iteration?: number;
  totalIterations?: number;
  iterationHistory?: SuperAdminUnitBarangMarketingSession[];
  media?: SuperAdminUnitBarangDetailMedia[];
  primaryMedia?: SuperAdminUnitBarangDetailMedia | null;
  startsAt?: string | null;
  createdAt?: string;
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
  buyerEmail?: string | null;
  buyerPhone?: string | null;
  buyerNationalId?: string | null;
  paymentMethod?: string | null;
  proofUrl?: string | null;
  verifiedBy?: string | null;
  handoverProofUrl?: string | null;
  handoverProofUploadedAt?: string | null;
  handoverProofUploadedBy?: string | null;
  handoverComplaintAt?: string | null;
  handoverComplaintNote?: string | null;
  handoverAutoCompleteAt?: string | null;
  completionSource?: string | null;
  reference?: string | null;
  soldAt?: string | null;
  completedAt?: string | null;
  transactionCreatedAt?: string | null;
  paymentDeadline?: string | null;
  insights?: LotInsights | null;
  basePrice?: number | null;
  appraisalValue?: number | null;
  finalPrice?: number | null;
  winner?: string | null;
  visibility?: string;
  specifications?: Record<string, string> | null;
  note?: string;
  bids?: Array<{
    id: string;
    bidderId: string;
    bidderName: string;
    submittedAtLabel: string;
    amount?: number | null;
    isRevealed?: boolean;
    rank: number;
    isWinner: boolean;
    determinesFinalPrice: boolean;
  }>;
};

export type SuperAdminUnitBarangHistoryEntry = {
  id: string;
  barangId: string;
  actionLabel: string;
  actionKey: "input_baru" | "perpanjangan" | "ditebus" | "dipasarkan" | "terjual" | "gagal";
  note: string;
  actorName: string;
  createdAtLabel: string;
};

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

export type SuperAdminUnitBarangDetail = {
  unit: {
    id: string;
    code: string;
    name: string;
    address: string;
    status: string;
  };
  item: Record<string, any> & {
    id: string;
    code?: string;
    name?: string;
    category?: string;
    condition?: string;
    status?: string;
    media?: SuperAdminUnitBarangDetailMedia[];
    specifications?: Record<string, string>;
  };
  operationalStatus: string;
  operationalTone: SuperAdminUnitBarangItem["operationalTone"];
  marketing: SuperAdminUnitBarangMarketingSession | null;
  history: SuperAdminUnitBarangHistoryEntry[];
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

export type SuperAdminValidatedTrendRangeKey =
  | "week"
  | "month"
  | "year"
  | "last7"
  | "last30"
  | "last3Months"
  | "last12Months"
  | "yearToDate"
  | "allTime";

export type SuperAdminValidatedTrendEvent = {
  amount: number;
  occurredAt: string;
  marketingMode: string | null;
  transactionType: string | null;
};

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
    validatedTrendEvents?: SuperAdminValidatedTrendEvent[];
    validatedTrendRanges?: Partial<Record<SuperAdminValidatedTrendRangeKey, SuperAdminValidatedTrendRange>> &
      Record<"week" | "month" | "year", SuperAdminValidatedTrendRange>;
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

type SuperAdminRestrictionLevelFilter =
  | "Semua"
  | "Level 1"
  | "Level 2"
  | "Level 3"
  | "Berakhir";

const restrictionLevelFilters: SuperAdminRestrictionLevelFilter[] = [
  "Semua",
  "Level 1",
  "Level 2",
  "Level 3",
  "Berakhir",
];

const DAY_MS = 86_400_000;
const dashboardMonthLabels = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function getSuperadminInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getSuperadminRestrictionLevel(entry: SuperAdminBlacklistItem) {
  return Math.min(Math.max(Number(entry.total ?? 0), 0), 3);
}

function getRestrictionDurationDays(level: number) {
  if (level >= 3) return 365;
  if (level === 2) return 30;
  if (level === 1) return 7;

  return 0;
}

function getRestrictionLevelMeta(level: number) {
  if (level >= 3) {
    return {
      avatar: "bg-rose-50 text-rose-700 ring-rose-100",
      badge: "bg-red-600 text-white shadow-[0_14px_26px_-20px_rgba(220,38,38,0.72)]",
      label: "Level 3 (365 Hari)",
      progress: "bg-red-600"
    };
  }

  if (level === 2) {
    return {
      avatar: "bg-orange-50 text-orange-700 ring-orange-100",
      badge: "bg-orange-500 text-white shadow-[0_14px_26px_-20px_rgba(249,115,22,0.72)]",
      label: "Level 2 (30 Hari)",
      progress: "bg-orange-500"
    };
  }

  return {
    avatar: "bg-amber-50 text-amber-800 ring-amber-100",
    badge: "bg-amber-400 text-amber-950 shadow-[0_14px_26px_-20px_rgba(245,158,11,0.72)]",
    label: "Level 1 (7 Hari)",
    progress: "bg-amber-400"
  };
}

function getRestrictionProgress(entry: SuperAdminBlacklistItem, serverNow?: string) {
  if (!entry.countdownAt) return 100;

  const targetTime = new Date(entry.countdownAt).getTime();
  const nowTime = serverNow ? new Date(serverNow).getTime() : Date.now();

  if (Number.isNaN(targetTime) || Number.isNaN(nowTime)) return 100;

  const level = getSuperadminRestrictionLevel(entry);
  const durationMs = getRestrictionDurationDays(level) * DAY_MS;
  const remainingMs = Math.max(targetTime - nowTime, 0);

  if (durationMs <= 0) return remainingMs > 0 ? 100 : 0;

  return Math.min(Math.max((remainingMs / durationMs) * 100, 4), 100);
}

function matchesSuperadminRestrictionQuery(entry: SuperAdminBlacklistItem, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  return [entry.name, entry.email, entry.unit, entry.reason, entry.status, String(entry.total)]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalizedQuery));
}

function SuperAdminHeroPill({
  children,
  icon: Icon,
  tone = "default"
}: {
  children: ReactNode;
  icon?: LucideIcon;
  tone?: "danger" | "default";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-[0.72rem] font-bold uppercase tracking-[0.16em] shadow-[0_16px_34px_-28px_rgba(8,69,50,0.35)] ring-1 backdrop-blur",
        tone === "danger"
          ? "bg-rose-50/92 text-rose-700 ring-rose-200"
          : "bg-white/75 text-[#0a6a49] ring-[#8fd0a9]/65"
      )}
    >
      {Icon ? <Icon className="size-4" /> : null}
      {children}
    </span>
  );
}

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
const dashboardAmountAxisMax = 25_000_000;
const dashboardAmountTickValues = [5_000_000, 10_000_000, 15_000_000, 20_000_000, 25_000_000];
const dashboardTrendRangeOptions: Array<ReportRangeOption<SuperAdminValidatedTrendRangeKey>> = [
  { value: "last7", label: "7 Hari Terakhir", helper: "Rentang mingguan berjalan" },
  { value: "last30", label: "30 Hari Terakhir", helper: "Pergerakan harian" },
  { value: "last3Months", label: "3 Bulan Terakhir", helper: "Ringkasan bulanan" },
  { value: "last12Months", label: "12 Bulan Terakhir", helper: "Satu tahun ke belakang" },
  { value: "month", label: "Bulan Berlangsung", helper: "Default dashboard" },
  { value: "yearToDate", label: "Tahun Berjalan", helper: "Januari hingga bulan ini" },
  { value: "allTime", label: "Semua Waktu", helper: "Seluruh transaksi tervalidasi" },
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

function toDashboardDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDashboardDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function formatDashboardDayLabel(date: Date) {
  return `${date.getDate()} ${dashboardMonthLabels[date.getMonth()]}`;
}

function formatDashboardMonthLabel(date: Date) {
  return `${dashboardMonthLabels[date.getMonth()]} ${date.getFullYear()}`;
}

function createDashboardTrendPoint(label: string): SuperAdminValidatedTrendPoint {
  return {
    amount: 0,
    count: 0,
    fixedPriceAmount: 0,
    label,
    vickreyAmount: 0,
    volume: 0,
  };
}

function addEventToDashboardPoint(
  point: SuperAdminValidatedTrendPoint,
  event: SuperAdminValidatedTrendEvent,
) {
  const amount = Number(event.amount ?? 0);
  const mode = String(event.transactionType ?? event.marketingMode ?? "").toLowerCase();

  if (mode.includes("fixed")) {
    point.fixedPriceAmount = Number(point.fixedPriceAmount ?? 0) + amount;
  } else {
    point.vickreyAmount = Number(point.vickreyAmount ?? 0) + amount;
  }

  point.amount += amount;
  point.count += 1;
  point.volume = point.count;
}

function buildCustomDashboardTrendRange(
  events: SuperAdminValidatedTrendEvent[],
  range: ReportCustomRange,
): SuperAdminValidatedTrendRange {
  const start = parseDashboardDateKey(range.startDate);
  const end = parseDashboardDateKey(range.endDate);
  end.setHours(23, 59, 59, 999);
  const dayCount = Math.max(1, Math.round((end.getTime() - start.getTime()) / DAY_MS));
  const points =
    dayCount <= 31
      ? Array.from({ length: dayCount }, (_, index) => {
          const date = new Date(start);
          date.setDate(start.getDate() + index);

          return createDashboardTrendPoint(formatDashboardDayLabel(date));
        })
      : Array.from(
          { length: (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth() + 1 },
          (_, index) => {
            const date = new Date(start.getFullYear(), start.getMonth() + index, 1);
            return createDashboardTrendPoint(formatDashboardMonthLabel(date));
          },
        );

  for (const event of events) {
    const occurredAt = new Date(event.occurredAt);
    if (occurredAt < start || occurredAt > end) {
      continue;
    }

    const pointIndex =
      dayCount <= 31
        ? Math.floor((parseDashboardDateKey(toDashboardDateKey(occurredAt)).getTime() - start.getTime()) / DAY_MS)
        : (occurredAt.getFullYear() - start.getFullYear()) * 12 + occurredAt.getMonth() - start.getMonth();
    const point = points[pointIndex];
    if (point) {
      addEventToDashboardPoint(point, event);
    }
  }

  return {
    label: "Rentang Kustom",
    points,
    summary: summarizeDashboardTrend(points),
  };
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
    vickreyAmount >= fixedPriceAmount ? "Lelang Tertutup" : "Harga Tetap";
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

function buildChartTicks({
  formatter,
}: {
  formatter: (value: number) => string;
}) {
  return dashboardAmountTickValues.map((value) => {
    const ratio = value / dashboardAmountAxisMax;
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

function shouldShowDashboardAxisLabel(index: number, total: number) {
  if (total <= 8) {
    return true;
  }

  const maxLabels = total <= 12 ? 5 : 6;
  const step = Math.max(1, Math.ceil((total - 1) / (maxLabels - 1)));

  return index === 0 || index === total - 1 || index % step === 0;
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
  superAdminName,
}: SuperAdminMonitoringData & { serverNow?: string; superAdminName?: string }) {
  const [chartVisibility, setChartVisibility] = useState({
    vickrey: true,
    fixedPrice: true,
  });
  const [activeTrendRange, setActiveTrendRange] =
    useState<SuperAdminValidatedTrendRangeKey | "custom">("month");
  const [customTrendRange, setCustomTrendRange] =
    useState<ReportCustomRange | null>(null);
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
      month: { ...fallbackTrendRange, label: "Bulan Berlangsung" },
      year: fallbackTrendRange,
      last7: { ...fallbackTrendRange, label: "7 Hari Terakhir" },
      last30: { ...fallbackTrendRange, label: "30 Hari Terakhir" },
      last3Months: { ...fallbackTrendRange, label: "3 Bulan Terakhir" },
      last12Months: { ...fallbackTrendRange, label: "12 Bulan Terakhir" },
      yearToDate: { ...fallbackTrendRange, label: "Tahun Berjalan" },
      allTime: { ...fallbackTrendRange, label: "Semua Waktu" },
    } satisfies Record<
      SuperAdminValidatedTrendRangeKey,
      SuperAdminValidatedTrendRange
    >);
  const activePresetTrendRange: SuperAdminValidatedTrendRangeKey =
    activeTrendRange === "custom" ? "month" : activeTrendRange;
  const activeTrendRangeData =
    activeTrendRange === "custom" && customTrendRange
      ? buildCustomDashboardTrendRange(governance?.validatedTrendEvents ?? [], customTrendRange)
      : trendRanges[activePresetTrendRange] ?? trendRanges.month ?? trendRanges.year ?? fallbackTrendRange;
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
      ? "Lelang Tertutup"
      : "Harga Tetap");
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
  const amountAxisMax = dashboardAmountAxisMax;
  const amountTicks = buildChartTicks({
    formatter: formatAmountTick,
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
        <div className="relative min-h-[19.5rem] overflow-hidden bg-[#f8fbfc] sm:min-h-[21rem] lg:min-h-[22.5rem] pb-12 sm:pb-16 lg:pb-20">
          <Image
            alt="Gedung kantor untuk Dashboard Nasional Superadmin"
            className="pointer-events-none object-cover object-center"
            fill
            priority
            sizes="(min-width: 1024px) calc(100vw - 16rem), 100vw"
            src={SUPERADMIN_DASHBOARD_HERO_IMAGE}
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,#ffffff_0%,rgba(255,255,255,0.96)_24%,rgba(255,255,255,0.58)_49%,rgba(255,255,255,0.05)_100%)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.94)_86%,#ffffff_100%)]" />
          <div className="relative z-[1] px-4 pt-6 sm:px-6 sm:pt-7 lg:px-8 lg:pt-8">
            <div className="max-w-[45rem]">
              <div className="admin-hero__eyebrow">
                <div className="admin-hero__display-title">Dashboard</div>
                <div className="admin-hero__display-sub">Superadmin</div>
              </div>

              <div className="mb-4">
                <WelcomeBrushBadge />
              </div>

              <h1 className="mt-2 font-sans text-[2.25rem] font-black leading-[0.98] tracking-tight text-[#07593f] sm:text-[3.05rem] lg:text-[3.55rem]">
                Halo, {superAdminName ?? "Superadmin Nasional"}
              </h1>
              <p className="mt-4 max-w-[39rem] font-sans text-[0.98rem] font-semibold leading-7 text-[#647067] sm:text-[1.05rem]">
                Anda siap memantau kinerja unit, meninjau pelanggaran, dan
                mengendalikan keputusan lintas cabang dari satu pusat kendali
                yang ringkas.
              </p>
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
                  className="flex min-h-[5.85rem] items-center gap-4 rounded-[0.95rem] border border-[#dce6e1] bg-white/92 p-3.5 shadow-[0_18px_38px_-30px_rgba(15,23,42,0.28)] sm:min-h-[5.9rem] sm:p-4"
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
              <span className="size-2.5 rounded-full bg-[#005626]" />
              Lelang Tertutup (Rp)
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
              <span className="size-2.5 rounded-full bg-[#9bd191]" />
              Harga Tetap (Rp)
            </button>
          </div>

          <div className="flex xl:justify-end">
            <ReportRangeDropdown
              ariaLabel="Filter tren transaksi tervalidasi"
              customRange={customTrendRange}
              onApplyCustomRange={(nextRange) => {
                setCustomTrendRange(nextRange);
                setActiveTrendRange("custom");
                setActiveTrendIndex(null);
              }}
              onChange={(nextRange) => {
                setActiveTrendRange(nextRange);
                setCustomTrendRange(null);
                setActiveTrendIndex(null);
              }}
              options={dashboardTrendRangeOptions}
              value={activeTrendRange}
            />
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
                      stroke="#cbd8d0"
                      strokeDasharray="4 7"
                      strokeOpacity="0.78"
                      strokeWidth="1.15"
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
                  const showLabel =
                    active ||
                    shouldShowDashboardAxisLabel(index, chartPoints.length);
                  const labelWidth = Math.max(42, point.label.length * 6.2 + 18);

                  return (
                    <g key={point.label}>
                      {fixedHeight > 0 ? (
                        <rect
                          className="transition-[fill,opacity] duration-200 ease-[cubic-bezier(0.2,0,0,1)]"
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
                            className="transition-[fill,opacity] duration-200 ease-[cubic-bezier(0.2,0,0,1)]"
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
                            className="transition-[fill,opacity] duration-200 ease-[cubic-bezier(0.2,0,0,1)]"
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
                      {showLabel ? (
                        <>
                          {active ? (
                            <rect
                              fill="#ffffff"
                              height="22"
                              opacity="0.98"
                              rx="11"
                              stroke="#d7e7df"
                              width={labelWidth}
                              x={xCenter - labelWidth / 2}
                              y="201"
                            />
                          ) : null}
                          <text
                            fill={active ? "#00563b" : "#465850"}
                            fontSize="11"
                            fontWeight={active ? "900" : "760"}
                            textAnchor="middle"
                            x={xCenter}
                            y="216"
                          >
                            {point.label}
                          </text>
                        </>
                      ) : null}
                    </g>
                  );
                })}

                {activeTrendPoint ? (
                  <g>
                    <line
                      stroke="#f59e0b"
                      strokeDasharray="4 6"
                      strokeOpacity="0.4"
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
                  aria-label={`${point.label}: Lelang Tertutup ${formatFullCurrency(getTrendVickreyAmount(point))}, Harga Tetap ${formatFullCurrency(getTrendFixedPriceAmount(point))}, Volume ${formatDashboardCount(point.volume)} transaksi`}
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
                  className="pointer-events-none absolute z-[3] w-[16.25rem] -translate-x-1/2 -translate-y-full rounded-[0.95rem] border border-[#cfe7d8] bg-white px-3.5 py-3 text-left shadow-[0_22px_50px_-30px_rgba(0,82,45,0.45)] ring-1 ring-white/70 transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.2,0,0,1)]"
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
                        <span className="size-2.5 rounded-full bg-[#005626]" />
                        Lelang Tertutup
                      </span>
                      <span className="font-black text-[#00563b]">
                        {formatFullCurrency(getTrendVickreyAmount(activeTrendPoint))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-[0.72rem] bg-[#f6fbf5] px-2.5 py-2">
                      <span className="inline-flex items-center gap-2">
                        <span className="size-2.5 rounded-full bg-[#9bd191]" />
                        Harga Tetap
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
        title="Direktori unit terkait"
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
                className="min-h-11 rounded-xl border border-border/70 bg-white px-4 text-sm outline-none"
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

const unitDetailPageSizeOptions = [10, 20, 50] as const;
const unitDetailFilterAll = "Semua";
const unitDetailOperationalStatusOptions = [
  "Barang Jaminan",
  "Ditebus",
  "Sedang Dipasarkan",
  "Siap Dipasarkan",
  "Terjual",
] as const;
const unitDetailModeOptions = [
  { label: "Harga Tetap", value: "fixed_price" },
  { label: "Lelang Tertutup", value: "vickrey" },
] as const;

function normalizeUnitDetailOptionValue(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function formatUnitDetailCategory(value: string) {
  const normalized = normalizeUnitDetailOptionValue(value);

  if (normalized === "logam_mulia") {
    return "Logam Mulia";
  }

  return normalized
    .split("_")
    .filter(Boolean)
    .map((segment) => `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`)
    .join(" ");
}

function getSuperAdminSpecificationIcon(category: unknown, label: string) {
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

function getUnitDetailMarketingModeValue(value: string) {
  const normalized = normalizeUnitDetailOptionValue(value);

  if (normalized.includes("fixed") || normalized.includes("harga_tetap") || normalized === "tetap") {
    return "fixed_price";
  }

  if (normalized.includes("vickrey") || normalized.includes("lelang") || normalized.includes("tertutup")) {
    return "vickrey";
  }

  return "";
}

function getUnitDetailMarketingModeLabel(value: string) {
  const modeValue = getUnitDetailMarketingModeValue(value);
  return unitDetailModeOptions.find((option) => option.value === modeValue)?.label ?? value;
}

function getUnitDetailStatusToneClass(tone: SuperAdminUnitBarangItem["operationalTone"]) {
  if (tone === "amber") {
    return "bg-amber-50 text-amber-700 ring-amber-100";
  }
  if (tone === "red") {
    return "bg-rose-50 text-rose-700 ring-rose-100";
  }
  if (tone === "blue") {
    return "bg-blue-50 text-blue-700 ring-blue-100";
  }
  if (tone === "slate") {
    return "bg-slate-100 text-slate-700 ring-slate-200";
  }

  return "bg-emerald-50 text-emerald-700 ring-emerald-100";
}

function getUnitDetailDisplayStatus(status: string) {
  const normalizedStatus = normalizeUnitDetailOptionValue(status);

  if (
    ["bukti_diunggah", "menunggu_pembayaran", "menunggu_konfirmasi_langsung"].includes(
      normalizedStatus,
    )
  ) {
    return "Sedang Dipasarkan";
  }

  if (["ada_tindak_lanjut", "gagal", "ditolak_bukti"].includes(normalizedStatus)) {
    return "Siap Dipasarkan";
  }

  return status;
}

function getUnitDetailDisplayTone(
  status: string,
  fallbackTone: SuperAdminUnitBarangItem["operationalTone"],
) {
  const displayStatus = getUnitDetailDisplayStatus(status);

  if (displayStatus === "Barang Jaminan") return "amber";
  if (displayStatus === "Sedang Dipasarkan") return "blue";
  if (displayStatus === "Siap Dipasarkan") return "emerald";
  if (displayStatus === "Ditebus" || displayStatus === "Terjual") return "slate";

  return fallbackTone;
}

function getUnitDetailStatusDotClass(tone: SuperAdminUnitBarangItem["operationalTone"]) {
  if (tone === "amber") return "bg-amber-500";
  if (tone === "red") return "bg-rose-500";
  if (tone === "blue") return "bg-blue-500";
  if (tone === "slate") return "bg-slate-500";
  return "bg-emerald-500";
}

function getUnitTypeLabel(name: string) {
  if (/upc/i.test(name)) {
    return "Unit Pelayanan Cabang";
  }
  if (/cp/i.test(name)) {
    return "Cabang unit";
  }

  return "Unit terkait";
}

function getUnitDetailVisiblePages(currentPage: number, totalPages: number) {
  return Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (page) =>
      totalPages <= 5 ||
      page === 1 ||
      page === totalPages ||
      Math.abs(page - currentPage) <= 1,
  );
}

function SuperAdminUnitDetailStepNumber({ value }: { value: string }) {
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#006747] font-headline text-[0.78rem] font-black text-white shadow-[0_16px_30px_-22px_rgba(0,103,71,0.52)]">
      {value}
    </span>
  );
}

function SuperAdminUnitDetailSetupSection({
  children,
  description,
  icon: Icon,
  step,
  title,
}: {
  children: ReactNode;
  description: string;
  icon: LucideIcon;
  step: string;
  title: string;
}) {
  return (
    <section className="border-t border-[#edf2ee] first:border-t-0">
      <div className="flex flex-col gap-4 px-4 py-5 sm:px-5 lg:px-6">
        <div className="flex items-center gap-3 border-b border-[#edf2ee] pb-3">
          <SuperAdminUnitDetailStepNumber value={step} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Icon className="size-4 text-[#006747]" strokeWidth={2} />
              <h3 className="font-headline text-[0.98rem] font-black tracking-[-0.02em] text-[#13211c]">
                {title}
              </h3>
            </div>
            <p className="text-[0.72rem] font-semibold leading-5 text-black/42">
              {description}
            </p>
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}

function SuperAdminUnitDetailInfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-[1rem] border border-[#dfe8e3] bg-[#fbfcfa] px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
      <div className="flex items-start gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-[0.8rem] border border-[#d9e8df] bg-white text-[#006747]">
          <Icon className="size-4" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="text-[0.64rem] font-black uppercase tracking-[0.16em] text-black/36">
            {label}
          </p>
          <div className="mt-1 break-words text-[0.8rem] font-bold leading-5 text-[#13211c]">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

function SuperAdminUnitDetailEmptyLedger({
  description,
  icon: Icon,
  title,
}: {
  description: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="grid min-h-36 place-items-center px-4 py-7 text-center">
      <div className="max-w-sm">
        <span className="mx-auto grid size-10 place-items-center rounded-full bg-[#f2faf5] text-[#006747] ring-1 ring-[#d9e8df]">
          <Icon className="size-5" strokeWidth={2} />
        </span>
        <p className="mt-3 text-[0.84rem] font-black text-[#13211c]">{title}</p>
        <p className="mt-1 text-[0.72rem] font-semibold leading-5 text-black/42">
          {description}
        </p>
      </div>
    </div>
  );
}

function SuperAdminUnitDetailPopupRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-[0.95rem] border border-[#e4ece7] bg-[#fbfcfa] px-3.5 py-3">
      <div className="flex items-start gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-[0.8rem] border border-[#d9e8df] bg-white text-[#006747]">
          <Icon className="size-4" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-black/38">
            {label}
          </p>
          <div className="mt-1 break-words text-[0.82rem] font-bold leading-5 text-[#13211c]">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

function SuperAdminUnitDetailPopup({
  children,
  icon: Icon,
  onOpenChange,
  open,
  subtitle,
  title,
}: {
  children: ReactNode;
  icon: LucideIcon;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  subtitle: string;
  title: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenChange, open]);

  if (!mounted || !open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto overscroll-contain bg-[#081b14]/42 p-4 backdrop-blur-[2px] sm:p-6">
      <button
        aria-label="Tutup panel detail"
        className="absolute inset-0"
        onClick={() => onOpenChange(false)}
        type="button"
      />
      <div
        className="my-auto w-full max-w-xl py-8 sm:py-10"
        data-safe-floating-header-frame="true"
      >
      <section
        aria-label={title}
        aria-modal="true"
        className="toast-enter relative z-[121] w-full overflow-visible rounded-[1.75rem] border border-[#dfe8e3] bg-white shadow-[0_42px_120px_-52px_rgba(3,21,14,0.82),0_18px_38px_-28px_rgba(8,69,50,0.24)]"
        data-header-layout="floating-centered"
        role="dialog"
      >
        <div className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2">
          <span className="grid size-16 place-items-center rounded-full border-[5px] border-white bg-[#006747] text-white shadow-[0_18px_30px_-18px_rgba(0,103,71,0.7)]">
            <Icon className="size-6" strokeWidth={2.2} />
          </span>
        </div>
        <div className="relative overflow-hidden rounded-[inherit] bg-white px-5 pb-5 pt-11 sm:px-7 sm:pb-6 sm:pt-12">
          <button
            aria-label="Tutup panel detail"
            className="absolute right-4 top-4 grid size-9 place-items-center rounded-lg text-slate-400 transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-slate-100 hover:text-slate-700 active:scale-[0.98]"
            onClick={() => onOpenChange(false)}
            type="button"
          >
            <X className="size-4.5" strokeWidth={2.2} />
          </button>
          <div className="mx-auto max-w-md text-center">
            <h2 className="text-center font-headline text-[1.35rem] font-black tracking-tight text-[#15231d] sm:text-[1.5rem]">
              {title}
            </h2>
            <p className="mt-2 text-center text-[0.82rem] font-semibold leading-6 text-slate-500">
              {subtitle}
            </p>
          </div>
          <div className="mt-5 grid gap-3 border-t border-[#edf2ee] pt-5 sm:grid-cols-2">
            {children}
          </div>
        </div>
      </section>
      </div>
    </div>,
    document.body,
  );
}

function SuperAdminUnitDetailAccountLedger({
  accounts,
  unitId,
}: {
  accounts: SuperAdminUnitAccount[];
  unitId: string;
}) {
  const [previewAccount, setPreviewAccount] = useState<SuperAdminUnitAccount | null>(null);

  return (
    <>
      <div className="min-w-0 overflow-hidden rounded-[1rem] border border-[#dfe8e3] bg-white">
        <div className="border-b border-[#edf2ee] bg-[#fbfcfa] px-4 py-3 text-[0.66rem] font-black uppercase tracking-[0.18em] text-black/40">
          Daftar Rekening Terdaftar ({accounts.length})
        </div>
        <div className="hidden grid-cols-[1fr_1fr_1.15fr_5.75rem] gap-3 border-b border-[#edf2ee] px-4 py-2 text-[0.64rem] font-black uppercase tracking-[0.14em] text-black/38 md:grid">
          <span>Bank</span>
          <span>Nomor Rekening</span>
          <span>Nama Pemilik</span>
          <span className="text-right">Aksi</span>
        </div>
        {accounts.length === 0 ? (
          <SuperAdminUnitDetailEmptyLedger
            description="Rekening yang ditambahkan akan tampil sebagai ledger audit."
            icon={WalletCards}
            title="Belum ada rekening unit"
          />
        ) : (
          <div className="divide-y divide-[#edf2ee]">
            {accounts.map((account) => (
              <div
                className="grid gap-3 px-4 py-3 text-[0.78rem] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#f8fbf8] md:grid-cols-[1fr_1fr_1.15fr_5.75rem] md:items-center md:gap-3"
                key={account.id}
              >
                <div className="flex min-w-0 items-center gap-2 font-black text-[#13211c]">
                  <BankLogoMark
                    bankName={account.bankName}
                    className="h-7 w-10 justify-start rounded-none bg-transparent"
                    imageClassName="max-h-5 max-w-10"
                    loading="lazy"
                    sizes="40px"
                  />
                  <span className="truncate">{getBankDisplayName(account.bankName)}</span>
                </div>
                <p className="flex min-w-0 items-center justify-between gap-3 rounded-[0.85rem] bg-[#f8fbf8] px-3 py-2 font-mono font-bold text-black/58 md:block md:rounded-none md:bg-transparent md:p-0">
                  <span className="font-body text-[0.62rem] font-black uppercase tracking-[0.14em] text-black/36 md:hidden">Rekening</span>
                  <span className="min-w-0 truncate">{account.accountNumber}</span>
                </p>
                <p className="flex min-w-0 items-center justify-between gap-3 rounded-[0.85rem] bg-[#f8fbf8] px-3 py-2 font-semibold text-black/55 md:block md:rounded-none md:bg-transparent md:p-0">
                  <span className="font-body text-[0.62rem] font-black uppercase tracking-[0.14em] text-black/36 md:hidden">Pemilik</span>
                  <span className="min-w-0 truncate text-right md:text-left">{account.accountHolder}</span>
                </p>
                <div className="flex justify-start gap-1.5 md:justify-end">
                  <button
                    aria-label={`Lihat detail rekening ${account.bankName}`}
                    className="grid size-10 place-items-center rounded-xl text-[#006747] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#edf7ef] active:scale-[0.98] md:size-8"
                    onClick={() => setPreviewAccount(account)}
                    type="button"
                  >
                    <Eye className="size-4" />
                  </button>
                  <DeleteRekeningButton account={account} unitId={unitId} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <SuperAdminUnitDetailPopup
        icon={WalletCards}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setPreviewAccount(null);
          }
        }}
        open={Boolean(previewAccount)}
        subtitle="Informasi rekening operasional yang sudah tersimpan pada unit ini."
        title="Detail Rekening Unit"
      >
        <SuperAdminUnitDetailPopupRow icon={Landmark} label="Bank" value={previewAccount?.bankName ?? "-"} />
        <SuperAdminUnitDetailPopupRow icon={CreditCard} label="Nomor Rekening" value={previewAccount?.accountNumber ?? "-"} />
        <SuperAdminUnitDetailPopupRow icon={UserRound} label="Nama Pemilik" value={previewAccount?.accountHolder ?? "-"} />
        <SuperAdminUnitDetailPopupRow icon={Building2} label="Cabang" value={previewAccount?.branch || "-"} />
      </SuperAdminUnitDetailPopup>
    </>
  );
}

function SuperAdminUnitDetailAdminLedger({
  admins,
}: {
  admins: SuperAdminUnitDetail["admins"];
}) {
  const [previewAdmin, setPreviewAdmin] = useState<SuperAdminUnitDetail["admins"][number] | null>(null);

  return (
    <>
      <div className="min-w-0 overflow-hidden rounded-[1rem] border border-[#dfe8e3] bg-white">
        <div className="border-b border-[#edf2ee] bg-[#fbfcfa] px-4 py-3 text-[0.66rem] font-black uppercase tracking-[0.18em] text-black/40">
          Daftar Admin Unit Terdaftar ({admins.length})
        </div>
        <div className="hidden grid-cols-[1.1fr_1.15fr_0.9fr_5.75rem] gap-3 border-b border-[#edf2ee] px-4 py-2 text-[0.64rem] font-black uppercase tracking-[0.14em] text-black/38 md:grid">
          <span>Admin</span>
          <span>Email</span>
          <span>Telepon</span>
          <span className="text-right">Aksi</span>
        </div>
        {admins.length === 0 ? (
          <SuperAdminUnitDetailEmptyLedger
            description="Admin penanggung jawab yang ditambahkan akan tampil di sini."
            icon={UserCog}
            title="Belum ada admin unit"
          />
        ) : (
          <div className="divide-y divide-[#edf2ee]">
            {admins.map((admin) => (
              <div
                className="grid gap-3 px-4 py-3 text-[0.78rem] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#f8fbf8] md:grid-cols-[1.1fr_1.15fr_0.9fr_5.75rem] md:items-center md:gap-3"
                key={admin.id}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full border border-[#bce9cf] bg-[#ecfff3] font-headline text-[0.68rem] font-black text-[#006747]">
                    {getSuperAdminInitials(admin.name)}
                  </span>
                  <span className="truncate font-black text-[#13211c]">{admin.name}</span>
                </div>
                <p className="flex min-w-0 items-center justify-between gap-3 rounded-[0.85rem] bg-[#f8fbf8] px-3 py-2 font-semibold text-black/50 md:justify-start md:rounded-none md:bg-transparent md:p-0">
                  <span className="font-body text-[0.62rem] font-black uppercase tracking-[0.14em] text-black/36 md:hidden">Email</span>
                  <span className="flex min-w-0 items-center gap-1.5">
                  <Mail className="size-3.5 shrink-0 text-[#006747]" />
                  <span className="truncate">{admin.email}</span>
                  </span>
                </p>
                <p className="flex min-w-0 items-center justify-between gap-3 rounded-[0.85rem] bg-[#f8fbf8] px-3 py-2 font-semibold text-black/46 md:justify-start md:rounded-none md:bg-transparent md:p-0">
                  <span className="font-body text-[0.62rem] font-black uppercase tracking-[0.14em] text-black/36 md:hidden">Telepon</span>
                  <span className="flex min-w-0 items-center gap-1.5">
                  <Phone className="size-3.5 shrink-0 text-[#006747]" />
                  <span className="truncate">{admin.phone || "-"}</span>
                  </span>
                </p>
                <div className="flex justify-start gap-1.5 md:justify-end">
                  <button
                    aria-label={`Lihat detail admin ${admin.name}`}
                    className="grid size-10 place-items-center rounded-xl text-[#006747] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#edf7ef] active:scale-[0.98] md:size-8"
                    onClick={() => setPreviewAdmin(admin)}
                    type="button"
                  >
                    <Eye className="size-4" />
                  </button>
                  <DeactivateAdminButton
                    adminId={admin.id}
                    adminName={admin.name}
                    compact
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <SuperAdminUnitDetailPopup
        icon={UserCog}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setPreviewAdmin(null);
          }
        }}
        open={Boolean(previewAdmin)}
        subtitle="Informasi admin penanggung jawab yang sudah terhubung ke unit ini."
        title="Detail Admin Unit"
      >
        <SuperAdminUnitDetailPopupRow icon={UserRound} label="Nama Admin" value={previewAdmin?.name ?? "-"} />
        <SuperAdminUnitDetailPopupRow icon={Mail} label="Email" value={previewAdmin?.email ?? "-"} />
        <SuperAdminUnitDetailPopupRow icon={Phone} label="Nomor Telepon" value={previewAdmin?.phone || "-"} />
      </SuperAdminUnitDetailPopup>
    </>
  );
}

function SuperAdminUnitInventorySection({
  items,
  unit,
}: {
  items: SuperAdminUnitBarangItem[];
  unit: SuperAdminUnitDetail;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(unitDetailFilterAll);
  const [statusFilter, setStatusFilter] = useState(unitDetailFilterAll);
  const [modeFilter, setModeFilter] = useState(unitDetailFilterAll);
  const [pageSize, setPageSize] = useState<(typeof unitDetailPageSizeOptions)[number]>(10);
  const [currentPage, setCurrentPage] = useState(1);
  const categoryOptions = useMemo(() => {
    const categoryMap = new Map<string, string>();

    items.forEach((item) => {
      const value = normalizeUnitDetailOptionValue(item.category);
      if (value && !categoryMap.has(value)) {
        categoryMap.set(value, formatUnitDetailCategory(item.category));
      }
    });

    return [
      { label: "Semua Kategori", value: unitDetailFilterAll },
      ...Array.from(categoryMap, ([value, label]) => ({ label, value })).sort((left, right) =>
        left.label.localeCompare(right.label, "id-ID"),
      ),
    ];
  }, [items]);
  const statusOptions = useMemo(
    () => [
      { label: "Semua Status", value: unitDetailFilterAll },
      ...unitDetailOperationalStatusOptions.map((status) => ({ label: status, value: status })),
    ],
    [],
  );
  const modeOptions = useMemo(
    () => [
      { label: "Semua Mode", value: unitDetailFilterAll },
      ...unitDetailModeOptions,
    ],
    [],
  );
  const filteredItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !normalizedQuery ||
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.code.toLowerCase().includes(normalizedQuery);
      const matchesCategory =
        categoryFilter === unitDetailFilterAll ||
        normalizeUnitDetailOptionValue(item.category) === categoryFilter;
      const matchesStatus =
        statusFilter === unitDetailFilterAll ||
        getUnitDetailDisplayStatus(item.operationalStatus) === statusFilter;
      const matchesMode =
        modeFilter === unitDetailFilterAll ||
        getUnitDetailMarketingModeValue(item.marketingModeLabel) === modeFilter;

      return matchesSearch && matchesCategory && matchesStatus && matchesMode;
    });
  }, [categoryFilter, items, modeFilter, searchQuery, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const visiblePages = getUnitDetailVisiblePages(currentPage, totalPages);
  const currentPageStart =
    filteredItems.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const currentPageEnd = Math.min(currentPage * pageSize, filteredItems.length);
  const collateralCount = items.filter(
    (item) => getUnitDetailDisplayStatus(item.operationalStatus) === "Barang Jaminan",
  ).length;
  const readyCount = items.filter(
    (item) => getUnitDetailDisplayStatus(item.operationalStatus) === "Siap Dipasarkan",
  ).length;
  const marketedCount = items.filter(
    (item) => getUnitDetailDisplayStatus(item.operationalStatus) === "Sedang Dipasarkan",
  ).length;
  const soldCount = items.filter(
    (item) => getUnitDetailDisplayStatus(item.operationalStatus) === "Terjual",
  ).length;
  const unitDetailMetrics = [
    {
      label: "Barang Jaminan",
      value: collateralCount,
      icon: Clock3,
      iconClass: "bg-amber-50 text-amber-600 ring-amber-100",
      filter: "Barang Jaminan",
    },
    {
      label: "Siap Dipasarkan",
      value: readyCount,
      icon: Package,
      iconClass: "bg-emerald-50 text-emerald-700 ring-emerald-100",
      filter: "Siap Dipasarkan",
    },
    {
      label: "Sedang Dipasarkan",
      value: marketedCount,
      icon: Megaphone,
      iconClass: "bg-blue-50 text-blue-700 ring-blue-100",
      filter: "Sedang Dipasarkan",
    },
    {
      label: "Terjual",
      value: soldCount,
      icon: BadgeCheck,
      iconClass: "bg-slate-100 text-slate-700 ring-slate-200",
      filter: "Terjual",
    },
  ];
  const resetFilters = () => {
    setSearchQuery("");
    setCategoryFilter(unitDetailFilterAll);
    setStatusFilter(unitDetailFilterAll);
    setModeFilter(unitDetailFilterAll);
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, modeFilter, pageSize, searchQuery, statusFilter]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  return (
    <section className="overflow-hidden rounded-[1.45rem] border border-[#dfe8e3] bg-white shadow-[0_30px_90px_-74px_rgba(8,69,50,0.34)]">
      <div className="border-b border-[#edf2ee] bg-[linear-gradient(135deg,#fbfcfa_0%,#f4faf6_100%)] px-4 py-5 sm:px-5 lg:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-[1rem] border border-[#cde7da] bg-[#ecfff3] text-[#006747]">
              <Package2 className="size-5" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-[#006747]">
                Detail Inventori
              </p>
              <h3 className="mt-1 font-headline text-[1.38rem] font-black tracking-[-0.04em] text-[#13211c]">
                Daftar Barang Unit
              </h3>
              <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-black/52">
                Daftar lengkap barang pada {unit.name}, termasuk status operasional, mode pemasaran, nilai barang, dan akses detail setiap barang.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-[0.72rem] font-bold text-[#52615d]">
            <span className="rounded-full bg-white px-3 py-1 ring-1 ring-[#dfeae4]">
              {formatDashboardCount(items.length)} barang tercatat
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 lg:p-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {unitDetailMetrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <button
                aria-label={`Ringkasan ${metric.label}`}
                className="flex items-center gap-4 rounded-xl border border-[#dfe8e2] bg-white p-4 text-left shadow-[0_20px_48px_-44px_rgba(8,69,50,0.44)] outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                key={metric.label}
                onClick={() => setStatusFilter(metric.filter)}
                type="button"
              >
                <span className="flex min-w-0 items-center gap-4">
                  <span
                    className={cn(
                      "grid size-12 shrink-0 place-items-center rounded-full ring-1",
                      metric.iconClass,
                    )}
                  >
                    <Icon className="size-5" strokeWidth={1.9} />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-headline text-3xl font-black leading-none tracking-[-0.04em] text-[#13211c]">
                      {formatDashboardCount(metric.value)}
                    </span>
                    <span className="mt-1 block text-xs font-semibold text-[#536279]">
                      {metric.label}
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 rounded-[1.35rem] border border-[#edf2ee] bg-[linear-gradient(180deg,#fffefb,#fbfcfa)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.86)]">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#536279]" />
              <input
                aria-label="Cari nama barang atau ID barang"
                className="h-12 w-full rounded-[1.15rem] border border-[#d8e4de] bg-white pl-11 pr-4 text-sm font-semibold text-[#273954] shadow-[0_14px_30px_-28px_rgba(8,69,50,0.32)] outline-none transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] placeholder:text-[#8a97a8] focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari nama barang atau ID barang..."
                value={searchQuery}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(12.5rem,1fr)_minmax(13.5rem,1fr)_minmax(12.5rem,1fr)_auto]">
              {[
                {
                  label: "Kategori Barang",
                  value: categoryFilter,
                  onChange: setCategoryFilter,
                  options: categoryOptions,
                },
                {
                  label: "Status Operasional",
                  value: statusFilter,
                  onChange: setStatusFilter,
                  options: statusOptions,
                },
                {
                  label: "Mode Pemasaran",
                  value: modeFilter,
                  onChange: setModeFilter,
                  options: modeOptions,
                },
              ].map((filter) => (
                <AdminSelect
                  ariaLabel={filter.label}
                  className="w-full"
                  key={filter.label}
                  onValueChange={filter.onChange}
                  options={filter.options}
                  value={filter.value}
                />
              ))}

              <button
                className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-[1.15rem] px-4 text-sm font-bold text-[#536279] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white hover:text-[#00563b] active:scale-[0.98]"
                onClick={resetFilters}
                type="button"
              >
                <RefreshCw className="size-4" />
                Reset Filter
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-[#dfe8e2]">
          {filteredItems.length === 0 ? (
            <EmptyState
              className="p-8"
              description="Tidak ada barang yang sesuai dengan pencarian atau filter saat ini."
              icon={SearchX}
              title="Barang tidak ditemukan"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#dfe8e2] bg-[#fbfcfb] text-[0.68rem] font-black uppercase tracking-[0.14em] text-[#435476]">
                    <th className="w-16 px-5 py-3.5" scope="col">
                      No
                    </th>
                    <th className="w-24 px-4 py-3.5" scope="col">
                      Gambar
                    </th>
                    <th className="px-4 py-3.5" scope="col">
                      Nama Barang & ID Barang
                    </th>
                    <th className="px-4 py-3.5 text-center" scope="col">
                      Kategori
                    </th>
                    <th className="px-4 py-3.5 text-center" scope="col">
                      Mode Pemasaran
                    </th>
                    <th className="px-4 py-3.5 text-right" scope="col">
                      Nilai Barang
                    </th>
                    <th className="px-4 py-3.5 text-center" scope="col">
                      Status Operasional
                    </th>
                    <th className="px-5 py-3.5 text-center" scope="col">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf2ee] bg-white">
                  {paginatedItems.map((item, index) => {
                    const operationalStatus = getUnitDetailDisplayStatus(item.operationalStatus);
                    const operationalTone = getUnitDetailDisplayTone(
                      item.operationalStatus,
                      item.operationalTone,
                    );

                    return (
                      <tr
                      className="transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[#f8fbf9]"
                      key={item.id}
                    >
                      <td className="px-5 py-3.5 font-semibold text-[#273954]">
                        {formatDashboardCount(currentPageStart + index)}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="grid size-12 place-items-center overflow-hidden rounded-lg border border-[#dfe8e2] bg-[#f5faf7]">
                          {item.imageUrl ? (
                            <img
                              alt={item.name}
                              className="size-full object-cover"
                              src={item.imageUrl}
                            />
                          ) : (
                            <Package className="size-5 text-[#7b9186]" strokeWidth={1.8} />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold leading-tight text-[#13211c]">
                          {item.name}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-[#536279]">
                          ({item.code})
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-center font-semibold text-[#273954]">
                        {formatUnitDetailCategory(item.category)}
                      </td>
                      <td className="px-4 py-3.5 text-center font-semibold text-[#273954]">
                        {getUnitDetailMarketingModeLabel(item.marketingModeLabel)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-[#273954]">
                        {formatFullCurrency(item.value)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1",
                            getUnitDetailStatusToneClass(operationalTone),
                          )}
                        >
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              getUnitDetailStatusDotClass(operationalTone),
                            )}
                          />
                          {operationalStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-2">
                          <DetailActionLink
                            className="min-h-9 rounded-lg px-3 text-xs"
                            href={`/superadmin/unit/${unit.id}/barang/${item.id}`}
                          />
                          <button
                            aria-label={`Menu ${item.name}`}
                            className="grid size-9 place-items-center rounded-lg text-[#8a97a8] transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[#f5faf7] hover:text-[#273954]"
                            type="button"
                          >
                            <MoreVertical className="size-4" />
                          </button>
                        </div>
                      </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-3 text-sm font-semibold text-[#536279] lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <p>
              Menampilkan {formatDashboardCount(currentPageStart)}-{formatDashboardCount(currentPageEnd)} dari{" "}
              {formatDashboardCount(filteredItems.length)} barang
            </p>
            <label className="inline-flex items-center gap-2 text-xs font-bold text-[#536279]">
              Tampilkan
              <AdminSelect
                ariaLabel="Jumlah barang per halaman"
                className="w-[6.25rem]"
                onValueChange={(value) =>
                  setPageSize(Number(value) as (typeof unitDetailPageSizeOptions)[number])
                }
                options={unitDetailPageSizeOptions.map((option) => ({
                  label: String(option),
                  value: option,
                }))}
                placement="top"
                size="compact"
                value={pageSize}
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              aria-label="Halaman sebelumnya"
              className="grid size-9 place-items-center rounded-lg border border-[#d8e4de] bg-white text-[#536279] shadow-[0_12px_28px_-24px_rgba(8,69,50,0.42)] transition-[transform,border-color,background-color,color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-[#afd4bd] hover:bg-[#f8fbf9] hover:text-[#00563b] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              type="button"
            >
              <ChevronLeft className="size-4" />
            </button>
            {visiblePages.map((page, index) => {
              const previousPage = visiblePages[index - 1];
              const shouldShowGap = previousPage !== undefined && page - previousPage > 1;

              return (
                <span className="inline-flex items-center gap-1.5" key={page}>
                  {shouldShowGap ? (
                    <span className="grid size-9 place-items-center text-[#8a97a8]">
                      ...
                    </span>
                  ) : null}
                  <button
                    aria-current={currentPage === page ? "page" : undefined}
                    className={cn(
                      "grid size-9 place-items-center rounded-lg border text-sm font-black tabular-nums shadow-[0_12px_28px_-24px_rgba(8,69,50,0.42)] transition-[transform,border-color,background-color,color,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 active:scale-[0.98]",
                      currentPage === page
                        ? "border-[#007a4d] bg-[#007a4d] text-white shadow-[0_18px_34px_-24px_rgba(0,122,77,0.64)]"
                        : "border-[#d8e4de] bg-white text-[#273954] hover:border-[#afd4bd] hover:bg-[#f8fbf9] hover:text-[#00563b]",
                    )}
                    onClick={() => setCurrentPage(page)}
                    type="button"
                  >
                    {page}
                  </button>
                </span>
              );
            })}
            <button
              aria-label="Halaman berikutnya"
              className="grid size-9 place-items-center rounded-lg border border-[#d8e4de] bg-white text-[#536279] shadow-[0_12px_28px_-24px_rgba(8,69,50,0.42)] transition-[transform,border-color,background-color,color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-[#afd4bd] hover:bg-[#f8fbf9] hover:text-[#00563b] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              type="button"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
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
    <div className="space-y-5 md:space-y-6">
      <Link
        className="inline-flex items-center gap-2 text-[0.72rem] font-black uppercase tracking-[0.12em] text-[#0a6a49] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-[#064b35]"
        href="/superadmin/monitoring-unit"
      >
        <ArrowLeft className="size-3.5" />
        Kembali ke Monitoring Unit
      </Link>

      <AdminPageHero
        description={`Pantau seluruh barang pada ${unit.name} di ${unit.address}, termasuk status operasional, mode pemasaran, nilai barang, dan detail setiap barang.`}
        eyebrow="Superadmin / Monitoring Unit / Detail Unit"
        icon={ShieldCheck}
        rightRail={
          <>
            <SuperAdminHeroPill icon={Building2}>{unit.code}</SuperAdminHeroPill>
            <SuperAdminHeroPill icon={BadgeCheck}>{unit.status}</SuperAdminHeroPill>
          </>
        }
        title="Detail Inventori Unit"
      />

      <SuperAdminUnitInventorySection items={unit.items ?? []} unit={unit} />
    </div>
  );
}

export function SuperAdminManagementUnitDetailPage({
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

  const unitLabel = `${unit.name} (${unit.code})`;
  const unitTypeLabel = getUnitTypeLabel(`${unit.name} ${unit.code}`);
  const unitOption = [{ id: unit.id, name: unit.name, code: unit.code }];
  const profileFormId = `superadmin-unit-profile-${unit.id}`;

  return (
    <div className="space-y-5 md:space-y-6">
      <Link
        className="inline-flex items-center gap-2 text-[0.72rem] font-black uppercase tracking-[0.12em] text-[#0a6a49] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-[#064b35]"
        href="/superadmin/manajemen-unit"
      >
        <ArrowLeft className="size-3.5" />
        Kembali ke Daftar Unit Pelaksana
      </Link>

      <AdminPageHero
        description="Perbarui profil unit, tambah rekening operasional, dan tambah admin penanggung jawab dari data unit yang sudah tersimpan."
        eyebrow="Superadmin / Detail Unit"
        icon={Building2}
        title="Detail & Edit Unit Pelaksana"
      />

      <Card className="overflow-hidden rounded-[1.45rem] border border-[#dfe8e3] bg-white shadow-[0_30px_90px_-74px_rgba(8,69,50,0.34)]">
        <CardContent className="p-0">
          <SuperAdminUnitDetailSetupSection
            description="Informasi unit sudah terisi dari database dan bisa diedit tanpa membuat unit baru."
            icon={Building2}
            step="01"
            title="Profil & Lokasi Unit"
          >
            <div className="mb-4 flex flex-wrap items-center gap-2 text-[0.72rem] font-bold text-black/48">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e5eee9] bg-[#fbfcfa] px-2.5 py-1 text-[#475569]">
                <Building2 className="size-3.5 text-[#006747]" />
                {unitLabel}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e5eee9] bg-white px-2.5 py-1 text-[#475569]">
                <Info className="size-3.5 text-[#006747]" />
                {unitTypeLabel}
              </span>
            </div>
            <UnitForm
              formId={profileFormId}
              initialValue={{
                address: unit.address,
                code: unit.code,
                isActive: unit.isActive,
                name: unit.name,
              }}
              mode="update"
              showSubmitButton={false}
              showTitle={false}
              submitLabel="Simpan Perubahan"
              unitId={unit.id}
            />
          </SuperAdminUnitDetailSetupSection>

          <SuperAdminUnitDetailSetupSection
            description="Tambah rekening operasional baru dari halaman detail dan pantau rekening yang sudah tersimpan."
            icon={Landmark}
            step="02"
            title="Rekening Operasional Cabang"
          >
            <div className="grid gap-5 xl:grid-cols-12 xl:gap-7">
              <div className="xl:col-span-5">
                <RekeningForm
                  showActiveToggle={false}
                  showTitle={false}
                  submitLabel="Tambah Rekening"
                  unitId={unit.id}
                />
              </div>
              <div className="xl:col-span-7">
                <SuperAdminUnitDetailAccountLedger accounts={unit.accounts} unitId={unit.id} />
              </div>
            </div>
          </SuperAdminUnitDetailSetupSection>

          <SuperAdminUnitDetailSetupSection
            description="Admin unit bisa ditambahkan langsung untuk unit ini tanpa kembali ke direktori admin."
            icon={UserCog}
            step="03"
            title="Otoritas Admin Penanggung Jawab"
          >
            <div className="grid gap-5 xl:grid-cols-12 xl:gap-7">
              <div className="xl:col-span-5">
                <AdminUnitForm
                  showNationalIdField
                  showTitle={false}
                  showUnitField={false}
                  submitLabel="Tambah Admin"
                  units={unitOption}
                />
              </div>
              <div className="xl:col-span-7">
                <SuperAdminUnitDetailAdminLedger admins={unit.admins} />
              </div>
            </div>
          </SuperAdminUnitDetailSetupSection>
        </CardContent>
      </Card>

      <div className="safe-sticky-actions sticky z-20 rounded-[1.25rem] border border-[#dfe8e3] bg-white/96 px-3 py-3 shadow-[0_24px_70px_-48px_rgba(8,69,50,0.46),inset_0_1px_0_rgba(255,255,255,0.92)] backdrop-blur-xl sm:px-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-2 text-[0.72rem] font-bold text-black/48">
            <Info className="size-4 shrink-0 text-[#64756e]" />
            <span className="min-w-0">
              Perubahan profil unit disimpan melalui tombol ini. Rekening dan admin baru memakai tombol tambah pada section masing-masing.
            </span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Link
              className="inline-flex min-h-11 w-full items-center justify-center rounded-[0.95rem] border border-[#dfe8e3] bg-white px-5 text-center text-[0.78rem] font-black text-[#475569] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#fbfcfa] active:scale-[0.98] sm:w-auto"
              href="/superadmin/manajemen-unit"
            >
              Kembali
            </Link>
            <Button
              className="min-h-11 w-full rounded-[0.95rem] px-5 text-[0.78rem] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] sm:w-auto"
              form={profileFormId}
              type="submit"
            >
              <CheckCircle2 className="size-4" />
              Simpan Perubahan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatSuperAdminDisplayLabel(value: unknown) {
  const normalized = String(value ?? "")
    .replace(/_/g, " ")
    .trim();

  if (!normalized) {
    return "-";
  }

  return normalized
    .toLowerCase()
    .replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
}

function formatSuperAdminDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return formatAppDateTime(parsed);
}

function getSuperAdminMarketingModeLabel(session?: SuperAdminUnitBarangMarketingSession | null) {
  if (!session) {
    return "Belum dipasarkan";
  }

  return getUnitDetailMarketingModeLabel(session.mode);
}

function getSuperAdminMarketingPriceLabel(session: SuperAdminUnitBarangMarketingSession) {
  if (getUnitDetailMarketingModeValue(session.mode) === "vickrey") {
    return session.finalPrice ? "Harga akhir Lelang Tertutup" : "Harga dasar Lelang Tertutup";
  }

  return "Harga Tetap";
}

function getSuperAdminMarketingPriceValue(session: SuperAdminUnitBarangMarketingSession) {
  if (getUnitDetailMarketingModeValue(session.mode) === "vickrey") {
    return session.finalPrice ?? session.basePrice ?? session.appraisalValue ?? 0;
  }

  return session.price ?? session.finalPrice ?? session.appraisalValue ?? 0;
}

function getSuperAdminMarketingSummary(session: SuperAdminUnitBarangMarketingSession) {
  if (session.note) {
    return session.note;
  }

  if (session.winner || session.buyerName) {
    return `${session.winner || session.buyerName} - ${formatFullCurrency(
      session.finalPrice ?? session.price ?? 0,
    )}`;
  }

  if (getUnitDetailMarketingModeValue(session.mode) === "vickrey") {
    return `${formatDashboardCount(session.participants ?? 0)} peserta tercatat`;
  }

  return "Belum ada pembeli pada sesi ini.";
}

function getSuperAdminIterationHistory(marketing: SuperAdminUnitBarangMarketingSession | null) {
  if (!marketing) {
    return [];
  }

  const rows = marketing.iterationHistory?.length ? marketing.iterationHistory : [];
  const uniqueRows = new Map<string, SuperAdminUnitBarangMarketingSession>();

  for (const row of rows) {
    uniqueRows.set(row.id, row);
  }

  uniqueRows.set(marketing.id, {
    ...(uniqueRows.get(marketing.id) ?? {}),
    ...marketing,
  });

  return Array.from(uniqueRows.values()).sort((left, right) => {
    const iterationDiff = Number(right.iteration ?? 0) - Number(left.iteration ?? 0);
    if (iterationDiff !== 0) {
      return iterationDiff;
    }

    const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
    const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
    return rightTime - leftTime;
  });
}

function getSuperAdminMarketingDateLabel(session: SuperAdminUnitBarangMarketingSession) {
  const dateLabel = formatSuperAdminDateTime(
    session.endingAt ?? session.soldAt ?? session.paymentDeadline ?? session.createdAt,
  );

  return dateLabel !== "-" ? dateLabel : session.ending || "-";
}

function getSuperAdminWinnerBid(session: SuperAdminUnitBarangMarketingSession) {
  return (session.bids ?? []).find((bid) => bid.isWinner) ?? null;
}

function getSuperAdminHighestBidAmount(session: SuperAdminUnitBarangMarketingSession) {
  const amounts = (session.bids ?? [])
    .map((bid) => bid.amount)
    .filter((amount): amount is number => typeof amount === "number" && Number.isFinite(amount))
    .sort((left, right) => right - left);

  return amounts[0] ?? session.finalPrice ?? session.basePrice ?? null;
}

function formatSuperAdminOptionalCurrency(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value) ? formatFullCurrency(value) : "Rp ********";
}

function getSuperAdminCurrencyDigitCount(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return String(Math.trunc(Math.abs(value))).length;
}

function getSuperAdminCompactCurrencyTextClass(value?: number | null) {
  const digits = getSuperAdminCurrencyDigitCount(value);

  if (digits >= 12) {
    return "text-[0.64rem] sm:text-[0.74rem] xl:text-[0.82rem] 2xl:text-[0.9rem]";
  }

  if (digits >= 10) {
    return "text-[0.74rem] sm:text-[0.84rem] xl:text-[0.92rem] 2xl:text-[1rem]";
  }

  if (digits >= 8) {
    return "text-[0.84rem] sm:text-[0.94rem] xl:text-[1.02rem] 2xl:text-[1.1rem]";
  }

  return "text-[0.98rem] sm:text-[1.08rem] xl:text-[1.16rem]";
}

function isSuperAdminVickreyPaymentVerified(session: SuperAdminUnitBarangMarketingSession) {
  return session.transactionStatus === "LUNAS" || session.transactionStatus === "SELESAI";
}

function isSuperAdminVickreyPaymentFulfilled(session: SuperAdminUnitBarangMarketingSession) {
  return session.transactionStatus === "SELESAI";
}

function isSuperAdminAutoCompleted(session: Pick<SuperAdminUnitBarangMarketingSession, "completionSource">) {
  return session.completionSource === "auto_handover_grace";
}

function getSuperAdminCompletionLabel(session: Pick<SuperAdminUnitBarangMarketingSession, "completionSource">) {
  return isSuperAdminAutoCompleted(session) ? "Selesai otomatis" : "Selesai oleh buyer";
}

function getSuperAdminProgressCompletionLabel(session: Pick<SuperAdminUnitBarangMarketingSession, "completionSource">) {
  return isSuperAdminAutoCompleted(session) ? "Selesai otomatis" : "Selesai";
}

function getSuperAdminVerifiedDetail(
  session: Pick<SuperAdminUnitBarangMarketingSession, "handoverAutoCompleteAt" | "handoverComplaintAt">,
) {
  if (session.handoverComplaintAt) {
    return "Buyer mengajukan komplain serah-terima. Auto-selesai ditahan sampai admin unit menindaklanjuti bukti.";
  }

  if (session.handoverAutoCompleteAt) {
    return `Menunggu buyer menekan Pembelian Selesai atau komplain. Auto-selesai pada ${formatSuperAdminDateTime(session.handoverAutoCompleteAt)}.`;
  }

  return "Pembayaran sudah diverifikasi. Menunggu buyer menekan Pembelian Selesai.";
}

function getSuperAdminReceiptLockMessage(session: SuperAdminUnitBarangMarketingSession) {
  return isSuperAdminVickreyPaymentVerified(session) && !session.handoverProofUrl
    ? "Nota belum tersedia. Admin unit perlu mengunggah dokumentasi serah-terima barang fisik terlebih dahulu."
    : null;
}

const FAILED_SUPERADMIN_VICKREY_TRANSACTION_STATUSES = new Set([
  "GAGAL",
  "DIBATALKAN",
  "DIBATALKAN_OTOMATIS",
]);

function getSuperAdminVickreyFailureKind(session: SuperAdminUnitBarangMarketingSession) {
  const hasWinnerTrace = Boolean(session.winner || session.buyerName || session.transactionId);
  const failedTransaction = FAILED_SUPERADMIN_VICKREY_TRANSACTION_STATUSES.has(session.transactionStatus ?? "");

  return hasWinnerTrace || failedTransaction ? "unpaid" : "no_bids";
}

function isSuperAdminVickreyFailureArchive(session: SuperAdminUnitBarangMarketingSession) {
  if (getUnitDetailMarketingModeValue(session.mode) !== "vickrey") {
    return false;
  }

  const noWinnerAfterReveal = !session.transactionId && !session.winner && !session.buyerName;

  return (
    session.status === "GAGAL" ||
    FAILED_SUPERADMIN_VICKREY_TRANSACTION_STATUSES.has(session.transactionStatus ?? "") ||
    noWinnerAfterReveal
  );
}

function getSuperAdminVickreyArchiveDate(session: SuperAdminUnitBarangMarketingSession) {
  return formatSuperAdminDateTime(session.soldAt ?? session.paymentDeadline ?? session.endingAt ?? session.createdAt);
}

function getSuperAdminInitials(name?: string | null) {
  const parts = (name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) {
    return "SA";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

type SuperAdminMarketingReceiptContext = {
  itemCode: string;
  itemMedia: SuperAdminUnitBarangDetailMedia[];
  itemTitle: string;
  unitAddress: string;
  unitName: string;
};

function getSuperAdminMarketingReceiptImageUrl(
  session: SuperAdminUnitBarangMarketingSession,
  itemMedia: SuperAdminUnitBarangDetailMedia[],
) {
  if (session.primaryMedia?.type !== "video" && session.primaryMedia?.url) {
    return session.primaryMedia.url;
  }

  const sessionImage = session.media?.find((entry) => entry.type !== "video")?.url;
  if (sessionImage) {
    return sessionImage;
  }

  return itemMedia.find((entry) => entry.type !== "video")?.url;
}

function getSuperAdminMarketingPaymentMethodLabel(session: SuperAdminUnitBarangMarketingSession) {
  if (session.paymentMethod === "BAYAR_LANGSUNG") {
    return "Langsung di unit";
  }

  if (session.paymentMethod === "TRANSFER_BANK") {
    return "Transfer Bank";
  }

  return session.paymentMethod ? formatSuperAdminDisplayLabel(session.paymentMethod) : "Transfer Bank";
}

function getSuperAdminVickreyReceiptPrintRootId(session: SuperAdminUnitBarangMarketingSession) {
  return `superadmin-vickrey-receipt-print-root-${String(session.transactionId || session.id).replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

function getSuperAdminVickreyReceiptTerms(unitName: string) {
  return [
    "Tunjukkan nota ini beserta kartu identitas asli (KTP) saat pengambilan barang.",
    `Pengambilan barang dilakukan di unit ${unitName}.`,
    "Pembayaran hasil lelang sudah diverifikasi admin unit dan nota ini sah sebagai bukti pembelian.",
    "Simpan nota ini untuk keperluan administrasi atau pengambilan barang.",
  ];
}

function SuperAdminReadOnlyAuditFooter({
  icon: Icon,
  note,
}: {
  icon: LucideIcon;
  note: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-[#dce9df] bg-[#f8fcf9] px-4 py-3 text-[0.78rem] font-semibold text-[#52675e] shadow-[0_16px_40px_-34px_rgba(8,69,50,0.32)]">
      <Icon className="size-4 shrink-0 text-[#006747]" />
      <span>{note}</span>
    </div>
  );
}

function SuperAdminHandoverProofAuditCard({
  itemTitle,
  session,
  unitName,
}: {
  itemTitle?: string;
  session: SuperAdminUnitBarangMarketingSession;
  unitName?: string | null;
}) {
  return (
    <HandoverProofCard
      audience="superadmin"
      itemTitle={itemTitle ?? session.lot}
      proof={{
        fileUrl: session.handoverProofUrl,
        uploadedAt: session.handoverProofUploadedAt
          ? formatSuperAdminDateTime(session.handoverProofUploadedAt)
          : null,
        uploadedBy: session.handoverProofUploadedBy,
        location: unitName ?? session.unitName
      }}
    />
  );
}

function SuperAdminMarketingArchiveStatusCard({
  eyebrow,
  title,
  detail,
  tone = "emerald",
}: {
  eyebrow: string;
  title: string;
  detail: string;
  tone?: "emerald" | "red";
}) {
  const titleClass = tone === "red" ? "text-[#7f1d1d]" : "text-[#111b46]";
  const eyebrowClass = tone === "red" ? "text-[#991b1b]" : "text-[#006747]";

  return (
    <section className="rounded-xl border border-[#dfe7e2] bg-white px-4 py-4 shadow-[0_20px_46px_-40px_rgba(8,69,50,0.32)]">
      <p className={`text-[0.78rem] font-black uppercase tracking-[0.04em] ${eyebrowClass}`}>{eyebrow}</p>
      <p className={`mt-2 font-headline text-[1rem] font-black leading-tight ${titleClass}`}>{title}</p>
      <p className="mt-2 text-[0.74rem] font-semibold leading-5 text-[#52655d]">{detail}</p>
    </section>
  );
}

function SuperAdminVickreySettlementBanner({
  session,
}: {
  session: SuperAdminUnitBarangMarketingSession;
}) {
  const verified = isSuperAdminVickreyPaymentVerified(session);
  const fulfilled = isSuperAdminVickreyPaymentFulfilled(session);
  const serverNow = new Date().toISOString();

  if (fulfilled) {
    return (
      <section className="rounded-[1.1rem] border border-[#86d9ad] bg-[#f0fdf4] px-4 py-4 shadow-[0_18px_42px_-36px_rgba(0,103,71,0.34)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-full bg-[#006747] text-white shadow-[0_18px_30px_-20px_rgba(0,103,71,0.74)]">
              <CheckCircle2 className="size-7" strokeWidth={2.5} />
            </span>
            <div className="min-w-0">
              <h2 className="font-headline text-[1rem] font-black uppercase tracking-[0.02em] text-[#006747] sm:text-[1.12rem]">
                Lelang Selesai Sempurna - Aset Telah Diserahkan
              </h2>
              <p className="mt-1 text-[0.8rem] font-semibold leading-5 text-[#2f6a52]">
                Pembayaran telah dilunasi 100% oleh pemenang dan barang telah diserahkan kepada pemenang.
              </p>
            </div>
          </div>

          <div className="border-t border-[#b7e8cc] pt-3 lg:min-w-[22rem] lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <span className="inline-flex rounded-full border border-[#a7d9c7] bg-white/68 px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.12em] text-[#006747]">
              Status Arsip
            </span>
            <p className="mt-2 font-headline text-[0.92rem] font-black uppercase tracking-[0.01em] text-[#006747]">
              Pembayaran & Penyerahan Selesai
            </p>
            <p className="mt-1 text-[0.72rem] font-semibold leading-5 text-[#2f6a52]">
              Arsip ini bersifat final dan telah ditutup.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (verified) {
    return (
      <section className="rounded-[1.1rem] border border-[#b9e4cc] bg-[#f4fcf6] px-4 py-4 shadow-[0_18px_42px_-36px_rgba(0,103,71,0.28)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-full bg-[#20b96b] text-white shadow-[0_18px_30px_-20px_rgba(32,185,107,0.64)]">
              <ShieldCheck className="size-7" strokeWidth={2.5} />
            </span>
            <div className="min-w-0">
              <h2 className="font-headline text-[1rem] font-black uppercase tracking-[0.02em] text-[#075b3f] sm:text-[1.12rem]">
                Pembayaran Terverifikasi - Menunggu Buyer Selesai
              </h2>
              <p className="mt-1 text-[0.8rem] font-semibold leading-5 text-[#2f6a52]">
                Admin sudah memverifikasi pembayaran. Tahap final baru tercapai setelah buyer menekan Pembelian Selesai.
              </p>
            </div>
          </div>

          <div className="border-t border-[#c9ead3] pt-3 lg:min-w-[22rem] lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <span className="inline-flex rounded-full border border-[#b9e4cc] bg-white/72 px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.12em] text-[#075b3f]">
              Status Transaksi
            </span>
            <p className="mt-2 font-headline text-[0.92rem] font-black uppercase tracking-[0.01em] text-[#075b3f]">
              Nota tersedia, arsip final belum ditutup
            </p>
            <p className="mt-1 text-[0.72rem] font-semibold leading-5 text-[#2f6a52]">
              Buyer perlu mengonfirmasi dari halaman transaksi.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[1.1rem] border border-[#fde68a] bg-[#fffbeb] px-4 py-3 shadow-[0_18px_42px_-36px_rgba(146,64,14,0.34)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[radial-gradient(circle_at_34%_22%,#facc15_0%,#f59e0b_48%,#b45309_100%)] text-white shadow-[0_14px_26px_-18px_rgba(180,83,9,0.72)]">
            <Trophy className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="font-headline text-[0.92rem] font-black uppercase tracking-[0.02em] text-[#7c2d12]">
              Lelang Selesai - Menunggu Pelunasan Nasabah
            </h2>
            <p className="mt-1 text-[0.78rem] font-semibold leading-5 text-[#9a3412]">
              Pemenang wajib melakukan pelunasan sebelum batas waktu berakhir.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <p className="text-[0.62rem] font-black uppercase tracking-[0.13em] text-[#162461]">
            Batas Waktu Pelunasan
          </p>
          <span className="rounded-lg border border-[#e9edf1] bg-white px-3 py-2 text-[0.72rem] font-black text-[#7c2d12] shadow-[0_10px_24px_-20px_rgba(8,69,50,0.25)]">
            {session.paymentDeadline ? (
              <AdminLiveCountdown
                expiredLabel="Batas bayar terlewati"
                fallbackLabel={formatSuperAdminDateTime(session.paymentDeadline)}
                prefix="Sisa"
                serverNow={serverNow}
                targetAt={session.paymentDeadline}
              />
            ) : (
              "-"
            )}
          </span>
        </div>
      </div>
    </section>
  );
}

function SuperAdminVickreyWinnerProfilePanel({
  session,
}: {
  session: SuperAdminUnitBarangMarketingSession;
}) {
  const winnerName = session.buyerName || session.winner || "Pemenang belum tercatat";
  const fulfilled = isSuperAdminVickreyPaymentFulfilled(session);
  const verified = isSuperAdminVickreyPaymentVerified(session);
  const title = verified ? "Manifes Penyerahan & Pemenang" : "Detail Pemenang Lelang";
  const actionLabel = fulfilled ? "Barang Sudah Diambil" : "Menunggu Buyer Selesai";

  return (
    <section
      className="relative overflow-hidden rounded-xl border border-[#dfe7e2] bg-white px-4 py-4 shadow-[0_20px_46px_-40px_rgba(8,69,50,0.32)]"
      data-testid="superadmin-vickrey-winner-profile"
    >
      {verified ? (
        <CheckCircle2 className="pointer-events-none absolute -right-4 -top-5 size-20 text-[#f3f8f5]" strokeWidth={2.4} />
      ) : null}
      <p className="text-[0.78rem] font-black uppercase tracking-[0.04em] text-[#006747]">
        {title}
      </p>

      <div className="relative mt-4 flex min-w-0 items-center gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-full border border-[#d9e8df] bg-[#eef3f1] font-headline text-[1rem] font-black text-[#006747]">
          {getSuperAdminInitials(winnerName)}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-headline text-[0.95rem] font-black leading-tight text-[#111b46]">
            {winnerName}
          </h3>
          {verified ? (
            <span className="mt-1.5 inline-flex max-w-full items-center gap-1 rounded-full border border-[#d6efe1] bg-[#f1fbf6] px-2 py-1 text-[0.56rem] font-black uppercase leading-none tracking-[0.07em] text-[#006747]">
              <CheckCircle2 className="size-3 shrink-0" />
              <span className="truncate">Pemenang Terverifikasi</span>
            </span>
          ) : null}
          <div className="mt-2 grid min-w-0 gap-1.5 text-[0.72rem] font-bold leading-4 text-[#111b46]">
            <p className="flex min-w-0 items-center gap-2">
              <Phone className="size-3.5 shrink-0 text-[#40558b]" />
              <span className="min-w-0 truncate">{session.buyerPhone || "Nomor telepon belum tercatat"}</span>
            </p>
            <p className="flex min-w-0 items-center gap-2">
              <Mail className="size-3.5 shrink-0 text-[#40558b]" />
              <span className="min-w-0 truncate font-mono text-[0.7rem]">
                {session.buyerEmail || "email-belum-tercatat"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {verified ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-[#edf2ee] pt-3">
          <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-[#006747] px-2.5 py-1.5 text-[0.56rem] font-black uppercase leading-none tracking-[0.05em] text-white">
            <CheckCircle2 className="size-3.5 shrink-0" />
            <span className="truncate">Pemenang Terverifikasi</span>
          </span>
          <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-[#2463eb] px-2.5 py-1.5 text-[0.56rem] font-black uppercase leading-none tracking-[0.05em] text-white">
            <ShieldCheck className="size-3.5 shrink-0" />
            <span className="truncate">{actionLabel}</span>
          </span>
        </div>
      ) : null}
    </section>
  );
}

function SuperAdminVickreyMechanismPanel({
  session,
}: {
  session: SuperAdminUnitBarangMarketingSession;
}) {
  const highestBid = getSuperAdminHighestBidAmount(session);
  const paymentPrice = session.finalPrice ?? session.basePrice ?? null;
  const fulfilled = isSuperAdminVickreyPaymentFulfilled(session);
  const verified = isSuperAdminVickreyPaymentVerified(session);

  return (
    <section className="rounded-xl border border-[#dfe7e2] bg-white px-4 py-4 shadow-[0_20px_46px_-40px_rgba(8,69,50,0.32)]">
      <div className="flex items-center gap-2">
        <p className="text-[0.78rem] font-black uppercase tracking-[0.04em] text-[#006747]">
          {fulfilled ? "Mekanisme Lelang (Arsip)" : "Mekanisme Lelang: Lelang Tertutup"}
        </p>
        <Info className="size-3.5 text-[#2f6fff]" />
      </div>

      <div className={`mt-4 grid gap-3 ${fulfilled ? "sm:grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-3"}`}>
        <div className="min-w-0 rounded-lg border border-[#d6efe1] bg-[#f1fbf6] px-3.5 py-3">
          <p className="text-[0.66rem] font-black text-[#006747]">Penawaran Tertinggi</p>
          <p className={`mt-2 max-w-full whitespace-nowrap font-headline font-black leading-tight tracking-[-0.03em] text-[#006747] [font-variant-numeric:tabular-nums] ${getSuperAdminCompactCurrencyTextClass(highestBid)}`}>
            {formatSuperAdminOptionalCurrency(highestBid)}
          </p>
          <p className="mt-1 text-[0.68rem] font-semibold leading-4 text-[#2f6a52]">
            Penawaran tertinggi oleh pemenang
          </p>
        </div>

        <div className="min-w-0 rounded-lg border border-[#fde2a5] bg-[#fff8e7] px-3.5 py-3">
          <p className="text-[0.66rem] font-black text-[#92400e]">Harga Bayar</p>
          <p className={`mt-2 max-w-full whitespace-nowrap font-headline font-black leading-tight tracking-[-0.03em] text-[#f59e0b] [font-variant-numeric:tabular-nums] ${getSuperAdminCompactCurrencyTextClass(paymentPrice)}`}>
            {formatSuperAdminOptionalCurrency(paymentPrice)}
          </p>
          <p className="mt-1 text-[0.68rem] font-semibold leading-4 text-[#b45309]">
            Harga yang harus dibayarkan pemenang
          </p>
        </div>

        <div className="rounded-lg border border-[#e7ece9] bg-[#f8faf9] px-3.5 py-3">
          <p className="text-[0.66rem] font-black text-[#40558b]">{fulfilled ? "Status Lelang" : "Status"}</p>
          <span className="mt-2 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#e9f8ef] px-2.5 py-1 text-[0.6rem] font-black uppercase text-[#006747] 2xl:text-[0.64rem]">
            {fulfilled ? "Selesai & Diarsipkan" : verified ? "Terverifikasi" : "Menang"} <Trophy className="size-3.5" />
          </span>
          <p className="mt-1 text-[0.68rem] font-semibold leading-4 text-[#40558b]">
            {fulfilled ? "Berkas final pemenang" : verified ? "Menunggu konfirmasi buyer" : "Pemenang utama lelang"}
          </p>
        </div>

        {fulfilled ? (
          <div className="rounded-lg border border-[#e7ece9] bg-[#f8faf9] px-3.5 py-3">
            <p className="text-[0.66rem] font-black text-[#40558b]">Waktu Pelaksanaan</p>
            <p className="mt-2 font-mono text-[0.78rem] font-black leading-tight text-[#111b46]">
              {formatSuperAdminDateTime(session.endingAt)}
            </p>
            <p className="mt-1 text-[0.68rem] font-semibold leading-4 text-[#40558b]">
              Tanggal sesi ditutup
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-lg border border-[#edf2ee] bg-[#f8faf9] px-3 py-2.5 text-[0.72rem] font-semibold leading-5 text-[#52655d]">
        <ReceiptText className="mt-0.5 size-4 shrink-0 text-[#006747]" />
        {fulfilled ? (
          <div className="grid flex-1 gap-2 sm:grid-cols-3">
            <p>
              <span className="block text-[0.62rem] font-black uppercase tracking-[0.08em] text-[#40558b]">
                Mekanisme
              </span>
              e-Bidding - Lelang Tertutup
            </p>
            <p>
              <span className="block text-[0.62rem] font-black uppercase tracking-[0.08em] text-[#40558b]">
                Pemenang
              </span>
              {session.buyerName || session.winner || "-"}
            </p>
            <p>
              <span className="block text-[0.62rem] font-black uppercase tracking-[0.08em] text-[#40558b]">
                Tanggal Arsip
              </span>
              {getSuperAdminVickreyArchiveDate(session)}
            </p>
          </div>
        ) : (
          <p>
            <span className="font-black text-[#006747]">Catatan Admin:</span> Harga akhir mengikuti mekanisme lelang
            dan dihitung dari penawaran tertinggi kedua.
          </p>
        )}
      </div>
    </section>
  );
}

function SuperAdminVickreyRankingTable({
  session,
}: {
  session: SuperAdminUnitBarangMarketingSession;
}) {
  const rows = [...(session.bids ?? [])].sort((left, right) => (left.rank || 0) - (right.rank || 0));
  const fulfilled = isSuperAdminVickreyPaymentFulfilled(session);

  return (
    <section className="overflow-hidden rounded-xl border border-[#dfe7e2] bg-white shadow-[0_20px_46px_-40px_rgba(8,69,50,0.32)]">
      <div className="border-b border-[#edf2ee] bg-[#fbfcfb] px-4 py-3">
        <h3 className="text-[0.78rem] font-black uppercase tracking-[0.04em] text-[#006747]">
          {fulfilled ? "Bidders Ranking Table (Arsip)" : "Ranking Peserta Lelang (Admin View)"}
        </h3>
      </div>
      <div>
        <table className="w-full table-fixed text-left text-[0.72rem]">
          <colgroup>
            <col className="w-[7%]" />
            <col className="w-[25%]" />
            <col className="w-[22%]" />
            <col className="w-[24%]" />
            <col className="w-[22%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-[#edf2ee] bg-[#f8faf9] text-[0.56rem] font-black uppercase tracking-[0.04em] text-[#40558b] sm:text-[0.6rem]">
              <th className="px-2 py-2.5 text-center">#</th>
              <th className="px-2 py-2.5">Nama Peserta</th>
              <th className="px-2 py-2.5">Waktu Penawaran</th>
              <th className="px-2 py-2.5 text-right">Nominal Penawaran</th>
              <th className="px-2 py-2.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edf2ee] font-bold text-[#111b46]">
            {rows.map((bid) => {
              const isRunnerUp = bid.determinesFinalPrice;
              const rowTone = fulfilled
                ? bid.isWinner
                  ? "bg-[#e9f8ef]"
                  : "bg-white text-[#8b9a93]"
                : bid.isWinner
                  ? "bg-[#e9f8ef]"
                  : isRunnerUp
                    ? "bg-[#fff8e7]"
                    : "bg-white";
              const status = fulfilled
                ? bid.isWinner
                  ? "Lunas & Diserahkan"
                  : "Tidak Menang"
                : bid.isWinner
                  ? "Pemenang"
                  : isRunnerUp
                    ? "Harga Bayar"
                    : "-";
              const statusTone = fulfilled
                ? bid.isWinner
                  ? "bg-[#e9f8ef] text-[#006747]"
                  : "bg-[#eef2f0] text-[#8b9a93]"
                : bid.isWinner
                  ? "bg-[#006747] text-white"
                  : isRunnerUp
                    ? "bg-[#f59e0b] text-white"
                    : "text-[#40558b]";

              return (
                <tr className={`${rowTone} transition-colors duration-200 hover:bg-[#f4fbf7]`} key={bid.id}>
                  <td className="px-2 py-2.5 text-center font-mono text-[#006747]">{bid.rank}</td>
                  <td className="break-words px-2 py-2.5 text-[0.68rem] leading-4 sm:text-[0.72rem]">{bid.bidderName}</td>
                  <td className="break-words px-2 py-2.5 font-mono text-[0.62rem] leading-4 text-[#40558b]">
                    {bid.submittedAtLabel}
                  </td>
                  <td className="break-words px-2 py-2.5 text-right font-mono text-[0.68rem] font-black leading-4">
                    {formatSuperAdminOptionalCurrency(bid.amount)}
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    {status === "-" ? (
                      <span className="font-black text-[#40558b]">-</span>
                    ) : (
                      <span className={`inline-flex max-w-full items-center justify-center gap-1 rounded-full px-2 py-1 text-[0.55rem] font-black uppercase leading-3 sm:text-[0.58rem] ${statusTone}`}>
                        {fulfilled ? (
                          bid.isWinner ? (
                            <CheckCircle2 className="size-3" />
                          ) : (
                            <X className="size-3" />
                          )
                        ) : bid.isWinner ? (
                          <Trophy className="size-3" />
                        ) : (
                          <ReceiptText className="size-3" />
                        )}
                        <span className="min-w-0 whitespace-normal break-words text-center">{status}</span>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t border-[#edf2ee] bg-[#fbfcfb] px-4 py-2.5 text-[0.68rem] font-black text-[#40558b]">
        Total {session.participants ?? rows.length} peserta
      </div>
    </section>
  );
}

function SuperAdminVickreyProgressPanel({
  session,
}: {
  session: SuperAdminUnitBarangMarketingSession;
}) {
  const fulfilled = isSuperAdminVickreyPaymentFulfilled(session);
  const verified = isSuperAdminVickreyPaymentVerified(session);
  const steps = fulfilled
    ? [
        { label: "Pembayaran", status: "Selesai", occurredAt: formatSuperAdminDateTime(session.transactionCreatedAt), icon: CheckCircle2, tone: "done" as const },
        { label: "Verifikasi", status: "Selesai", occurredAt: formatSuperAdminDateTime(session.soldAt), icon: ShieldCheck, tone: "done" as const },
        { label: "Selesai", status: getSuperAdminProgressCompletionLabel(session), occurredAt: formatSuperAdminDateTime(session.completedAt), icon: CheckCircle2, tone: "done" as const },
      ]
    : verified
      ? [
          { label: "Pembayaran", status: "Selesai", occurredAt: formatSuperAdminDateTime(session.transactionCreatedAt), icon: CheckCircle2, tone: "done" as const },
          { label: "Verifikasi", status: "Selesai", occurredAt: formatSuperAdminDateTime(session.soldAt), icon: ShieldCheck, tone: "done" as const },
          { label: "Selesai", status: "Menunggu buyer", icon: CheckCircle2, tone: "current" as const },
        ]
      : [
          { label: "Pembayaran", status: "Berjalan", occurredAt: formatSuperAdminDateTime(session.transactionCreatedAt), icon: WalletCards, tone: "current" as const },
          { label: "Verifikasi", status: "Belum terjadi", icon: FileText, tone: "pending" as const },
          { label: "Selesai", status: "Belum terjadi", icon: CheckCircle2, tone: "pending" as const },
        ];

  return <CompactTransactionProgress steps={steps} title={verified ? "Progress Penyelesaian" : "Progress Pembayaran Lelang"} />;
}

function SuperAdminVickreyNotePanel({
  session,
}: {
  session: SuperAdminUnitBarangMarketingSession;
}) {
  const paymentPrice = session.finalPrice ?? session.basePrice ?? session.price ?? 0;
  const fulfilled = isSuperAdminVickreyPaymentFulfilled(session);
  const verified = isSuperAdminVickreyPaymentVerified(session);

  if (fulfilled) {
    return (
      <section className="rounded-xl border border-[#dfe7e2] bg-white px-4 py-4 shadow-[0_20px_46px_-40px_rgba(8,69,50,0.32)]">
        <p className="text-[0.78rem] font-black uppercase tracking-[0.04em] text-[#111b46]">
          Ringkasan Transaksi
        </p>
        <p className="mt-1 text-[0.72rem] font-semibold leading-5 text-[#52655d]">
          Cetak nota resmi dan arsipkan berkas lelang setelah buyer menutup pembelian.
        </p>

        <div className="mt-4 space-y-2 rounded-xl border border-[#e4ebe7] bg-[#f8faf9] px-3 py-3 text-[0.76rem] font-bold text-[#52655d]">
          <div className="flex items-center justify-between gap-4">
            <span>Harga akhir lelang</span>
            <span className="whitespace-nowrap font-mono text-[#111b46]">{formatFullCurrency(paymentPrice)}</span>
          </div>
          <div className="border-t border-[#dfe7e2] pt-2">
            <div className="flex items-end justify-between gap-4">
              <span className="text-[0.66rem] font-black uppercase tracking-[0.06em] text-[#006747]">
                Total Pelunasan Kasir
              </span>
              <span className={`whitespace-nowrap font-mono font-black leading-none tracking-[-0.03em] text-[#006747] ${getSuperAdminCompactCurrencyTextClass(paymentPrice)}`}>
                {formatFullCurrency(paymentPrice)}
              </span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (verified) {
    return (
      <section className="rounded-xl border border-[#dfe7e2] bg-white px-4 py-4 shadow-[0_20px_46px_-40px_rgba(8,69,50,0.32)]">
        <p className="text-[0.78rem] font-black uppercase tracking-[0.04em] text-[#111b46]">
          Nota & Konfirmasi Buyer
        </p>
        <p className="mt-1 text-[0.72rem] font-semibold leading-5 text-[#52655d]">
          {getSuperAdminVerifiedDetail(session)}
        </p>

        <div className="mt-4 space-y-2 rounded-xl border border-[#e4ebe7] bg-[#f8faf9] px-3 py-3 text-[0.76rem] font-bold text-[#52655d]">
          <div className="flex items-center justify-between gap-4">
            <span>Harga akhir lelang</span>
            <span className="whitespace-nowrap font-mono text-[#111b46]">{formatFullCurrency(paymentPrice)}</span>
          </div>
          <div className="border-t border-[#dfe7e2] pt-2">
            <div className="flex items-end justify-between gap-4">
              <span className="text-[0.66rem] font-black uppercase tracking-[0.06em] text-[#006747]">
                Status Admin
              </span>
              <span className="text-right font-mono text-[0.9rem] font-black leading-tight text-[#006747]">
                Terverifikasi
              </span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-[#dfe7e2] bg-white px-4 py-4 shadow-[0_20px_46px_-40px_rgba(8,69,50,0.32)]">
      <p className="text-[0.78rem] font-black uppercase tracking-[0.04em] text-[#006747]">Total Pembayaran</p>
      <div className="mt-4 space-y-3 text-[0.8rem] font-bold text-[#111b46]">
        <div className="flex items-center justify-between gap-4">
          <span>Harga Bayar (Second Price)</span>
          <span className="font-mono">{formatFullCurrency(paymentPrice)}</span>
        </div>
        <div className="border-t border-[#edf2ee] pt-3">
          <div className="flex items-end justify-between gap-4">
            <span className="text-[0.84rem] font-black">Status Pembayaran</span>
            <span className="font-headline text-[1.15rem] font-black leading-none text-[#7c2d12]">
              {formatSuperAdminDisplayLabel(session.transactionStatus) || "Menunggu bayar"}
            </span>
          </div>
        </div>
        <div className="rounded-lg border border-[#fde2a5] bg-[#fffbeb] px-3 py-2.5 text-[0.72rem] font-semibold leading-5 text-[#9a3412]">
          Status saat ini: <span className="font-black">{formatSuperAdminDisplayLabel(session.transactionStatus) || "Menunggu Bayar"}</span>. Menunggu pelunasan oleh pemenang hingga batas waktu yang ditentukan.
        </div>
      </div>
    </section>
  );
}

function SuperAdminVickreyReceiptInlinePrint({
  receiptContext,
  session,
  buttonClassName,
  label = "Cetak Nota",
}: {
  receiptContext: SuperAdminMarketingReceiptContext;
  session: SuperAdminUnitBarangMarketingSession;
  buttonClassName: string;
  label?: string;
}) {
  const paymentPrice = session.finalPrice ?? session.basePrice ?? session.price ?? 0;
  const imageUrl = getSuperAdminMarketingReceiptImageUrl(session, receiptContext.itemMedia);
  const isCompleted = isSuperAdminVickreyPaymentFulfilled(session);
  const paymentMethodLabel = getSuperAdminMarketingPaymentMethodLabel(session);
  const verifiedAt = formatSuperAdminDateTime(
    session.soldAt ?? session.paymentDeadline ?? session.endingAt ?? session.createdAt,
  );
  const noteNumber = String(session.reference || session.transactionId || session.id).replace(/^#/, "");

  return (
    <TransactionReceiptInlinePrint
      buttonClassName={buttonClassName}
      label={label}
      rootId={getSuperAdminVickreyReceiptPrintRootId(session)}
    >
      <TransactionReceiptDocument
        buyerEmail={session.buyerEmail ?? undefined}
        buyerName={session.buyerName || session.winner || "-"}
        buyerPhone={session.buyerPhone ?? undefined}
        extraMeta={[
          { label: "Jenis transaksi", value: "Lelang" },
          { label: "Kode aset", value: receiptContext.itemCode },
        ]}
        footerText="Dokumen ini diterbitkan sebagai salinan monitoring superadmin Ruang Agunan."
        handoverByName={session.handoverProofUploadedBy ?? undefined}
        imageUrl={imageUrl}
        itemSubtitle={paymentMethodLabel}
        itemTitle={receiptContext.itemTitle}
        noteNumber={noteNumber}
        paymentMethodLabel={paymentMethodLabel}
        statusLabel={isCompleted ? getSuperAdminCompletionLabel(session) : "Terverifikasi admin"}
        subtotal={paymentPrice}
        terms={getSuperAdminVickreyReceiptTerms(receiptContext.unitName)}
        total={paymentPrice}
        transactionId={session.transactionId || session.id}
        unitAddress={receiptContext.unitAddress}
        unitName={receiptContext.unitName}
        receiverName={session.buyerName || session.winner || "-"}
        verifiedByName={session.verifiedBy ?? undefined}
        verifiedAt={verifiedAt}
        outputLayout
      />
    </TransactionReceiptInlinePrint>
  );
}

function SuperAdminPassiveActionButton({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  return (
    <button
      aria-disabled="true"
      className={className}
      onClick={(event) => event.preventDefault()}
      title="Aksi operasional dilakukan dari workspace admin unit"
      type="button"
    >
      {children}
    </button>
  );
}

function SuperAdminVickreyActionFooter({
  receiptContext,
  session,
}: {
  receiptContext: SuperAdminMarketingReceiptContext;
  session: SuperAdminUnitBarangMarketingSession;
}) {
  const receiptLockMessage = getSuperAdminReceiptLockMessage(session);
  const canPrintReceipt = !receiptLockMessage;

  if (isSuperAdminVickreyPaymentFulfilled(session)) {
    return (
      <div className="grid gap-3 print:hidden">
        {canPrintReceipt ? (
          <SuperAdminVickreyReceiptInlinePrint
            buttonClassName="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-[#d8e4de] bg-white px-5 text-[0.86rem] font-black text-[#111b46] shadow-[0_18px_34px_-28px_rgba(8,69,50,0.28)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-[#f8faf9] active:scale-[0.99]"
            receiptContext={receiptContext}
            session={session}
          />
        ) : (
          <Button className="h-12 rounded-lg border border-[#d8e4de] bg-white px-5 text-[0.86rem] font-black text-[#111b46]" disabled title={receiptLockMessage ?? undefined} variant="secondary">
            <Printer className="size-4" />
            Cetak Nota
          </Button>
        )}
        {receiptLockMessage ? (
          <p className="text-[0.72rem] font-semibold leading-5 text-[#52655d]">{receiptLockMessage}</p>
        ) : null}
        <SuperAdminPassiveActionButton className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#006747] px-5 text-[0.9rem] font-black text-white shadow-[0_18px_34px_-24px_rgba(0,103,71,0.75)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-[#00583d] active:scale-[0.99]">
          <LockKeyhole className="size-4.5" />
          Tutup & Arsipkan Berkas Lelang
        </SuperAdminPassiveActionButton>
      </div>
    );
  }

  if (isSuperAdminVickreyPaymentVerified(session)) {
    return (
      <div className="grid gap-3 print:hidden">
        {canPrintReceipt ? (
          <SuperAdminVickreyReceiptInlinePrint
            buttonClassName="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#006747] px-5 text-[0.9rem] font-black text-white shadow-[0_18px_34px_-24px_rgba(0,103,71,0.75)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-[#00583d] active:scale-[0.99]"
            receiptContext={receiptContext}
            session={session}
          />
        ) : (
          <Button className="h-12 rounded-lg bg-[#006747] px-5 text-[0.9rem] font-black text-white" disabled title={receiptLockMessage ?? undefined}>
            <Printer className="size-4" />
            Cetak Nota
          </Button>
        )}
        {receiptLockMessage ? (
          <p className="text-[0.72rem] font-semibold leading-5 text-[#52655d]">{receiptLockMessage}</p>
        ) : null}
        <Button
          className="h-12 rounded-lg border border-[#d8e4de] bg-white px-5 text-[0.86rem] font-black text-[#111b46]"
          disabled
          variant="secondary"
        >
          <CheckCircle2 className="size-4" />
          Menunggu Buyer Selesai
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-3 print:hidden">
      <Button
        className="h-12 rounded-lg bg-[#006747] px-5 text-[0.9rem] font-black text-white shadow-[0_18px_34px_-24px_rgba(0,103,71,0.75)]"
        disabled
      >
        <ReceiptText className="size-4.5" />
        Menunggu Verifikasi Pembayaran
      </Button>
    </div>
  );
}

function SuperAdminVickreyFailureActionFooter() {
  return (
    <div className="grid gap-3 print:hidden">
      <SuperAdminPassiveActionButton className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#006747] px-5 text-[0.9rem] font-black text-white shadow-[0_18px_34px_-24px_rgba(0,103,71,0.75)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-[#00583d] active:scale-[0.99]">
        <RefreshCcw className="size-4.5" />
        Jadwalkan Pasarkan Ulang
      </SuperAdminPassiveActionButton>
    </div>
  );
}

function SuperAdminVickreyFailureBanner({
  session,
}: {
  session: SuperAdminUnitBarangMarketingSession;
}) {
  const unpaid = getSuperAdminVickreyFailureKind(session) === "unpaid";

  return (
    <section className="rounded-[1.1rem] border border-[#fecaca] bg-[#fff1f2] px-4 py-4 shadow-[0_18px_42px_-36px_rgba(185,28,28,0.34)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-[#b91c1c] text-white shadow-[0_18px_30px_-20px_rgba(185,28,28,0.72)]">
            <AlertTriangle className="size-7" strokeWidth={2.5} />
          </span>
          <div className="min-w-0">
            <h2 className="font-headline text-[1rem] font-black uppercase tracking-[0.02em] text-[#7f1d1d] sm:text-[1.12rem]">
              {unpaid ? "Lelang Gagal - Pemenang Dikenakan Sanksi" : "Lelang Gagal - Tidak Ada Peserta"}
            </h2>
            <p className="mt-1 max-w-3xl text-[0.8rem] font-semibold leading-5 text-[#9f1239]">
              {unpaid
                ? "Pemenang tidak melakukan pelunasan dalam batas waktu 24 jam setelah hasil lelang diumumkan, sehingga sesi dinyatakan gagal dan akun pemenang dikenai sanksi."
                : "Sesi berakhir tanpa peserta yang mengirim bid, sehingga tidak ada pemenang dan barang perlu dijadwalkan untuk lelang ulang."}
            </p>
          </div>
        </div>

        <div className="border-t border-[#fecdd3] pt-3 lg:min-w-[20rem] lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <span className="inline-flex rounded-full border border-[#fecaca] bg-white/72 px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.12em] text-[#991b1b]">
            Status Arsip
          </span>
          <p className="mt-2 font-headline text-[0.92rem] font-black uppercase tracking-[0.01em] text-[#7f1d1d]">
            {unpaid ? "Batas 24 Jam Terlewati" : "Tidak Ada Bid Masuk"}
          </p>
          <p className="mt-1 text-[0.72rem] font-semibold leading-5 text-[#9f1239]">
            {formatSuperAdminDateTime(session.endingAt ?? session.createdAt)} - {session.code || session.id}
          </p>
        </div>
      </div>
    </section>
  );
}

function SuperAdminVickreyFailureProfilePanel({
  session,
}: {
  session: SuperAdminUnitBarangMarketingSession;
}) {
  const unpaid = getSuperAdminVickreyFailureKind(session) === "unpaid";
  const winnerName = session.buyerName || session.winner || "Pemenang tidak tercatat";
  const winnerBid = getSuperAdminWinnerBid(session);
  const winnerId = winnerBid?.bidderId || session.buyerNationalId || session.reference || "-";

  return (
    <section className="relative overflow-hidden rounded-xl border border-[#e5d8d8] bg-white px-4 py-4 shadow-[0_20px_46px_-40px_rgba(127,29,29,0.34)]">
      <X className="pointer-events-none absolute -right-5 -top-6 size-24 text-[#fff1f2]" strokeWidth={2.6} />
      <p className="text-[0.78rem] font-black uppercase tracking-[0.04em] text-[#006747]">
        {unpaid ? "Manifes Penyerahan & Pemenang" : "Manifes Kegagalan Sesi"}
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(15rem,0.56fr)] md:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <span
            className={`grid size-14 shrink-0 place-items-center rounded-full border font-headline text-[1.1rem] font-black ${
              unpaid ? "border-[#fecaca] bg-[#fff1f2] text-[#991b1b]" : "border-[#dfe7e2] bg-[#eef3f1] text-[#006747]"
            }`}
          >
            {unpaid ? getSuperAdminInitials(winnerName) : <UsersRound className="size-6" />}
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-headline text-[1.08rem] font-black leading-tight text-[#111b46]">
              {unpaid ? winnerName : "Pemenang Belum Tersedia"}
            </h3>
            <p className="mt-2 text-[0.74rem] font-bold leading-5 text-[#52655d]">
              {unpaid ? (
                <>
                  Member ID: <span className="font-mono text-[#111b46]">{winnerId}</span>
                </>
              ) : (
                "Tidak ada peserta mengirim bid pada sesi ini."
              )}
            </p>
          </div>
        </div>

        <div className="grid gap-2 border-t border-[#edf2ee] pt-3 text-[0.76rem] font-bold text-[#111b46] md:border-l md:border-t-0 md:pl-5 md:pt-0">
          {unpaid ? (
            <>
              <p className="flex min-w-0 items-center gap-2">
                <Phone className="size-4 shrink-0 text-[#40558b]" />
                <span className="min-w-0 truncate">{session.buyerPhone || "Nomor telepon belum tercatat"}</span>
              </p>
              <p className="flex min-w-0 items-center gap-2">
                <Mail className="size-4 shrink-0 text-[#40558b]" />
                <span className="min-w-0 truncate font-mono text-[0.72rem]">
                  {session.buyerEmail || "email-belum-tercatat"}
                </span>
              </p>
            </>
          ) : (
            <>
              <p className="flex min-w-0 items-center gap-2">
                <UsersRound className="size-4 shrink-0 text-[#40558b]" />
                <span>{session.participants ?? 0} peserta tercatat</span>
              </p>
              <p className="flex min-w-0 items-center gap-2">
                <Gavel className="size-4 shrink-0 text-[#40558b]" />
                <span>Tidak ada penawaran valid</span>
              </p>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-[#edf2ee] pt-3">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#b91c1c] px-3 py-1.5 text-[0.62rem] font-black uppercase tracking-[0.06em] text-white">
          <X className="size-3.5" />
          {unpaid ? "Gagal Pelunasan" : "0 Peserta"}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#f59e0b] px-3 py-1.5 text-[0.62rem] font-black uppercase tracking-[0.06em] text-white">
          <AlertTriangle className="size-3.5" />
          {unpaid ? "Pelanggaran Dicatat" : "Siap Lelang Ulang"}
        </span>
      </div>
    </section>
  );
}

function SuperAdminVickreyFailureMechanismPanel({
  session,
}: {
  session: SuperAdminUnitBarangMarketingSession;
}) {
  const unpaid = getSuperAdminVickreyFailureKind(session) === "unpaid";
  const highestBid = getSuperAdminHighestBidAmount(session);
  const paymentPrice = session.finalPrice ?? session.basePrice ?? session.price ?? null;

  return (
    <section className="rounded-xl border border-[#dfe7e2] bg-white px-4 py-4 shadow-[0_20px_46px_-40px_rgba(8,69,50,0.32)]">
      <div className="flex items-center gap-2">
        <p className="text-[0.78rem] font-black uppercase tracking-[0.04em] text-[#006747]">
          Mekanisme Lelang (Arsip)
        </p>
        <Info className="size-3.5 text-[#2f6fff]" />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="min-w-0 overflow-hidden rounded-lg border border-[#d6efe1] bg-[#f1fbf6] px-3.5 py-3">
          <p className="text-[0.66rem] font-black text-[#006747]">Penawaran Tertinggi</p>
          <p className={`mt-2 max-w-full whitespace-nowrap font-headline font-black leading-tight tracking-tight text-[#006747] [font-variant-numeric:tabular-nums] ${getSuperAdminCompactCurrencyTextClass(highestBid)}`}>
            {unpaid ? formatSuperAdminOptionalCurrency(highestBid) : "Belum ada bid"}
          </p>
          <p className="mt-1 text-[0.68rem] font-semibold leading-4 text-[#2f6a52]">
            {unpaid ? "Bid tertinggi dari pemenang gagal bayar" : "Tidak ada penawaran yang tersimpan"}
          </p>
        </div>

        <div className="min-w-0 overflow-hidden rounded-lg border border-[#fde2a5] bg-[#fff8e7] px-3.5 py-3">
          <p className="text-[0.66rem] font-black text-[#92400e]">{unpaid ? "Harga Bayar" : "Harga Dasar"}</p>
          <p className={`mt-2 max-w-full whitespace-nowrap font-headline font-black leading-tight tracking-tight text-[#f59e0b] [font-variant-numeric:tabular-nums] ${getSuperAdminCompactCurrencyTextClass(paymentPrice)}`}>
            {formatSuperAdminOptionalCurrency(paymentPrice)}
          </p>
          <p className="mt-1 text-[0.68rem] font-semibold leading-4 text-[#b45309]">
            {unpaid ? "Nilai final sebelum sesi dibatalkan" : "Nilai awal untuk penjadwalan ulang"}
          </p>
        </div>

        <div className="rounded-lg border border-[#fecaca] bg-[#fff1f2] px-3.5 py-3">
          <p className="text-[0.66rem] font-black text-[#991b1b]">Status Lelang</p>
          <span className="mt-2 inline-flex min-w-fit items-center gap-1.5 whitespace-nowrap rounded-full bg-[#b91c1c] px-3 py-1 text-[0.62rem] font-black uppercase text-white">
            {unpaid ? "Batal / Gagal" : "Tanpa Bid"}
            <X className="size-3.5" />
          </span>
          <p className="mt-1 text-[0.68rem] font-semibold leading-4 text-[#9f1239]">
            {unpaid ? "Pemenang gagal memenuhi batas bayar" : "Sesi belum menghasilkan pemenang"}
          </p>
        </div>

        <div className="rounded-lg border border-[#e7ece9] bg-[#f8faf9] px-3.5 py-3">
          <p className="text-[0.66rem] font-black text-[#40558b]">Waktu Pelaksanaan</p>
          <p className="mt-2 font-mono text-[0.76rem] font-black leading-tight text-[#111b46]">
            {formatSuperAdminDateTime(session.endingAt ?? session.createdAt)}
          </p>
          <p className="mt-1 text-[0.68rem] font-semibold leading-4 text-[#40558b]">
            Tanggal sesi ditutup
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-3 rounded-lg border border-[#edf2ee] bg-[#f8faf9] px-3 py-2.5 text-[0.72rem] font-semibold leading-5 text-[#52655d] sm:grid-cols-3">
        <p>
          <span className="block text-[0.62rem] font-black uppercase tracking-[0.08em] text-[#40558b]">
            Mekanisme
          </span>
          e-Bidding - Lelang Tertutup
        </p>
        <p>
          <span className="block text-[0.62rem] font-black uppercase tracking-[0.08em] text-[#40558b]">
            Hasil
          </span>
          {unpaid ? session.buyerName || session.winner || "-" : "Belum menghasilkan pemenang"}
        </p>
        <p>
          <span className="block text-[0.62rem] font-black uppercase tracking-[0.08em] text-[#40558b]">
            Tanggal Arsip
          </span>
          {getSuperAdminVickreyArchiveDate(session)}
        </p>
      </div>
    </section>
  );
}

function SuperAdminVickreyFailureRankingTable({
  session,
}: {
  session: SuperAdminUnitBarangMarketingSession;
}) {
  const rows = [...(session.bids ?? [])].sort((left, right) => (left.rank || 0) - (right.rank || 0));

  return (
    <section className="overflow-hidden rounded-xl border border-[#dfe7e2] bg-white shadow-[0_20px_46px_-40px_rgba(8,69,50,0.32)]">
      <div className="border-b border-[#edf2ee] bg-[#fbfcfb] px-4 py-3">
        <h3 className="text-[0.78rem] font-black uppercase tracking-[0.04em] text-[#006747]">
          Bidders Ranking Table (Arsip)
        </h3>
      </div>
      <table className="w-full table-fixed text-left text-[0.72rem]">
        <colgroup>
          <col className="w-[7%]" />
          <col className="w-[25%]" />
          <col className="w-[22%]" />
          <col className="w-[24%]" />
          <col className="w-[22%]" />
        </colgroup>
        <thead>
          <tr className="border-b border-[#edf2ee] bg-[#f8faf9] text-[0.56rem] font-black uppercase tracking-[0.04em] text-[#40558b] sm:text-[0.6rem]">
            <th className="px-2 py-2.5 text-center">#</th>
            <th className="px-2 py-2.5">Nama Peserta</th>
            <th className="px-2 py-2.5">Waktu Penawaran</th>
            <th className="px-2 py-2.5 text-right">Nominal Penawaran</th>
            <th className="px-2 py-2.5 text-center">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#edf2ee] font-bold text-[#111b46]">
          {rows.length ? (
            rows.map((bid) => {
              const rowTone = bid.isWinner ? "bg-[#fff1f2]" : bid.determinesFinalPrice ? "bg-[#fff8e7]" : "bg-white";
              const status = bid.isWinner ? "Gagal / Pelanggaran" : bid.determinesFinalPrice ? "Harga Pembanding" : "Tidak Menang";
              const statusTone = bid.isWinner
                ? "bg-[#b91c1c] text-white"
                : bid.determinesFinalPrice
                  ? "bg-[#f59e0b] text-white"
                  : "bg-[#eef2f0] text-[#40558b]";

              return (
                <tr className={`${rowTone} transition-colors duration-200 hover:bg-[#fef2f2]`} key={bid.id}>
                  <td className="px-2 py-2.5 text-center font-mono text-[#991b1b]">{bid.rank}</td>
                  <td className="break-words px-2 py-2.5 text-[0.68rem] leading-4 sm:text-[0.72rem]">
                    {bid.bidderName}
                  </td>
                  <td className="break-words px-2 py-2.5 font-mono text-[0.62rem] leading-4 text-[#40558b]">
                    {bid.submittedAtLabel}
                  </td>
                  <td className="break-words px-2 py-2.5 text-right font-mono text-[0.68rem] font-black leading-4">
                    {formatSuperAdminOptionalCurrency(bid.amount)}
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <span className={`inline-flex max-w-full items-center justify-center gap-1 rounded-full px-2 py-1 text-[0.55rem] font-black uppercase leading-3 sm:text-[0.58rem] ${statusTone}`}>
                      {bid.isWinner ? <X className="size-3" /> : bid.determinesFinalPrice ? <ReceiptText className="size-3" /> : <CheckCircle2 className="size-3" />}
                      <span className="min-w-0 whitespace-normal break-words text-center">{status}</span>
                    </span>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td className="px-4 py-5 text-center text-[0.78rem] font-semibold leading-5 text-[#52655d]" colSpan={5}>
                Belum ada peserta yang mengirim penawaran.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="border-t border-[#edf2ee] bg-[#fbfcfb] px-4 py-2.5 text-[0.68rem] font-black text-[#40558b]">
        Total {session.participants ?? rows.length} peserta
      </div>
    </section>
  );
}

function SuperAdminVickreyFailureProgressPanel({
  session,
}: {
  session: SuperAdminUnitBarangMarketingSession;
}) {
  const unpaid = getSuperAdminVickreyFailureKind(session) === "unpaid";
  const steps = unpaid
    ? [
        { label: "Pemenang Diumumkan", status: "Selesai", occurredAt: formatSuperAdminDateTime(session.endingAt), icon: Trophy, tone: "done" as const },
        { label: "Gagal Bayar", status: "Terjadi", occurredAt: formatSuperAdminDateTime(session.paymentDeadline), icon: X, tone: "failed" as const },
        { label: "Selesai", status: "Belum tercapai", icon: CheckCircle2, tone: "pending" as const },
      ]
    : [
        { label: "Sesi Ditutup", status: "Selesai", occurredAt: formatSuperAdminDateTime(session.endingAt), icon: CheckCircle2, tone: "done" as const },
        { label: "Tanpa Bid", status: "Terjadi", occurredAt: formatSuperAdminDateTime(session.endingAt), icon: X, tone: "failed" as const },
        { label: "Lelang Ulang", status: "Belum dijadwalkan", icon: RefreshCcw, tone: "pending" as const },
      ];

  return <CompactTransactionProgress steps={steps} title="Progress Penyelesaian" />;
}

function SuperAdminFixedPriceProgressPanel({
  session,
}: {
  session: SuperAdminUnitBarangMarketingSession;
}) {
  const fulfilled = session.transactionStatus === "SELESAI";
  const verified = session.transactionStatus === "LUNAS" || fulfilled;
  const submitted = Boolean(session.transactionId) && !["MENUNGGU_PEMBAYARAN", "GAGAL"].includes(session.transactionStatus ?? "");
  const steps = [
    {
      label: "Pembayaran",
      status: submitted ? "Selesai" : session.transactionId ? "Berjalan" : "Belum terjadi",
      occurredAt: submitted ? formatSuperAdminDateTime(session.transactionCreatedAt) : null,
      icon: WalletCards,
      tone: submitted ? ("done" as const) : session.transactionId ? ("current" as const) : ("pending" as const),
    },
    {
      label: "Verifikasi",
      status: verified ? "Selesai" : submitted ? "Menunggu admin" : "Belum terjadi",
      occurredAt: verified ? formatSuperAdminDateTime(session.soldAt) : null,
      icon: ShieldCheck,
      tone: verified ? ("done" as const) : submitted ? ("current" as const) : ("pending" as const),
    },
    {
      label: "Selesai",
      status: fulfilled ? getSuperAdminProgressCompletionLabel(session) : verified ? "Menunggu buyer" : "Belum terjadi",
      occurredAt: fulfilled ? formatSuperAdminDateTime(session.completedAt) : null,
      icon: CheckCircle2,
      tone: fulfilled ? ("done" as const) : verified ? ("current" as const) : ("pending" as const),
    },
  ];

  return <CompactTransactionProgress steps={steps} title="Progress Penyelesaian" />;
}

function SuperAdminFixedPriceWorkspace({
  session,
}: {
  session: SuperAdminUnitBarangMarketingSession;
}) {
  const sold = session.transactionStatus === "SELESAI" || session.status === "SELESAI" || Boolean(session.soldAt);
  const verified = session.transactionStatus === "LUNAS";
  const hasBuyer = Boolean(session.transactionId || session.buyerName || session.winner);
  const isFailed = session.status === "GAGAL" || session.transactionStatus === "GAGAL";
  const statusTitle = isFailed
    ? "Sesi Harga Tetap Diarsipkan"
    : sold
      ? "Pembelian Harga Tetap Selesai"
      : verified
        ? "Pembayaran Harga Tetap Terverifikasi"
        : hasBuyer
          ? "Bukti Pembayaran Masuk"
          : "Masih Tersedia di Katalog";
  const statusDetail = isFailed
    ? "Iterasi harga tetap ini ditutup tanpa transaksi yang valid dan disimpan sebagai arsip monitoring."
    : sold
      ? isSuperAdminAutoCompleted(session)
        ? "Penjualan harga tetap selesai otomatis setelah masa konfirmasi serah-terima berakhir tanpa komplain."
        : "Penjualan harga tetap sudah selesai dan siap masuk arsip transaksi."
      : verified
        ? getSuperAdminVerifiedDetail(session)
        : hasBuyer
          ? "Buyer sudah mengirim bukti pembayaran. Sesi menunggu verifikasi admin unit."
          : "Barang tersedia di katalog publik dan masih menunggu buyer menyelesaikan pembelian.";

  return (
    <div className="space-y-4" data-testid="superadmin-fixed-price-settlement-layout">
      <section className={cn(
        "rounded-[1.1rem] px-4 py-4 shadow-[0_18px_42px_-36px_rgba(8,69,50,0.28)]",
        isFailed ? "border border-[#fecaca] bg-[#fff1f2]" : "border border-[#b9e4cc] bg-[#f4fcf6]",
      )}>
        <div className="flex items-start gap-4">
          <span className={cn(
            "grid size-14 shrink-0 place-items-center rounded-full text-white",
            isFailed ? "bg-[#b91c1c]" : "bg-[#006747]",
          )}>
            {isFailed ? <AlertTriangle className="size-7" strokeWidth={2.5} /> : <ShoppingBag className="size-7" strokeWidth={2.2} />}
          </span>
          <div className="min-w-0">
            <h2 className={cn(
              "font-headline text-[1rem] font-black uppercase tracking-[0.02em] sm:text-[1.12rem]",
              isFailed ? "text-[#7f1d1d]" : "text-[#075b3f]",
            )}>
              {statusTitle}
            </h2>
            <p className={cn(
              "mt-1 text-[0.8rem] font-semibold leading-5",
              isFailed ? "text-[#9f1239]" : "text-[#2f6a52]",
            )}>
              {statusDetail}
            </p>
          </div>
        </div>
      </section>

      <div
        className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(19rem,0.72fr)]"
        data-testid="superadmin-fixed-price-settlement-primary-grid"
      >
        <div className="space-y-4">
          <section className="rounded-xl border border-[#dfe7e2] bg-white px-4 py-4 shadow-[0_20px_46px_-40px_rgba(8,69,50,0.32)]">
            <p className="text-[0.78rem] font-black uppercase tracking-[0.04em] text-[#006747]">
              Ringkasan Sesi Harga Tetap
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <SuperAdminDetailInfoCard
                icon={ShoppingBag}
                label="Status Sesi"
                value={formatSuperAdminDisplayLabel(session.status)}
              />
              <SuperAdminDetailInfoCard
                icon={CreditCard}
                label="Status Pembayaran"
                value={formatSuperAdminDisplayLabel(session.transactionStatus)}
              />
              <SuperAdminDetailInfoCard
                icon={WalletCards}
                label="Buyer"
                value={session.buyerName || session.winner || "Belum ada pembeli"}
              />
              <SuperAdminDetailInfoCard
                icon={Clock3}
                label="Waktu Sesi"
                value={getSuperAdminMarketingDateLabel(session)}
              />
            </div>
          </section>

          <section className="rounded-xl border border-[#dfe7e2] bg-white px-4 py-4 shadow-[0_20px_46px_-40px_rgba(8,69,50,0.32)]">
            <p className="text-[0.78rem] font-black uppercase tracking-[0.04em] text-[#006747]">
              Harga & Catatan Sesi
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-[#fde2a5] bg-[#fff8e7] px-3.5 py-3">
                <p className="text-[0.66rem] font-black text-[#92400e]">Harga Tetap</p>
                <p className={`mt-2 max-w-full whitespace-nowrap font-headline font-black leading-tight tracking-tight text-[#f59e0b] [font-variant-numeric:tabular-nums] ${getSuperAdminCompactCurrencyTextClass(getSuperAdminMarketingPriceValue(session))}`}>
                  {formatFullCurrency(getSuperAdminMarketingPriceValue(session))}
                </p>
              </div>
              <div className="rounded-lg border border-[#e7ece9] bg-[#f8faf9] px-3.5 py-3">
                <p className="text-[0.66rem] font-black text-[#40558b]">Referensi</p>
                <p className="mt-2 text-[0.9rem] font-black leading-tight text-[#111b46]">
                  {session.reference || "-"}
                </p>
              </div>
            </div>
            <div className="mt-3 rounded-lg border border-[#edf2ee] bg-[#f8faf9] px-3 py-2.5 text-[0.72rem] font-semibold leading-5 text-[#52655d]">
              {session.note || "Belum ada catatan tambahan pada iterasi harga tetap ini."}
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <SuperAdminMarketingArchiveStatusCard
            detail={hasBuyer ? "Data buyer dan status transaksi ditampilkan read-only untuk kebutuhan audit." : "Belum ada pembeli tercatat pada sesi harga tetap ini."}
            eyebrow="Status Transaksi"
            title={hasBuyer ? formatSuperAdminDisplayLabel(session.transactionStatus) : "Belum ada pembeli"}
            tone={isFailed ? "red" : "emerald"}
          />
          {hasBuyer ? <SuperAdminFixedPriceProgressPanel session={session} /> : null}
        </div>
      </div>

      <MarketingPerformancePanel insights={session.insights} testId="superadmin-fixed-price-performance-panel" />

      <div data-testid="superadmin-fixed-price-settlement-handover">
        <SuperAdminHandoverProofAuditCard
          itemTitle={session.lot}
          session={session}
          unitName={session.unitName}
        />
      </div>

      <SuperAdminReadOnlyAuditFooter
        icon={ShieldCheck}
        note="Panel ini hanya untuk monitoring superadmin dan tidak membuka aksi operasional unit."
      />
    </div>
  );
}

function SuperAdminVickreyWorkspace({
  receiptContext,
  session,
}: {
  receiptContext: SuperAdminMarketingReceiptContext;
  session: SuperAdminUnitBarangMarketingSession;
}) {
  const failureArchive = isSuperAdminVickreyFailureArchive(session);
  const verified = isSuperAdminVickreyPaymentVerified(session);
  const fulfilled = isSuperAdminVickreyPaymentFulfilled(session);

  if (failureArchive) {
    const unpaid = getSuperAdminVickreyFailureKind(session) === "unpaid";

    return (
      <div className="space-y-4">
        <SuperAdminVickreyFailureBanner session={session} />
        <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.03fr)_minmax(24rem,0.92fr)]">
          <div className="space-y-4">
            <SuperAdminVickreyFailureProfilePanel session={session} />
            <SuperAdminVickreyFailureMechanismPanel session={session} />
            <SuperAdminVickreyFailureRankingTable session={session} />
          </div>
          <div className="space-y-4 2xl:sticky 2xl:top-4">
            <SuperAdminVickreyFailureProgressPanel session={session} />
            <MarketingPerformancePanel
              insights={session.insights}
              testId="superadmin-vickrey-failure-performance-panel"
            />
            <SuperAdminVickreyFailureActionFooter />
          </div>
        </div>
        <SuperAdminReadOnlyAuditFooter
          icon={ShieldCheck}
          note={
            unpaid
              ? "Riwayat gagal bayar, pelanggaran pemenang, dan ranking bid diarsipkan sebagai bukti audit."
              : "Riwayat sesi tanpa peserta disiapkan menjadi dasar penjadwalan lelang ulang."
          }
        />
      </div>
    );
  }

  if (verified || fulfilled) {
    return (
      <div className="space-y-4" data-testid="superadmin-vickrey-settlement-layout">
        <SuperAdminVickreySettlementBanner session={session} />
        <div
          className="grid gap-4 xl:grid-cols-3"
          data-testid="superadmin-vickrey-settlement-primary-grid"
        >
          <SuperAdminVickreyWinnerProfilePanel session={session} />
          <SuperAdminVickreyProgressPanel session={session} />
          <div className="grid content-start gap-4">
            <SuperAdminVickreyNotePanel session={session} />
            <SuperAdminVickreyActionFooter receiptContext={receiptContext} session={session} />
          </div>
        </div>

        <div
          className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]"
          data-testid="superadmin-vickrey-settlement-secondary-grid"
        >
          <SuperAdminVickreyMechanismPanel session={session} />
          <SuperAdminVickreyRankingTable session={session} />
        </div>

        <MarketingPerformancePanel insights={session.insights} testId="superadmin-vickrey-settlement-performance-panel" />

        <div data-testid="superadmin-vickrey-settlement-handover">
          <SuperAdminHandoverProofAuditCard
            itemTitle={receiptContext.itemTitle}
            session={session}
            unitName={receiptContext.unitName}
          />
        </div>

        <SuperAdminReadOnlyAuditFooter
          icon={ShieldCheck}
          note="Seluruh data dilindungi sistem keamanan berlapis dan ditampilkan read-only untuk kebutuhan audit superadmin."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SuperAdminVickreySettlementBanner session={session} />
      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.03fr)_minmax(24rem,0.92fr)]">
        <div className="space-y-4">
          <SuperAdminVickreyWinnerProfilePanel session={session} />
          <SuperAdminVickreyMechanismPanel session={session} />
          <SuperAdminVickreyRankingTable session={session} />
          <SuperAdminHandoverProofAuditCard
            itemTitle={receiptContext.itemTitle}
            session={session}
            unitName={receiptContext.unitName}
          />
        </div>
        <div className="space-y-4 2xl:sticky 2xl:top-4">
          <SuperAdminVickreyProgressPanel session={session} />
          <MarketingPerformancePanel insights={session.insights} testId="superadmin-vickrey-active-performance-panel" />
          <SuperAdminVickreyNotePanel session={session} />
          <SuperAdminVickreyActionFooter receiptContext={receiptContext} session={session} />
        </div>
      </div>
      <SuperAdminReadOnlyAuditFooter
        icon={ShieldCheck}
        note="Ringkasan sesi, pemenang, dan ranking bid ditampilkan read-only untuk monitoring lintas unit."
      />
    </div>
  );
}

function SuperAdminDetailInfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-[1rem] border border-[#e4ece7] bg-white px-4 py-3.5 shadow-[0_14px_34px_-30px_rgba(8,69,50,0.34)]">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-[#f1f8f4] text-[#007a4d] ring-1 ring-[#d6eadf]">
          <Icon className="size-4" strokeWidth={1.9} />
        </span>
        <div className="min-w-0">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-[#6a7d73]">
            {label}
          </p>
          <div className="mt-1.5 text-[0.95rem] font-bold leading-6 text-[#13211c]">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

function SuperAdminMarketingAuditPanel({
  marketing,
  receiptContext,
}: {
  marketing: SuperAdminUnitBarangMarketingSession | null;
  receiptContext: SuperAdminMarketingReceiptContext;
}) {
  const iterationHistory = getSuperAdminIterationHistory(marketing);
  const [selectedIterationId, setSelectedIterationId] = useState(() => marketing?.id ?? "");

  useEffect(() => {
    setSelectedIterationId(marketing?.id ?? "");
  }, [marketing?.id]);

  if (!marketing) {
    return null;
  }

  const latestIterationId = iterationHistory[0]?.id;
  const selectedIteration =
    iterationHistory.find((entry) => entry.id === selectedIterationId) ?? iterationHistory[0] ?? marketing;
  const selectedStatus = formatSuperAdminDisplayLabel(selectedIteration.status);
  const selectedStatusKey = normalizeUnitDetailOptionValue(selectedIteration.status);
  const selectedIsFailed =
    selectedStatusKey.includes("gagal") || selectedStatusKey.includes("ditolak");
  const selectedIsSettled =
    selectedStatusKey.includes("selesai") ||
    selectedStatusKey.includes("terverifikasi") ||
    selectedStatusKey.includes("menunggu_buyer");
  const selectedIsActive =
    !selectedIsFailed &&
    !selectedIsSettled &&
    (selectedStatusKey.includes("aktif") ||
      selectedStatusKey.includes("menunggu") ||
      selectedStatusKey.includes("jalan") ||
      selectedStatusKey.includes("proses"));
  const isVickrey = getUnitDetailMarketingModeValue(selectedIteration.mode) === "vickrey";
  const iterationOptions: AdminSelectOption[] = iterationHistory.map((entry, index) => ({
    value: entry.id,
    label: `Iterasi ${entry.iteration ?? iterationHistory.length - index}${entry.id === latestIterationId ? " (Terkini)" : ""}`,
  }));

  return (
    <section className="space-y-4 overflow-hidden rounded-[1.15rem] border border-[#d8e8dd] border-l-[5px] border-l-[#008f4a] bg-white px-5 py-5 shadow-[0_22px_58px_-42px_rgba(15,23,42,0.28)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[0.72rem] font-black uppercase tracking-[0.16em] text-[#006747]">
            Riwayat Iterasi Pemasaran
          </p>
          <p className="mt-2 font-headline text-[1.48rem] font-black leading-none text-[#13211c]">
            {marketing.lot}
          </p>
        </div>
        {iterationOptions.length > 1 ? (
          <AdminSelect
            ariaLabel="Pilih iterasi pemasaran"
            className="w-full sm:w-[13.75rem] [&_.admin-select-trigger]:h-11 [&_.admin-select-trigger]:rounded-[0.72rem] [&_.admin-select-trigger]:border-[#d7e0ec] [&_.admin-select-trigger]:bg-[#fbfcfe] [&_.admin-select-trigger]:px-3 [&_.admin-select-trigger]:text-[0.92rem] [&_.admin-select-trigger]:font-semibold [&_.admin-select-trigger]:text-[#192333] [&_.admin-select-trigger]:shadow-[0_12px_28px_-24px_rgba(15,23,42,0.35)] [&_.admin-select-trigger[aria-expanded='true']]:border-[#006747]/45 [&_.admin-select-trigger[aria-expanded='true']]:bg-white [&_.admin-select-trigger[aria-expanded='true']]:shadow-[0_0_0_4px_rgba(189,232,208,0.48),0_18px_38px_-30px_rgba(0,103,71,0.34)] [&_.admin-select-icon]:text-[#15231d] [&_.admin-select-menu]:border-[#d7e0ec] [&_.admin-select-menu]:bg-white [&_.admin-select-menu]:shadow-[0_24px_54px_-34px_rgba(15,23,42,0.26)] [&_.admin-select-option]:min-h-11 [&_.admin-select-option]:rounded-[0.72rem] [&_.admin-select-option]:text-[0.9rem] [&_.admin-select-option]:font-semibold [&_.admin-select-option]:text-[#192333] [&_.admin-select-option:hover]:bg-[#f0f7f3] [&_.admin-select-option[data-active='true']]:bg-[#e7f5ed] [&_.admin-select-check]:text-[#006747]"
            onValueChange={setSelectedIterationId}
            options={iterationOptions}
            value={selectedIteration.id}
          />
        ) : (
          <span className="inline-flex h-9 w-fit items-center gap-2 rounded-[0.45rem] bg-[#eef3f1] px-3.5 text-[0.82rem] font-black text-[#52655d] shadow-[inset_0_1px_0_rgba(255,255,255,0.74)]">
            <FileText className="size-4" />
            Iterasi {selectedIteration.iteration ?? 1}
          </span>
        )}
      </div>

      <div className="mt-5 border-t border-[#e6eee9] pt-5">
        <div className="grid gap-3 rounded-[0.95rem] text-sm sm:grid-cols-[11.5rem_minmax(0,1fr)_11.5rem] sm:items-center">
          <span
            className={cn(
              "inline-flex h-9 w-fit items-center gap-2 rounded-[0.45rem] px-3.5 text-[0.82rem] font-black shadow-[inset_0_1px_0_rgba(255,255,255,0.74)]",
              selectedIsFailed
                ? "bg-[#fff1f1] text-[#b42318]"
                : selectedIsSettled
                  ? "bg-[#eaf8f0] text-[#006747]"
                  : selectedIsActive
                    ? "bg-[#fff6df] text-[#9b5c00]"
                    : "bg-[#eef3f1] text-[#52655d]",
            )}
          >
            <span
              className={cn(
                "relative size-3 rounded-full",
                selectedIsFailed
                  ? "bg-[#d61f1f]"
                  : selectedIsSettled
                    ? "bg-[#00a85a]"
                    : selectedIsActive
                      ? "bg-[#d89b12]"
                      : "bg-[#94a3a0]",
              )}
            >
              <span className="absolute inset-0 rounded-full bg-current opacity-20" />
            </span>
            {selectedStatus}
          </span>
          <span className="min-w-0 truncate font-black text-[#0f172a]">
            {getSuperAdminMarketingSummary(selectedIteration)}
          </span>
          <span className="inline-flex items-center gap-2 font-mono text-[0.76rem] font-black uppercase tracking-[0.04em] text-[#40558b] sm:justify-end">
            <Clock3 className="size-4 shrink-0" />
            {getSuperAdminMarketingDateLabel(selectedIteration)}
          </span>
        </div>
      </div>

      <div className="border-t border-[#e6eee9] pt-5">
        {isVickrey ? (
          <SuperAdminVickreyWorkspace receiptContext={receiptContext} session={selectedIteration} />
        ) : (
          <SuperAdminFixedPriceWorkspace session={selectedIteration} />
        )}
      </div>
    </section>
  );
}

function SuperAdminAssetTimeline({
  history,
  item,
}: {
  history: SuperAdminUnitBarangHistoryEntry[];
  item: SuperAdminUnitBarangDetail["item"];
}) {
  const timelineSourceEntries =
    history.length > 0
      ? history
      : [
          {
            id: `${item.id}-received`,
            barangId: item.id,
            actionLabel: "Barang Diterima Unit",
            actionKey: "input_baru" as const,
            note: "Barang dicatat sebagai aset jaminan unit.",
            actorName: "Admin Unit",
            createdAtLabel: String(item.pawnedAt ?? item.date ?? "-"),
          },
        ];
  const timelineEntries = sortTimelineEntries(timelineSourceEntries);
  const iconMap: Record<SuperAdminUnitBarangHistoryEntry["actionKey"], LucideIcon> = {
    input_baru: PackagePlus,
    perpanjangan: CalendarClock,
    ditebus: ReceiptText,
    dipasarkan: Gavel,
    terjual: BadgeCheck,
    gagal: FileWarning,
  };

  return (
    <aside className="flex h-full max-h-[min(44rem,calc(100vh-8rem))] min-h-0 flex-col overflow-hidden rounded-3xl border border-[#e2ebe6] bg-white shadow-[0_18px_54px_-46px_rgba(8,69,50,0.34)]">
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
          const EntryIcon = iconMap[entry.actionKey] ?? FileText;
          const stamp = String(entry.createdAtLabel ?? "").split(",");

          return (
            <div
              className="relative grid grid-cols-[2.8rem_minmax(0,1fr)_5.8rem] gap-3 py-3.5"
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
              <div className="pt-0.5 text-right text-[0.78rem] leading-6 text-[#667085]">
                <p>{stamp[0]?.trim() || "-"}</p>
                <p>{stamp.slice(1).join(",").trim()}</p>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

export function SuperAdminUnitBarangDetailPage({
  detail,
}: {
  detail: SuperAdminUnitBarangDetail | null;
}) {
  if (!detail) {
    return (
      <Card className="border border-border/70 bg-white p-8">
        <p className="text-muted-foreground">Barang tidak ditemukan pada unit ini.</p>
      </Card>
    );
  }

  const { item, marketing, unit } = detail;
  const itemName = String(item.name ?? "Detail Barang");
  const itemCode = String(item.code ?? item.id);
  const media = Array.isArray(item.media) ? item.media : marketing?.media ?? [];
  const specificationRows = getBarangSpecificationRows(
    String(item.category ?? ""),
    item.specifications ?? {},
  );
  const summaryMetrics = [
    {
      label: "Kategori",
      value: formatUnitDetailCategory(String(item.category ?? "-")),
      icon: Package2,
    },
    {
      label: "Kondisi",
      value: formatSuperAdminDisplayLabel(item.condition),
      icon: ShieldCheck,
    },
    {
      label: "Nilai Taksiran",
      value: formatFullCurrency(Number(item.appraisalValue ?? 0)),
      icon: Landmark,
    },
  ];
  const specificationInfoRows = specificationRows.map((row) => ({
    label: row.label,
    value: row.value || "-",
    icon: getSuperAdminSpecificationIcon(item.category, row.label),
  }));
  const topInfoRows = [
    ...specificationInfoRows,
    { label: "Jatuh Tempo", value: item.dueDate || "-", icon: CalendarClock },
  ].filter(Boolean) as Array<{
    label: string;
    value: ReactNode;
    icon: LucideIcon;
  }>;
  const bottomInfoRows = [
    { label: "Tanggal Gadai", value: item.pawnedAt || item.date || "-", icon: CalendarDays },
    { label: "Nama Nasabah", value: item.ownerName || "-", icon: UserRound },
    { label: "Nomor Telepon Nasabah", value: item.customerNumber || "-", icon: Phone },
  ];

  return (
    <div className="space-y-5">
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-2 text-[0.72rem] font-bold text-[#536279]"
      >
        <span>Superadmin / Detail Barang</span>
        <span className="text-[#c5d1cb]">/</span>
        <Link
          className="transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:text-[#00563b]"
          href={`/superadmin/unit/${unit.id}`}
        >
          {unit.name}
        </Link>
        <span className="text-[#c5d1cb]">/</span>
        <span className="text-[#13211c]">{itemCode}</span>
      </nav>

      <AdminPageHero
        description="Pantau detail barang lintas unit secara read-only, termasuk aset, media, status pemasaran, transaksi, dan riwayat iterasinya."
        eyebrow="Superadmin / Monitoring Unit"
        icon={ShieldCheck}
        rightRail={
          <>
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-[0.72rem] font-black uppercase tracking-[0.14em] ring-1",
                getUnitDetailStatusToneClass(detail.operationalTone),
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  getUnitDetailStatusDotClass(detail.operationalTone),
                )}
              />
              Status {detail.operationalStatus}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/78 px-4 py-2 text-[0.72rem] font-black uppercase tracking-[0.14em] text-[#006747] shadow-[0_16px_34px_-28px_rgba(8,69,50,0.35)] ring-1 ring-[#8fd0a9]/65">
              <Building2 className="size-4" strokeWidth={1.9} />
              {unit.name}
            </span>
          </>
        }
        title={itemName}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_21.5rem]">
        <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
          <div className="space-y-5 p-4 lg:p-5">
            <div className="relative overflow-hidden rounded-[1.35rem] border border-[#dcebe2] bg-[linear-gradient(135deg,rgba(223,242,232,0.88)_0%,rgba(246,250,247,0.94)_48%,rgba(255,255,255,0.98)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] lg:p-5">
              <div className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-[#006747]/[0.055]" />
              <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start">
                <div className="w-full shrink-0 lg:w-[18rem]">
                  <AdminBarangDetailMediaViewer
                    category={formatUnitDetailCategory(String(item.category ?? ""))}
                    media={media}
                    title={itemName}
                  />
                </div>

                <div className="min-w-0 flex-1 space-y-4">
                  <div>
                    <p className="font-headline text-[2rem] font-black tracking-[-0.04em] text-[#14213d] sm:text-[2.45rem]">
                      {itemName}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[0.95rem] text-[#667085]">
                      <span className="font-medium">Kode Barang:</span>
                      <span className="font-medium text-[#0a9f62]">{itemCode}</span>
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
                                  : "text-[0.93rem]",
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

            <div className="space-y-4 rounded-2xl border border-[#eef1ee] bg-[linear-gradient(180deg,#ffffff,#fbfcfb)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)]">
              <div className="space-y-3">
                <p className="text-[0.7rem] font-black uppercase tracking-[0.14em] text-[#6a7d73]">
                  Spesifikasi Barang
                </p>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {topInfoRows.map((row) => (
                  <div
                    className="rounded-[1rem] border border-[#e7eeea] bg-white px-4 py-4 shadow-[0_10px_26px_-24px_rgba(8,69,50,0.24)]"
                    key={row.label}
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-[#f4fbf7] text-[#0a9f62] ring-1 ring-[#d8eadf]">
                        <row.icon className="size-4.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[0.72rem] font-medium text-[#667085]">
                          {row.label}
                        </p>
                        <p className="mt-1.5 break-words text-[0.98rem] font-medium leading-6 text-[#14213d]">
                          {row.value}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              </div>

              <div className="h-px bg-[#eef1ee]" />

              <div className="space-y-3">
                <p className="text-[0.7rem] font-black uppercase tracking-[0.14em] text-[#6a7d73]">
                  Informasi Gadai
                </p>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {bottomInfoRows.map((row) => (
                  <div
                    className="rounded-[1rem] border border-[#e7eeea] bg-white px-4 py-4 shadow-[0_10px_26px_-24px_rgba(8,69,50,0.24)]"
                    key={row.label}
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-[#f4fbf7] text-[#0a9f62] ring-1 ring-[#d8eadf]">
                        <row.icon className="size-4.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[0.72rem] font-medium text-[#667085]">
                          {row.label}
                        </p>
                        <p className="mt-1.5 break-words text-[0.98rem] font-medium leading-6 text-[#14213d]">
                          {row.value}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
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
                  <p className="mt-3 text-[0.96rem] leading-7 text-[#5f6f86]">
                    {item.description || "Belum ada deskripsi barang yang dicatat."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="space-y-4">
          <SuperAdminAssetTimeline history={detail.history} item={item} />
        </div>
      </div>

      {marketing ? (
        <SuperAdminMarketingAuditPanel
          marketing={marketing}
          receiptContext={{
            itemCode,
            itemMedia: media,
            itemTitle: itemName,
            unitAddress: unit.address,
            unitName: unit.name,
          }}
        />
      ) : null}
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

const managementUnitPageSizeOptions = [10, 20, 50] as const;

export function SuperAdminManagementPage({
  units,
  admins,
}: {
  units: SuperAdminUnitListItem[];
  admins: SuperAdminAdminItem[];
}) {
  const [query, setQuery] = useState("");
  const [adminQuery, setAdminQuery] = useState("");
  const [pageSize, setPageSize] = useState<number>(managementUnitPageSizeOptions[0]);
  const [pageIndex, setPageIndex] = useState(0);
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
  const totalPages = Math.max(1, Math.ceil(filteredUnits.length / pageSize));
  const currentPage = Math.min(pageIndex, totalPages - 1);
  const visibleUnits = filteredUnits.slice(currentPage * pageSize, currentPage * pageSize + pageSize);
  const pageStart = filteredUnits.length === 0 ? 0 : currentPage * pageSize + 1;
  const pageEnd = Math.min(filteredUnits.length, (currentPage + 1) * pageSize);
  const activeAdmins = useMemo(() => {
    const normalized = adminQuery.trim().toLowerCase();

    return admins.filter((admin) => {
      if (admin.status !== "Aktif") {
        return false;
      }

      return (
        normalized.length === 0 ||
        admin.name.toLowerCase().includes(normalized) ||
        admin.unit.toLowerCase().includes(normalized) ||
        admin.email.toLowerCase().includes(normalized)
      );
    });
  }, [adminQuery, admins]);
  useEffect(() => {
    setPageIndex(0);
  }, [filteredUnits.length, pageSize, query]);

  return (
    <div className="space-y-6 md:space-y-7">
      <AdminPageHero
        description="Kelola unit, rekening aktif utama, dan admin unit dari data database dalam tampilan ledger yang ringkas."
        eyebrow="Superadmin / Manajemen Unit"
        icon={Building2}
        title="Manajemen Unit"
      />

      <Card className="overflow-hidden border border-[#dfe8e3] bg-white shadow-[0_28px_80px_-68px_rgba(8,69,50,0.32)]">
        <CardContent className="p-0">
          <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <section className="min-w-0">
              <div className="grid gap-3 border-b border-[#e5eee9] bg-[#fbfcfa] px-4 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center lg:px-5">
                <div className="relative min-w-0">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-black/35" />
                  <Input
                    className="h-11 rounded-[1.15rem] bg-white pl-10 text-[0.88rem] font-semibold shadow-[0_16px_34px_-30px_rgba(15,23,42,0.34)]"
                    name="managementSearch"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Cari unit, kode, atau alamat..."
                    value={query}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link className="w-full sm:w-auto" href="/superadmin/manajemen-unit/tambah">
                    <Button
                      className="min-h-10 w-full rounded-[1.05rem] px-4 text-[0.78rem] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] sm:w-auto"
                      type="button"
                    >
                      <Plus className="size-4" />
                      Tambah Unit
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="hidden grid-cols-[minmax(17rem,1.25fr)_minmax(13rem,0.85fr)_minmax(9rem,0.55fr)_9rem] gap-4 border-b border-[#edf2ee] px-5 py-3 text-[0.68rem] font-black uppercase tracking-[0.16em] text-black/38 lg:grid">
                <span>Unit & alamat</span>
                <span>Rekening utama</span>
                <span>Admin/Rekening</span>
                <span className="text-right">Aksi</span>
              </div>

              {filteredUnits.length === 0 ? (
                <EmptyState
                  className="m-5 p-6"
                  description="Coba kata kunci lain atau tambahkan unit baru melalui tombol tambah unit."
                  icon={SearchX}
                  title="Belum ada unit yang sesuai"
                />
              ) : (
                <div className="divide-y divide-[#edf2ee]">
                  {visibleUnits.map((unit) => (
                    <article
                      className="grid gap-4 px-4 py-4 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#f8fbf8] lg:grid-cols-[minmax(17rem,1.25fr)_minmax(13rem,0.85fr)_minmax(9rem,0.55fr)_9rem] lg:items-center lg:px-5"
                      key={unit.id}
                    >
                      <div className="flex min-w-0 gap-3">
                        <span className="grid size-11 shrink-0 place-items-center rounded-[1.05rem] border border-[#d9e8df] bg-[linear-gradient(180deg,#fdfcf8,#edf7ef)] text-[#006747] shadow-[0_18px_34px_-28px_rgba(10,106,73,0.42),inset_0_1px_0_rgba(255,255,255,0.9)]">
                          <Building2 className="size-5" />
                        </span>
                        <div className="min-w-0">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <Link
                              className="min-w-0 truncate font-headline text-[0.98rem] font-black leading-tight tracking-[-0.02em] text-[#13211c] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-[#006747]"
                              href={`/superadmin/manajemen-unit/${unit.id}`}
                            >
                              {unit.name}
                            </Link>
                          </div>
                          <p className="mt-1 text-[0.72rem] font-black uppercase tracking-[0.16em] text-[#006747]">
                            {unit.code}
                          </p>
                          <p className="mt-1 line-clamp-2 text-[0.78rem] font-medium leading-5 text-black/50">
                            {unit.address}
                          </p>
                        </div>
                      </div>

                      <div className="min-w-0">
                        {unit.activeAccount ? (
                          <div className="w-full max-w-full rounded-[1rem] border border-[#dfe8e3] bg-[#f8faf9] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                            <div className="flex min-w-0 items-center gap-2">
                              <Landmark className="size-4 shrink-0 text-[#006747]" />
                              <p className="truncate text-[0.72rem] font-black uppercase tracking-[0.14em] text-[#13211c]">
                                {unit.activeAccount.bankName}
                              </p>
                            </div>
                            <p className="mt-1 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[0.78rem] font-bold text-black/62">
                              {unit.activeAccount.accountNumber}
                            </p>
                            <p className="mt-0.5 truncate text-[0.72rem] font-semibold text-black/42">
                              {unit.activeAccount.accountHolder}
                            </p>
                          </div>
                        ) : (
                          <div className="rounded-[1rem] border border-dashed border-[#dfe8e3] bg-[#fbfcfa] px-3 py-3 text-[0.78rem] font-semibold text-black/45">
                            Belum ada rekening utama aktif.
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                        <div className="flex items-center gap-2 rounded-[0.95rem] bg-[#f6faf7] px-3 py-2 text-[0.78rem] font-bold text-[#13211c]">
                          <UsersRound className="size-4 shrink-0 text-[#006747]" />
                          {unit.adminCount} Admin
                        </div>
                        <div className="flex items-center gap-2 rounded-[0.95rem] bg-[#f6faf7] px-3 py-2 text-[0.78rem] font-bold text-[#13211c]">
                          <CreditCard className="size-4 shrink-0 text-[#006747]" />
                          {unit.accountCount} Rekening
                        </div>
                      </div>

                      <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                        <DetailActionLink
                          className="w-full sm:w-auto"
                          href={`/superadmin/manajemen-unit/${unit.id}`}
                        />
                      </div>
                    </article>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-3 border-t border-[#e5eee9] bg-[#fbfcfa] px-4 py-3 text-[0.72rem] font-semibold text-black/48 lg:flex-row lg:items-center lg:justify-between lg:px-5">
                <p>
                  Menampilkan <span className="font-black text-[#13211c]">{pageStart}</span> sampai{" "}
                  <span className="font-black text-[#13211c]">{pageEnd}</span> dari{" "}
                  <span className="font-black text-[#13211c]">{filteredUnits.length}</span> unit
                </p>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <label className="font-bold text-black/45" htmlFor="management-unit-page-size">
                    Baris per halaman:
                  </label>
                  <AdminSelect
                    ariaLabel="Baris per halaman unit"
                    className="min-w-[4.8rem]"
                    id="management-unit-page-size"
                    options={managementUnitPageSizeOptions.map((size) => ({
                      value: size,
                      label: String(size),
                    }))}
                    placement="top"
                    size="compact"
                    value={pageSize}
                    onValueChange={(nextValue) => {
                      setPageSize(Number(nextValue));
                      setPageIndex(0);
                    }}
                  />
                  <div className="ml-0 flex max-w-full flex-wrap items-center gap-1 lg:ml-3">
                    <button
                      aria-label="Halaman sebelumnya"
                      className="grid size-10 place-items-center rounded-xl text-black/42 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white hover:text-[#0a6a49] disabled:cursor-not-allowed disabled:opacity-35 md:size-8"
                      disabled={currentPage === 0}
                      type="button"
                      onClick={() => setPageIndex(Math.max(0, currentPage - 1))}
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, index) => (
                      <button
                        aria-current={index === currentPage ? "page" : undefined}
                        className={cn(
                          "grid size-8 place-items-center rounded-xl text-[0.72rem] font-black transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                          "size-10 md:size-8",
                          index === currentPage
                            ? "border border-[#0a6a49]/15 bg-white text-[#0a6a49] shadow-[0_16px_30px_-26px_rgba(10,106,73,0.46),inset_0_1px_0_rgba(255,255,255,0.9)]"
                            : "text-black/52 hover:bg-white hover:text-[#0a6a49]"
                        )}
                        key={index}
                        type="button"
                        onClick={() => setPageIndex(index)}
                      >
                        {index + 1}
                      </button>
                    ))}
                    <button
                      aria-label="Halaman berikutnya"
                      className="grid size-10 place-items-center rounded-xl text-black/42 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white hover:text-[#0a6a49] disabled:cursor-not-allowed disabled:opacity-35 md:size-8"
                      disabled={currentPage >= totalPages - 1}
                      type="button"
                      onClick={() => setPageIndex(Math.min(totalPages - 1, currentPage + 1))}
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <aside className="border-t border-[#e5eee9] bg-white px-4 py-5 xl:border-l xl:border-t-0 lg:px-5">
              <div className="border-b border-[#edf2ee] pb-3">
                <div>
                  <p className="page-heading-eyebrow">Admin Aktif</p>
                  <h3 className="mt-1 font-headline text-[1.05rem] font-black tracking-[-0.02em] text-[#13211c]">
                    Admin unit aktif
                  </h3>
                </div>
                <label className="relative mt-3 block">
                  <span className="sr-only">Cari admin unit aktif</span>
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-black/35" />
                  <Input
                    aria-label="Cari admin unit aktif"
                    className="h-10 rounded-[1rem] bg-[#f8faf9] pl-9 text-[0.78rem] font-semibold"
                    name="activeAdminSearch"
                    onChange={(event) => setAdminQuery(event.target.value)}
                    placeholder="Cari nama, unit, atau email..."
                    value={adminQuery}
                  />
                </label>
              </div>

              <div className="mt-4 space-y-3">
                {activeAdmins.length === 0 ? (
                  <EmptyState
                    className="p-5"
                    description={
                      adminQuery
                        ? "Coba gunakan nama, unit, atau email admin yang berbeda."
                        : "Admin unit aktif yang tersimpan di database akan muncul sebagai feed singkat."
                    }
                    icon={UserCog}
                    title={adminQuery ? "Admin tidak ditemukan" : "Belum ada admin aktif"}
                  />
                ) : (
                  activeAdmins.slice(0, 6).map((admin) => (
                    <div
                      className="group flex items-center justify-between gap-3 rounded-[1.05rem] px-2 py-2 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#f6faf7]"
                      key={admin.id}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full border border-[#d9e8df] bg-[#f8faf9] font-headline text-[0.72rem] font-black text-[#006747] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:border-[#006747]/35">
                          {getSuperAdminInitials(admin.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[0.82rem] font-black text-[#13211c]">
                            {admin.name}
                          </p>
                          <p className="mt-0.5 truncate text-[0.72rem] font-semibold text-black/45">
                            {admin.unit}
                          </p>
                          <p className="mt-0.5 flex min-w-0 items-center gap-1.5 truncate text-[0.7rem] font-semibold text-black/38">
                            <Mail className="size-3.5 shrink-0" />
                            <span className="truncate">{admin.email}</span>
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#edf7ef] px-2 py-1 text-[0.62rem] font-black uppercase tracking-[0.12em] text-[#006747]">
                        <BadgeCheck className="size-3.5" />
                        Aktif
                      </span>
                    </div>
                  ))
                )}
              </div>
            </aside>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function SuperAdminCreateUnitPage() {
  return (
    <div className="space-y-5 md:space-y-6">
      <Link
        className="inline-flex items-center gap-2 text-[0.72rem] font-black uppercase tracking-[0.12em] text-[#0a6a49] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-[#064b35]"
        href="/superadmin/manajemen-unit"
      >
        <ArrowLeft className="size-3.5" />
        Kembali ke Daftar Unit Pelaksana
      </Link>

      <AdminPageHero
        description="Lengkapi profil unit, rekening operasional, dan admin penanggung jawab dalam satu setup compact yang tersambung ke data sistem."
        eyebrow="Superadmin / Tambah Unit"
        icon={Building2}
        rightRail={
          <>
            <SuperAdminHeroPill icon={Landmark}>Rekening utama aktif</SuperAdminHeroPill>
            <SuperAdminHeroPill icon={UserCog}>Admin penanggung jawab</SuperAdminHeroPill>
          </>
        }
        title="Registrasi & Setup Unit Pelaksana Baru"
      />

      <UnitForm showTitle={false} />
    </div>
  );
}

export function SuperAdminPolicyPage() {
  return (
    <div className="space-y-6">
      <AdminPageHero
        description="Referensi read-only untuk sanksi progresif buyer yang gagal membayar transaksi Lelang Tertutup dalam 24 jam."
        eyebrow="Superadmin / Kebijakan"
        icon={UserCog}
        title="Kebijakan Pelanggaran"
      />

      <section className="grid gap-5 xl:grid-cols-3">
        <article className="flex min-h-[31.5rem] flex-col rounded-[1.35rem] border border-[#d8e4de] bg-white p-5 text-center shadow-[0_24px_72px_-58px_rgba(8,69,50,0.46)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5">
          <span className="mx-auto inline-flex min-w-[12rem] justify-center rounded-full border border-amber-300 bg-amber-50 px-5 py-2 text-sm font-black uppercase tracking-[0.02em] text-orange-600">
            TIER 1 - STRIKE ONE
          </span>

          <div className="mt-8 flex flex-1 flex-col">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-amber-50 text-orange-500 ring-1 ring-amber-100">
              <AlertTriangle className="size-8" strokeWidth={2.1} />
            </span>
            <h3 className="mt-7 font-headline text-2xl font-black tracking-[-0.03em] text-[#111827]">
              Pelanggaran Pertama
            </h3>
            <p className="mx-auto mt-3 max-w-xs text-sm font-semibold leading-6 text-[#42526b]">
              No payment within 24 hours.
            </p>

            <div className="mt-10 border-t border-[#dce2e6] pt-5">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#42526b]">
                Konsekuensi
              </p>
              <div className="mt-4 space-y-3 text-left">
                <div className="flex items-center gap-4 rounded-[0.9rem] border border-amber-200 bg-amber-50/45 px-4 py-3.5 text-orange-600">
                  <Ban className="size-7 shrink-0" strokeWidth={2.2} />
                  <p className="text-sm font-black uppercase">
                    Bid Lelang: Ban 7 Hari
                  </p>
                </div>
                <div className="flex items-center gap-4 rounded-[0.9rem] border border-[#cfe8d8] bg-[#f5fbf7] px-4 py-3.5 text-[#006747]">
                  <CheckCircle2 className="size-7 shrink-0" strokeWidth={2.2} />
                  <p className="text-sm font-black uppercase">
                    Harga Tetap: Aktif
                  </p>
                </div>
              </div>
              <p className="mt-7 flex items-center justify-center gap-2 text-sm font-semibold text-[#42526b]">
                <Info className="size-4 shrink-0" />
                Ini adalah tingkat akumulasi pertama.
              </p>
            </div>
          </div>
        </article>

        <article className="flex min-h-[31.5rem] flex-col rounded-[1.35rem] border border-[#d8e4de] bg-white p-5 text-center shadow-[0_24px_72px_-58px_rgba(8,69,50,0.46)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5">
          <span className="mx-auto inline-flex min-w-[12rem] justify-center rounded-full bg-orange-500 px-5 py-2 text-sm font-black uppercase tracking-[0.02em] text-white shadow-[0_16px_30px_-24px_rgba(249,115,22,0.82)]">
            TIER 2 - STRIKE TWO
          </span>

          <div className="mt-8 flex flex-1 flex-col">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-orange-50 text-orange-500 ring-1 ring-orange-100">
              <AlertTriangle className="size-8" strokeWidth={2.1} />
            </span>
            <h3 className="mt-7 font-headline text-2xl font-black tracking-[-0.03em] text-[#111827]">
              Pelanggaran Kedua
              <br />
              (Akumulasi 2x)
            </h3>
            <p className="mx-auto mt-3 max-w-xs text-sm font-semibold leading-6 text-[#42526b]">
              Akumulasi pelanggaran berulang karena gagal melakukan pembayaran.
            </p>

            <div className="mt-8 border-t border-[#dce2e6] pt-5">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#42526b]">
                Konsekuensi
              </p>
              <div className="mt-4 space-y-3 text-left">
                <div className="flex items-center gap-4 rounded-[0.9rem] border border-orange-200 bg-orange-50/50 px-4 py-3.5 text-orange-600">
                  <Ban className="size-7 shrink-0" strokeWidth={2.2} />
                  <p className="text-sm font-black uppercase">
                    Bid Lelang: Ban Total 30 Hari
                  </p>
                </div>
                <div className="flex items-center gap-4 rounded-[0.9rem] border border-orange-200 bg-orange-50/50 px-4 py-3.5 text-orange-600">
                  <Ban className="size-7 shrink-0" strokeWidth={2.2} />
                  <p className="text-sm font-black uppercase">
                    Harga Tetap: Ban Total 30 Hari
                  </p>
                </div>
                <div className="flex items-center gap-4 rounded-[0.9rem] border border-orange-300 bg-orange-50/60 px-4 py-3.5 text-orange-700">
                  <AlertTriangle className="size-7 shrink-0" strokeWidth={2.1} />
                  <p className="text-sm font-semibold leading-5">
                    Pelanggaran berikutnya memicu sanksi Kritis Tier 3 (Lock
                    Akses Login)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </article>

        <article className="flex min-h-[31.5rem] flex-col rounded-[1.35rem] border border-[#d8e4de] bg-white p-5 text-center shadow-[0_24px_72px_-58px_rgba(8,69,50,0.46)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5">
          <span className="mx-auto inline-flex min-w-[12rem] justify-center rounded-full bg-red-600 px-5 py-2 text-sm font-black uppercase tracking-[0.02em] text-white shadow-[0_16px_30px_-24px_rgba(220,38,38,0.82)]">
            TIER 3 - SYSTEM REJECTION
          </span>

          <div className="mt-8 flex flex-1 flex-col">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-red-50 text-red-600 ring-1 ring-red-100">
              <LockKeyhole className="size-8" strokeWidth={2.1} />
            </span>
            <h3 className="mt-7 font-headline text-2xl font-black tracking-[-0.03em] text-[#111827]">
              Pelanggaran Ketiga
              <br />
              (Akumulasi 3x)
            </h3>

            <div className="mt-[4.85rem] border-t border-[#dce2e6] pt-5">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#42526b]">
                Konsekuensi
              </p>
              <div className="mt-4 rounded-[0.9rem] border border-red-200 bg-red-50/50 p-5 text-center text-red-600">
                <span className="mx-auto grid size-14 place-items-center rounded-full border border-red-400 bg-white text-red-600">
                  <LockKeyhole className="size-7" strokeWidth={2.2} />
                </span>
                <p className="mt-5 font-headline text-2xl font-black uppercase leading-tight tracking-[-0.02em]">
                  Ban Total 360 Hari
                  <br />
                  + Lock Login Access
                </p>
                <p className="mt-4 text-sm font-semibold text-[#42526b]">
                  Dilarang masuk ke aplikasi sama sekali.
                </p>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-[1.35rem] border border-[#8fd0a9] bg-white p-6 shadow-[0_18px_48px_-42px_rgba(8,69,50,0.34)]">
        <div className="grid gap-5 md:grid-cols-[10rem_minmax(0,1fr)] md:items-center">
          <div className="relative mx-auto grid size-28 place-items-center text-[#0a6a49]">
            <Sparkles className="absolute left-0 top-6 size-5 text-[#0a6a49]/70" />
            <Sparkles className="absolute right-3 top-1 size-4 text-[#0a6a49]/70" />
            <ShieldCheck className="size-24" strokeWidth={1.75} />
          </div>
          <div className="space-y-3">
            <h3 className="font-headline text-xl font-black uppercase tracking-[0.03em] text-[#00563b]">
              Pemulihan Otomatis
            </h3>
            <p className="max-w-5xl text-sm font-semibold leading-7 text-[#42526b]">
              Sistem mengakhiri pembatasan setiap level sesuai tanggal
              berakhirnya. Akun Level 3 yang ditangguhkan akan diaktifkan
              kembali otomatis setelah periode 365 hari selesai.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

const monitoringItemsPerPage = 10;
const monitoringChartSeries = [
  {
    key: "collateralItems",
    label: "Barang Jaminan",
    barClass: "bg-[#f59e0b]",
    dotClass: "bg-[#f59e0b]",
  },
  {
    key: "marketedItems",
    label: "Sedang Dipasarkan",
    barClass: "bg-[#007a4d]",
    dotClass: "bg-[#007a4d]",
  },
  {
    key: "soldItems",
    label: "Terjual",
    barClass: "bg-[#2563eb]",
    dotClass: "bg-[#2563eb]",
  },
] as const;

type MonitoringChartSeriesKey = (typeof monitoringChartSeries)[number]["key"];
const monitoringChartToneClasses: Record<
  MonitoringChartSeriesKey,
  { pill: string; row: string; value: string }
> = {
  collateralItems: {
    pill: "bg-[#fff7e6] text-[#c97900]",
    row: "bg-[#fff9ed]",
    value: "text-[#c97900]",
  },
  marketedItems: {
    pill: "bg-[#eef8f3] text-[#00563b]",
    row: "bg-[#f5faf7]",
    value: "text-[#00563b]",
  },
  soldItems: {
    pill: "bg-[#eef4ff] text-[#1d4ed8]",
    row: "bg-[#f5f8ff]",
    value: "text-[#1d4ed8]",
  },
};
type MonitoringChartTooltip = {
  anchorX: number;
  id: string;
  key: MonitoringChartSeriesKey;
  label: string;
  row: SuperAdminMonitoringUnitRow;
  value: number;
};

function getCompactUnitName(name: string) {
  return name.replace(/^Pegadaian\s+/i, "");
}

export function SuperAdminMonitoringPage({
  data,
  serverNow,
}: {
  data: SuperAdminMonitoringData;
  serverNow?: string;
}) {
  const unitRows = useMemo(() => data.unitRows ?? [], [data.unitRows]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeMetricIndex, setActiveMetricIndex] = useState<number | null>(null);
  const [activeChartTooltip, setActiveChartTooltip] =
    useState<MonitoringChartTooltip | null>(null);
  const [monitoringRange, setMonitoringRange] =
    useState<SuperAdminValidatedTrendRangeKey | "custom">("month");
  const [monitoringCustomRange, setMonitoringCustomRange] =
    useState<ReportCustomRange | null>(null);
  const chartPlotRef = useRef<HTMLDivElement | null>(null);
  const filteredUnitRows = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return unitRows.filter(
      (row) =>
        !normalizedQuery ||
        row.unitName.toLowerCase().includes(normalizedQuery) ||
        row.unitCode.toLowerCase().includes(normalizedQuery),
    );
  }, [searchQuery, unitRows]);
  const totalPages = Math.max(
    1,
    Math.ceil(filteredUnitRows.length / monitoringItemsPerPage),
  );
  const paginatedUnitRows = filteredUnitRows.slice(
    (currentPage - 1) * monitoringItemsPerPage,
    currentPage * monitoringItemsPerPage,
  );
  const visiblePageNumbers = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  ).filter(
    (page) =>
      totalPages <= 5 ||
      Math.abs(page - currentPage) <= 2 ||
      page === 1 ||
      page === totalPages,
  );
  const currentPageStart =
    filteredUnitRows.length === 0
      ? 0
      : (currentPage - 1) * monitoringItemsPerPage + 1;
  const currentPageEnd = Math.min(
    currentPage * monitoringItemsPerPage,
    filteredUnitRows.length,
  );
  const maxChartValue = Math.max(
    1,
    ...filteredUnitRows.flatMap((row) =>
      monitoringChartSeries.map((series) => Number(row[series.key] ?? 0)),
    ),
  );
  const chartMinWidth = Math.max(920, filteredUnitRows.length * 128);
  const activeUnitCount = unitRows.length;
  const topMarketedUnit = [...unitRows].sort(
    (left, right) =>
      Number(right.marketedItems ?? 0) - Number(left.marketedItems ?? 0),
  )[0];
  const itemMonitoringMetrics = [
    {
      label: "Barang Jaminan",
      value: unitRows.reduce(
        (sum, row) => sum + Number(row.collateralItems ?? 0),
        0,
      ),
      detail:
        unitRows.length > 0
          ? `Tercatat pada ${formatDashboardCount(unitRows.length)} unit`
          : "Belum ada unit tercatat",
      icon: Package,
      iconClass: "bg-amber-50 text-amber-700 ring-amber-100",
      valueClass: "text-[#13211c]",
      tooltipRows: [
        {
          label: "Unit tercatat",
          value: formatDashboardCount(unitRows.length),
        },
        {
          label: "Unit aktif",
          value: formatDashboardCount(activeUnitCount),
        },
      ],
    },
    {
      label: "Sedang Dipasarkan",
      value: unitRows.reduce(
        (sum, row) => sum + Number(row.marketedItems ?? 0),
        0,
      ),
      detail:
        topMarketedUnit && Number(topMarketedUnit.marketedItems) > 0
          ? `Tertinggi di ${getCompactUnitName(topMarketedUnit.unitName)}`
          : "Belum ada barang dipasarkan",
      icon: Megaphone,
      iconClass: "bg-emerald-50 text-[#007a4d] ring-emerald-100",
      valueClass: "text-[#13211c]",
      tooltipRows: [
        {
          label: "Unit tertinggi",
          value: topMarketedUnit
            ? getCompactUnitName(topMarketedUnit.unitName)
            : "-",
        },
        {
          label: "Barang tertinggi",
          value: formatDashboardCount(topMarketedUnit?.marketedItems ?? 0),
        },
      ],
    },
    {
      label: "Terjual",
      value: unitRows.reduce(
        (sum, row) => sum + Number(row.soldItems ?? 0),
        0,
      ),
      detail: "Selesai dari transaksi terverifikasi",
      icon: BadgeCheck,
      iconClass: "bg-[#e8f3ec] text-[#007a4d] ring-[#cfe8d8]",
      valueClass: "text-[#13211c]",
      tooltipRows: [
        {
          label: "Nilai tervalidasi",
          value: formatCompactCurrency(
            unitRows.reduce(
              (sum, row) => sum + Number(row.validatedTransactionValue ?? 0),
              0,
            ),
          ),
        },
        {
          label: "Basis data",
          value: "Transaksi lunas / selesai",
        },
      ],
    },
  ];
  const activeChartRows = activeChartTooltip
    ? monitoringChartSeries.map((series) => ({
        ...series,
        rowClass:
          activeChartTooltip.key === series.key
            ? monitoringChartToneClasses[series.key].row
            : "bg-white",
        value: Number(activeChartTooltip.row[series.key] ?? 0),
        valueClass:
          activeChartTooltip.key === series.key
            ? monitoringChartToneClasses[series.key].value
            : "text-[#13211c]",
      }))
    : [];
  const activeChartTone = activeChartTooltip
    ? monitoringChartToneClasses[activeChartTooltip.key]
    : null;
  const setAnchoredChartTooltip = (
    event: ReactFocusEvent<HTMLButtonElement> | ReactMouseEvent<HTMLButtonElement>,
    tooltip: Omit<MonitoringChartTooltip, "anchorX">,
  ) => {
    const plotRect = chartPlotRef.current?.getBoundingClientRect();
    const targetRect = event.currentTarget.getBoundingClientRect();
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const rawAnchorX = plotRect ? targetCenterX - plotRect.left : targetCenterX;
    const anchorX = Math.min(Math.max(rawAnchorX, 156), chartMinWidth - 156);

    setActiveChartTooltip({
      ...tooltip,
      anchorX,
    });
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  return (
    <div className="space-y-5 lg:space-y-6">
      <AdminPageHero
        description="Bandingkan distribusi barang lintas unit dari data database: barang jaminan, pemasaran aktif, dan penjualan."
        eyebrow="Superadmin / Monitoring Unit"
        icon={ShieldCheck}
        title="Monitoring Unit"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {itemMonitoringMetrics.map((metric, index) => {
          const Icon = metric.icon;

          return (
            <Card
              aria-describedby={
                activeMetricIndex === index
                  ? `monitoring-metric-tooltip-${index}`
                  : undefined
              }
              aria-label={`Ringkasan ${metric.label}`}
              className="relative border border-border/70 bg-white p-5 shadow-[0_18px_55px_-44px_rgba(8,69,50,0.45)] outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2"
              key={metric.label}
              onBlur={() => setActiveMetricIndex(null)}
              onFocus={() => setActiveMetricIndex(index)}
              style={{ animationDelay: `${index * 70}ms` }}
              tabIndex={0}
            >
              <div className="flex items-start gap-4">
                <span
                  className={cn(
                    "grid size-14 shrink-0 place-items-center rounded-full ring-1",
                    metric.iconClass,
                  )}
                >
                  <Icon className="size-6" strokeWidth={1.9} />
                </span>
                <div className="min-w-0">
                  <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-[#273954]">
                    {metric.label}
                  </p>
                  <p
                    className={cn(
                      "mt-2 font-headline text-4xl font-black tracking-[-0.04em]",
                      metric.valueClass,
                    )}
                  >
                    {formatDashboardCount(metric.value)}
                  </p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-[#536279]">
                    {metric.detail}
                  </p>
                </div>
              </div>
              {activeMetricIndex === index ? (
                <div
                  className="pointer-events-none absolute left-5 right-5 top-[calc(100%-0.35rem)] z-[3] rounded-[0.95rem] border border-[#cfe7d8] bg-white px-3.5 py-3 text-left shadow-[0_22px_50px_-30px_rgba(0,82,45,0.45)] ring-1 ring-white/70"
                  id={`monitoring-metric-tooltip-${index}`}
                  role="tooltip"
                >
                  <div className="absolute left-8 top-0 size-3 -translate-y-1/2 rotate-45 border-l border-t border-[#cfe7d8] bg-white" />
                  <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-[#6a7d73]">
                    {metric.label}
                  </p>
                  <p className="mt-1 font-headline text-lg font-black leading-none text-[#00563b]">
                    {formatDashboardCount(metric.value)} item
                  </p>
                  <div className="mt-3 grid gap-2 text-[0.72rem] font-bold text-[#52615d]">
                    {metric.tooltipRows.map((row) => (
                      <div
                        className="flex items-center justify-between gap-3 rounded-[0.72rem] bg-[#f5faf7] px-2.5 py-2"
                        key={row.label}
                      >
                        <span>{row.label}</span>
                        <span className="text-right font-black text-[#00563b]">
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>

      <Card className="border border-border/70 bg-white shadow-[0_24px_80px_-68px_rgba(8,69,50,0.45)]">
        <CardHeader className="gap-4 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10">
              <BarChart3 className="size-4" strokeWidth={2} />
            </span>
            <CardTitle>Grafik Barang pada Tiap Unit</CardTitle>
          </div>
          <ReportRangeDropdown
            ariaLabel="Filter grafik barang tiap unit"
            customRange={monitoringCustomRange}
            onApplyCustomRange={(nextRange) => {
              setMonitoringCustomRange(nextRange);
              setMonitoringRange("custom");
            }}
            onChange={(nextRange) => {
              setMonitoringRange(nextRange);
              setMonitoringCustomRange(null);
            }}
            options={dashboardTrendRangeOptions}
            value={monitoringRange}
          />
        </CardHeader>
        <CardContent className="relative space-y-4 pt-5">
          {filteredUnitRows.length === 0 ? (
            <EmptyState
              className="p-6"
              description="Tidak ada unit yang sesuai dengan filter saat ini."
              icon={Building2}
              title="Belum ada data unit"
            />
          ) : (
            <div className="overflow-x-auto pb-2">
              <span
                aria-label="Grafik barang pada tiap unit"
                className="sr-only"
                role="img"
              >
                Grafik komparasi barang jaminan, barang dipasarkan, dan barang
                terjual pada setiap unit.
              </span>
              <div
                className="relative h-[18.5rem]"
                ref={chartPlotRef}
                style={{ minWidth: `${chartMinWidth}px` }}
              >
                <div className="absolute inset-x-0 bottom-[4.6rem] top-5 flex flex-col justify-between">
                  {[4, 3, 2, 1, 0].map((tick) => (
                    <div className="flex items-center gap-3" key={tick}>
                      <span className="w-8 text-right text-xs font-semibold text-[#435476]">
                        {Math.round((maxChartValue / 4) * tick)}
                      </span>
                      <span className="h-px flex-1 border-t border-dashed border-[#dce5ef]" />
                    </div>
                  ))}
                </div>
                <div className="relative ml-11 flex h-full items-end gap-5 px-2 pb-12 pt-8">
                  {filteredUnitRows.map((row) => (
                    <div
                      className="flex min-w-[6.4rem] flex-1 flex-col items-center"
                      key={row.id}
                    >
                      <div className="flex h-40 items-end justify-center gap-1.5">
                        {monitoringChartSeries.map((series) => {
                          const value = Number(row[series.key] ?? 0);
                          const height = value > 0
                            ? Math.max((value / maxChartValue) * 100, 8)
                            : 1;
                          const tooltipId = `${row.id}-${series.key}`;
                          const active =
                            activeChartTooltip?.id === tooltipId;

                          return (
                            <div
                              className="flex h-full flex-col items-center justify-end gap-1"
                              key={series.key}
                            >
                              {(value > 0 || filteredUnitRows.length <= 8) ? (
                                <span className="text-[0.68rem] font-black text-[#13211c]">
                                  {formatDashboardCount(value)}
                                </span>
                              ) : null}
                              <div className="relative h-full w-4">
                                <button
                                  aria-describedby={
                                    active
                                      ? "monitoring-chart-tooltip"
                                      : undefined
                                  }
                                  aria-label={`${series.label} ${row.unitName}: ${formatDashboardCount(value)} item`}
                                  className={cn(
                                    "absolute bottom-0 left-0 w-4 rounded-t-md border border-white/50 outline-none shadow-[0_10px_18px_-14px_rgba(15,23,42,0.5)] transition-[height,opacity,transform,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-x-125 hover:opacity-95 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2",
                                    value > 0
                                      ? series.barClass
                                      : "bg-[#dfe6ee]",
                                    active && "scale-x-125 opacity-95",
                                  )}
                                  onBlur={() => setActiveChartTooltip(null)}
                                  onFocus={(event) =>
                                    setAnchoredChartTooltip(event, {
                                      id: tooltipId,
                                      key: series.key,
                                      label: series.label,
                                      row,
                                      value,
                                    })
                                  }
                                  onMouseEnter={(event) =>
                                    setAnchoredChartTooltip(event, {
                                      id: tooltipId,
                                      key: series.key,
                                      label: series.label,
                                      row,
                                      value,
                                    })
                                  }
                                  onMouseLeave={() => setActiveChartTooltip(null)}
                                  style={{ height: `${height}%` }}
                                  type="button"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <p className="mt-3 w-28 truncate text-center text-xs font-bold text-[#273954]">
                        {getCompactUnitName(row.unitName)}
                      </p>
                      <p className="mt-0.5 text-center text-[0.62rem] font-bold uppercase tracking-[0.08em] text-[#536279]">
                        ({row.unitCode})
                      </p>
                    </div>
                  ))}
                </div>
                {activeChartTooltip ? (
                  <div
                    className="pointer-events-none absolute top-4 z-[4] w-[18.75rem] max-w-[calc(100%_-_2rem)] -translate-x-1/2 rounded-[1.05rem] border border-[#cfe7d8] bg-white p-4 text-left shadow-[0_24px_62px_-34px_rgba(0,82,45,0.48)] ring-1 ring-white/70"
                    id="monitoring-chart-tooltip"
                    role="tooltip"
                    style={{ left: `${activeChartTooltip.anchorX}px` }}
                  >
                    <div className="absolute left-1/2 top-full size-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-[#cfe7d8] bg-white" />
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-[#6a7d73]">
                          {activeChartTooltip.row.unitCode}
                        </p>
                        <p className="mt-1 truncate text-[0.8rem] font-bold text-[#5b6d63]">
                          {getCompactUnitName(activeChartTooltip.row.unitName)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-[0.7rem] font-black",
                          activeChartTone?.pill,
                        )}
                      >
                        {formatDashboardCount(activeChartTooltip.value)} item
                      </span>
                    </div>

                    <p className="mt-3 text-[0.68rem] font-black uppercase tracking-[0.14em] text-[#6a7d73]">
                      {activeChartTooltip.label}
                    </p>
                    <p
                      className={cn(
                        "mt-1 font-headline text-[1.55rem] font-black leading-none",
                        activeChartTone?.value,
                      )}
                    >
                      {formatDashboardCount(activeChartTooltip.value)} item
                    </p>

                    <div className="mt-3 grid gap-2 text-[0.78rem] font-bold text-[#52615d]">
                      {activeChartRows.map((series) => (
                        <div
                          className={cn(
                            "flex items-center justify-between gap-3 rounded-[0.82rem] px-3 py-2.5 ring-1 ring-[#e2ece5]",
                            series.rowClass,
                          )}
                          key={series.key}
                        >
                          <span className="inline-flex items-center gap-2">
                            <span
                              className={cn(
                                "size-2.5 rounded-[0.2rem]",
                                series.dotClass,
                              )}
                            />
                            {series.label}
                          </span>
                          <span className={cn("font-black", series.valueClass)}>
                            {formatDashboardCount(series.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
          <div className="flex flex-wrap justify-center gap-5 border-t border-border/60 pt-4 text-xs font-bold text-[#536279]">
            {monitoringChartSeries.map((series) => (
              <span className="inline-flex items-center gap-2" key={series.key}>
                <span className={cn("size-2.5 rounded-sm", series.dotClass)} />
                {series.label}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border border-border/70 bg-white shadow-[0_24px_80px_-68px_rgba(8,69,50,0.45)]">
        <CardHeader className="gap-4 border-b border-border/60 bg-[linear-gradient(180deg,#ffffff,#fbfcfb)] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10">
              <ListChecks className="size-4" strokeWidth={2} />
            </span>
            <CardTitle>Daftar Komparasi Unit</CardTitle>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#536279]" />
            <Input
              aria-label="Cari unit atau kode cabang"
              className="h-10 rounded-xl border-border/70 bg-white pl-9 text-sm"
              placeholder="Cari unit atau kode cabang..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredUnitRows.length === 0 ? (
            <EmptyState
              className="p-8"
              description="Tidak ada unit yang cocok dengan pencarian."
              icon={SearchX}
              title="Unit tidak ditemukan"
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border/70 bg-[#fbfcfb] text-[0.68rem] font-black uppercase tracking-[0.14em] text-[#435476]">
                      <th className="px-6 py-3.5" scope="col">
                        Unit / Cabang
                      </th>
                      <th className="px-4 py-3.5 text-center" scope="col">
                        Barang Jaminan
                      </th>
                      <th className="px-4 py-3.5 text-center" scope="col">
                        Sedang Dipasarkan
                      </th>
                      <th className="px-4 py-3.5 text-center" scope="col">
                        Terjual
                      </th>
                      <th className="px-6 py-3.5 text-right" scope="col">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 bg-white">
                    {paginatedUnitRows.map((row) => (
                      <tr
                        className="transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[#f7fbf8]"
                        key={row.id}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-[#007a4d] ring-1 ring-emerald-100">
                              <Building2 className="size-5" strokeWidth={1.9} />
                              <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-[#007a4d] ring-2 ring-white" />
                            </span>
                            <div className="min-w-0">
                              <p className="font-bold text-[#13211c]">
                                {row.unitName}
                              </p>
                              <p className="mt-0.5 text-xs font-bold text-[#435476]">
                                ({row.unitCode})
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center font-bold text-[#13211c]">
                          {formatDashboardCount(row.collateralItems)}
                        </td>
                        <td className="px-4 py-4 text-center font-bold text-[#13211c]">
                          {formatDashboardCount(row.marketedItems)}
                        </td>
                        <td className="px-4 py-4 text-center font-bold text-[#13211c]">
                          {formatDashboardCount(row.soldItems)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <DetailActionLink
                            href={`/superadmin/unit/${row.id}`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-border/60 bg-[#fbfcfb] px-6 py-4 text-xs font-semibold text-[#536279] sm:flex-row sm:items-center sm:justify-between">
                <p>
                  Menampilkan{" "}
                  <span className="font-black text-[#13211c]">
                    {formatDashboardCount(currentPageStart)}
                  </span>
                  {" - "}
                  <span className="font-black text-[#13211c]">
                    {formatDashboardCount(currentPageEnd)}
                  </span>{" "}
                  dari{" "}
                  <span className="font-black text-[#13211c]">
                    {formatDashboardCount(filteredUnitRows.length)}
                  </span>{" "}
                  unit
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    disabled={currentPage === 1}
                    size="sm"
                    type="button"
                    variant="secondary"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  >
                    <ChevronLeft className="size-4" />
                    Prev
                  </Button>
                  {visiblePageNumbers.map((page, index) => {
                    const previousPage = visiblePageNumbers[index - 1];
                    const shouldShowGap =
                      previousPage !== undefined && page - previousPage > 1;

                    return (
                      <div className="flex items-center gap-2" key={page}>
                        {shouldShowGap ? (
                          <span className="px-1 text-[#8a97a8]">...</span>
                        ) : null}
                        <Button
                          className={cn(
                            "w-9 px-0",
                            currentPage === page &&
                              "bg-primary text-primary-foreground hover:bg-primary",
                          )}
                          size="sm"
                          type="button"
                          variant={currentPage === page ? "default" : "secondary"}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      </div>
                    );
                  })}
                  <Button
                    disabled={currentPage === totalPages}
                    size="sm"
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      setCurrentPage((page) => Math.min(totalPages, page + 1))
                    }
                  >
                    Next
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function SuperAdminBlacklistPage({
  entries,
  serverNow,
}: {
  entries: SuperAdminBlacklistItem[];
  serverNow?: string;
}) {
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] =
    useState<SuperAdminRestrictionLevelFilter>("Semua");
  const activeEntries = entries.filter((entry) => entry.status === "Aktif");
  const isExpiredHistory = levelFilter === "Berakhir";
  const ledgerEntries = isExpiredHistory
    ? entries.filter((entry) => entry.status !== "Aktif")
    : activeEntries;
  const filteredEntries = ledgerEntries.filter((entry) => {
    const level = getSuperadminRestrictionLevel(entry);
    const matchesLevel =
      levelFilter === "Semua" ||
      levelFilter === "Berakhir" ||
      (levelFilter === "Level 1" && level === 1) ||
      (levelFilter === "Level 2" && level === 2) ||
      (levelFilter === "Level 3" && level >= 3);

    return matchesLevel && matchesSuperadminRestrictionQuery(entry, query);
  });
  const filterCounts = restrictionLevelFilters.reduce(
    (accumulator, filter) => {
      const entriesForFilter =
        filter === "Berakhir"
          ? entries.filter((entry) => entry.status !== "Aktif")
          : activeEntries;

      accumulator[filter] = entriesForFilter.filter((entry) => {
        const level = getSuperadminRestrictionLevel(entry);

        return (
          filter === "Berakhir" ||
          filter === "Semua" ||
          (filter === "Level 1" && level === 1) ||
          (filter === "Level 2" && level === 2) ||
          (filter === "Level 3" && level >= 3)
        );
      }).length;

      return accumulator;
    },
    {} as Record<SuperAdminRestrictionLevelFilter, number>,
  );

  return (
    <div className="space-y-6">
      <AdminPageHero
        description="Pusat pengawasan pembatasan aktif dan riwayat pelanggaran pembayaran Lelang Tertutup lintas unit."
        eyebrow="Superadmin / Pelanggaran"
        icon={Ban}
        title="Pelanggaran Pengguna"
      />

      <div className="grid gap-3 rounded-[1.35rem] border border-[#d8e4de] bg-white p-4 shadow-[0_18px_48px_-42px_rgba(8,69,50,0.38)] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#0a6a49]/42" />
          <Input
            className="h-12 rounded-[1.05rem] border-[#dbe7df] bg-[#fbfcfb] pl-12 text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] focus:bg-white focus-visible:ring-2 focus-visible:ring-[#0a6a49]/15"
            placeholder="Cari nama, email, unit, atau status..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 text-[0.72rem] font-black uppercase tracking-[0.12em] text-muted-foreground">
          <span className="rounded-lg bg-[#f6f8f6] px-3 py-2 ring-1 ring-[#e3ebe5]">
            {ledgerEntries.length} akun {isExpiredHistory ? "berakhir" : "aktif"}
          </span>
        </div>
      </div>

      <section className="overflow-hidden rounded-[1.35rem] border border-[#d8e4de] bg-white shadow-[0_26px_76px_-62px_rgba(8,69,50,0.44)]">
        <div className="border-b border-[#edf2ee] p-4 sm:p-5">
          <div>
            <h2 className="font-headline text-lg font-black tracking-[-0.02em] text-[#13211c]">
              {isExpiredHistory ? "Riwayat Pembatasan Berakhir" : "Pembatasan Aktif"}
            </h2>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              Ledger blacklist buyer berdasarkan level pelanggaran real dari sistem.
            </p>
          </div>

          <div className="admin-choice-shell mt-4 flex flex-wrap gap-2 rounded-[1.15rem] p-1">
            {restrictionLevelFilters.map((filter) => {
              const active = levelFilter === filter;

              return (
                <button
                  aria-pressed={active}
                  className="admin-choice-button inline-flex items-center gap-2 rounded-[0.92rem] px-3 py-2 text-[0.72rem] font-black uppercase tracking-[0.12em]"
                  data-active={active}
                  key={filter}
                  type="button"
                  onClick={() => setLevelFilter(filter)}
                >
                  {filter}
                  <span className="admin-choice-count">
                    {filterCounts[filter]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {ledgerEntries.length === 0 ? (
          <div className="p-4 sm:p-5">
            <EmptyState
              className="p-6"
              description={
                isExpiredHistory
                  ? "Belum ada riwayat pembatasan yang berakhir."
                  : "Saat ini belum ada akun dengan blacklist aktif. Daftar ini akan terisi otomatis jika ada pelanggaran lintas unit."
              }
              icon={ShieldBan}
              title={isExpiredHistory ? "Belum ada riwayat berakhir" : "Belum ada blacklist aktif"}
            />
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-4 sm:p-5">
            <EmptyState
              className="p-6"
              description="Tidak ada pembatasan yang cocok dengan pencarian atau filter saat ini."
              icon={SearchX}
              title="Data tidak ditemukan"
            />
          </div>
        ) : (
          <>
              <div className="hidden grid-cols-[minmax(13rem,1.15fr)_minmax(9rem,0.65fr)_minmax(11rem,0.75fr)_minmax(12rem,0.85fr)_7rem] gap-4 border-b border-[#edf2ee] bg-[#fbfcfb] px-5 py-3 text-[0.68rem] font-black uppercase tracking-[0.14em] text-[#536279] lg:grid">
              <div>Pengguna</div>
              <div>Unit Asal</div>
              <div>Tingkat Pelanggaran</div>
                <div>{isExpiredHistory ? "Berakhir Pada" : "Sisa Waktu"}</div>
              <div className="text-right">Aksi</div>
            </div>

            <div className="divide-y divide-[#edf2ee]">
              {filteredEntries.map((item) => {
                const level = getSuperadminRestrictionLevel(item);
                const meta = getRestrictionLevelMeta(level);

                return (
                  <article
                    className="grid gap-4 px-4 py-4 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#fbfcfb] lg:grid-cols-[minmax(13rem,1.15fr)_minmax(9rem,0.65fr)_minmax(11rem,0.75fr)_minmax(12rem,0.85fr)_7rem] lg:items-center sm:px-5"
                    key={item.id}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={cn(
                          "grid size-10 shrink-0 place-items-center rounded-full text-sm font-black ring-1",
                          meta.avatar,
                        )}
                      >
                        {getSuperadminInitials(item.name || "Buyer")}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-headline text-sm font-black tracking-[-0.01em] text-[#111827]">
                          {item.name}
                        </p>
                        <p className="mt-1 truncate text-xs font-semibold text-[#42526b]">
                          {item.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[#42526b]">
                      <Building2 className="size-4 shrink-0 text-[#536279]" />
                      <span className="truncate">{item.unit}</span>
                    </div>

                    <div>
                      <span
                        className={cn(
                          "inline-flex min-w-[9.1rem] justify-center rounded-md px-3 py-1.5 text-xs font-black",
                          meta.badge,
                        )}
                      >
                        {meta.label}
                      </span>
                      <p className="mt-1 text-[0.68rem] font-bold text-muted-foreground">
                        {item.total} pelanggaran
                      </p>
                    </div>

                    <div>
                      {isExpiredHistory ? (
                        <>
                          <p className="text-xs font-black text-[#42526b]">
                            {item.until}
                          </p>
                          <SuperAdminCountdown
                            className="mt-1 text-xs font-black text-[#42526b]"
                            countdownAt={item.countdownAt}
                            countdownLabel={item.countdownLabel}
                            expiredLabel={item.expiredLabel}
                            serverNow={serverNow}
                          />
                        </>
                      ) : (
                        <>
                          <SuperAdminCountdown
                            className="text-xs font-black text-[#42526b]"
                            countdownAt={item.countdownAt}
                            countdownLabel={item.countdownLabel}
                            expiredLabel={item.expiredLabel}
                            serverNow={serverNow}
                          />
                          {!item.countdownAt ? (
                            <p className="text-xs font-black text-[#42526b]">
                              {item.until}
                            </p>
                          ) : null}
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap justify-start gap-3 lg:justify-end">
                      <DetailActionLink
                        href={`/superadmin/blacklist/detail/${item.userId}`}
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>

      <section className="grid gap-3 rounded-[1.35rem] border border-[#d8e4de] bg-[#fbfcfb] p-4 text-sm leading-6 text-muted-foreground shadow-[0_18px_48px_-42px_rgba(8,69,50,0.34)] md:grid-cols-3">
        <p>
          Pelanggaran buyer aktif hanya dibuat saat pemenang Lelang Tertutup
          tidak membayar dalam 24 jam.
        </p>
        <p>
          Level 1 menahan bid Lelang Tertutup, level 2 menahan transaksi baru, dan level
          3 menangguhkan akun selama 365 hari.
        </p>
        <p>
          Fixed price ditolak, lelang tanpa bid, dan pemasaran gagal masuk
          tindak lanjut operasional.
        </p>
      </section>

    </div>
  );
}
