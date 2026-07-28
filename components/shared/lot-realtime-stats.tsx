"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Heart, ShoppingBag, UsersRound, type LucideIcon } from "lucide-react";

import type { AuctionMode, LotInsights } from "@/lib/contracts/catalog";
import { cn } from "@/lib/utils";

const EMPTY_STATS: LotInsights = {
  likes: 0,
  participants: 0,
  views: 0
};

type LotRealtimeStatsProps = {
  className?: string;
  fixedStatusLabel?: string;
  iconClassName?: string;
  initialStats?: LotInsights | null;
  itemClassName?: string;
  labelClassName?: string;
  lotId: string;
  mode: AuctionMode;
  pollIntervalMs?: number | null;
  separatorClassName?: string;
  showFixedStatus?: boolean;
  showSeparators?: boolean;
  status?: string;
  trackView?: boolean;
  valueClassName?: string;
  watchLabel?: string;
};

type StatItem = {
  icon: LucideIcon;
  label: string;
  value: string;
};

function normalizeStats(stats?: LotInsights | null): LotInsights {
  return {
    likes: Number(stats?.likes ?? 0),
    participants: Number(stats?.participants ?? 0),
    views: Number(stats?.views ?? 0)
  };
}

function createVisitId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function formatCount(value: number) {
  return value.toLocaleString("id-ID");
}

export function LotRealtimeStats({
  className,
  fixedStatusLabel = "Status",
  iconClassName,
  initialStats,
  itemClassName,
  labelClassName,
  lotId,
  mode,
  pollIntervalMs = null,
  separatorClassName,
  showFixedStatus = false,
  showSeparators = false,
  status,
  trackView = false,
  valueClassName,
  watchLabel = "Suka"
}: LotRealtimeStatsProps) {
  const [stats, setStats] = useState<LotInsights>(() => normalizeStats(initialStats));
  const visitId = useMemo(createVisitId, [lotId]);

  useEffect(() => {
    setStats(normalizeStats(initialStats));
  }, [initialStats]);

  const endpoint = useMemo(() => `/api/public/lots/${encodeURIComponent(lotId)}/stats`, [lotId]);

  const refreshStats = useCallback(
    async (method: "GET" | "POST") => {
      const request =
        method === "POST"
          ? fetch(endpoint, {
              body: JSON.stringify({ visitId }),
              cache: "no-store",
              headers: { "Content-Type": "application/json" },
              method
            })
          : fetch(endpoint, {
              cache: "no-store",
              method
            });

      const response = await request;
      if (!response.ok) {
        return null;
      }

      return normalizeStats(await response.json());
    },
    [endpoint, visitId]
  );

  useEffect(() => {
    let mounted = true;

    if (trackView || !initialStats) {
      void refreshStats(trackView ? "POST" : "GET")
        .then((nextStats) => {
          if (mounted && nextStats) {
            setStats(nextStats);
          }
        })
        .catch(() => undefined);
    }

    const intervalId =
      pollIntervalMs && pollIntervalMs > 0
        ? window.setInterval(() => {
            void refreshStats("GET")
              .then((nextStats) => {
                if (mounted && nextStats) {
                  setStats(nextStats);
                }
              })
              .catch(() => undefined);
          }, pollIntervalMs)
        : null;

    return () => {
      mounted = false;
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
    };
  }, [initialStats, pollIntervalMs, refreshStats, trackView]);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") {
        return;
      }

      void refreshStats("GET")
        .then((nextStats) => {
          if (nextStats) {
            setStats(nextStats);
          }
        })
        .catch(() => undefined);
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshStats]);

  useEffect(() => {
    function handleRefresh(event: Event) {
      const detail = event instanceof CustomEvent ? (event.detail as { lotId?: string } | undefined) : undefined;
      if (detail?.lotId !== lotId) {
        return;
      }

      void refreshStats("GET")
        .then((nextStats) => {
          if (nextStats) {
            setStats(nextStats);
          }
        })
        .catch(() => undefined);
    }

    window.addEventListener("pegadaian:lot-stats-refresh", handleRefresh);

    return () => {
      window.removeEventListener("pegadaian:lot-stats-refresh", handleRefresh);
    };
  }, [lotId, refreshStats]);

  const items: StatItem[] = [
    {
      icon: Eye,
      label: "Dilihat",
      value: `${formatCount(stats.views)}x`
    },
    {
      icon: Heart,
      label: watchLabel,
      value: formatCount(stats.likes)
    },
    mode === "vickrey"
      ? {
          icon: UsersRound,
          label: "Peserta",
          value: formatCount(stats.participants)
        }
      : showFixedStatus
        ? {
            icon: ShoppingBag,
            label: fixedStatusLabel,
            value: status ?? "-"
          }
        : null
  ].filter(Boolean) as StatItem[];

  return (
    <div className={className}>
      {items.map((item, index) => {
        const Icon = item.icon;

        return (
          <div className="contents" key={item.label}>
            {showSeparators && index > 0 ? <span className={separatorClassName} /> : null}
            <span className={cn("inline-flex shrink-0 items-center gap-1 whitespace-nowrap", itemClassName)}>
              <Icon className={cn("size-3.5", iconClassName)} />
              <span className={labelClassName}>{item.label}</span>
              <span className={valueClassName}>{item.value}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
