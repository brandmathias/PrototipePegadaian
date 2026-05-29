"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  ChartNoAxesCombined,
  MoreVertical,
  ShoppingCart,
  Tag,
  TrendingUp,
  type LucideIcon
} from "lucide-react";

import { cn } from "@/lib/utils";
import type {
  AdminDashboardMetrics,
  DashboardSalesTimeframeKey,
  DashboardTrendPoint,
  DashboardTrendRange
} from "@/components/pages/admin-dashboard-page";

type DashboardStripMetric = {
  title: string;
  value: string;
  subtext: string;
  icon: LucideIcon;
};

const numberFormatter = new Intl.NumberFormat("id-ID");

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
  const maxAxisValue = 50;
  const step = (chart.right - chart.left) / Math.max(fallback.length - 1, 1);
  const axisTicks = [
    { label: "50+", y: 38 },
    { label: "40", y: 79.4 },
    { label: "30", y: 120.8 },
    { label: "20", y: 162.2 },
    { label: "10", y: 203.6 },
    { label: "0", y: chart.bottom }
  ];
  const points = fallback.map((point, index) => {
    const ratio = Math.min(point.value / maxAxisValue, 1);
    return {
      ...point,
      x: chart.left + step * index,
      y: chart.bottom - ratio * (chart.bottom - chart.top)
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
    timeframe === "day" ? "Rata-rata Slot" : timeframe === "month" ? "Rata-rata Pekanan" : "Rata-rata Harian";
  const averageSubtitle =
    timeframe === "day"
      ? `rata-rata nilai penjualan per slot waktu sepanjang ${range.label.toLowerCase()}`
      : timeframe === "month"
        ? `rata-rata nilai penjualan per pekan aktif sepanjang ${range.label.toLowerCase()}`
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

const timeframeOptions: Array<{ key: DashboardSalesTimeframeKey; label: string }> = [
  { key: "day", label: "Hari Ini" },
  { key: "week", label: "Minggu Ini" },
  { key: "month", label: "Bulan Ini" }
];

export function AdminDashboardTrendChart({ metrics }: { metrics: AdminDashboardMetrics }) {
  const [activeRange, setActiveRange] = useState<DashboardSalesTimeframeKey>(metrics.salesTrend.defaultRange);
  const range = metrics.salesTrend.ranges[activeRange] ?? metrics.salesTrend.ranges.week;
  const chart = useMemo(() => buildChartModel(range.points), [range.points]);
  const stripMetrics = useMemo(() => buildStripMetrics(range, activeRange), [activeRange, range]);
  const lastPoint = chart.points[chart.points.length - 1];

  return (
    <div className="relative overflow-hidden rounded-[1.65rem] border border-[#ebeeea] bg-white p-4 shadow-[0_20px_48px_-40px_rgba(15,23,42,0.2)] transition-colors duration-300 dark:border-emerald-300/10 dark:bg-[#101a15] dark:shadow-[0_20px_54px_-34px_rgba(0,0,0,0.64)] sm:p-5">
      <div className="relative flex flex-col gap-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-[5.15rem] shrink-0 place-items-center rounded-[1.15rem] border border-[#dcefe2] bg-[linear-gradient(180deg,#f5fbf6,#ebf7ef)] text-[#0c6a42] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-colors duration-300 dark:border-emerald-300/12 dark:bg-[linear-gradient(180deg,rgba(32,120,83,0.26),rgba(14,73,52,0.22))] dark:text-emerald-200 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <ChartNoAxesCombined className="size-10" strokeWidth={1.8} />
            </span>
            <div>
              <h2 className="font-headline text-[1.35rem] font-black tracking-[-0.035em] text-[#121a16] dark:text-slate-100 sm:text-[1.55rem]">
                Laporan Tren Penjualan
              </h2>
              <p className="mt-1 max-w-xl text-sm leading-6 text-[#5f6d67] dark:text-slate-300/72">
                Performa penjualan barang lelang dalam periode waktu pilihan.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start">
            {timeframeOptions.map((option) => {
              const active = option.key === activeRange;
              return (
                <button
                  aria-pressed={active}
                  className={cn(
                    "inline-flex min-w-[6.6rem] items-center justify-center rounded-[0.82rem] border px-4 py-3 text-[0.9rem] font-black tracking-[-0.015em] transition duration-300",
                    active
                      ? "border-[#179353] bg-[linear-gradient(180deg,#1a9b56,#13844a)] text-white shadow-[0_16px_32px_-22px_rgba(19,132,74,0.65)]"
                      : "border-[#ebeeea] bg-white text-[#2a352f] shadow-[0_10px_24px_-22px_rgba(15,23,42,0.34)] hover:border-[#d7e4da] hover:bg-[#fbfcfb] dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-100 dark:hover:border-emerald-300/18 dark:hover:bg-white/[0.05]"
                  )}
                  key={option.key}
                  onClick={() => setActiveRange(option.key)}
                  type="button"
                >
                  {option.label}
                </button>
              );
            })}

            <button
              aria-label="Opsi tren penjualan"
              className="inline-flex size-11 items-center justify-center rounded-[0.82rem] border border-transparent text-[#425466] transition duration-300 hover:bg-[#f6f8f7] dark:text-slate-300 dark:hover:bg-white/[0.04]"
              type="button"
            >
              <MoreVertical className="size-5" strokeWidth={2} />
            </button>
          </div>
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

            <g className="fill-[#536472] dark:fill-slate-300/70" fontSize="13">
              {chart.axisTicks.map((tick, index) => (
                <text key={tick.label} x={index === chart.axisTicks.length - 1 ? 35 : 14} y={tick.y + 6}>
                  {tick.label}
                </text>
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

            <circle cx={chart.points[0].x} cy={chart.points[0].y} fill="#ffffff" r="6.5" stroke="#10a24f" strokeWidth="3.2" />
            <circle cx={lastPoint.x} cy={lastPoint.y} fill="rgba(30,185,95,0.12)" r="17" />
            <circle cx={lastPoint.x} cy={lastPoint.y} fill="#ffffff" r="6.5" stroke="#10a24f" strokeWidth="3.2" />

            <g className="fill-[#425466] dark:fill-slate-300/70" fontSize="12">
              {chart.points.map((point, index) => (
                <text key={`${point.label}-${index}`} textAnchor="middle" x={point.x} y="282">
                  {point.label}
                </text>
              ))}
            </g>
          </svg>
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
