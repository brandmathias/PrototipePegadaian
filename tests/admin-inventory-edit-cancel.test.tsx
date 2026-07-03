import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AdminInventoryEditPage } from "@/components/pages/admin-pages";
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

function editItem() {
  return {
    id: "barang-edit",
    code: "BRG-EDIT",
    name: "Kalung Lama",
    category: "perhiasan",
    condition: "baik",
    customerNumber: "081211112222",
    description: "Data lama",
    dueDate: "2026-06-01",
    ownerName: "Nasabah Lama",
    pawnedAt: "2026-05-01",
    appraisalValue: 10_000_000,
    status: "JAMINAN",
    media: [
      {
        id: "media-1",
        type: "foto",
        url: "/uploads/barang/foto-1.jpg",
        fileName: "foto-1.jpg",
        sizeBytes: 2048
      }
    ],
    specifications: {
      berat: "8 gram"
    }
  };
}

describe("AdminInventoryEditPage cancellation", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response(JSON.stringify({ data: {} }), { status: 200 }))));
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:media-preview"),
      revokeObjectURL: vi.fn()
    });
    router.push.mockClear();
    router.refresh.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps field and media edits draft-only when Batal is clicked", async () => {
    const { container } = renderWithToast(<AdminInventoryEditPage item={editItem()} />);

    fireEvent.change(screen.getByLabelText("Nama barang"), {
      target: { value: "Kalung Baru" }
    });

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [new File(["foto-baru"], "foto-baru.jpg", { type: "image/jpeg" })] }
    });

    fireEvent.click(screen.getByRole("button", { name: /hapus foto-1\.jpg/i }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya, hapus media" }));
    const cancelLink = screen.getByRole("link", { name: "Batal" });
    cancelLink.addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(cancelLink);

    await waitFor(() => {
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  it("submits staged media together with the edit payload only on Simpan Perubahan", async () => {
    const { container } = renderWithToast(<AdminInventoryEditPage item={editItem()} />);
    const addedFile = new File(["foto-baru"], "foto-baru.jpg", { type: "image/jpeg" });

    fireEvent.change(screen.getByLabelText("Nama barang"), {
      target: { value: "Kalung Baru" }
    });
    fireEvent.change(container.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [addedFile] }
    });
    fireEvent.click(screen.getByRole("button", { name: /hapus foto-1\.jpg/i }));
    fireEvent.click(await screen.findByRole("button", { name: "Ya, hapus media" }));
    fireEvent.click(screen.getByRole("button", { name: "Simpan Perubahan" }));

    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());

    const [url, request] = vi.mocked(fetch).mock.calls[0];
    const body = (request as RequestInit).body as FormData;
    const payload = JSON.parse(String(body.get("payload")));
    expect(url).toBe("/api/admin/barang/barang-edit");
    expect(request).toEqual(expect.objectContaining({ method: "PUT" }));
    expect(payload).toMatchObject({
      name: "Kalung Baru",
      ownerName: "Nasabah Lama",
      appraisalValue: "10000000"
    });
    expect(body.getAll("deleteMediaIds")).toEqual(["media-1"]);
    expect(body.getAll("media")).toEqual([addedFile]);
    expect(router.push).toHaveBeenCalledWith("/admin/barang");
  });

  it("keeps media-only saves on the full editable barang payload", async () => {
    const { container } = renderWithToast(<AdminInventoryEditPage item={editItem()} />);
    const addedFile = new File(["foto-baru"], "foto-baru.jpg", { type: "image/jpeg" });

    fireEvent.change(container.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [addedFile] }
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan Perubahan" }));

    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());

    const [, request] = vi.mocked(fetch).mock.calls[0];
    const payload = JSON.parse(String(((request as RequestInit).body as FormData).get("payload")));
    expect(payload).toMatchObject({
      name: "Kalung Lama",
      category: "perhiasan",
      ownerName: "Nasabah Lama",
      appraisalValue: "10000000"
    });
    expect(payload).not.toHaveProperty("correctionOnly");
  });
});
