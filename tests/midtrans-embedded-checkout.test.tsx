import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  it("keeps the Snap mount target in the DOM while checkout initializes", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => undefined)));

    render(
      <ToastProvider>
        <MidtransEmbeddedCheckout compact transactionId="trx-fixed-1" />
      </ToastProvider>
    );

    expect(document.querySelector('[id^="midtrans-snap-"]')).toHaveClass("h-full", "min-h-0");
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
    let targetExistedWhenSnapMounted = false;
    const hideMock = vi.fn();
    let embedOptions: { embedId: string; hideCloseButton?: boolean } | undefined;
    const embedMock = vi.fn((_token: string, options: { embedId: string; hideCloseButton?: boolean }) => {
      targetExistedWhenSnapMounted = document.getElementById(options.embedId) !== null;
      embedOptions = options;
    });

    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("snap", { embed: embedMock, hide: hideMock });

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
    expect(targetExistedWhenSnapMounted).toBe(true);
    expect(embedOptions).toEqual(expect.objectContaining({ hideCloseButton: true }));
    expect(document.querySelector('[id^="midtrans-snap-"]')).toHaveClass("w-full");
    expect(screen.getByText(/pembayaran transfer/i)).toBeInTheDocument();
    expect(screen.getByText(/pilih metode pembayaran/i)).toBeInTheDocument();
  });

  it("lets the buyer hide checkout with the themed back control", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ data: { clientKey: "SB-Mid-client-test", isProduction: false, snapToken: "snap-token-1" } })
      })
    );
    const hideMock = vi.fn();
    const embedMock = vi.fn();

    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("snap", { embed: embedMock, hide: hideMock });

    render(
      <ToastProvider>
        <MidtransEmbeddedCheckout transactionId="trx-fixed-1" />
      </ToastProvider>
    );

    await waitFor(() => expect(embedMock).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: /kembali dari pembayaran/i }));

    expect(hideMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/pembayaran disembunyikan/i)).toBeInTheDocument();
  });

  it("does not offer a redirect checkout when the inline checkout cannot load", async () => {
    const fetchMock = vi.fn((url: string) =>
      Promise.resolve({
        ok: url === "/api/payments/midtrans/config",
        json: async () =>
          url === "/api/payments/midtrans/config"
            ? { data: { clientKey: "SB-Mid-client-test", isProduction: false } }
            : { message: "Pembayaran belum tersedia." }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <ToastProvider>
        <MidtransEmbeddedCheckout transactionId="trx-fixed-1" />
      </ToastProvider>
    );

    expect(await screen.findByText(/pembayaran belum dapat ditampilkan/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /buka checkout midtrans/i })).not.toBeInTheDocument();
  });
});
