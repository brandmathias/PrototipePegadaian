import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn()
  })
}));

import { BuyerPaymentProofForm } from "@/components/buyer/payment-proof-form";
import { ToastProvider } from "@/components/ui/toast";

function renderForm(props: Partial<ComponentProps<typeof BuyerPaymentProofForm>> = {}) {
  return render(
    <ToastProvider>
      <BuyerPaymentProofForm transactionId="trx-fixed-1" {...props} />
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

  it("fills the dashed proof review frame with the uploaded image preview", () => {
    renderForm({ currentProof: "/uploads/bukti-transfer.jpg", locked: true, readOnlyPreview: true });

    const previewButton = screen.getByRole("button", { name: /buka preview bukti transfer/i });
    const previewImage = screen.getByRole("img", { name: /preview bukti transfer/i });

    expect(previewButton).toHaveClass("absolute", "inset-0", "h-full", "w-full");
    expect(previewImage).toHaveClass("absolute", "inset-0", "h-full", "w-full", "object-cover");
  });

  it("shows a readable fallback link when an uploaded proof image cannot be loaded", () => {
    renderForm({ currentProof: "/uploads/bukti-hilang.jpg", locked: true, readOnlyPreview: true });

    fireEvent.error(screen.getByRole("img", { name: /preview bukti transfer/i }));

    expect(screen.getByText(/bukti pembayaran tidak dapat ditampilkan/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /buka file asli/i })).toHaveAttribute("href", "/uploads/bukti-hilang.jpg");
  });
});
