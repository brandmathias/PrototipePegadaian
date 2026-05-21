"use client";

import { LiveCountdown } from "@/components/buyer/live-countdown";

type AdminLiveCountdownProps = {
  targetAt?: string | null;
  fallbackLabel: string;
  expiredLabel: string;
  prefix?: string;
  className?: string;
  serverNow?: string;
};

export function AdminLiveCountdown({
  targetAt,
  fallbackLabel,
  expiredLabel,
  prefix,
  className,
  serverNow
}: AdminLiveCountdownProps) {
  return (
    <LiveCountdown
      className={className}
      expiredLabel={expiredLabel}
      fallbackLabel={fallbackLabel}
      prefix={prefix}
      serverNow={serverNow}
      targetAt={targetAt}
    />
  );
}
