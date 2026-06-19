"use client";

import { useEffect, useMemo, useState } from "react";

import { getCountdownState, type CountdownState } from "@/lib/countdown";
import { cn } from "@/lib/utils";

type RestrictionCountdownTilesProps = {
  className?: string;
  level: number;
  serverNow?: string;
  targetAt: string | null | undefined;
};

const toneClasses = {
  amber: {
    label: "text-[#8a5200]",
    tile: "border-amber-200 bg-white",
    value: "text-[#a86200]"
  },
  orange: {
    label: "text-[#9a3412]",
    tile: "border-orange-200 bg-white",
    value: "text-[#dc4c18]"
  },
  red: {
    label: "text-[#991b1b]",
    tile: "border-red-200 bg-white",
    value: "text-[#b91c1c]"
  }
} as const;

function parseCountdownSegments(label: string, state: CountdownState) {
  if (state.isExpired) {
    return [{ key: "status", label: "Status", value: label }];
  }

  const match = label.match(
    /(?:(\d+)\s+hari\s+)?(?:(\d+)\s+jam\s+)?(?:(\d+)\s+menit\s+)?(?:(\d+)\s+detik)?/i
  );
  const [, dayRaw, hourRaw, minuteRaw, secondRaw] = match ?? [];
  const twoDigits = (value: string | undefined) =>
    String(Math.max(0, Number(value ?? 0))).padStart(2, "0");

  return [
    { key: "days", label: "Hari", value: twoDigits(dayRaw) },
    { key: "hours", label: "Jam", value: twoDigits(hourRaw) },
    { key: "minutes", label: "Menit", value: twoDigits(minuteRaw) },
    { key: "seconds", label: "Detik", value: twoDigits(secondRaw) }
  ];
}

export function RestrictionCountdownTiles({
  className,
  level,
  serverNow,
  targetAt
}: RestrictionCountdownTilesProps) {
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
  const [state, setState] = useState(() =>
    getCountdownState(targetAt, {
      expiredLabel: "Masa pembatasan berakhir",
      now: syncedClock()
    })
  );

  useEffect(() => {
    const update = () => {
      setState(
        getCountdownState(targetAt, {
          expiredLabel: "Masa pembatasan berakhir",
          now: syncedClock()
        })
      );
    };

    update();
    const intervalId = window.setInterval(update, 1000);

    return () => window.clearInterval(intervalId);
  }, [syncedClock, targetAt]);

  const tone = level >= 3 ? toneClasses.red : level === 2 ? toneClasses.orange : toneClasses.amber;
  const segments = parseCountdownSegments(state.label, state);

  return (
    <div
      aria-label="Sisa waktu pembatasan"
      className={cn(
        "grid w-full gap-1.5",
        state.isExpired ? "grid-cols-1" : "grid-cols-4",
        className
      )}
    >
      {segments.map((segment) => (
        <span
          className={cn(
            "grid min-h-[3.45rem] place-items-center rounded-lg border px-1.5 py-2 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.92)]",
            tone.tile
          )}
          key={segment.key}
        >
          <span>
            <span
              className={cn(
                "block font-headline text-base font-black leading-none [font-variant-numeric:tabular-nums]",
                tone.value
              )}
              data-testid={`restriction-countdown-${segment.key}`}
            >
              {segment.value}
            </span>
            <span className={cn("mt-1 block text-[0.58rem] font-bold leading-none", tone.label)}>
              {segment.label}
            </span>
          </span>
        </span>
      ))}
    </div>
  );
}
