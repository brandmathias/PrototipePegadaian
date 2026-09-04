import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  FixedPriceAvailabilityBadge,
  FixedPriceAvailabilityMedia,
  FixedPriceAvailabilityProvider,
  useFixedPriceAvailability
} from "@/components/buyer/fixed-price-availability";

function AvailabilityProbe() {
  const { availability } = useFixedPriceAvailability();

  return <output data-testid="availability-state">{availability.status}</output>;
}

function availabilityResponse(data: Record<string, unknown>) {
  return {
    ok: true,
    json: async () => ({ data })
  };
}

describe("fixed-price availability UI", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("refreshes the open detail page and reflects a new reservation", async () => {
    vi.useFakeTimers();
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible"
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        availabilityResponse({
          status: "available",
          owner: null,
          expiresAt: null,
          canContinue: false
        })
      )
      .mockResolvedValueOnce(
        availabilityResponse({
          status: "reserved",
          owner: "other",
          expiresAt: "2099-05-05T14:07:00.000Z",
          canContinue: false
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <FixedPriceAvailabilityProvider lotId="lot-fixed-1">
        <AvailabilityProbe />
      </FixedPriceAvailabilityProvider>
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(screen.getByTestId("availability-state")).toHaveTextContent("available");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId("availability-state")).toHaveTextContent("reserved");
  });

  it("uses a general unavailable message for a reservation owned by another buyer", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => {})));

    render(
      <FixedPriceAvailabilityProvider
        initialAvailability={{
          status: "reserved",
          owner: "other",
          expiresAt: "2099-05-05T14:07:00.000Z",
          canContinue: false
        }}
        lotId="lot-fixed-1"
      >
        <FixedPriceAvailabilityBadge fallbackLabel="Tersedia" />
        <FixedPriceAvailabilityMedia>
          <div>media</div>
        </FixedPriceAvailabilityMedia>
      </FixedPriceAvailabilityProvider>
    );

    expect(screen.getByTestId("fixed-price-availability-badge")).toHaveTextContent(
      "Tidak tersedia"
    );
    expect(screen.queryByText("Sedang diproses")).not.toBeInTheDocument();
    expect(screen.getByTestId("fixed-price-unavailable-media")).toHaveTextContent(
      "Pembelian tidak tersedia saat ini."
    );
  });
});
