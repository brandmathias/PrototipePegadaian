import React from "react";
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LiveCountdown } from "@/components/buyer/live-countdown";
import { getCountdownState } from "@/lib/countdown";

describe("buyer countdown helpers", () => {
  it("formats long-running auction countdowns with day and hour precision", () => {
    const targetAt = new Date("2026-05-01T16:00:00+08:00");
    const now = new Date("2026-04-29T11:30:00+08:00").getTime();

    expect(getCountdownState(targetAt.toISOString(), { now, expiredLabel: "Menunggu hasil" })).toEqual({
      isExpired: false,
      label: "2 hari 4 jam"
    });
  });

  it("returns expired labels once the deadline has passed", () => {
    const targetAt = new Date("2026-04-29T09:59:58+08:00");
    const now = new Date("2026-04-29T10:00:00+08:00").getTime();

    expect(
      getCountdownState(targetAt.toISOString(), {
        now,
        expiredLabel: "Waktu pembayaran berakhir"
      })
    ).toEqual({
      isExpired: true,
      label: "Waktu pembayaran berakhir"
    });
  });
});

describe("LiveCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-29T10:00:00+08:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("updates the buyer countdown in the browser without requiring refresh", () => {
    render(
      <LiveCountdown
        expiredLabel="Menunggu hasil"
        prefix="Sesi berakhir"
        targetAt={new Date("2026-04-29T10:01:05+08:00").toISOString()}
      />
    );

    expect(screen.getByText("Sesi berakhir 1 menit 5 detik")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText("Sesi berakhir 1 menit 4 detik")).toBeInTheDocument();
  });
});
