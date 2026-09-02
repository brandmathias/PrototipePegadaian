import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const replaceMock = vi.fn();
const openMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
    refresh: vi.fn()
  })
}));

import { FixedPriceBuyButton } from "@/components/buyer/fixed-price-buy-button";
describe("FixedPriceBuyButton", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    replaceMock.mockReset();
    openMock.mockReset();
  });

  it("creates a fixed price Midtrans checkout and opens its payment detail", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        data: {
          snapRedirectUrl: "https://app.sandbox.midtrans.com/snap/v2/checkout",
          transactionId: "trx-fixed-1"
        }
      })
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<FixedPriceBuyButton lotId="lot-fixed-1" />);

    await user.click(screen.getByRole("button", { name: /beli sekarang/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/user/beli/lot-fixed-1",
        { method: "POST" }
      );
    });
    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/transaksi/trx-fixed-1");
    });
    expect(openMock).not.toHaveBeenCalled();
  });

  it("opens Snap only when the payment-detail action requests checkout", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        data: {
          snapRedirectUrl: "https://app.sandbox.midtrans.com/snap/v2/checkout",
          transactionId: "trx-fixed-1"
        }
      })
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("open", openMock);
    const user = userEvent.setup();

    render(<FixedPriceBuyButton buttonLabel="Lanjutkan ke Checkout Midtrans" lotId="lot-fixed-1" openCheckout />);

    await user.click(screen.getByRole("button", { name: /lanjutkan ke checkout midtrans/i }));

    await waitFor(() => {
      expect(openMock).toHaveBeenCalledWith("https://app.sandbox.midtrans.com/snap/v2/checkout", "_self");
    });
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
