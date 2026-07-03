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
          customerNumber: "081211112222",
          description: "Lengkap",
          dueDate: "2026-06-01",
          id: "barang-3",
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

    expect(screen.getByLabelText("Nilai taksiran")).toHaveValue("10.000.000");

    fireEvent.change(screen.getByLabelText("Nama barang"), {
      target: { value: "Cincin Emas 18K" }
    });
    fireEvent.change(screen.getByLabelText("Berat"), {
      target: { value: "9 gram" }
    });
    fireEvent.change(screen.getByLabelText("Nama penggadai"), {
      target: { value: "Raras Maheswari" }
    });
    fireEvent.change(screen.getByLabelText("Nomor telepon nasabah"), {
      target: { value: "0812-3456-7890" }
    });
    fireEvent.change(screen.getByLabelText("Nilai taksiran"), {
      target: { value: "11000000" }
    });
    expect(screen.getByLabelText("Nilai taksiran")).toHaveValue("11.000.000");
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
    const body = JSON.parse(String((request as RequestInit).body));
    expect(body).toMatchObject({
      condition: "cukup",
      name: "Cincin Emas 18K",
      ownerName: "Raras Maheswari",
      customerNumber: "81234567890",
      appraisalValue: "11000000",
      specifications: {
        berat: "9 gram",
        kadarEmas: "18K"
      }
    });
    expect(body).not.toHaveProperty("loanValue");
    await waitFor(() => {
      expect(router.push).toHaveBeenCalledWith("/admin/barang");
    });
    expect(router.refresh).toHaveBeenCalledOnce();
  });

  it("uses an explicit green focus treatment on every edit field", () => {
    renderWithToast(
      <AdminBarangEditForm
        item={{
          appraisalValue: 10000000,
          category: "kendaraan",
          condition: "baik",
          customerNumber: "081211112222",
          description: "Lengkap",
          dueDate: "2026-06-01",
          id: "barang-focus",
          marketingMode: "fixed_price",
          marketingPrice: 12000000,
          name: "Mobil",
          ownerName: "Nasabah Demo",
          pawnedAt: "2026-05-01",
          specifications: {
            nomorPolisi: ""
          }
        }}
      />
    );

    const directFields = [
      screen.getByLabelText("Nama barang"),
      screen.getByLabelText("Harga harga tetap aktif"),
      screen.getByLabelText("Deskripsi barang"),
      screen.getByLabelText("Nama penggadai")
    ];
    const groupedFields = [
      screen.getByLabelText("Nomor Polisi").parentElement,
      screen.getByLabelText("Nomor telepon nasabah").parentElement,
      screen.getByLabelText("Nilai taksiran").parentElement
    ];

    directFields.forEach((field) => {
      expect(field).toHaveClass(
        "focus-visible:shadow-[0_0_0_4px_rgba(189,232,208,0.46),0_18px_38px_-32px_rgba(0,103,71,0.42)]"
      );
    });
    groupedFields.forEach((field) => {
      expect(field).toHaveClass(
        "focus-within:shadow-[0_0_0_4px_rgba(189,232,208,0.46),0_18px_38px_-32px_rgba(0,103,71,0.42)]"
      );
      expect(field?.className).not.toContain("focus-within:ring-");
    });
    expect(screen.getByRole("radio", { name: "Baik" })).toHaveClass(
      "focus-visible:shadow-[0_0_0_4px_rgba(189,232,208,0.46)]"
    );
  });

  it("submits harga tetap marketing price when editing an active harga tetap barang", async () => {
    renderWithToast(
      <AdminBarangEditForm
        item={{
          appraisalValue: 10000000,
          category: "perhiasan",
          condition: "baik",
          customerNumber: "081211112222",
          description: "Lengkap",
          dueDate: "2026-06-01",
          id: "barang-fixed",
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

  it("submits only customer correction fields for a locked historical item", async () => {
    renderWithToast(
      <AdminBarangEditForm
        correctionOnly
        item={{
          appraisalValue: 10000000,
          category: "perhiasan",
          condition: "baik",
          customerNumber: "081211112222",
          description: "Transaksi telah selesai.",
          dueDate: "2026-06-01",
          id: "barang-sold",
          name: "Kalung Emas",
          ownerName: "Nasabah Lama",
          pawnedAt: "2026-05-01",
          specifications: {}
        }}
      />
    );

    expect(screen.queryByLabelText("Nama barang")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Nama penggadai")).toBeEnabled();
    expect(screen.getByLabelText("Nomor telepon nasabah")).toBeEnabled();
    expect(screen.getByLabelText("Nilai taksiran")).toBeEnabled();
    expect(screen.getByLabelText("Nilai taksiran")).toHaveValue("10.000.000");

    fireEvent.change(screen.getByLabelText("Nama penggadai"), {
      target: { value: "Nasabah Terkoreksi" }
    });
    fireEvent.change(screen.getByLabelText("Nomor telepon nasabah"), {
      target: { value: "081299998888" }
    });
    fireEvent.change(screen.getByLabelText("Nilai taksiran"), {
      target: { value: "12000000" }
    });
    expect(screen.getByLabelText("Nilai taksiran")).toHaveValue("12.000.000");
    fireEvent.click(screen.getByRole("button", { name: "Simpan Perubahan" }));

    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());

    const [, request] = vi.mocked(fetch).mock.calls[0];
    expect(JSON.parse(String((request as RequestInit).body))).toEqual({
      correctionOnly: true,
      ownerName: "Nasabah Terkoreksi",
      customerNumber: "81299998888",
      appraisalValue: "12000000"
    });
  });

  it("uses correction mode when only customer data changes on a normally editable form", async () => {
    renderWithToast(
      <AdminBarangEditForm
        item={{
          appraisalValue: 10000000,
          category: "perhiasan",
          condition: "baik",
          customerNumber: "081211112222",
          description: "Barang gagal dipasarkan.",
          dueDate: "2026-06-01",
          id: "barang-failed",
          name: "Kalung Emas",
          ownerName: "Nasabah Lama",
          pawnedAt: "2026-05-01",
          specifications: {}
        }}
      />
    );

    fireEvent.change(screen.getByLabelText("Nama penggadai"), {
      target: { value: "Nasabah Diperbaiki" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan Perubahan" }));

    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());

    const [, request] = vi.mocked(fetch).mock.calls[0];
    expect(JSON.parse(String((request as RequestInit).body))).toEqual({
      correctionOnly: true,
      ownerName: "Nasabah Diperbaiki",
      customerNumber: "81211112222",
      appraisalValue: "10000000"
    });
  });
});
