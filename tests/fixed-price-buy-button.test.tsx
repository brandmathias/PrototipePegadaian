import { render, screen } from "@testing-library/react";
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
import { ToastProvider } from "@/components/ui/toast";

describe("FixedPriceBuyButton", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    replaceMock.mockReset();
    refreshMock.mockReset();
  });

  it("creates a harga tetap transaction and opens the payment workflow detail", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ data: { id: "trx-fixed-1", status: "MENUNGGU_PEMBAYARAN" } })
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <FixedPriceBuyButton lotId="lot-fixed-1" />
      </ToastProvider>
    );

    await user.click(screen.getByRole("button", { name: /beli sekarang/i }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/user/beli/lot-fixed-1",
      expect.objectContaining({
        body: JSON.stringify({ paymentMethod: "transfer" }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      })
    );
    expect(replaceMock).toHaveBeenCalledWith("/transaksi/trx-fixed-1");
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });
});
