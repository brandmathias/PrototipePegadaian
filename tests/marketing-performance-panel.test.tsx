import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MarketingPerformancePanel } from "@/components/shared/marketing-performance-panel";

describe("MarketingPerformancePanel", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("refreshes views and watchlist from the shared lot stats endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        likes: 5,
        participants: 0,
        views: 11
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <MarketingPerformancePanel
        insights={{ likes: 0, participants: 0, views: 0 }}
        lotId="pm-fixed-1"
        pollIntervalMs={null}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("11x")).toBeInTheDocument();
      expect(screen.getByText("5 Akun")).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/public/lots/pm-fixed-1/stats", {
      cache: "no-store",
      method: "GET"
    });
  });
});
