import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn()
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
  it("requires direct payment location confirmation before fixed price submit", async () => {
    const user = userEvent.setup();

    renderPurchaseWorkflow();

    expect(screen.getByText(/konfirmasi lokasi bayar langsung/i)).toBeInTheDocument();
    expect(screen.getByText(/Jl\. Sam Ratulangi No\. 12, Manado/i)).toBeInTheDocument();
    expect(screen.getByText(/Sabtu 08\.00-12\.00/i)).toBeInTheDocument();

    const submitButton = screen.getByRole("button", { name: /konfirmasi pembelian/i });
    expect(submitButton).toBeDisabled();

    await user.click(screen.getByRole("checkbox", { name: /saya memahami pembayaran langsung/i }));

    expect(submitButton).toBeEnabled();
  });
});
