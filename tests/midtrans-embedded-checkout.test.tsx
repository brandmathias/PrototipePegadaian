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
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ data: { snapToken: "snap-token-1" } })
    });
    const embedMock = vi.fn();

    vi.stubEnv("NEXT_PUBLIC_MIDTRANS_CLIENT_KEY", "SB-Mid-client-test");
    vi.stubEnv("NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION", "false");
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("snap", { embed: embedMock });

    render(
      <ToastProvider>
        <MidtransEmbeddedCheckout lotId="lot-fixed-1" />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/user/beli/lot-fixed-1", { method: "POST" });
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
});
