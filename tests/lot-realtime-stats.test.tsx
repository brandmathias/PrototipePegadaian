import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LotRealtimeStats } from "@/components/shared/lot-realtime-stats";

const initialStats = {
  likes: 4,
  participants: 2,
  views: 9
};

describe("LotRealtimeStats mobile refresh policy", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockResolvedValue({
      json: async () => initialStats,
      ok: true
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("uses server-provided card statistics without an initial request or default polling", async () => {
    vi.useFakeTimers();

    render(
      <LotRealtimeStats
        initialStats={initialStats}
        lotId="lot-card"
        mode="vickrey"
      />
    );

    expect(screen.getByText("9x")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    await act(async () => {
      await Promise.resolve();
      vi.advanceTimersByTime(60_000);
      await Promise.resolve();
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refreshes card statistics once when the tab becomes visible again", async () => {
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");

    render(
      <LotRealtimeStats
        initialStats={initialStats}
        lotId="lot-visible"
        mode="fixed_price"
      />
    );

    await act(async () => {
      await Promise.resolve();
    });
    fetchMock.mockClear();

    document.dispatchEvent(new Event("visibilitychange"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/public/lots/lot-visible/stats",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("records a detail view immediately and polls only at the configured interval", async () => {
    vi.useFakeTimers();

    render(
      <LotRealtimeStats
        initialStats={initialStats}
        lotId="lot-detail"
        mode="vickrey"
        pollIntervalMs={30_000}
        trackView
      />
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/public/lots/lot-detail/stats",
      expect.objectContaining({ method: "POST" })
    );

    fetchMock.mockClear();

    await act(async () => {
      vi.advanceTimersByTime(29_999);
      await Promise.resolve();
    });
    expect(fetchMock).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1);
      await Promise.resolve();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/public/lots/lot-detail/stats",
      expect.objectContaining({ method: "GET" })
    );
  });
});
