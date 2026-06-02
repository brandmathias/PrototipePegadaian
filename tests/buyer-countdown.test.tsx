import React from "react";
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LiveCountdown } from "@/components/buyer/live-countdown";
import { getCountdownState } from "@/lib/countdown";

describe("buyer countdown helpers", () => {
  it("formats long-running auction countdowns with second precision", () => {
    const targetAt = new Date("2026-05-01T16:00:00+08:00");
    const now = new Date("2026-04-29T11:30:00+08:00").getTime();

    expect(getCountdownState(targetAt.toISOString(), { now, expiredLabel: "Menunggu hasil" })).toEqual({
      isExpired: false,
      label: "2 hari 4 jam 30 menit 0 detik"
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

  it("keeps long auction countdowns visibly ticking every second", () => {
    render(
      <LiveCountdown
        expiredLabel="Menunggu hasil"
        prefix="Sesi berakhir"
        targetAt={new Date("2026-05-01T14:30:05+08:00").toISOString()}
      />
    );

    expect(screen.getByText("Sesi berakhir 2 hari 4 jam 30 menit 5 detik")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText("Sesi berakhir 2 hari 4 jam 30 menit 4 detik")).toBeInTheDocument();
  });

  it("uses server time and monotonic elapsed time so device clock changes do not expire the countdown", () => {
    render(
      <LiveCountdown
        expiredLabel="Menunggu hasil"
        prefix="Sesi berakhir"
        serverNow={new Date("2026-04-29T10:00:00+08:00").toISOString()}
        targetAt={new Date("2026-04-29T10:01:00+08:00").toISOString()}
      />
    );

    expect(screen.getByText("Sesi berakhir 1 menit 0 detik")).toBeInTheDocument();

    vi.setSystemTime(new Date("2026-04-29T12:00:00+08:00"));
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText("Sesi berakhir 59 detik")).toBeInTheDocument();
    expect(screen.queryByText("Menunggu hasil")).not.toBeInTheDocument();
  });

  it("supports slower update intervals for non-critical countdown lists", () => {
    render(
      <LiveCountdown
        expiredLabel="Menunggu hasil"
        prefix="Sesi berakhir"
        targetAt={new Date("2026-04-29T10:03:00+08:00").toISOString()}
        updateIntervalMs={60_000}
      />
    );

    expect(screen.getByText("Sesi berakhir 3 menit 0 detik")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    expect(screen.getByText("Sesi berakhir 3 menit 0 detik")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    expect(screen.getByText("Sesi berakhir 2 menit 0 detik")).toBeInTheDocument();
  });

  it("notifies once when the countdown reaches the deadline", () => {
    const onExpired = vi.fn();

    render(
      <LiveCountdown
        expiredLabel="Menunggu hasil"
        onExpired={onExpired}
        prefix="Sesi berakhir"
        targetAt={new Date("2026-04-29T10:00:01+08:00").toISOString()}
      />
    );

    expect(onExpired).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onExpired).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(onExpired).toHaveBeenCalledTimes(1);
  });
});
