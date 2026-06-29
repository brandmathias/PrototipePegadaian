"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  ChartNoAxesCombined,
  ShoppingCart,
  Tag,
  TrendingUp,
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

type DashboardStripMetric = {
  title: string;
  value: string;
  subtext: string;
  icon: LucideIcon;
};

const chartAxisFontFamily = 'var(--font-manrope), "Segoe UI", system-ui, sans-serif';
const chartAxisTextStyle = { fontVariantNumeric: "tabular-nums" } as const;
const chartViewBoxHeight = 350;
const chartAxisMaxValue = 25;
const chartAxisTickValues = [5, 10, 15, 20, 25];
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
    left: 70,
    right: 930,
    top: 52,
    bottom: 292
  };
  const maxAxisValue = chartAxisMaxValue;
  const step = (chart.right - chart.left) / Math.max(fallback.length - 1, 1);
  const axisTicks = [...chartAxisTickValues].reverse().map((value) => {
    const ratio = value / maxAxisValue;

    return {
      label: formatAxisNumber(value),
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
      labelWidth: Math.max(54, point.label.length * 8.4 + 24),
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
    if (pts.length === 2) {
      return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)} L ${pts[1].x.toFixed(1)} ${pts[1].y.toFixed(1)}`;
    }

    // 1. Calculate tangents (slopes) at each point, flatting extrema to prevent overshooting
    const tangents = pts.map((p, i) => {
      if (i === 0) {
        return (pts[1].y - p.y) / (pts[1].x - p.x);
      }
      if (i === pts.length - 1) {
        return (p.y - pts[i - 1].y) / (p.x - pts[i - 1].x);
      }
      const prev = pts[i - 1];
      const next = pts[i + 1];
      
      const slope1 = (p.y - prev.y) / (p.x - prev.x);
      const slope2 = (next.y - p.y) / (next.x - p.x);
      
      // If it's a local maximum or minimum, set tangent to 0 to prevent overshooting
      if (slope1 * slope2 <= 0) {
        return 0;
      }
      
      return (slope1 + slope2) / 2;
    });

    // 2. Build Cubic Bezier segments using calculated tangents
    let path = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const dx = (p2.x - p1.x) / 3;

      const cp1x = p1.x + dx;
      const cp1y = p1.y + dx * tangents[i];

      const cp2x = p2.x - dx;
      const cp2y = p2.y - dx * tangents[i + 1];

      const clampY = (val: number) => Math.max(chart.top, Math.min(chart.bottom, val));

      path += ` C ${cp1x.toFixed(1)} ${clampY(cp1y).toFixed(1)}, ${cp2x.toFixed(1)} ${clampY(cp2y).toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
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
      subtext: `${formatCount(range.summary.verifiedTransactions)} transaksi lunas tercatat pada ${range.label.toLowerCase()}`,
      icon: TrendingUp
    },
    {
      title: averageTitle,
      value: formatCurrencyCompact(range.summary.averageRevenue),
      subtext: averageSubtitle,
      icon: ShoppingCart
    },
    {
      title: "Puncak Penjualan",
      value: formatCurrencyCompact(range.summary.peakRevenue),
      subtext: `nilai penjualan tertinggi terjadi pada ${range.summary.peakLabel}`,
      icon: BarChart3
    },
    {
      title: "Transaksi Lunas",
      value: formatCount(range.summary.verifiedTransactions),
      subtext: `${formatCurrencyCompact(averageTransaction)} rata-rata per transaksi terverifikasi`,
      icon: Tag
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
    <div className="relative overflow-visible rounded-[1.65rem] border border-[#ebeeea] bg-white p-4 shadow-[0_20px_48px_-40px_rgba(15,23,42,0.2)] transition-colors duration-300 dark:border-emerald-300/10 dark:bg-[#101a15] dark:shadow-[0_20px_54px_-34px_rgba(0,0,0,0.64)] sm:p-5">
      <div className="relative flex flex-col gap-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-[5.15rem] shrink-0 place-items-center rounded-[1.15rem] border border-[#dcefe2] bg-[linear-gradient(180deg,#f5fbf6,#ebf7ef)] text-[#0c6a42] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-colors duration-300 dark:border-emerald-300/12 dark:bg-[linear-gradient(180deg,rgba(32,120,83,0.26),rgba(14,73,52,0.22))] dark:text-emerald-200 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <ChartNoAxesCombined className="size-10" strokeWidth={1.8} />
            </span>
            <div>
              <h2 className="font-headline text-[1.25rem] font-black tracking-[-0.02em] text-[#17221d] dark:text-slate-100 sm:text-[1.42rem]">
                Laporan Tren Penjualan
              </h2>
              <p className="mt-1 max-w-xl text-[0.9rem] font-semibold leading-6 text-[#647067] dark:text-slate-300/72">
                Performa penjualan tervalidasi berdasarkan rentang waktu pilihan.
              </p>
            </div>
          </div>

          <ReportRangeDropdown
            ariaLabel="Filter laporan tren penjualan"
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

        <div className="relative h-[21rem] rounded-[1.25rem] bg-[linear-gradient(180deg,#ffffff_0%,#fbfdfb_100%)] px-2 py-3 dark:bg-[linear-gradient(180deg,#101a15_0%,#0c1511_100%)] sm:px-3 sm:py-4">
          <div className="pointer-events-none absolute right-4 top-3 z-[1] hidden items-center gap-4 text-[0.68rem] font-black text-[#3f4f48] dark:text-slate-300/78 sm:flex">
            <span className="inline-flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-[#005626]" />
              Lelang Tertutup
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-[#9bd191]" />
              Harga Tetap
            </span>
          </div>
          <svg className="h-full w-full" preserveAspectRatio="none" viewBox={`0 0 980 ${chartViewBoxHeight}`}>
            <defs>
              <linearGradient id="admin-vickrey-area-grad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#005626" stopOpacity="0.45" />
                <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="admin-fixed-area-grad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#9bd191" stopOpacity="0.42" />
                <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
              <filter id="admin-dashboard-line-shadow" x="-10%" y="-25%" width="130%" height="170%">
                <feDropShadow dx="0" dy="10" stdDeviation="7" floodColor="#2cab68" floodOpacity="0.14" />
              </filter>
            </defs>

            <text
              className="fill-[#53635d] dark:fill-slate-300/76"
              fontFamily={chartAxisFontFamily}
              fontSize="12"
              fontWeight="800"
              letterSpacing="0"
              x={chart.chart.left}
              y="18"
            >
              Nilai (Rp Juta)
            </text>

            <g>
              {chart.axisTicks.map((tick, index) => (
                <g key={tick.label}>
                  <line
                    className={cn(
                      index === chart.axisTicks.length - 1
                        ? "stroke-[#95c5a8] dark:stroke-emerald-200/34"
                        : "stroke-[#cbd8d1] dark:stroke-slate-300/20"
                    )}
                    strokeLinecap="round"
                    strokeWidth="1.35"
                    x1={chart.chart.left - 9}
                    x2={chart.chart.left - 3}
                    y1={tick.y}
                    y2={tick.y}
                  />
                  <text
                    className={cn(
                      index === chart.axisTicks.length - 1
                        ? "fill-[#0d824b] dark:fill-emerald-200"
                        : "fill-[#50665b] dark:fill-slate-300/76"
                    )}
                    dominantBaseline="middle"
                    fontFamily={chartAxisFontFamily}
                    fontSize="13.8"
                    fontWeight={index === chart.axisTicks.length - 1 ? 900 : 800}
                    letterSpacing="0"
                    style={chartAxisTextStyle}
                    textAnchor="end"
                    x={chart.chart.left - 18}
                    y={tick.y}
                  >
                    {tick.label}
                  </text>
                </g>
              ))}
            </g>

            <g className="stroke-[#c3d2c9] dark:stroke-white/16" strokeDasharray="4 6" strokeWidth="1.2">
              {chart.axisTicks.map((tick) => (
                <line key={tick.label} x1={chart.chart.left} x2={chart.chart.right} y1={tick.y} y2={tick.y} />
              ))}
            </g>
            <line className="stroke-[#cfdcd4] dark:stroke-white/12" x1={chart.chart.left} x2={chart.chart.right} y1={chart.chart.bottom} y2={chart.chart.bottom} strokeWidth="1.15" />

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
                stroke="#9bd191"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3.1"
              />
            ))}
            {chart.linePaths.vickrey.map((linePath, index) => (
              <path
                className="transition-[opacity] duration-200 ease-[cubic-bezier(0.2,0,0,1)]"
                d={linePath}
                fill="none"
                filter="url(#admin-dashboard-line-shadow)"
                key={`vickrey-line-${index}`}
                stroke="#005626"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3.2"
              />
            ))}

            {activePoint ? (
              <g>
                <line
                  className="stroke-[#0d824b]/30 dark:stroke-emerald-200/34"
                  strokeDasharray="4 6"
                  strokeLinecap="round"
                  strokeWidth="1.6"
                  x1={activePoint.x}
                  x2={activePoint.x}
                  y1={chart.chart.top}
                  y2={chart.chart.bottom}
                />
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
                        className="transition-[r,opacity] duration-200 ease-[cubic-bezier(0.2,0,0,1)]"
                        cx={point.x}
                        cy={point.vickreyY}
                        fill="rgba(0,86,38,0.12)"
                        r={active ? 15 : 10}
                      />
                      <circle
                        className="transition-[r,stroke-width] duration-200 ease-[cubic-bezier(0.2,0,0,1)]"
                        cx={point.x}
                        cy={point.vickreyY}
                        fill="#ffffff"
                        r={active ? 6.6 : 5.4}
                        stroke="#005626"
                        strokeWidth="3"
                      />
                    </>
                  ) : null}
                  {point.fixedPriceAmount > 0 ? (
                    <>
                      <circle
                        className="transition-[r,opacity] duration-200 ease-[cubic-bezier(0.2,0,0,1)]"
                        cx={point.x}
                        cy={point.fixedPriceY}
                        fill="rgba(155,209,145,0.18)"
                        r={active ? 14 : 9.5}
                      />
                      <circle
                        className="transition-[r,stroke-width] duration-200 ease-[cubic-bezier(0.2,0,0,1)]"
                        cx={point.x}
                        cy={point.fixedPriceY}
                        fill="#ffffff"
                        r={active ? 6.2 : 5}
                        stroke="#9bd191"
                        strokeWidth="3"
                      />
                    </>
                  ) : null}
                </g>
              );
            })}

            <g>
              {chart.points.map((point, index) => {
                const active = index === activePointIndex;
                const showLabel = active || shouldShowXAxisLabel(index, chart.points.length);

                if (!showLabel) {
                  return null;
                }

                return (
                  <g key={`${point.label}-${index}`}>
                  {active ? (
                    <rect
                      className="fill-[#ecf8f0] stroke-[#bfe7cc] dark:fill-emerald-300/10 dark:stroke-emerald-200/16"
                      height="22"
                      rx="11"
                      width={point.labelWidth}
                      x={point.x - point.labelWidth / 2}
                      y="318"
                    />
                  ) : null}
                  <text
                    className={cn(
                      active
                        ? "fill-[#0a7b47] dark:fill-emerald-200"
                        : "fill-[#435768] dark:fill-slate-300/72"
                    )}
                    dominantBaseline="middle"
                    fontFamily={chartAxisFontFamily}
                    fontSize={active ? "13.8" : "13.2"}
                    fontWeight={active ? 900 : 800}
                    letterSpacing="0"
                    style={chartAxisTextStyle}
                    textAnchor="middle"
                    x={point.x}
                    y="329"
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

        <div className="grid gap-3 rounded-[1.3rem] border border-[#edf0ec] bg-white/96 p-3 shadow-[0_14px_28px_-24px_rgba(15,23,42,0.16)] dark:border-white/8 dark:bg-white/[0.035] dark:shadow-[0_14px_32px_-24px_rgba(0,0,0,0.5)] sm:grid-cols-2 xl:grid-cols-4">
          {stripMetrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div className="grid grid-cols-[2.6rem_minmax(0,1fr)] gap-3 rounded-[1rem] p-2" key={metric.title}>
                <span className="grid size-10 shrink-0 place-items-center rounded-[0.9rem] bg-[linear-gradient(180deg,#f4fbf5,#eaf7ee)] text-[#0d824b] shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] dark:bg-[linear-gradient(180deg,rgba(32,120,83,0.24),rgba(14,73,52,0.18))] dark:text-emerald-200 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <Icon className="size-5" strokeWidth={1.8} />
                </span>
                <div className="min-w-0">
                  <p className="text-[0.78rem] font-semibold leading-4 text-[#667783] dark:text-slate-300/70">{metric.title}</p>
                  <p className="mt-1 whitespace-nowrap font-headline text-[1.25rem] font-black leading-none tracking-[-0.035em] text-[#10874c] dark:text-emerald-200">
                    {metric.value}
                  </p>
                  <p className="mt-1 text-[0.74rem] leading-5 text-[#667783] dark:text-slate-300/62">{metric.subtext}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
