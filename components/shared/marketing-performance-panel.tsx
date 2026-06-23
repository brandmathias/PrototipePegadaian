"use client";

import { BarChart3, Eye, Heart } from "lucide-react";

import type { LotInsights } from "@/lib/contracts/catalog";
import { cn } from "@/lib/utils";

const EMPTY_INSIGHTS: LotInsights = {
  likes: 0,
  participants: 0,
  views: 0
};

function normalizeInsights(insights?: LotInsights | null): LotInsights {
  return {
    likes: Number(insights?.likes ?? EMPTY_INSIGHTS.likes),
    participants: Number(insights?.participants ?? EMPTY_INSIGHTS.participants),
    views: Number(insights?.views ?? EMPTY_INSIGHTS.views)
  };
}

function MarketingPerformanceMetricCard({
  detail,
  icon: Icon,
  label,
  tone,
  value
}: {
  detail: string;
  icon: typeof Eye;
  label: string;
  tone: "green" | "rose";
  value: string;
}) {
  const toneClass =
    tone === "green"
      ? "border-[#bde9d2] bg-[#eaf7f0] text-[#006747] [--dot-color:rgba(0,103,71,0.17)]"
      : "border-[#ffd1d9] bg-[#fff0f2] text-[#e11d48] [--dot-color:rgba(225,29,72,0.16)]";

  return (
    <div className={cn("relative min-h-[7.1rem] overflow-hidden rounded-xl border p-4", toneClass)}>
      <div className="absolute inset-y-0 right-0 w-32 opacity-70 [background-image:radial-gradient(circle,var(--dot-color)_1.2px,transparent_1.2px)] [background-size:10px_10px]" />
      <div className="relative flex h-full items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[0.7rem] font-black uppercase tracking-[0.13em]">{label}</p>
          <p className="mt-2 font-headline text-[2rem] font-black leading-none text-[#070b16] sm:text-[2.25rem]">
            {value}
          </p>
          <p className="mt-2 text-[0.74rem] font-semibold text-[#53655e]">{detail}</p>
        </div>
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-white/80 bg-white/82 text-current shadow-[0_18px_36px_-28px_rgba(8,69,50,0.42)]">
          <Icon className="size-6" strokeWidth={2.35} />
        </span>
      </div>
    </div>
  );
}

export function MarketingPerformancePanel({
  className,
  insights,
  testId
}: {
  className?: string;
  insights?: LotInsights | null;
  testId?: string;
}) {
  const normalized = normalizeInsights(insights);

  return (
    <section
      className={cn(
        "rounded-[1.25rem] border border-[#d8e8dd] bg-white p-4 shadow-[0_20px_58px_-50px_rgba(8,69,50,0.42)]",
        className
      )}
      data-testid={testId}
    >
      <div className="flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#ecf9f2] text-[#007a4d] ring-1 ring-[#d5ecdf]">
          <BarChart3 className="size-4" strokeWidth={2.15} />
        </span>
        <div className="min-w-0">
          <h3 className="font-headline text-[1.02rem] font-black leading-tight text-[#07111f]">
            Performa & Aktivitas Sesi Publik
          </h3>
        </div>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <MarketingPerformanceMetricCard
          detail="Sejak dipublikasikan"
          icon={Eye}
          label="Total Tayangan"
          tone="green"
          value={`${normalized.views.toLocaleString("id-ID")}x`}
        />
        <MarketingPerformanceMetricCard
          detail="Disimpan oleh pengguna unik"
          icon={Heart}
          label="Watchlist Nasabah"
          tone="rose"
          value={`${normalized.likes.toLocaleString("id-ID")} Akun`}
        />
      </div>
    </section>
  );
}
