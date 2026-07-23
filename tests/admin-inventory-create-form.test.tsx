import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { AdminInventoryCreateForm } from "@/components/admin-unit/admin-inventory-create-form";
import { AdminInventoryCreatePage } from "@/components/pages/admin-pages";
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
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ data: { id: "barang-created" } }), {
            headers: { "Content-Type": "application/json" },
            status: 201
          })
        )
      )
    );
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

  it("uses the standard admin unit hero on the create barang page", () => {
    const { container } = renderWithToast(<AdminInventoryCreatePage />);

    expect(screen.getByText("Admin Unit / Input Barang")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /tambahkan barang gadai/i })).toBeInTheDocument();
    expect(container.querySelector(".hero-surface")).not.toBeInTheDocument();
    expect(container.querySelector("section")?.className).toContain("rounded-[2.35rem]");
  });

  it("renders uploaded video thumbnails with video preview frames", async () => {
    const { container } = renderWithToast(<AdminInventoryCreateForm />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, {
      target: {
        files: [
          new File(["foto"], "laptop.jpg", { type: "image/jpeg" }),
          new File(["video"], "review-laptop.mp4", { type: "video/mp4" })
        ]
      }
    });

    expect(await screen.findByAltText("Preview media barang 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Thumbnail video media barang 2")).toBeInTheDocument();
    expect(screen.queryByText(/^video$/i)).not.toBeInTheDocument();
  });

  it("shows category-specific specification fields while creating barang gadai", () => {
    renderWithToast(<AdminInventoryCreateForm />);

    expect(screen.queryByRole("radio", { name: "Emas" })).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Perhiasan" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByLabelText("Jenis Emas")).toBeInTheDocument();
    expect(screen.getByLabelText("Kadar Emas")).toBeInTheDocument();
    expect(screen.getByLabelText("Panjang")).toBeInTheDocument();
    expect(screen.getByLabelText("Diameter")).toBeInTheDocument();
    expect(screen.queryByLabelText("Sertifikat")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Nilai gadai")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /tanggal gadai/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Nomor nasabah")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "Logam Mulia" }));

    expect(screen.getByLabelText(/Nomor Sertifikat/i)).toBeInTheDocument();
    expect(screen.getByText(/Nomor Sertifikat \(Opsional\)/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "Elektronik" }));

    expect(screen.getByLabelText("Merek")).toBeInTheDocument();
    expect(screen.getByLabelText("Model")).toBeInTheDocument();
    expect(screen.getByLabelText("Kelengkapan")).toBeInTheDocument();
    expect(screen.queryByLabelText("Jenis Emas")).not.toBeInTheDocument();
  });

  it("renders precise duration controls for the due deadline", () => {
    renderWithToast(<AdminInventoryCreateForm />);

    expect(screen.getByText("Durasi jatuh tempo")).toBeInTheDocument();
    expect(screen.getByLabelText("Hari")).toHaveValue(30);
    expect(screen.getByLabelText("Jam")).toHaveValue(0);
    expect(screen.getByLabelText("Menit")).toHaveValue(0);
    expect(screen.getByLabelText("Detik")).toHaveValue(0);
  });

  it("updates checklist readiness from form fields, dates, specifications, and media", async () => {
    const { container } = renderWithToast(<AdminInventoryCreateForm />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    expect(screen.getAllByLabelText(/checklist belum selesai/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /simpan barang gadai/i })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Nama barang"), { target: { value: "Cincin Berlian" } });
    fireEvent.change(screen.getByLabelText("Nilai taksiran"), { target: { value: "18500000" } });
    fireEvent.change(screen.getByLabelText("Nomor nasabah"), { target: { value: "0812445511223" } });
    fireEvent.change(screen.getByLabelText("Nama penggadai"), { target: { value: "Raras" } });
    fireEvent.change(screen.getByLabelText("Jenis Emas"), { target: { value: "Cincin" } });
    fireEvent.change(screen.getByLabelText("Kadar Emas"), { target: { value: "24K" } });
    fireEvent.change(screen.getByLabelText("Berat"), { target: { value: "3,20 gram" } });
    fireEvent.change(screen.getByLabelText("Bentuk"), { target: { value: "Perhiasan" } });
    fireEvent.change(screen.getByLabelText("Panjang"), { target: { value: "18 cm" } });
    fireEvent.change(screen.getByLabelText("Diameter"), { target: { value: "16 mm" } });

    fireEvent.change(input, {
      target: {
        files: [new File(["foto"], "cincin.jpg", { type: "image/jpeg" })]
      }
    });

    expect(await screen.findByAltText("Preview media barang 1")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /buka preview penuh media barang/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByAltText("Preview penuh media barang")).toBeInTheDocument();

    expect(screen.getAllByLabelText(/checklist selesai/i)).toHaveLength(4);
    expect(screen.getByRole("button", { name: /simpan barang gadai/i })).toBeEnabled();
  });

  it("does not require certificate number for logam mulia", async () => {
    const { container } = renderWithToast(<AdminInventoryCreateForm />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.click(screen.getByRole("radio", { name: "Logam Mulia" }));
    fireEvent.change(screen.getByLabelText("Nama barang"), { target: { value: "Emas Antam 10 Gram" } });
    fireEvent.change(screen.getByLabelText("Nilai taksiran"), { target: { value: "12000000" } });
    fireEvent.change(screen.getByLabelText("Nomor nasabah"), { target: { value: "0812445511223" } });
    fireEvent.change(screen.getByLabelText("Nama penggadai"), { target: { value: "Raras" } });
    fireEvent.change(screen.getByLabelText("Jenis Logam"), { target: { value: "Emas batangan" } });
    fireEvent.change(screen.getByLabelText("Brand"), { target: { value: "Antam" } });
    fireEvent.change(screen.getByLabelText("Kadar"), { target: { value: "999,9" } });
    fireEvent.change(screen.getByLabelText("Berat"), { target: { value: "10 gram" } });
    expect(screen.getByLabelText(/Nomor Sertifikat/i)).toHaveValue("");

    fireEvent.change(input, {
      target: {
        files: [new File(["foto"], "antam.jpg", { type: "image/jpeg" })]
      }
    });

    expect(await screen.findByAltText("Preview media barang 1")).toBeInTheDocument();
    expect(screen.getAllByLabelText(/checklist selesai/i)).toHaveLength(4);
    expect(screen.getByRole("button", { name: /simpan barang gadai/i })).toBeEnabled();
  });

  it("submits appraisal value without the removed loan value field", async () => {
    const { container } = renderWithToast(<AdminInventoryCreateForm />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(screen.getByLabelText("Nama barang"), { target: { value: "Cincin Berlian" } });
    fireEvent.change(screen.getByLabelText("Nilai taksiran"), { target: { value: "18500000" } });
    fireEvent.change(screen.getByLabelText("Nomor nasabah"), { target: { value: "0812445511223" } });
    fireEvent.change(screen.getByLabelText("Nama penggadai"), { target: { value: "Raras Maheswari" } });
    fireEvent.change(screen.getByLabelText("Jenis Emas"), { target: { value: "Cincin" } });
    fireEvent.change(screen.getByLabelText("Kadar Emas"), { target: { value: "24K" } });
    fireEvent.change(screen.getByLabelText("Berat"), { target: { value: "3,20 gram" } });
    fireEvent.change(screen.getByLabelText("Bentuk"), { target: { value: "Perhiasan" } });
    fireEvent.change(screen.getByLabelText("Panjang"), { target: { value: "18 cm" } });
    fireEvent.change(screen.getByLabelText("Diameter"), { target: { value: "16 mm" } });
    fireEvent.change(input, {
      target: {
        files: [new File(["foto"], "cincin.jpg", { type: "image/jpeg" })]
      }
    });

    await screen.findByAltText("Preview media barang 1");
    fireEvent.click(screen.getByRole("button", { name: /simpan barang gadai/i }));

    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/barang",
      expect.objectContaining({
        method: "POST"
      })
    );
    const [, request] = vi.mocked(fetch).mock.calls[0];
    const body = (request as RequestInit).body as FormData;
    expect(body.get("appraisalValue")).toBe("18500000");
    expect(body.has("loanValue")).toBe(false);
  });
});
