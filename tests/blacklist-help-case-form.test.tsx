import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn()
  })
}));

import { BlacklistHelpCaseForm } from "@/components/buyer/blacklist-help-case-form";

describe("BlacklistHelpCaseForm", () => {
  const createObjectUrlMock = vi.fn(() => "blob:blacklist-review-preview");
  const revokeObjectUrlMock = vi.fn();

  beforeEach(() => {
    URL.createObjectURL = createObjectUrlMock;
    URL.revokeObjectURL = revokeObjectUrlMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    createObjectUrlMock.mockClear();
    revokeObjectUrlMock.mockClear();
  });

  it("shows an inline image preview for jpg or png attachments", async () => {
    render(<BlacklistHelpCaseForm incidentId="incident-1" />);

    const fileInput = screen.getByLabelText(/unggah bukti pendukung/i);
    const file = new File(["image-proof"], "bukti-bayar.png", { type: "image/png" });

    fireEvent.change(fileInput, {
      target: {
        files: [file]
      }
    });

    expect(await screen.findByRole("img", { name: /preview bukti pendukung/i })).toBeInTheDocument();
    expect(screen.getByText("bukti-bayar.png")).toBeInTheDocument();
  });

  it("shows a file card without image preview for pdf attachments", () => {
    render(<BlacklistHelpCaseForm incidentId="incident-2" />);

    const fileInput = screen.getByLabelText(/unggah bukti pendukung/i);
    const file = new File(["pdf-proof"], "bukti-pendukung.pdf", { type: "application/pdf" });

    fireEvent.change(fileInput, {
      target: {
        files: [file]
      }
    });

    expect(screen.queryByRole("img", { name: /preview bukti pendukung/i })).not.toBeInTheDocument();
    expect(screen.getByText("bukti-pendukung.pdf")).toBeInTheDocument();
    expect(screen.getByText("PDF - 9 B")).toBeInTheDocument();
  });
});
