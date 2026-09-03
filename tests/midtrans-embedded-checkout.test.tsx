import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock })
}));

import { MidtransEmbeddedCheckout } from "@/components/buyer/midtrans-embedded-checkout";
import { ToastProvider } from "@/components/ui/toast";

describe("MidtransEmbeddedCheckout", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    refreshMock.mockReset();
  });

  it("embeds the existing Snap token inside the payment card", async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url === "/api/payments/midtrans/config") {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: { clientKey: "SB-Mid-client-test", isProduction: false } })
        });
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ data: { snapToken: "snap-token-1" } })
      });
    });
    const embedMock = vi.fn();

    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("snap", { embed: embedMock });

    render(
      <ToastProvider>
        <MidtransEmbeddedCheckout transactionId="trx-fixed-1" />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/payments/midtrans/config");
      expect(fetchMock).toHaveBeenCalledWith("/api/user/transaksi/trx-fixed-1/midtrans");
    });
    await waitFor(() => {
      expect(embedMock).toHaveBeenCalledWith(
        "snap-token-1",
        expect.objectContaining({ embedId: expect.stringMatching(/^midtrans-snap-/) })
      );
    });
    expect(screen.getByText(/checkout midtrans/i)).toBeInTheDocument();
    expect(screen.getByText(/pilih metode pembayaran/i)).toBeInTheDocument();
  });

  it("does not offer a redirect checkout when the inline checkout cannot load", async () => {
    const fetchMock = vi.fn((url: string) =>
      Promise.resolve({
        ok: url === "/api/payments/midtrans/config",
        json: async () =>
          url === "/api/payments/midtrans/config"
            ? { data: { clientKey: "SB-Mid-client-test", isProduction: false } }
            : { message: "Token checkout Midtrans belum tersedia." }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <ToastProvider>
        <MidtransEmbeddedCheckout transactionId="trx-fixed-1" />
      </ToastProvider>
    );

    expect(await screen.findByText(/checkout belum dapat ditampilkan/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /buka checkout midtrans/i })).not.toBeInTheDocument();
  });
});
