import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { AdminInventoryCreateForm } from "@/components/admin-unit/admin-inventory-create-form";
import { ToastProvider } from "@/components/ui/toast";

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

describe("AdminInventoryCreateForm", () => {
  beforeEach(() => {
    router.push.mockClear();
    router.refresh.mockClear();
    vi.stubGlobal(
      "URL",
      Object.assign(globalThis.URL, {
        createObjectURL: vi.fn((file: File) => `blob:${file.name}`),
        revokeObjectURL: vi.fn()
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("caps selected upload media to five files during barang gadai creation", async () => {
    const { container } = renderWithToast(<AdminInventoryCreateForm />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    const files = Array.from({ length: 6 }, (_, index) =>
      new File([`file-${index}`], `foto-${index + 1}.jpg`, {
        type: "image/jpeg"
      })
    );

    fireEvent.change(input, { target: { files } });

    expect(await screen.findByText("5/5 media terpilih")).toBeInTheDocument();
    expect(screen.getByText(/batas upload tetap 5 media per barang/i)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /hapus foto-/i })).toHaveLength(5);
  });

  it("shows category-specific specification fields while creating barang gadai", () => {
    renderWithToast(<AdminInventoryCreateForm />);

    expect(screen.getByLabelText("Jenis Emas")).toBeInTheDocument();
    expect(screen.getByLabelText("Kadar Emas")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "Elektronik" }));

    expect(screen.getByLabelText("Merek")).toBeInTheDocument();
    expect(screen.getByLabelText("Model")).toBeInTheDocument();
    expect(screen.getByLabelText("Kelengkapan")).toBeInTheDocument();
    expect(screen.queryByLabelText("Jenis Emas")).not.toBeInTheDocument();
  });
});
