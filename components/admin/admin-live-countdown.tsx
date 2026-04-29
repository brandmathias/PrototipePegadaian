"use client";

import { LiveCountdown } from "@/components/buyer/live-countdown";

type AdminLiveCountdownProps = {
  targetAt?: string | null;
  fallbackLabel: string;
  expiredLabel: string;
  prefix?: string;
  className?: string;
};

export function AdminLiveCountdown({
  targetAt,
  fallbackLabel,
  expiredLabel,
  prefix,
  className
}: AdminLiveCountdownProps) {
  return (
    <LiveCountdown
      className={className}
      expiredLabel={expiredLabel}
      fallbackLabel={fallbackLabel}
      prefix={prefix}
      targetAt={targetAt}
    />
  );
}
