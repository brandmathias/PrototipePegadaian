import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

import { HandoverProofUploadForm } from "@/components/admin-unit/handover-proof-upload-form";
import { HandoverProofCard } from "@/components/shared/handover-proof-card";
import { ToastProvider } from "@/components/ui/toast";

function renderUploadForm(canUpload = true) {
  return render(
    <ToastProvider>
      <HandoverProofUploadForm
        canUpload={canUpload}
        itemTitle="Kalung Emas"
        location="UPC Ranotana"
        transactionId="trx-handover-1"
      />
    </ToastProvider>,
  );
}

describe("handover proof UI", () => {
  const createObjectUrlMock = vi.fn(() => "blob:handover-preview");
  const revokeObjectUrlMock = vi.fn();
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    URL.createObjectURL = createObjectUrlMock;
    URL.revokeObjectURL = revokeObjectUrlMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    createObjectUrlMock.mockClear();
    revokeObjectUrlMock.mockClear();
  });

  it("places admin handover controls in the same order and button style as payment proof upload", () => {
    renderUploadForm();

    const layoutShell = screen.getByLabelText(/panel bukti serah-terima barang/i);
    const previewShell = screen.getByLabelText(/area preview bukti serah-terima barang/i);
    const chooseFileLabel = screen.getByText(/^pilih file$/i).closest("label");
    const formatHint = screen.getByText(/^JPG, PNG, atau WebP \(Maks\. 5MB\)$/i);
    const uploadButton = screen.getByRole("button", { name: /unggah bukti serah-terima/i });

    expect(layoutShell).toHaveClass("xl:grid-cols-[minmax(17rem,0.72fr)_minmax(0,1.28fr)]");
    expect(previewShell).toHaveClass("min-h-[18rem]", "rounded-xl", "border-2", "border-dashed");
    expect(previewShell).not.toHaveClass("min-h-[26rem]");
    expect(chooseFileLabel).not.toBeNull();
    expect(previewShell.compareDocumentPosition(chooseFileLabel!) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(chooseFileLabel).toHaveClass("h-11", "rounded-[0.95rem]", "font-body", "text-sm", "font-semibold");
    expect(formatHint.compareDocumentPosition(uploadButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(uploadButton).toHaveClass("h-14", "w-full", "rounded-md", "font-body", "text-base", "font-semibold");
    expect(uploadButton).toBeDisabled();
  });

  it("shows a local image preview before the admin uploads handover proof", async () => {
    const { unmount } = renderUploadForm();
    const fileInput = screen.getByLabelText(/file bukti serah-terima barang/i);
    const file = new File(["proof"], "serah-terima.png", { type: "image/png" });

    fireEvent.change(fileInput, {
      target: {
        files: [file],
      },
    });

    expect(createObjectUrlMock).toHaveBeenCalledWith(file);
    expect(await screen.findByRole("img", { name: /preview bukti serah-terima barang/i })).toHaveAttribute(
      "src",
      "blob:handover-preview",
    );
    expect(screen.getByRole("button", { name: /unggah bukti serah-terima/i })).toBeEnabled();

    unmount();

    expect(revokeObjectUrlMock).toHaveBeenCalledWith("blob:handover-preview");
  });

  it("keeps the superadmin handover proof card read-only while using the wide preview shell", () => {
    render(
      <HandoverProofCard
        audience="superadmin"
        itemTitle="Cincin Emas Ranotana"
        proof={{
          fileUrl: "/uploads/serah-terima/cincin-ranotana.jpg",
          location: "UPC Ranotana",
          uploadedAt: "20 Juni 2026, 09.00 WITA",
          uploadedBy: "Admin UPC Ranotana",
        }}
      />,
    );

    expect(screen.getByLabelText(/panel bukti serah-terima barang/i)).toHaveClass(
      "xl:grid-cols-[minmax(17rem,0.72fr)_minmax(0,1.28fr)]",
    );
    expect(screen.getByLabelText(/area preview bukti serah-terima barang/i)).toHaveClass(
      "min-h-[18rem]",
      "rounded-xl",
      "border-2",
      "border-dashed",
    );
    expect(screen.getByRole("button", { name: /buka fullscreen bukti serah-terima barang/i })).toBeInTheDocument();
    expect(screen.queryByText(/^pilih file$/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /unggah bukti/i })).not.toBeInTheDocument();
  });
});
