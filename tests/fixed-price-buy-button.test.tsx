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
import { ToastProvider } from "@/components/ui/toast";

describe("FixedPriceBuyButton", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    replaceMock.mockReset();
    refreshMock.mockReset();
  });

  it("creates a transfer transaction directly from the detail CTA and redirects to payment detail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ data: { id: "trx-direct-1" } })
      })
    );
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <FixedPriceBuyButton lotId="lot-fixed-1" />
      </ToastProvider>
    );

    await user.click(screen.getByRole("button", { name: /beli sekarang/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/user/beli/lot-fixed-1",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ paymentMethod: "transfer" })
        })
      );
    });

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/transaksi/trx-direct-1");
    });
  });
});
