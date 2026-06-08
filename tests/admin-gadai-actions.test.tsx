import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AdminBarangEditForm } from "@/components/admin-unit/admin-barang-edit-form";
import { AdminExtensionForm } from "@/components/admin-unit/admin-extension-form";
import { AdminRedeemForm } from "@/components/admin-unit/admin-redeem-form";
import { ToastProvider } from "@/components/ui/toast";

const router = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn()
}));

vi.mock("next/navigation", () => ({
  useRouter: () => router
}));

function okResponse(body: Record<string, unknown> = {}) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      headers: { "Content-Type": "application/json" },
      status: 200
    })
  );
}

function renderWithToast(ui: React.ReactNode) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe("admin gadai action forms", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(() => okResponse({ success: true })));
    router.push.mockClear();
    router.refresh.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("submits the selected extension due date instead of an auto-generated fallback", async () => {
    const { container } = renderWithToast(
      <AdminExtensionForm currentDueDate="2026-05-31" itemId="barang-1" />
    );

    expect(container.querySelector(".lucide-calendar-clock")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Simpan perpanjangan" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/admin/barang/barang-1/perpanjang",
        expect.objectContaining({
          method: "POST"
        })
      );
    });

    const [, request] = vi.mocked(fetch).mock.calls[0];
    expect(JSON.parse(String((request as RequestInit).body))).toMatchObject({
      newDueDate: "2026-06-30"
    });
    expect(router.push).toHaveBeenCalledWith("/admin/barang/barang-1");
  });

  it("requires a redemption reference and sends the entered reference to the API", async () => {
    const { container } = renderWithToast(
      <AdminRedeemForm
        customerNumber="NAS-001"
        itemCode="BRG-002"
        itemId="barang-2"
        itemName="LM Antam 10gr Sertifikat"
        ownerName="Nasabah Demo"
        previewImageUrl="/uploads/lm-antam.jpg"
        redemptionAmount={12450000}
      />
    );

    expect(container.querySelector(".lucide-receipt-text")).toBeTruthy();

    expect(screen.getByRole("img", { name: "LM Antam 10gr Sertifikat" })).toHaveAttribute(
      "src",
      "/uploads/lm-antam.jpg"
    );

    fireEvent.click(screen.getByRole("button", { name: "Tunai" }));
    const visualTransferOption = screen
      .getAllByRole("option", { name: "Transfer Bank Unit" })
      .find((element) => element.tagName.toLowerCase() === "button");
    expect(visualTransferOption).toBeTruthy();
    fireEvent.click(visualTransferOption as HTMLElement);
    fireEvent.click(screen.getByRole("button", { name: /simpan transaksi/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/admin/barang/barang-2/tebus",
        expect.objectContaining({
          method: "POST"
        })
      );
    });

    const [, request] = vi.mocked(fetch).mock.calls[0];
    expect(JSON.parse(String((request as RequestInit).body))).toMatchObject({
      reference: "TEBUS-TRANSFER-BANK-UNIT-BRG-002"
    });
    expect(router.push).toHaveBeenCalledWith("/admin/barang/barang-2");
  });

  it("submits edited barang values from the form state", async () => {
    renderWithToast(
      <AdminBarangEditForm
        item={{
          appraisalValue: 10000000,
          category: "emas",
          condition: "baik",
          customerNumber: "NAS-001",
          description: "Lengkap",
          dueDate: "2026-06-01",
          id: "barang-3",
          loanValue: 7000000,
          name: "Kalung Emas",
          ownerName: "Nasabah Demo",
          pawnedAt: "2026-05-01",
          specifications: {
            berat: "8 gram",
            kadarEmas: "18K"
          }
        }}
      />
    );

    fireEvent.change(screen.getByLabelText("Nama barang"), {
      target: { value: "Cincin Emas 18K" }
    });
    fireEvent.change(screen.getByLabelText("Berat"), {
      target: { value: "9 gram" }
    });
    fireEvent.click(screen.getByRole("radio", { name: "Cukup" }));
    fireEvent.click(screen.getByRole("button", { name: "Simpan Perubahan" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/admin/barang/barang-3",
        expect.objectContaining({
          method: "PUT"
        })
      );
    });

    const [, request] = vi.mocked(fetch).mock.calls[0];
    expect(JSON.parse(String((request as RequestInit).body))).toMatchObject({
      condition: "cukup",
      name: "Cincin Emas 18K",
      specifications: {
        berat: "9 gram",
        kadarEmas: "18K"
      }
    });
  });

  it("submits harga tetap marketing price when editing an active harga tetap barang", async () => {
    renderWithToast(
      <AdminBarangEditForm
        item={{
          appraisalValue: 10000000,
          category: "perhiasan",
          condition: "baik",
          customerNumber: "NAS-001",
          description: "Lengkap",
          dueDate: "2026-06-01",
          id: "barang-fixed",
          loanValue: 7000000,
          marketingMode: "fixed_price",
          marketingPrice: 12500000,
          name: "Kalung Emas",
          ownerName: "Nasabah Demo",
          pawnedAt: "2026-05-01",
          specifications: {
            berat: "8 gram",
            kadarEmas: "18K"
          }
        }}
      />
    );

    fireEvent.change(screen.getByLabelText("Harga harga tetap aktif"), {
      target: { value: "13500000" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan Perubahan" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/admin/barang/barang-fixed",
        expect.objectContaining({
          method: "PUT"
        })
      );
    });

    const [, request] = vi.mocked(fetch).mock.calls[0];
    expect(JSON.parse(String((request as RequestInit).body))).toMatchObject({
      marketingPrice: "13500000"
    });
  });
});
