"use client";

import { LiveCountdown } from "@/components/buyer/live-countdown";

type AdminLiveCountdownProps = {
  targetAt?: string | null;
  fallbackLabel: string;
  expiredLabel: string;
  prefix?: string;
  className?: string;
  onExpired?: () => void;
  serverNow?: string;
};

export function AdminLiveCountdown({
  targetAt,
  fallbackLabel,
  expiredLabel,
  prefix,
  className,
  onExpired,
  serverNow
}: AdminLiveCountdownProps) {
  return (
    <LiveCountdown
      className={className}
      expiredLabel={expiredLabel}
      fallbackLabel={fallbackLabel}
      onExpired={onExpired}
      prefix={prefix}
      serverNow={serverNow}
      targetAt={targetAt}
    />
  );
}
