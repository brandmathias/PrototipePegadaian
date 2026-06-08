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

import { PurchaseWorkflow } from "@/components/buyer/purchase-workflow";
import { ToastProvider } from "@/components/ui/toast";
import type { Lot } from "@/lib/contracts/catalog";

const directPaymentLot: Lot = {
  id: "fixed-direct-1",
  code: "BRG-FIX-001",
  name: "Kalung Emas",
  category: "Emas",
  mode: "fixed_price",
  price: 100000000,
  location: "Jl. Sam Ratulangi No. 12, Manado",
  unitName: "UPC Ranotana",
  unitAddress: "Jl. Sam Ratulangi No. 12, Manado",
  city: "Manado",
  condition: "Baik",
  status: "Aktif",
  description: "Barang harga tetap dengan pembayaran langsung di unit.",
  bankName: "Bank Rakyat Indonesia (BRI)",
  bankAccountNumber: "0123-4567-8901-234",
  bankAccountHolder: "PT Pegadaian (Persero) UPC Ranotana",
  media: [],
  specs: []
};

function renderPurchaseWorkflow() {
  return render(
    <ToastProvider>
      <PurchaseWorkflow lot={directPaymentLot} />
    </ToastProvider>
  );
}

describe("PurchaseWorkflow", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    replaceMock.mockReset();
    refreshMock.mockReset();
  });

  it("creates a harga tetap transfer transaction only after buyer uploads payment proof", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ data: { id: "trx-transfer-1", status: "BUKTI_DIUNGGAH" } })
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    const proofFile = new File(["bukti"], "bukti-transfer.png", { type: "image/png" });

    renderPurchaseWorkflow();

    expect(screen.getByText(/konfirmasi pembayaran harga tetap/i)).toBeInTheDocument();
    expect(screen.getAllByText(/transfer bank/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/bayar langsung/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/belum membuat transaksi/i).length).toBeGreaterThan(0);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText(/0123-4567-8901-234/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /kirim bukti pembayaran/i })).toBeDisabled();

    await user.upload(screen.getByLabelText(/file bukti pembayaran/i), proofFile);
    await user.type(screen.getByLabelText(/nomor referensi/i), "BRI-2026-001");
    await user.click(screen.getByRole("button", { name: /kirim bukti pembayaran/i }));

    await waitFor(() => {
      const request = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;

      expect(fetchMock).toHaveBeenCalledWith(
        "/api/user/beli/fixed-direct-1",
        expect.objectContaining({
          method: "POST"
        })
      );
      expect(request?.body).toBeInstanceOf(FormData);
      const formData = request?.body as FormData;
      expect(formData.get("file")).toBe(proofFile);
      expect(formData.get("reference")).toBe("BRI-2026-001");
    });
    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/transaksi/trx-transfer-1");
    });
  });

  it("confirms before returning to harga tetap detail without creating a transaction", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderPurchaseWorkflow();

    await user.click(screen.getByRole("button", { name: /kembali ke detail barang/i }));

    expect(
      screen.getByRole("dialog", { name: /tetap lanjutkan pembayaran/i })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /ya, tetap di pembayaran/i }));

    expect(
      screen.queryByRole("dialog", { name: /tetap lanjutkan pembayaran/i })
    ).not.toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /kembali ke detail barang/i }));
    await user.click(screen.getByRole("button", { name: /tidak, kembali ke detail barang/i }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(replaceMock).toHaveBeenCalledWith("/katalog/fixed-direct-1");
  });
});
