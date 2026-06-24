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

const chartAxisFontFamily = 'var(--font-manrope), "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
const chartAxisTextStyle = { fontVariantNumeric: "tabular-nums" } as const;
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

function formatAxisNumber(value: number) {
  if (Number.isInteger(value)) {
    return numberFormatter.format(value);
  }

  return numberFormatter.format(Number(value.toFixed(1)));
}

function resolveAxisMax(value: number) {
  return Math.max(30, Math.ceil(value / 5) * 5);
}

function buildChartModel(series: DashboardTrendPoint[]) {
  const fallback = series.length
    ? series
    : [
        { label: "00.00", value: 0, amount: 0 },
        { label: "04.00", value: 0, amount: 0 },
        { label: "08.00", value: 0, amount: 0 },
        { label: "12.00", value: 0, amount: 0 },
        { label: "16.00", value: 0, amount: 0 },
        { label: "20.00", value: 0, amount: 0 }
      ];
  const chart = {
    left: 70,
    right: 930,
    top: 38,
    bottom: 245
  };
  const maxPlotValue = Math.max(...fallback.map((point) => Number(point.value ?? 0)));
  const maxAxisValue = resolveAxisMax(maxPlotValue);
  const step = (chart.right - chart.left) / Math.max(fallback.length - 1, 1);
  const axisTicks = Array.from({ length: 7 }, (_, index) => {
    const ratio = index / 6;
    const value = maxAxisValue - maxAxisValue * ratio;

    return {
      label: formatAxisNumber(value),
      y: chart.top + (chart.bottom - chart.top) * ratio
    };
  });
  const points = fallback.map((point, index) => {
    const plotValue = Number(point.value ?? 0);
    const ratio = Math.min(plotValue / maxAxisValue, 1);
    const x = chart.left + step * index;
    const y = chart.bottom - ratio * (chart.bottom - chart.top);

    return {
      ...point,
      isActiveData: Number(point.amount ?? 0) > 0 || Number(point.value ?? 0) > 0,
      labelWidth: Math.max(48, point.label.length * 7.6 + 20),
      leftPercent: (x / 980) * 100,
      plotValue,
      topPercent: (y / 300) * 100,
      x,
      y
    };
  });
  const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)} ${chart.bottom} L${points[0].x.toFixed(1)} ${chart.bottom} Z`;

  return {
    axisTicks,
    areaPath,
    chart,
    linePath,
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
        ? "Rata-rata Pekanan"
        : ["last3Months", "last12Months", "yearToDate", "allTime"].includes(timeframe)
          ? "Rata-rata Bulanan"
          : "Rata-rata Harian";
  const averageSubtitle =
    timeframe === "day"
      ? `rata-rata nilai penjualan per slot waktu sepanjang ${range.label.toLowerCase()}`
      : timeframe === "month"
        ? `rata-rata nilai penjualan per pekan aktif sepanjang ${range.label.toLowerCase()}`
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
        label: formatDayLabel(date),
        value: 0,
        amount: 0
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
      bucket.value += 1;
      bucket.amount += Number(event.amount ?? 0);
    }

    return makeRangeFromPoints(
      buckets.map(({ label, value, amount }) => ({ label, value, amount })),
      "Rentang Kustom"
    );
  }

  const monthCount = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth() + 1;
  const buckets = Array.from({ length: monthCount }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth() + index, 1);

    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: formatMonthLabel(date),
      value: 0,
      amount: 0
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
    bucket.value += 1;
    bucket.amount += Number(event.amount ?? 0);
  }

  return makeRangeFromPoints(
    buckets.map(({ label, value, amount }) => ({ label, value, amount })),
    "Rentang Kustom"
  );
}

function makeRangeFromPoints(points: DashboardTrendPoint[], label: string): DashboardTrendRange {
  const totalRevenue = points.reduce((sum, point) => sum + point.amount, 0);
  const verifiedTransactions = points.reduce((sum, point) => sum + point.value, 0);
  const peakPoint = points.reduce(
    (highest, point) => (point.amount > highest.amount ? point : highest),
    points[0] ?? { label: "-", value: 0, amount: 0 }
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
  const range =
    activeRange === "custom" && customRange
      ? makeCustomTrendRange(metrics.salesTrend.events ?? [], customRange)
      : metrics.salesTrend.ranges[activeRange] ?? metrics.salesTrend.ranges.month ?? metrics.salesTrend.ranges.week;
  const chart = useMemo(() => buildChartModel(range.points), [range.points]);
  const stripMetrics = useMemo(
    () => buildStripMetrics(range, activeRange === "custom" ? "month" : activeRange),
    [activeRange, range]
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

        <div className="relative h-[16.5rem] rounded-[1.25rem] bg-[linear-gradient(180deg,#ffffff_0%,#fbfdfb_100%)] p-1 dark:bg-[linear-gradient(180deg,#101a15_0%,#0c1511_100%)] sm:p-2">
          <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 980 300">
            <defs>
              <linearGradient id="admin-dashboard-area" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#93dc9b" stopOpacity="0.48" />
                <stop offset="72%" stopColor="#d3efd5" stopOpacity="0.24" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.04" />
              </linearGradient>
              <filter id="admin-dashboard-line-shadow" x="-10%" y="-25%" width="130%" height="170%">
                <feDropShadow dx="0" dy="10" stdDeviation="7" floodColor="#2cab68" floodOpacity="0.14" />
              </filter>
            </defs>

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
                    fontSize="12.6"
                    fontWeight={index === chart.axisTicks.length - 1 ? 900 : 760}
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

            <g className="stroke-[#dfe5de] dark:stroke-white/10" strokeDasharray="3 5" strokeWidth="1.1">
              {chart.axisTicks.slice(0, -1).map((tick) => (
                <line key={tick.label} x1={chart.chart.left} x2={chart.chart.right} y1={tick.y} y2={tick.y} />
              ))}
            </g>
            <line className="stroke-[#dfe5de] dark:stroke-white/10" x1={chart.chart.left} x2={chart.chart.right} y1={chart.chart.bottom} y2={chart.chart.bottom} strokeWidth="1.1" />

            <path d={chart.areaPath} fill="url(#admin-dashboard-area)" />
            <path
              d={chart.linePath}
              fill="none"
              filter="url(#admin-dashboard-line-shadow)"
              stroke="#0ea34e"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
            />

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
                <circle cx={activePoint.x} cy={activePoint.y} fill="rgba(30,185,95,0.14)" r="22" />
              </g>
            ) : null}

            {chart.points.map((point, index) => {
              const active = index === activePointIndex;
              const visibleDataPoint = point.isActiveData || index === 0 || index === chart.points.length - 1;

              return (
                <g key={`${point.label}-marker-${index}`}>
                  {visibleDataPoint ? (
                    <circle
                      cx={point.x}
                      cy={point.y}
                      fill={point.isActiveData ? "rgba(30,185,95,0.13)" : "rgba(30,185,95,0.08)"}
                      r={active ? 17 : point.isActiveData ? 12 : 9}
                    />
                  ) : null}
                  <circle
                    cx={point.x}
                    cy={point.y}
                    fill="#ffffff"
                    r={active ? 7.4 : point.isActiveData ? 6.2 : 4.2}
                    stroke={point.isActiveData ? "#10a24f" : "#b9d8c4"}
                    strokeWidth={point.isActiveData ? 3.2 : 2.2}
                  />
                </g>
              );
            })}

            <g>
              {chart.points.map((point, index) => (
                <g key={`${point.label}-${index}`}>
                  {point.isActiveData ? (
                    <rect
                      className="fill-[#ecf8f0] stroke-[#bfe7cc] dark:fill-emerald-300/10 dark:stroke-emerald-200/16"
                      height="22"
                      rx="11"
                      width={point.labelWidth}
                      x={point.x - point.labelWidth / 2}
                      y="266"
                    />
                  ) : null}
                  <text
                    className={cn(
                      point.isActiveData
                        ? "fill-[#0a7b47] dark:fill-emerald-200"
                        : "fill-[#435768] dark:fill-slate-300/72"
                    )}
                    dominantBaseline="middle"
                    fontFamily={chartAxisFontFamily}
                    fontSize={point.isActiveData ? "12.8" : "12.2"}
                    fontWeight={point.isActiveData ? 900 : 760}
                    letterSpacing="0"
                    style={chartAxisTextStyle}
                    textAnchor="middle"
                    x={point.x}
                    y="277"
                  >
                    {point.label}
                  </text>
                </g>
              ))}
            </g>
          </svg>

          {chart.points.map((point, index) => (
            <button
              aria-label={`${point.label}: ${formatCount(point.value)} transaksi lunas, ${formatCurrencyCompact(point.amount)}`}
              className="absolute size-11 -translate-x-1/2 -translate-y-1/2 rounded-full outline-none transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:ring-2 focus-visible:ring-[#18a65a] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              key={`${point.label}-hotspot-${index}`}
              onBlur={() => setActivePointIndex(null)}
              onFocus={() => setActivePointIndex(index)}
              onMouseEnter={() => setActivePointIndex(index)}
              onMouseLeave={() => setActivePointIndex(null)}
              style={{
                left: `${point.leftPercent}%`,
                top: `${point.topPercent}%`
              }}
              type="button"
            />
          ))}

          {activePoint ? (
            <div
              className="pointer-events-none absolute w-[13.4rem] -translate-x-1/2 -translate-y-full rounded-[1rem] border border-[#cfe7d8] bg-white/98 px-4 py-3 text-left shadow-[0_22px_50px_-30px_rgba(0,82,45,0.45)] ring-1 ring-white/70 transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] dark:border-emerald-300/18 dark:bg-[#102019]/98 dark:shadow-[0_22px_54px_-28px_rgba(0,0,0,0.72)] dark:ring-white/8"
              role="tooltip"
              style={{
                left: `clamp(7rem, ${activePoint.leftPercent}%, calc(100% - 7rem))`,
                top: `calc(${activePoint.topPercent}% - 0.9rem)`
              }}
            >
              <div className="absolute left-1/2 top-full size-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-[#cfe7d8] bg-white dark:border-emerald-300/18 dark:bg-[#102019]" />
              <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-[#6a7d73] dark:text-slate-300/68">
                {activePoint.label}
              </p>
              <p className="mt-1 font-headline text-[1.35rem] font-black leading-none tracking-[-0.035em] text-[#08633b] dark:text-emerald-200">
                {formatCount(activePoint.value)} transaksi lunas
              </p>
              <p className="mt-1 text-[0.78rem] font-semibold text-[#60736a] dark:text-slate-300/72">
                Nilai penjualan {formatCurrencyCompact(activePoint.amount)}
              </p>
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
