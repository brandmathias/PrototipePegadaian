import { render, screen, waitFor } from "@testing-library/react";
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
  description: "Barang fixed price dengan pembayaran langsung di unit.",
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

  it("creates a fixed price transfer transaction and opens payment detail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ data: { id: "trx-transfer-1" } })
      })
    );

    renderPurchaseWorkflow();

    expect(screen.getByText(/menyiapkan pembayaran transfer/i)).toBeInTheDocument();
    expect(screen.getAllByText(/transfer bank/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/bayar langsung/i)).not.toBeInTheDocument();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/user/beli/fixed-direct-1",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ paymentMethod: "transfer" })
        })
      );
    });
    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/transaksi/trx-transfer-1");
    });
  });
});
