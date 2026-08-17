"use client";

import { useEffect, useMemo, useState } from "react";

type AuctionWinnerCountdownProps = {
  targetAt?: string | null;
  serverNow?: string;
  variant?: "inline" | "tiles";
};

type CountdownParts = {
  expired: boolean;
  hours: string;
  minutes: string;
  seconds: string;
};

function getTargetParts(targetAt?: string | null, now = Date.now()): CountdownParts {
  if (!targetAt) {
    return {
      expired: true,
      hours: "00",
      minutes: "00",
      seconds: "00",
    };
  }

  const targetMs = new Date(targetAt).getTime();
  const diffMs = targetMs - now;

  if (Number.isNaN(targetMs) || diffMs <= 0) {
    return {
      expired: true,
      hours: "00",
      minutes: "00",
      seconds: "00",
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  const formatUnit = (value: number) => String(value).padStart(2, "0");

  return {
    expired: false,
    hours: formatUnit(hours),
    minutes: formatUnit(minutes),
    seconds: formatUnit(seconds),
  };
}

export function AuctionWinnerCountdown({
  serverNow,
  targetAt,
  variant = "tiles",
}: AuctionWinnerCountdownProps) {
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

  const [parts, setParts] = useState(() => getTargetParts(targetAt, syncedClock()));

  useEffect(() => {
    const update = () => {
      setParts(getTargetParts(targetAt, syncedClock()));
    };

    update();
    const intervalId = window.setInterval(update, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [syncedClock, targetAt]);

  const units = [
    { label: "Jam", value: parts.hours },
    { label: "Menit", value: parts.minutes },
    { label: "Detik", value: parts.seconds },
  ];

  if (variant === "inline") {
    return (
      <span
        aria-label="Sisa waktu pembayaran"
        className="font-headline text-lg font-black tracking-[-0.025em] text-[#dc2626] [font-variant-numeric:tabular-nums]"
      >
        {parts.hours}:{parts.minutes}:{parts.seconds}
      </span>
    );
  }

  if (parts.expired) {
    return (
      <div className="rounded-[1.5rem] border border-[#f0d5d5] bg-white px-5 py-6 text-center">
        <p className="text-[0.74rem] font-bold uppercase tracking-[0.22em] text-[#991b1b]">
          Batas waktu berakhir
        </p>
        <p className="mt-3 font-headline text-2xl font-black tracking-[-0.03em] text-[#991b1b]">
          00 : 00 : 00
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-end justify-between gap-2.5 text-center">
      {units.map((unit, index) => (
        <div className="contents" key={unit.label}>
          <div className="min-w-0 flex-1 rounded-[1.2rem] bg-[#fff7f7] px-2 py-3 ring-1 ring-[#f0d5d5]">
            <span
              className="winner-count-tick block font-headline text-[2.35rem] font-black leading-none tracking-[-0.06em] text-[#991b1b] [font-variant-numeric:tabular-nums] md:text-[2.85rem]"
              key={`${unit.label}-${unit.value}`}
            >
              {unit.value}
            </span>
            <span className="mt-2 block text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#7d6767]">
              {unit.label}
            </span>
          </div>
          {index < units.length - 1 ? (
            <span
              aria-hidden="true"
              className="pb-5 font-headline text-[2rem] font-black leading-none text-[#991b1b] md:text-[2.4rem]"
            >
              :
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
