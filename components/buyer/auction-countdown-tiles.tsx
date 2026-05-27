"use client";

import { useEffect, useMemo, useState } from "react";

import type { CountdownState } from "@/lib/countdown";
import { getCountdownState } from "@/lib/countdown";
import { cn } from "@/lib/utils";

type AuctionCountdownTilesProps = {
  className?: string;
  expiredLabel: string;
  fallbackLabel?: string;
  serverNow?: string;
  targetAt: string | null | undefined;
};

function parseCountdownSegments(label: string, state: CountdownState) {
  if (state.isExpired) {
    return [{ label: "Status", value: label }];
  }

  const match = label.match(/(?:(\d+)\s+hari\s+)?(?:(\d+)\s+jam\s+)?(?:(\d+)\s+menit\s+)?(?:(\d+)\s+detik)?/i);
  if (!match) {
    return [{ label: "Sisa", value: label }];
  }

  const [, dayRaw, hourRaw, minuteRaw, secondRaw] = match;
  const days = Number(dayRaw ?? 0);
  const hours = Number(hourRaw ?? 0);
  const minutes = Number(minuteRaw ?? 0);
  const seconds = Number(secondRaw ?? 0);
  const twoDigits = (value: number) => String(Math.max(0, value)).padStart(2, "0");

  if (days > 0) {
    return [
      { label: "Hari", value: twoDigits(days) },
      { label: "Jam", value: twoDigits(hours) },
      { label: "Menit", value: twoDigits(minutes) },
      { label: "Detik", value: twoDigits(seconds) }
    ];
  }

  return [
    { label: "Jam", value: twoDigits(hours) },
    { label: "Menit", value: twoDigits(minutes) },
    { label: "Detik", value: twoDigits(seconds) }
  ];
}

export function AuctionCountdownTiles({
  className,
  expiredLabel,
  fallbackLabel,
  serverNow,
  targetAt
}: AuctionCountdownTilesProps) {
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

  const segments = parseCountdownSegments(state.label, state);

  return (
    <div
      className={cn(
        "grid w-full max-w-[18.5rem] gap-1.5",
        segments.length >= 4 ? "grid-cols-4" : "grid-cols-3",
        className
      )}
    >
      {segments.map((segment) => (
        <span
          className={cn(
            "rounded-md bg-[#fff3f4] px-2 py-2 text-center ring-1 ring-[#ffd9df] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            state.isExpired && "col-span-full"
          )}
          key={segment.label}
        >
          <span className="block font-headline text-sm font-black leading-none text-[#d72b43] [font-variant-numeric:tabular-nums]">
            {segment.value}
          </span>
          <span className="mt-1 block text-[0.58rem] font-bold text-[#b13a4d]">{segment.label}</span>
        </span>
      ))}
    </div>
  );
}
