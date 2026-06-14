import React from "react";
import { act, render, screen } from "@testing-library/react";

import { LotRealtimeStats } from "@/components/shared/lot-realtime-stats";

describe("LotRealtimeStats", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("can render initial stats without an automatic network refresh or polling", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(
      <LotRealtimeStats
        initialStats={{ likes: 7, participants: 3, views: 12 }}
        lotId="lot-performa-katalog"
        mode="vickrey"
        pollIntervalMs={0}
        refreshOnMount={false}
      />
    );

    expect(screen.getByText("12x")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
