import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const replaceMock = vi.fn();
const toastMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
    refresh: vi.fn()
  })
}));

vi.mock("@/components/ui/toast", () => ({
  useToast: () => ({ toast: toastMock })
}));

import { FixedPriceBuyButton } from "@/components/buyer/fixed-price-buy-button";
describe("FixedPriceBuyButton", () => {
  afterEach(() => {
    document.body.style.overflow = "";
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    replaceMock.mockReset();
    toastMock.mockReset();
  });

  it("asks for confirmation before creating the fixed-price checkout", async () => {
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

    const buyButton = screen.getByRole("button", { name: /beli sekarang/i });
    await user.click(buyButton);

    const dialog = screen.getByRole("dialog", {
      name: "Lanjutkan Pembayaran?"
    });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveClass("max-w-[720px]", "rounded-[20px]", "sm:rounded-[26px]");
    expect(screen.getByText("Barang ini dijual dengan harga tetap.")).toBeInTheDocument();
    expect(
      screen.getByText("Apakah Anda yakin ingin melanjutkan pembayaran?")
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(document.body.style.overflow).toBe("hidden");
    expect(screen.getByRole("button", { name: "Tidak" })).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "Ya, Lanjutkan" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/user/beli/lot-fixed-1",
        { method: "POST" }
      );
    });
    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/transaksi/trx-fixed-1");
    });
  });

  it("keeps the Beli Sekarang label while using the unavailable wishlist treatment", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(
      <FixedPriceBuyButton
        availability={{
          status: "reserved",
          owner: "other",
          expiresAt: "2099-05-05T14:07:00.000Z",
          canContinue: false
        }}
        lotId="lot-fixed-1"
      />
    );

    const buyButton = screen.getByRole("button", { name: /beli sekarang/i });
    expect(buyButton).toBeDisabled();
    expect(buyButton).toHaveClass(
      "rounded-full",
      "bg-[#eceae4]",
      "text-[#77736b]",
      "disabled:opacity-100"
    );
    expect(buyButton).not.toHaveTextContent(/sedang diproses/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("closes from the cancel controls but not from the backdrop", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<FixedPriceBuyButton lotId="lot-fixed-1" />);

    const buyButton = screen.getByRole("button", { name: /beli sekarang/i });
    await user.click(buyButton);

    fireEvent.click(screen.getByTestId("fixed-price-payment-backdrop"));
    expect(screen.getByRole("dialog", { name: "Lanjutkan Pembayaran?" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Tidak" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(buyButton).toHaveFocus();
    expect(fetchMock).not.toHaveBeenCalled();

    await user.click(buyButton);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(buyButton);
    await user.click(screen.getByRole("button", { name: "Tutup konfirmasi pembayaran" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("explains when another buyer reserved the item before a stale checkout could start", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        code: "FIXED_PRICE_RESERVED",
        message: "Barang sedang dalam proses pembelian oleh pembeli lain."
      })
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<FixedPriceBuyButton lotId="lot-fixed-1" />);

    await user.click(screen.getByRole("button", { name: /beli sekarang/i }));
    await user.click(screen.getByRole("button", { name: "Ya, Lanjutkan" }));

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Barang baru saja dipesan",
          description: "Pembeli lain lebih dulu memulai pembayaran. Ketersediaan barang telah diperbarui.",
          variant: "error"
        })
      );
    });
  });

  it("keeps the confirmation locked while checkout is being prepared", async () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => {})));
    const user = userEvent.setup();

    render(<FixedPriceBuyButton lotId="lot-fixed-1" />);

    await user.click(screen.getByRole("button", { name: /beli sekarang/i }));
    await user.click(screen.getByRole("button", { name: "Ya, Lanjutkan" }));

    const dialog = screen.getByRole("dialog", { name: "Lanjutkan Pembayaran?" });
    expect(dialog).toHaveAttribute(
      "aria-busy",
      "true"
    );
    expect(within(dialog).getByRole("button", { name: /menyiapkan pembayaran/i })).toBeDisabled();

    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog", { name: "Lanjutkan Pembayaran?" })).toBeInTheDocument();
  });
});
