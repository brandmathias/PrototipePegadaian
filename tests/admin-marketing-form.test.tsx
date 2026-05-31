import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AdminMarketingForm } from "@/components/admin-unit/admin-marketing-form";
import { ToastProvider } from "@/components/ui/toast";
import { validatePemasaranPayload } from "@/lib/admin-unit/validation";

const router = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn()
}));

vi.mock("next/navigation", () => ({
  useRouter: () => router
}));

function renderWithToast(ui: React.ReactNode) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe("AdminMarketingForm", () => {
  beforeEach(() => {
    router.push.mockClear();
    router.refresh.mockClear();
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ data: { id: "marketing-1" } }), {
            headers: { "Content-Type": "application/json" },
            status: 200
          })
        )
      )
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("submits fixed price marketing without requiring duration fields", async () => {
    renderWithToast(
      <AdminMarketingForm
        barangId="barang-1"
        defaultPrice={150000}
        endpoint="/api/admin/pemasaran"
        redirectTo="/admin/pemasaran"
        serverNow="2026-05-30T03:00:00.000Z"
        submitLabel="Simpan pemasaran"
        successDescription="Berhasil"
        successTitle="Sukses"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /simpan pemasaran/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    const request = vi.mocked(fetch).mock.calls[0]?.[1] as RequestInit;
    const payload = JSON.parse(String(request.body));

    expect(validatePemasaranPayload(payload)).toEqual({
      mode: "fixed_price",
      price: "150000"
    });
    expect(payload).toEqual({
      mode: "fixed_price",
      price: "150000"
    });
  });

  it("submits vickrey marketing with a payload accepted by backend validation and shows active mode state", async () => {
    renderWithToast(
      <AdminMarketingForm
        barangId="barang-1"
        defaultPrice={200000}
        endpoint="/api/admin/pemasaran"
        redirectTo="/admin/pemasaran"
        serverNow="2026-05-30T03:00:00.000Z"
        submitLabel="Publikasikan"
        successDescription="Berhasil"
        successTitle="Sukses"
      />
    );

    const fixedPriceButton = screen.getByRole("button", { name: /fixed price/i });
    const vickreyButton = screen.getByRole("button", { name: /vickrey auction/i });

    expect(fixedPriceButton).toHaveAttribute("aria-pressed", "true");
    expect(vickreyButton).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(vickreyButton);

    expect(fixedPriceButton).toHaveAttribute("aria-pressed", "false");
    expect(vickreyButton).toHaveAttribute("aria-pressed", "true");

    fireEvent.change(screen.getByLabelText(/harga dasar/i), { target: { value: "275000" } });
    fireEvent.change(screen.getByLabelText("Hari"), { target: { value: "0" } });
    fireEvent.change(screen.getByLabelText("Jam"), { target: { value: "0" } });
    fireEvent.change(screen.getByLabelText("Menit"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Detik"), { target: { value: "15" } });

    expect(screen.getByText(/30 Mei 2026 pukul 11\.02\.15/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /publikasikan/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    const request = vi.mocked(fetch).mock.calls[0]?.[1] as RequestInit;
    const payload = JSON.parse(String(request.body));

    expect(validatePemasaranPayload(payload)).toEqual({
      mode: "vickrey",
      price: "275000",
      durationDays: 0,
      durationHours: 0,
      durationMinutes: 2,
      durationSeconds: 15,
      totalSeconds: 135
    });
    expect(payload).toEqual({
      mode: "vickrey",
      price: "275000",
      durationDays: "0",
      durationHours: "0",
      durationMinutes: "2",
      durationSeconds: "15"
    });
  });

  it("lets operators replace duration values cleanly after the padded default renders", () => {
    renderWithToast(
      <AdminMarketingForm
        barangId="barang-1"
        defaultPrice={200000}
        endpoint="/api/admin/pemasaran"
        redirectTo="/admin/pemasaran"
        serverNow="2026-05-30T03:00:00.000Z"
        submitLabel="Publikasikan"
        successDescription="Berhasil"
        successTitle="Sukses"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /vickrey auction/i }));

    const minutesInput = screen.getByLabelText("Menit") as HTMLInputElement;
    fireEvent.focus(minutesInput);
    fireEvent.change(minutesInput, { target: { value: "12" } });

    expect(minutesInput.value).toBe("12");
  });

  it("lets operators enter multi-digit day durations without locking on the first digit", () => {
    renderWithToast(
      <AdminMarketingForm
        barangId="barang-1"
        defaultPrice={200000}
        endpoint="/api/admin/pemasaran"
        redirectTo="/admin/pemasaran"
        serverNow="2026-05-30T03:00:00.000Z"
        submitLabel="Publikasikan"
        successDescription="Berhasil"
        successTitle="Sukses"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /vickrey auction/i }));

    const daysInput = screen.getByLabelText("Hari") as HTMLInputElement;
    fireEvent.focus(daysInput);
    fireEvent.change(daysInput, { target: { value: "124" } });

    expect(daysInput.value).toBe("124");
  });

  it("clamps minute and second fields to valid clock values while typing", () => {
    renderWithToast(
      <AdminMarketingForm
        barangId="barang-1"
        defaultPrice={200000}
        endpoint="/api/admin/pemasaran"
        redirectTo="/admin/pemasaran"
        serverNow="2026-05-30T03:00:00.000Z"
        submitLabel="Publikasikan"
        successDescription="Berhasil"
        successTitle="Sukses"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /vickrey auction/i }));

    const minutesInput = screen.getByLabelText("Menit") as HTMLInputElement;
    const secondsInput = screen.getByLabelText("Detik") as HTMLInputElement;

    fireEvent.focus(minutesInput);
    fireEvent.change(minutesInput, { target: { value: "66" } });
    fireEvent.focus(secondsInput);
    fireEvent.change(secondsInput, { target: { value: "88" } });

    expect(minutesInput.value).toBe("59");
    expect(secondsInput.value).toBe("59");
  });
});
