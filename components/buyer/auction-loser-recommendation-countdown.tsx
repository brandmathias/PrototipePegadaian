"use client";

import type { CountdownState } from "@/lib/countdown";
import { LiveCountdown } from "@/components/buyer/live-countdown";

type AuctionLoserRecommendationCountdownProps = {
  targetAt: string | null | undefined;
  fallbackLabel?: string;
  serverNow?: string;
  className?: string;
};

function formatRecommendationCountdown(label: string, state: CountdownState) {
  if (state.isExpired) {
    return label;
  }

  return label
    .replace(/\bhari\b/gi, "h")
    .replace(/\bjam\b/gi, "j")
    .replace(/\bmenit\b/gi, "m")
    .replace(/\bdetik\b/gi, "d");
}

export function AuctionLoserRecommendationCountdown({
  targetAt,
  fallbackLabel,
  serverNow,
  className,
}: AuctionLoserRecommendationCountdownProps) {
  return (
    <LiveCountdown
      className={className}
      expiredLabel="Menunggu hasil"
      fallbackLabel={fallbackLabel}
      formatLabel={formatRecommendationCountdown}
      serverNow={serverNow}
      targetAt={targetAt}
      updateIntervalMs={60_000}
    />
  );
}
