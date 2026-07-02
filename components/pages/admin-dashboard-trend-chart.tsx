"use client";

import { useMemo, useState } from "react";

import {
  ReportRangeDropdown,
  type ReportCustomRange,
  type ReportRangeOption
} from "@/components/shared/report-range-dropdown";
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
    viewBox="0 0 48 48"
  >
    <path
      d="M10 37V30M18 37V25M26 37V29M34 37V21"
      stroke="#f2d778"
      strokeLinecap="round"
      strokeWidth="3.2"
    />
    <path
      d="M9 24.5 17.5 17l7 6.2L37.5 10"
      stroke="#f2d778"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="3"
    />
    <path
      d="M31.5 10h6v6"
      stroke="#f2d778"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="3"
    />
  </svg>
);

const TotalPeriodeIcon = ({ className }: { className?: string }) => (
  <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 32 32">
    <path d="M16 4.5a11.5 11.5 0 0 1 8.15 3.37" stroke="#d6b63f" strokeLinecap="round" strokeWidth="3.5" />
    <path d="M25.45 9.45A11.5 11.5 0 0 1 27.5 16" stroke="#79b858" strokeLinecap="round" strokeWidth="3.5" />
    <path d="M27.5 16A11.5 11.5 0 0 1 16 27.5" stroke="#0c6a42" strokeLinecap="round" strokeWidth="3.5" />
    <path d="M16 27.5A11.5 11.5 0 0 1 4.5 16" stroke="#0c6a42" strokeLinecap="round" strokeWidth="3.5" />
    <path d="M4.5 16A11.5 11.5 0 0 1 13 4.85" stroke="#0c6a42" strokeLinecap="round" strokeWidth="3.5" />
    <circle cx="16" cy="16" fill="white" r="6.5" />
  </svg>
);

const RataRataIcon = ({ className }: { className?: string }) => (
  <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 32 32">
    <path d="M7 9.5h18v15.25A2.25 2.25 0 0 1 22.75 27H7.25A2.25 2.25 0 0 1 5 24.75v-13A2.25 2.25 0 0 1 7.25 9.5Z" stroke="#0c6a42" strokeLinejoin="round" strokeWidth="2" />
    <path d="M5 14h20M10 6.5v6M20 6.5v6" stroke="#0c6a42" strokeLinecap="round" strokeWidth="2.2" />
    <circle cx="23.5" cy="23.5" fill="#edf6ef" r="5.25" stroke="#0c6a42" strokeWidth="1.8" />
    <path d="M23.5 20.7v2.9l2 1.15" stroke="#0c6a42" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
  </svg>
);

const PuncakIcon = ({ className }: { className?: string }) => (
  <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 32 32">
    <path d="M5.5 26V17.5h5V26M14 26V11h5v15M22.5 21V6h5v15" stroke="#0c6a42" strokeLinejoin="round" strokeWidth="2" />
    <path d="m24.5 19.4 1.65 3.35 3.7.54-2.68 2.61.63 3.69-3.3-1.74-3.3 1.74.63-3.69-2.68-2.61 3.7-.54Z" fill="#d6b63f" stroke="#d6b63f" strokeLinejoin="round" strokeWidth=".7" />
  </svg>
);

const TransaksiLunasIcon = ({ className }: { className?: string }) => (
  <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 32 32">
    <path d="M4 7h3l2.35 12.25h13.4l2.15-8.5H8.1M11.25 23.5h10.5" stroke="#0c6a42" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.25" />
    <circle cx="12" cy="27" r="1.8" stroke="#0c6a42" strokeWidth="1.9" />
    <circle cx="21.5" cy="27" r="1.8" stroke="#0c6a42" strokeWidth="1.9" />
    <circle cx="25.5" cy="9" fill="#d6b63f" r="5" stroke="white" strokeWidth="1.1" />
    <path d="m23.2 9 1.5 1.5 3-3" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
  </svg>
);

type DashboardStripMetric = {
  title: string;
  value: string;
  subtext: string;
  icon: React.ComponentType<{ className?: string }>;
};

const chartAxisFontFamily = "var(--font-inter), 'Segoe UI', system-ui, sans-serif";
const chartAxisTextStyle = { fontVariantNumeric: "tabular-nums", textRendering: "geometricPrecision", WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" } as const;
const chartViewBoxHeight = 358;
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
    left: 66,
    right: 944,
    top: 34,
    bottom: 296
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
    <div className="relative overflow-visible rounded-[1.25rem] border border-[#e1e8e3] bg-white p-3.5 shadow-[0_18px_48px_-42px_rgba(15,23,42,0.3)] transition-colors duration-300 dark:border-emerald-300/10 dark:bg-[#101a15] dark:shadow-[0_20px_54px_-34px_rgba(0,0,0,0.64)] sm:p-4 xl:p-5">
      <div className="relative flex flex-col gap-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-3.5">
            <span className="grid size-[3.25rem] shrink-0 place-items-center rounded-[0.75rem] border border-[#00613d]/30 bg-[linear-gradient(145deg,#00623e_0%,#004a23_52%,#00391c_100%)] text-[#f2d778] shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_14px_24px_-22px_rgba(0,74,35,0.58)] transition-colors duration-300 dark:border-emerald-300/20">
              <TrendReportIcon className="size-9" />
            </span>
            <div className="min-w-0 pt-0.5">
              <h2 className="font-body text-[1.35rem] font-extrabold leading-tight text-[#0f172a] dark:text-slate-100 sm:text-[1.55rem]">
                Laporan Tren Penjualan
              </h2>
              <p className="mt-1 max-w-2xl font-body text-[0.8rem] font-medium leading-5 text-[#566172] dark:text-slate-300/72 sm:text-[0.84rem]">
                Performa penjualan tervalidasi berdasarkan rentang waktu pilihan.
              </p>
            </div>
          </div>

          <ReportRangeDropdown
            ariaLabel="Filter laporan tren penjualan"
            buttonClassName="h-11 rounded-[0.75rem] border-[#b6d5c6] px-3.5 text-[0.82rem] font-extrabold text-[#06472e] shadow-none sm:min-w-[14rem]"
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

        <div className="relative flex h-[24rem] flex-col gap-3 dark:bg-transparent sm:h-[26rem]">
          <div className="flex flex-col gap-2.5 px-0 font-body text-[0.84rem] font-semibold text-[#26323f] dark:text-slate-300/78 sm:flex-row sm:items-center sm:justify-between">
            <span className="font-extrabold text-[#0f172a] dark:text-slate-200">
              Nilai (Rp Juta)
            </span>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-[#005626]" />
                Lelang Tertutup
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-[#65dc4f]" />
                Harga Tetap
              </span>
            </div>
          </div>
          
          <div className="relative min-h-0 flex-1">
            <svg className="block h-full w-full" preserveAspectRatio="none" viewBox={`0 0 980 ${chartViewBoxHeight}`}>
              <defs>
                <linearGradient
                  gradientUnits="userSpaceOnUse"
                  id="admin-vickrey-area-grad"
                  x1="0"
                  x2="0"
                  y1={chart.chart.top}
                  y2={chart.chart.bottom}
                >
                  <stop offset="0%" stopColor="#007a5b" stopOpacity="0.86" />
                  <stop offset="42%" stopColor="#0fbb91" stopOpacity="0.66" />
                  <stop offset="74%" stopColor="#78e1c7" stopOpacity="0.46" />
                  <stop offset="100%" stopColor="#c8f4e5" stopOpacity="0.26" />
                </linearGradient>
                <linearGradient
                  gradientUnits="userSpaceOnUse"
                  id="admin-fixed-area-grad"
                  x1="0"
                  x2="0"
                  y1={chart.chart.top}
                  y2={chart.chart.bottom}
                >
                  <stop offset="0%" stopColor="#6cdf4f" stopOpacity="0.7" />
                  <stop offset="42%" stopColor="#9bea73" stopOpacity="0.52" />
                  <stop offset="74%" stopColor="#c4f5a8" stopOpacity="0.36" />
                  <stop offset="100%" stopColor="#e1fad1" stopOpacity="0.22" />
                </linearGradient>
                <filter id="admin-dashboard-area-soften" x="-8%" y="-18%" width="116%" height="138%">
                  <feGaussianBlur stdDeviation="3.2" />
                </filter>
                <filter id="admin-dashboard-line-shadow" x="-10%" y="-28%" width="130%" height="180%">
                  <feDropShadow dx="0" dy="4" stdDeviation="4.3" floodColor="#13b98a" floodOpacity="0.34" />
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
                    fontSize="14"
                    fontWeight="600"
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
                d={areaPath}
                fill="url(#admin-fixed-area-grad)"
                filter="url(#admin-dashboard-area-soften)"
                key={`fixed-area-glow-${index}`}
                opacity={activePoint ? 0.6 : 0.54}
              />
            ))}
            {chart.areaPaths.vickrey.map((areaPath, index) => (
              <path
                d={areaPath}
                fill="url(#admin-vickrey-area-grad)"
                filter="url(#admin-dashboard-area-soften)"
                key={`vickrey-area-glow-${index}`}
                opacity={activePoint ? 0.68 : 0.62}
              />
            ))}
            {chart.areaPaths.fixedPrice.map((areaPath, index) => (
              <path
                className="transition-[opacity] duration-300 ease-[cubic-bezier(0.2,0,0,1)] animate-chart-fade-in"
                d={areaPath}
                fill="url(#admin-fixed-area-grad)"
                key={`fixed-area-${index}`}
                opacity={activePoint ? 1 : 0.94}
              />
            ))}
            {chart.areaPaths.vickrey.map((areaPath, index) => (
              <path
                className="transition-[opacity] duration-300 ease-[cubic-bezier(0.2,0,0,1)] animate-chart-fade-in"
                d={areaPath}
                fill="url(#admin-vickrey-area-grad)"
                key={`vickrey-area-${index}`}
                opacity={activePoint ? 1 : 0.96}
              />
            ))}

            {chart.linePaths.fixedPrice.map((linePath, index) => (
              <path
                className="transition-[opacity] duration-200 ease-[cubic-bezier(0.2,0,0,1)]"
                d={linePath}
                fill="none"
                filter="url(#admin-dashboard-line-shadow)"
                key={`fixed-line-${index}`}
                stroke="#65dc4f"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.85"
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
                strokeWidth="2.85"
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
                      <circle
                        cx={point.x}
                        cy={point.vickreyY}
                        fill={active ? "rgba(0,122,91,0.3)" : "rgba(0,122,91,0.18)"}
                        r={active ? 14 : 10}
                      />
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
                      <circle
                        cx={point.x}
                        cy={point.fixedPriceY}
                        fill={active ? "rgba(108,223,79,0.32)" : "rgba(108,223,79,0.2)"}
                        r={active ? 13.5 : 9.5}
                      />
                      <circle
                        className="transition-[r,stroke-width] duration-200 ease-[cubic-bezier(0.2,0,0,1)]"
                        cx={point.x}
                        cy={point.fixedPriceY}
                        fill="#65dc4f"
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
                    fontSize="14"
                    fontWeight="600"
                    letterSpacing="0"
                    style={chartAxisTextStyle}
                    textAnchor="middle"
                    x={point.x}
                    y={chart.chart.bottom + 32}
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
                    <span className="size-2.5 rounded-full bg-[#65dc4f]" />
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

        <div className="grid grid-cols-1 gap-3.5 rounded-[0.9rem] border border-[#e2e8e4] bg-white p-3 shadow-[0_12px_30px_-28px_rgba(15,23,42,0.22)] dark:border-white/8 dark:bg-white/[0.035] dark:shadow-[0_14px_32px_-24px_rgba(0,0,0,0.5)] sm:grid-cols-2 sm:p-3.5 xl:grid-cols-4 xl:gap-0 xl:divide-x xl:divide-[#dfe7e1] dark:xl:divide-white/10">
          {stripMetrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-2.5 rounded-[0.75rem] p-0.5 xl:px-3" key={metric.title}>
                <span className="grid size-[3.25rem] shrink-0 place-items-center rounded-[0.75rem] border border-[#d9eadf] bg-[linear-gradient(180deg,#f0f8f2,#e8f3ec)] text-[#0d824b] shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] dark:border-emerald-300/10 dark:bg-[linear-gradient(180deg,rgba(32,120,83,0.24),rgba(14,73,52,0.18))] dark:text-emerald-200 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <Icon className="size-7" />
                </span>
                <div className="min-w-0">
                  <p className="font-body text-[0.78rem] font-bold leading-4 text-[#566172] dark:text-slate-300/70">{metric.title}</p>
                  <p className="mt-1.5 whitespace-nowrap font-body text-[1.42rem] font-extrabold leading-none text-[#0d7042] [font-variant-numeric:tabular-nums] dark:text-emerald-200">
                    {metric.value}
                  </p>
                  <p className="mt-2 font-body text-[0.76rem] leading-5 text-[#566172] dark:text-slate-300/62">{metric.subtext}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
