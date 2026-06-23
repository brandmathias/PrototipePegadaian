import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn()
  })
}));

import { BuyerPaymentProofForm } from "@/components/buyer/payment-proof-form";
import { ToastProvider } from "@/components/ui/toast";

function renderForm() {
  return render(
    <ToastProvider>
      <BuyerPaymentProofForm transactionId="trx-fixed-1" />
    </ToastProvider>
  );
}

describe("BuyerPaymentProofForm", () => {
  const createObjectUrlMock = vi.fn(() => "blob:proof-preview");
  const revokeObjectUrlMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    URL.createObjectURL = createObjectUrlMock;
    URL.revokeObjectURL = revokeObjectUrlMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    createObjectUrlMock.mockClear();
    revokeObjectUrlMock.mockClear();
  });

  it("renders a large preview and opens it in a fullscreen dialog after file selection", async () => {
    renderForm();

    const fileInput = screen.getByLabelText(/file bukti transfer/i);
    const file = new File(["proof"], "bukti-transfer.png", { type: "image/png" });

    fireEvent.change(fileInput, {
      target: {
        files: [file]
      }
    });

    expect(await screen.findByRole("img", { name: /preview bukti transfer/i })).toBeInTheDocument();
    expect(screen.queryByText(/preview aktif|bukti terkirim|bukti sebelumnya/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/tekan untuk membuka tampilan penuh/i)).not.toBeInTheDocument();
    expect(screen.queryByText("bukti-transfer.png")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /buka preview bukti transfer/i }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /bukti-transfer.png/i })).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: /preview bukti transfer/i }).length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole("button", { name: /tutup preview bukti transfer/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
