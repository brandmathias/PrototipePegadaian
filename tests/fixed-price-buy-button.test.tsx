import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const replaceMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
    refresh: refreshMock
  })
}));

import { FixedPriceBuyButton } from "@/components/buyer/fixed-price-buy-button";
describe("FixedPriceBuyButton", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    replaceMock.mockReset();
    refreshMock.mockReset();
  });

  it("creates a fixed price transaction and opens its payment detail", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ data: { id: "trx-fixed-1" } })
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<FixedPriceBuyButton lotId="lot-fixed-1" />);

    await user.click(screen.getByRole("button", { name: /beli sekarang/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/user/beli/lot-fixed-1",
        expect.objectContaining({
          body: JSON.stringify({ paymentMethod: "transfer" }),
          headers: { "Content-Type": "application/json" },
          method: "POST"
        })
      );
    });
    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/transaksi/trx-fixed-1");
      expect(refreshMock).toHaveBeenCalledTimes(1);
    });
  });
});
