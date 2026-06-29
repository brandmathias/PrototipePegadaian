"use client";

import { useMemo, useState } from "react";
import {
  CalendarClock,
  BarChart3,
  ShoppingCart,
  Star,
  Check,
  type LucideIcon
} from "lucide-react";

import {
  ReportRangeDropdown,
  type ReportCustomRange,
  type ReportRangeOption
} from "@/components/shared/report-range-dropdown";
import { cn } from "@/lib/utils";
import type {
  AdminDashboardMetrics,
  DashboardSalesTimeframeKey,
  DashboardTrendEvent,
  DashboardTrendPoint,
  DashboardTrendRange
} from "@/components/pages/admin-dashboard-page";

const TrendReportIcon = ({ className }: { className?: string }) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    viewBox="0 0 56 56"
  >
    <path
      d="M14 38V28M24 38V22M34 38V30M44 38V16"
      stroke="#f2d778"
      strokeLinecap="round"
      strokeWidth="4"
    />
    <path
      d="M12 24l10-8 10 7 12-13"
      stroke="#f2d778"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="3.5"
    />
    <path
      d="M37 10h7v7"
      stroke="#f2d778"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="3.5"
    />
  </svg>
);

const TotalPeriodeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.8" strokeLinecap="round" className={className}>
    <path d="M 22 12 A 10 10 0 1 1 12 2" stroke="#0c6a42" />
    <path d="M 12 2 A 10 10 0 0 1 22 12" stroke="#d4a345" />
    <circle cx="12" cy="12" r="3.5" fill="#0c6a42" />
  </svg>
);

const RataRataIcon = ({ className }: { className?: string }) => (
  <CalendarClock className={className} strokeWidth={1.8} />
);

const PuncakIcon = ({ className }: { className?: string }) => (
  <div className={cn("relative flex items-center justify-center", className)}>
    <BarChart3 className="size-full text-[#0c6a42] dark:text-emerald-200" strokeWidth={1.8} />
    <span className="absolute -bottom-0.5 -right-0.5 flex size-2.5 items-center justify-center rounded-full bg-white dark:bg-[#101a15]">
      <Star className="size-2.5 fill-[#d4a345] text-[#d4a345]" />
    </span>
  </div>
);

const TransaksiLunasIcon = ({ className }: { className?: string }) => (
  <div className={cn("relative flex items-center justify-center", className)}>
    <ShoppingCart className="size-full text-[#0c6a42] dark:text-emerald-200" strokeWidth={1.8} />
    <span className="absolute -top-0.5 -right-0.5 flex size-2.5 items-center justify-center rounded-full bg-[#d4a345] text-white">
      <Check className="size-2" strokeWidth={4} />
    </span>
  </div>
);

type DashboardStripMetric = {
  title: string;
  value: string;
  subtext: string;
  icon: React.ComponentType<{ className?: string }>;
};

const chartAxisFontFamily = "'Plus Jakarta Sans', var(--font-plus-jakarta), 'Segoe UI', system-ui, -apple-system, sans-serif";
const chartAxisTextStyle = { fontVariantNumeric: "tabular-nums", textRendering: "geometricPrecision", WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" } as const;
const chartViewBoxHeight = 362;
const chartAxisMaxValue = 25;
const chartAxisTickValues = [0, 5, 10, 15, 20, 25];
const numberFormatter = new Intl.NumberFormat("id-ID");
const monthLabels = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function formatCount(value: number) {
  return numberFormatter.format(value);
}

function formatShortNumber(value: number) {
  if (value >= 1_000_000_000) {
    return `${numberFormatter.format(Number((value / 1_000_000_000).toFixed(2)))} M`;
  }
  if (value >= 1_000_000) {
    return `${numberFormatter.format(Number((value / 1_000_000).toFixed(2)))} jt`;
  }
  if (value >= 1_000) {
    return `${numberFormatter.format(Number((value / 1_000).toFixed(1)))} rb`;
  }

  return numberFormatter.format(value);
}

function formatCurrencyCompact(value: number) {
  return `Rp ${formatShortNumber(value)}`;
}

function formatCurrencyFull(value: number) {
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}

function formatAxisNumber(value: number) {
  if (Number.isInteger(value)) {
    return numberFormatter.format(value);
  }

  return numberFormatter.format(Number(value.toFixed(1)));
}

function shouldShowXAxisLabel(index: number, total: number) {
  if (total <= 8) {
    return true;
  }

  const maxLabels = total <= 12 ? 5 : 6;
  const step = Math.max(1, Math.ceil((total - 1) / (maxLabels - 1)));

  return index === 0 || index === total - 1 || index % step === 0;
}

function getTrendVickreyAmount(point: DashboardTrendPoint) {
  const hasSplit = point.vickreyAmount !== undefined || point.fixedPriceAmount !== undefined;
  return hasSplit ? Number(point.vickreyAmount ?? 0) : Number(point.amount ?? 0);
}

function getTrendFixedPriceAmount(point: DashboardTrendPoint) {
  return Number(point.fixedPriceAmount ?? 0);
}

function buildChartModel(series: DashboardTrendPoint[]) {
  const fallback = series.length
    ? series
    : [
        { label: "00.00", value: 0, amount: 0, fixedPriceAmount: 0, vickreyAmount: 0 },
        { label: "04.00", value: 0, amount: 0, fixedPriceAmount: 0, vickreyAmount: 0 },
        { label: "08.00", value: 0, amount: 0, fixedPriceAmount: 0, vickreyAmount: 0 },
        { label: "12.00", value: 0, amount: 0, fixedPriceAmount: 0, vickreyAmount: 0 },
        { label: "16.00", value: 0, amount: 0, fixedPriceAmount: 0, vickreyAmount: 0 },
        { label: "20.00", value: 0, amount: 0, fixedPriceAmount: 0, vickreyAmount: 0 }
      ];
  const chart = {
    left: 58,
    right: 952,
    top: 42,
    bottom: 304
  };
  const maxAxisValue = chartAxisMaxValue;
  const step = (chart.right - chart.left) / Math.max(fallback.length - 1, 1);
  const axisTicks = [...chartAxisTickValues].reverse().map((value) => {
    const ratio = value / maxAxisValue;

    return {
      label: formatAxisNumber(value),
      value,
      y: chart.bottom - (chart.bottom - chart.top) * ratio
    };
  });
  const getY = (amount: number) => {
    const plotValue = amount / 1_000_000;
    const ratio = Math.min(plotValue / maxAxisValue, 1);
    return chart.bottom - ratio * (chart.bottom - chart.top);
  };
  const points = fallback.map((point, index) => {
    const fixedPriceAmount = getTrendFixedPriceAmount(point);
    const vickreyAmount = getTrendVickreyAmount(point);
    const plotValue = Number(point.amount ?? 0) / 1_000_000;
    const ratio = Math.min(plotValue / maxAxisValue, 1);
    const x = chart.left + step * index;
    const y = chart.bottom - ratio * (chart.bottom - chart.top);
    const hitLeft = fallback.length <= 1 ? chart.left : index === 0 ? chart.left : x - step / 2;
    const hitRight = fallback.length <= 1 ? chart.right : index === fallback.length - 1 ? chart.right : x + step / 2;

    return {
      ...point,
      isActiveData: Number(point.amount ?? 0) > 0 || Number(point.value ?? 0) > 0,
      hitHeightPercent: ((chart.bottom - chart.top) / chartViewBoxHeight) * 100,
      hitLeftPercent: (hitLeft / 980) * 100,
      hitTopPercent: (chart.top / chartViewBoxHeight) * 100,
      hitWidthPercent: ((hitRight - hitLeft) / 980) * 100,
      leftPercent: (x / 980) * 100,
      fixedPriceAmount,
      fixedPriceY: getY(fixedPriceAmount),
      plotValue,
      topPercent: (y / chartViewBoxHeight) * 100,
      vickreyAmount,
      vickreyY: getY(vickreyAmount),
      x,
      y
    };
  });
  const firstX = points.length ? points[0].x.toFixed(1) : "0";
  const lastX = points.length ? points[points.length - 1].x.toFixed(1) : "0";
  const bottomY = chart.bottom.toFixed(1);

  const getCurvePath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return "";
    if (pts.length === 1) return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    
    let path = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      
      const cp1x = p1.x + (p2.x - p1.x) / 2;
      const cp1y = p1.y;
      
      const cp2x = p1.x + (p2.x - p1.x) / 2;
      const cp2y = p2.y;
      
      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return path;
  };

  const fixedPoints = points.map((p) => ({ x: p.x, y: p.fixedPriceY }));
  const vickreyPoints = points.map((p) => ({ x: p.x, y: p.vickreyY }));

  const linePaths = {
    fixedPrice: points.length ? [getCurvePath(fixedPoints)] : [],
    vickrey: points.length ? [getCurvePath(vickreyPoints)] : []
  };

  const areaPaths = {
    fixedPrice: linePaths.fixedPrice.length
      ? [`${linePaths.fixedPrice[0]} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`]
      : [],
    vickrey: linePaths.vickrey.length
      ? [`${linePaths.vickrey[0]} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`]
      : []
  };

  return {
    axisTicks,
    chart,
    linePaths,
    areaPaths,
    points
  };
}

function buildStripMetrics(range: DashboardTrendRange, timeframe: DashboardSalesTimeframeKey): DashboardStripMetric[] {
  const averageTransaction = range.summary.verifiedTransactions
    ? Math.round(range.summary.totalRevenue / range.summary.verifiedTransactions)
    : 0;
  const averageTitle =
    timeframe === "day"
      ? "Rata-rata Slot"
      : timeframe === "month"
        ? "Rata-rata Harian"
        : ["last3Months", "last12Months", "yearToDate", "allTime"].includes(timeframe)
          ? "Rata-rata Bulanan"
          : "Rata-rata Harian";
  const averageSubtitle =
    timeframe === "day"
      ? `rata-rata nilai penjualan per slot waktu sepanjang ${range.label.toLowerCase()}`
      : timeframe === "month"
        ? `rata-rata nilai penjualan per hari sepanjang ${range.label.toLowerCase()}`
        : ["last3Months", "last12Months", "yearToDate", "allTime"].includes(timeframe)
          ? `rata-rata nilai penjualan per bulan sepanjang ${range.label.toLowerCase()}`
          : `rata-rata nilai penjualan per hari sepanjang ${range.label.toLowerCase()}`;

  return [
    {
      title: "Total Periode",
      value: formatCurrencyCompact(range.summary.totalRevenue),
      subtext: "Total nilai penjualan pada periode ini",
      icon: TotalPeriodeIcon
    },
    {
      title: averageTitle,
      value: formatCurrencyCompact(range.summary.averageRevenue),
      subtext: averageSubtitle,
      icon: RataRataIcon
    },
    {
      title: "Puncak Penjualan",
      value: formatCurrencyCompact(range.summary.peakRevenue),
      subtext: `Nilai penjualan tertinggi terjadi pada ${range.summary.peakLabel}`,
      icon: PuncakIcon
    },
    {
      title: "Transaksi Lunas",
      value: formatCount(range.summary.verifiedTransactions),
      subtext: `${formatCurrencyCompact(averageTransaction)} rata-rata per transaksi tervalidasi`,
      icon: TransaksiLunasIcon
    }
  ];
}

const timeframeOptions: Array<ReportRangeOption<DashboardSalesTimeframeKey>> = [
  { value: "day", label: "Hari Ini", helper: "Slot waktu hari ini" },
  { value: "last7", label: "7 Hari Terakhir", helper: "Rentang mingguan berjalan" },
  { value: "last30", label: "30 Hari Terakhir", helper: "Pergerakan harian" },
  { value: "last3Months", label: "3 Bulan Terakhir", helper: "Ringkasan bulanan" },
  { value: "last12Months", label: "12 Bulan Terakhir", helper: "Satu tahun ke belakang" },
  { value: "month", label: "Bulan Berlangsung", helper: "Default laporan" },
  { value: "yearToDate", label: "Tahun Berjalan", helper: "Januari hingga bulan ini" },
  { value: "allTime", label: "Semua Waktu", helper: "Seluruh transaksi tervalidasi" }
];

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function formatDayLabel(date: Date) {
  return `${date.getDate()} ${monthLabels[date.getMonth()]}`;
}

function formatMonthLabel(date: Date) {
  return `${monthLabels[date.getMonth()]} ${date.getFullYear()}`;
}

function createTrendPoint(label: string): DashboardTrendPoint {
  return { label, value: 0, amount: 0, fixedPriceAmount: 0, vickreyAmount: 0 };
}

function addEventToTrendPoint(point: DashboardTrendPoint, event: DashboardTrendEvent) {
  const amount = Number(event.amount ?? 0);
  const mode = String(event.transactionType ?? event.marketingMode ?? "").toLowerCase();

  if (mode.includes("fixed")) {
    point.fixedPriceAmount = Number(point.fixedPriceAmount ?? 0) + amount;
  } else {
    point.vickreyAmount = Number(point.vickreyAmount ?? 0) + amount;
  }

  point.value += 1;
  point.amount += amount;
}

function makeCustomTrendRange(events: DashboardTrendEvent[], range: ReportCustomRange): DashboardTrendRange {
  const start = parseDateKey(range.startDate);
  const end = parseDateKey(range.endDate);
  end.setHours(23, 59, 59, 999);
  const dayCount = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000));

  if (dayCount <= 31) {
    const buckets = Array.from({ length: dayCount }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);

      return {
        key: toDateKey(date),
        ...createTrendPoint(formatDayLabel(date))
      };
    });
    const bucketByKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));

    for (const event of events) {
      const occurredAt = new Date(event.occurredAt);
      if (occurredAt < start || occurredAt > end) {
        continue;
      }

      const bucket = bucketByKey.get(toDateKey(occurredAt));
      if (!bucket) {
        continue;
      }
      addEventToTrendPoint(bucket, event);
    }

    return makeRangeFromPoints(
      buckets.map(({ label, value, amount, fixedPriceAmount, vickreyAmount }) => ({ label, value, amount, fixedPriceAmount, vickreyAmount })),
      "Rentang Kustom"
    );
  }

  const monthCount = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth() + 1;
  const buckets = Array.from({ length: monthCount }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth() + index, 1);

    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      ...createTrendPoint(formatMonthLabel(date))
    };
  });
  const bucketByKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  for (const event of events) {
    const occurredAt = new Date(event.occurredAt);
    if (occurredAt < start || occurredAt > end) {
      continue;
    }

    const bucket = bucketByKey.get(`${occurredAt.getFullYear()}-${occurredAt.getMonth()}`);
    if (!bucket) {
      continue;
    }
    addEventToTrendPoint(bucket, event);
  }

  return makeRangeFromPoints(
    buckets.map(({ label, value, amount, fixedPriceAmount, vickreyAmount }) => ({ label, value, amount, fixedPriceAmount, vickreyAmount })),
    "Rentang Kustom"
  );
}

function makeRangeFromPoints(points: DashboardTrendPoint[], label: string): DashboardTrendRange {
  const totalRevenue = points.reduce((sum, point) => sum + point.amount, 0);
  const verifiedTransactions = points.reduce((sum, point) => sum + point.value, 0);
  const peakPoint = points.reduce(
    (highest, point) => (point.amount > highest.amount ? point : highest),
    points[0] ?? createTrendPoint("-")
  );

  return {
    label,
    points,
    summary: {
      totalRevenue,
      verifiedTransactions,
      averageRevenue: points.length ? Math.round(totalRevenue / points.length) : 0,
      peakRevenue: peakPoint.amount,
      peakLabel: peakPoint.label
    }
  };
}

export function AdminDashboardTrendChart({ metrics }: { metrics: AdminDashboardMetrics }) {
  const [activeRange, setActiveRange] = useState<DashboardSalesTimeframeKey | "custom">(metrics.salesTrend.defaultRange);
  const [customRange, setCustomRange] = useState<ReportCustomRange | null>(null);
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);
  const activePresetRange: DashboardSalesTimeframeKey =
    activeRange === "custom" ? "month" : activeRange;
  const range =
    activeRange === "custom" && customRange
      ? makeCustomTrendRange(metrics.salesTrend.events ?? [], customRange)
      : metrics.salesTrend.ranges[activePresetRange] ?? metrics.salesTrend.ranges.month ?? metrics.salesTrend.ranges.week;
  const chart = useMemo(() => buildChartModel(range.points), [range.points]);
  const stripMetrics = useMemo(
    () => buildStripMetrics(range, activePresetRange),
    [activePresetRange, range]
  );
  const activePoint = activePointIndex !== null ? chart.points[activePointIndex] : null;

  return (
    <div className="relative overflow-visible rounded-[1.65rem] border border-[#e1e8e3] bg-white p-5 shadow-[0_22px_58px_-46px_rgba(15,23,42,0.34)] transition-colors duration-300 dark:border-emerald-300/10 dark:bg-[#101a15] dark:shadow-[0_20px_54px_-34px_rgba(0,0,0,0.64)] sm:p-7 xl:p-8">
      <div className="relative flex flex-col gap-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-5">
            <span className="grid size-[4.85rem] shrink-0 place-items-center rounded-[1.05rem] border border-[#00613d]/30 bg-[linear-gradient(145deg,#00623e_0%,#004a23_52%,#00391c_100%)] text-[#f2d778] shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_18px_28px_-24px_rgba(0,74,35,0.62)] transition-colors duration-300 dark:border-emerald-300/20 sm:size-[5.4rem]">
              <TrendReportIcon className="size-14 sm:size-16" />
            </span>
            <div className="min-w-0 pt-1">
              <h2 className="font-body text-[1.7rem] font-extrabold leading-tight text-[#0f172a] dark:text-slate-100 sm:text-[2rem]">
                Laporan Tren Penjualan
              </h2>
              <p className="mt-2 max-w-2xl font-body text-[1rem] font-medium leading-7 text-[#566172] dark:text-slate-300/72">
                Performa penjualan tervalidasi berdasarkan rentang waktu pilihan.
              </p>
            </div>
          </div>

          <ReportRangeDropdown
            ariaLabel="Filter laporan tren penjualan"
            buttonClassName="h-12 rounded-[0.9rem] border-[#b6d5c6] px-4 text-[0.92rem] font-extrabold text-[#06472e] shadow-none sm:min-w-[16.75rem]"
            customRange={customRange}
            onApplyCustomRange={(nextRange) => {
              setCustomRange(nextRange);
              setActiveRange("custom");
              setActivePointIndex(null);
            }}
            onChange={(nextRange) => {
              setActiveRange(nextRange);
              setCustomRange(null);
              setActivePointIndex(null);
            }}
            options={timeframeOptions}
            value={activeRange}
          />
        </div>

        <div className="relative flex h-[25rem] flex-col gap-4 dark:bg-transparent sm:h-[31rem]">
          <div className="flex flex-col gap-3 px-0 font-body text-[0.98rem] font-semibold text-[#26323f] dark:text-slate-300/78 sm:flex-row sm:items-center sm:justify-between">
            <span className="font-extrabold text-[#0f172a] dark:text-slate-200">
              Nilai (Rp Juta)
            </span>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
              <span className="inline-flex items-center gap-2">
                <span className="size-3 rounded-full bg-[#005626]" />
                Lelang Tertutup
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="size-3 rounded-full bg-[#9ed47a]" />
                Harga Tetap
              </span>
            </div>
          </div>
          
          <div className="relative flex-1">
            <svg className="h-full w-full" preserveAspectRatio="none" viewBox={`0 0 980 ${chartViewBoxHeight}`}>
              <defs>
                <linearGradient id="admin-vickrey-area-grad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#064e3b" stopOpacity="0.18" />
                  <stop offset="54%" stopColor="#064e3b" stopOpacity="0.055" />
                  <stop offset="100%" stopColor="#064e3b" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="admin-fixed-area-grad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#9ed47a" stopOpacity="0.2" />
                  <stop offset="54%" stopColor="#9ed47a" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="#9ed47a" stopOpacity="0" />
                </linearGradient>
                <filter id="admin-dashboard-line-shadow" x="-10%" y="-25%" width="130%" height="170%">
                  <feDropShadow dx="0" dy="4" stdDeviation="2.5" floodColor="#2cab68" floodOpacity="0.06" />
                </filter>
              </defs>

              {/* Visually hidden text to satisfy DOM testing library query */}
              <text className="opacity-0 pointer-events-none" x="0" y="0">Nilai (Rp Juta)</text>

            <g>
              {chart.axisTicks.map((tick) => (
                <g key={tick.label}>
                  <text
                    className="fill-[#2f3a46] font-semibold antialiased transition-all duration-150 dark:fill-slate-200"
                    dominantBaseline="middle"
                    fontFamily={chartAxisFontFamily}
                    fontSize="15"
                    fontWeight="650"
                    letterSpacing="0"
                    style={chartAxisTextStyle}
                    textAnchor="end"
                    x={chart.chart.left - 16}
                    y={tick.y}
                  >
                    {tick.label}
                  </text>
                </g>
              ))}
            </g>

            <g className="stroke-[#d7e0dc] dark:stroke-white/20" strokeDasharray="5 5" strokeWidth="1.1">
              {chart.axisTicks.filter((tick) => tick.value > 0).map((tick) => (
                <line key={tick.label} x1={chart.chart.left} x2={chart.chart.right} y1={tick.y} y2={tick.y} />
              ))}
            </g>
            <line className="stroke-[#7d8791] dark:stroke-white/22" x1={chart.chart.left} x2={chart.chart.right} y1={chart.chart.bottom} y2={chart.chart.bottom} strokeWidth="1.2" />

            {/* Area Gradient Fills */}
            {chart.areaPaths.fixedPrice.map((areaPath, index) => (
              <path
                className="transition-[opacity] duration-300 ease-[cubic-bezier(0.2,0,0,1)] animate-chart-fade-in"
                d={areaPath}
                fill="url(#admin-fixed-area-grad)"
                key={`fixed-area-${index}`}
              />
            ))}
            {chart.areaPaths.vickrey.map((areaPath, index) => (
              <path
                className="transition-[opacity] duration-300 ease-[cubic-bezier(0.2,0,0,1)] animate-chart-fade-in"
                d={areaPath}
                fill="url(#admin-vickrey-area-grad)"
                key={`vickrey-area-${index}`}
              />
            ))}

            {chart.linePaths.fixedPrice.map((linePath, index) => (
              <path
                className="transition-[opacity] duration-200 ease-[cubic-bezier(0.2,0,0,1)]"
                d={linePath}
                fill="none"
                filter="url(#admin-dashboard-line-shadow)"
                key={`fixed-line-${index}`}
                stroke="#9ed47a"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.65"
              />
            ))}
            {chart.linePaths.vickrey.map((linePath, index) => (
              <path
                className="transition-[opacity] duration-200 ease-[cubic-bezier(0.2,0,0,1)]"
                d={linePath}
                fill="none"
                filter="url(#admin-dashboard-line-shadow)"
                key={`vickrey-line-${index}`}
                stroke="#064e3b"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.65"
              />
            ))}

            {activePoint ? (
              <g>
                <line
                  className="stroke-[#63b37e]/70 dark:stroke-emerald-200/34"
                  strokeDasharray="5 5"
                  strokeLinecap="round"
                  strokeWidth="1.25"
                  x1={activePoint.x}
                  x2={activePoint.x}
                  y1={chart.chart.top}
                  y2={chart.chart.bottom}
                />
                <circle cx={activePoint.x} cy={chart.chart.bottom} fill="#064e3b" r="4.2" />
                {activePoint.vickreyAmount > 0 ? (
                  <circle cx={activePoint.x} cy={activePoint.vickreyY} fill="rgba(0,86,38,0.13)" r="19" />
                ) : null}
                {activePoint.fixedPriceAmount > 0 ? (
                  <circle cx={activePoint.x} cy={activePoint.fixedPriceY} fill="rgba(155,209,145,0.2)" r="18" />
                ) : null}
              </g>
            ) : null}

            {chart.points.map((point, index) => {
              const active = index === activePointIndex;

              if (point.vickreyAmount <= 0 && point.fixedPriceAmount <= 0) {
                return null;
              }

              return (
                <g key={`${point.label}-marker-${index}`}>
                  {point.vickreyAmount > 0 ? (
                    <>
                      {active ? (
                        <circle cx={point.x} cy={point.vickreyY} fill="rgba(6,78,59,0.13)" r="13" />
                      ) : null}
                      <circle
                        className="transition-[r,stroke-width] duration-200 ease-[cubic-bezier(0.2,0,0,1)]"
                        cx={point.x}
                        cy={point.vickreyY}
                        fill="#064e3b"
                        r={active ? 6.6 : 5.4}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                    </>
                  ) : null}
                  {point.fixedPriceAmount > 0 ? (
                    <>
                      {active ? (
                        <circle cx={point.x} cy={point.fixedPriceY} fill="rgba(158,212,122,0.2)" r="12.5" />
                      ) : null}
                      <circle
                        className="transition-[r,stroke-width] duration-200 ease-[cubic-bezier(0.2,0,0,1)]"
                        cx={point.x}
                        cy={point.fixedPriceY}
                        fill="#9ed47a"
                        r={active ? 6.2 : 5}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                    </>
                  ) : null}
                </g>
              );
            })}

            <g>
              {chart.points.map((point, index) => {
                const showLabel = index === activePointIndex || shouldShowXAxisLabel(index, chart.points.length);

                if (!showLabel) {
                  return null;
                }

                return (
                  <g key={`${point.label}-${index}`}>
                  <text
                    className="fill-[#2f3a46] font-semibold antialiased transition-all duration-150 dark:fill-slate-200"
                    dominantBaseline="middle"
                    fontFamily={chartAxisFontFamily}
                    fontSize="15"
                    fontWeight="650"
                    letterSpacing="0"
                    style={chartAxisTextStyle}
                    textAnchor="middle"
                    x={point.x}
                    y="342"
                  >
                    {point.label}
                  </text>
                </g>
                );
              })}
            </g>
          </svg>

          {chart.points.map((point, index) => (
            <button
              aria-label={`${point.label}: Lelang Tertutup ${formatCurrencyFull(point.vickreyAmount)}, Harga Tetap ${formatCurrencyFull(point.fixedPriceAmount)}, Volume ${formatCount(point.value)} transaksi`}
              className="absolute rounded-lg outline-none transition-[background-color,box-shadow] duration-150 ease-[cubic-bezier(0.2,0,0,1)] focus-visible:ring-2 focus-visible:ring-[#18a65a] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              key={`${point.label}-hotspot-${index}`}
              onBlur={() => setActivePointIndex(null)}
              onFocus={() => setActivePointIndex(index)}
              onMouseEnter={() => setActivePointIndex(index)}
              onMouseLeave={() => setActivePointIndex(null)}
              style={{
                height: `${point.hitHeightPercent}%`,
                left: `${point.hitLeftPercent}%`,
                top: `${point.hitTopPercent}%`,
                width: `${point.hitWidthPercent}%`
              }}
              type="button"
            />
          ))}

          {activePoint ? (
            <div
              className="pointer-events-none absolute z-[3] w-[16.25rem] -translate-x-1/2 -translate-y-full rounded-[0.95rem] border border-[#cfe7d8] bg-white px-3.5 py-3 text-left shadow-[0_22px_50px_-30px_rgba(0,82,45,0.45)] ring-1 ring-white/70 transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.2,0,0,1)] dark:border-emerald-300/18 dark:bg-[#102019] dark:shadow-[0_22px_54px_-28px_rgba(0,0,0,0.72)] dark:ring-white/8"
              role="tooltip"
              style={{
                left: `clamp(7rem, ${activePoint.leftPercent}%, calc(100% - 7rem))`,
                top: `clamp(7rem, calc(${activePoint.topPercent}% - 0.9rem), calc(100% - 0.5rem))`
              }}
            >
              <div className="absolute left-1/2 top-full size-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-[#cfe7d8] bg-white dark:border-emerald-300/18 dark:bg-[#102019]" />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-[#6a7d73] dark:text-slate-300/68">
                    {activePoint.label}
                  </p>
                  <p className="mt-1 font-headline text-[1.15rem] font-black leading-none text-[#00563b] dark:text-emerald-200">
                    {formatCurrencyFull(activePoint.amount)}
                  </p>
                </div>
                <span className="rounded-full bg-[#fff7e6] px-2.5 py-1 text-[0.68rem] font-black text-[#c97900] dark:bg-amber-300/12 dark:text-amber-100">
                  {formatCount(activePoint.value)} trx
                </span>
              </div>
              <div className="mt-3 grid gap-2 text-[0.75rem] font-bold text-[#52615d] dark:text-slate-300/78">
                <div className="flex items-center justify-between gap-3 rounded-[0.72rem] bg-[#f5faf7] px-2.5 py-2 dark:bg-emerald-300/8">
                  <span className="inline-flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-[#005626]" />
                    Lelang Tertutup
                  </span>
                  <span className="font-black text-[#00563b] dark:text-emerald-200">
                    {formatCurrencyFull(activePoint.vickreyAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-[0.72rem] bg-[#f6fbf5] px-2.5 py-2 dark:bg-emerald-300/8">
                  <span className="inline-flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-[#9bd191]" />
                    Harga Tetap
                  </span>
                  <span className="font-black text-[#3f8d42] dark:text-emerald-100">
                    {formatCurrencyFull(activePoint.fixedPriceAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-[0.72rem] bg-[#fff9ef] px-2.5 py-2 dark:bg-amber-300/8">
                  <span className="inline-flex items-center gap-2">
                    <span className="size-2.5 rounded-full border-2 border-[#f59e0b] bg-white dark:bg-[#102019]" />
                    Volume
                  </span>
                  <span className="font-black text-[#c97900] dark:text-amber-100">
                    {formatCount(activePoint.value)} transaksi
                  </span>
                </div>
              </div>
            </div>
          ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 rounded-[1.35rem] border border-[#e2e8e4] bg-white p-5 shadow-[0_14px_36px_-32px_rgba(15,23,42,0.24)] dark:border-white/8 dark:bg-white/[0.035] dark:shadow-[0_14px_32px_-24px_rgba(0,0,0,0.5)] sm:grid-cols-2 sm:p-6 xl:grid-cols-4 xl:gap-0 xl:divide-x xl:divide-[#dfe7e1] dark:xl:divide-white/10">
          {stripMetrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div className="grid grid-cols-[4.6rem_minmax(0,1fr)] gap-5 rounded-[1rem] p-1 xl:px-6" key={metric.title}>
                <span className="grid size-[4.6rem] shrink-0 place-items-center rounded-[1rem] border border-[#d9eadf] bg-[linear-gradient(180deg,#f0f8f2,#e8f3ec)] text-[#0d824b] shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] dark:border-emerald-300/10 dark:bg-[linear-gradient(180deg,rgba(32,120,83,0.24),rgba(14,73,52,0.18))] dark:text-emerald-200 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <Icon className="size-9" />
                </span>
                <div className="min-w-0">
                  <p className="font-body text-[1rem] font-bold leading-5 text-[#566172] dark:text-slate-300/70">{metric.title}</p>
                  <p className="mt-2 whitespace-nowrap font-body text-[1.85rem] font-extrabold leading-none text-[#0d7042] [font-variant-numeric:tabular-nums] dark:text-emerald-200">
                    {metric.value}
                  </p>
                  <p className="mt-3 font-body text-[0.95rem] leading-6 text-[#566172] dark:text-slate-300/62">{metric.subtext}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
