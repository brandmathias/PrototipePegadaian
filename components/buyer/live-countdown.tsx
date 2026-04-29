"use client";

import { useEffect, useMemo, useState } from "react";

import { getCountdownState } from "@/lib/countdown";

type LiveCountdownProps = {
  targetAt: string | null | undefined;
  fallbackLabel?: string;
  expiredLabel: string;
  prefix?: string;
  className?: string;
};

export function LiveCountdown({
  targetAt,
  fallbackLabel,
  expiredLabel,
  prefix,
  className
}: LiveCountdownProps) {
  const initialState = useMemo(
    () =>
      fallbackLabel
        ? {
            isExpired: !targetAt || fallbackLabel === expiredLabel,
            label: fallbackLabel
          }
        : getCountdownState(targetAt, { expiredLabel }),
    [expiredLabel, fallbackLabel, targetAt]
  );

  const [state, setState] = useState(initialState);

  useEffect(() => {
    const update = () => {
      setState(getCountdownState(targetAt, { expiredLabel }));
    };

    update();
    const intervalId = window.setInterval(update, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [expiredLabel, targetAt]);

  const text = state.isExpired || !prefix ? state.label : `${prefix} ${state.label}`;

  return <span className={className}>{text}</span>;
}
