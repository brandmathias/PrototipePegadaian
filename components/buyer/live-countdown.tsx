"use client";

import { useEffect, useMemo, useState } from "react";

import type { CountdownState } from "@/lib/countdown";
import { getCountdownState } from "@/lib/countdown";

type LiveCountdownProps = {
  targetAt: string | null | undefined;
  fallbackLabel?: string;
  expiredLabel: string;
  prefix?: string;
  className?: string;
  serverNow?: string;
  formatLabel?: (label: string, state: CountdownState) => string;
};

export function LiveCountdown({
  targetAt,
  fallbackLabel,
  expiredLabel,
  prefix,
  className,
  serverNow,
  formatLabel
}: LiveCountdownProps) {
  const syncedClock = useMemo(() => {
    const serverNowMs = serverNow ? new Date(serverNow).getTime() : Number.NaN;
    const performanceStart = typeof performance !== "undefined" ? performance.now() : 0;
    const dateStart = Date.now();

    return () => {
      if (Number.isNaN(serverNowMs)) {
        return Date.now();
      }

      const elapsedMs =
        typeof performance !== "undefined"
          ? performance.now() - performanceStart
          : Date.now() - dateStart;

      return serverNowMs + Math.max(0, elapsedMs);
    };
  }, [serverNow]);

  const initialState = useMemo(
    () =>
      fallbackLabel
        ? {
            isExpired: !targetAt || fallbackLabel === expiredLabel,
            label: fallbackLabel
          }
        : getCountdownState(targetAt, { expiredLabel, now: syncedClock() }),
    [expiredLabel, fallbackLabel, syncedClock, targetAt]
  );

  const [state, setState] = useState(initialState);

  useEffect(() => {
    const update = () => {
      setState(getCountdownState(targetAt, { expiredLabel, now: syncedClock() }));
    };

    update();
    const intervalId = window.setInterval(update, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [expiredLabel, syncedClock, targetAt]);

  const text = state.isExpired || !prefix ? state.label : `${prefix} ${state.label}`;
  const output = formatLabel ? formatLabel(text, state) : text;

  return <span className={className}>{output}</span>;
}
