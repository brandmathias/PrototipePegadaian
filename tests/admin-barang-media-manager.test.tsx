import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AdminBarangMediaManager } from "@/components/admin-unit/admin-barang-media-manager";
import { ToastProvider } from "@/components/ui/toast";

const router = vi.hoisted(() => ({
  refresh: vi.fn()
}));

vi.mock("next/navigation", () => ({
  useRouter: () => router
}));

function renderWithToast(ui: React.ReactNode) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe("AdminBarangMediaManager", () => {
  beforeEach(() => {
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:media-preview"),
      revokeObjectURL: vi.fn()
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ data: { id: "media-1" } }), {
            headers: { "Content-Type": "application/json" },
            status: 200
          })
        )
      )
    );
    router.refresh.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("stages media deletion behind the in-app confirmation dialog", async () => {
    const confirmSpy = vi.spyOn(window, "confirm");
    const onDraftChange = vi.fn();

    renderWithToast(
      <AdminBarangMediaManager
        barangId="barang-1"
        onDraftChange={onDraftChange}
        media={[
          {
            id: "media-1",
            type: "foto",
            url: "/uploads/barang/foto-1.jpg",
            fileName: "foto-1.jpg",
            sizeBytes: 2048
          }
        ]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /hapus foto-1\.jpg/i }));

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(screen.getByText("Hapus media dari barang?")).toBeInTheDocument();

    fireEvent.click(await screen.findByRole("button", { name: "Ya, hapus media" }));

    await waitFor(() => {
      expect(onDraftChange).toHaveBeenLastCalledWith({
        addedFiles: [],
        deletedMediaIds: ["media-1"]
      });
    });
    expect(fetch).not.toHaveBeenCalled();
    expect(router.refresh).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it("stages uploaded media locally until the edit form is saved", async () => {
    const onDraftChange = vi.fn();

    const { container } = renderWithToast(
      <AdminBarangMediaManager
        barangId="barang-1"
        onDraftChange={onDraftChange}
        media={[
          {
            id: "media-1",
            type: "foto",
            url: "/uploads/barang/foto-1.jpg",
            fileName: "foto-1.jpg",
            sizeBytes: 2048
          }
        ]}
      />
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["foto-baru"], "foto-baru.jpg", { type: "image/jpeg" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(onDraftChange).toHaveBeenLastCalledWith({
        addedFiles: [file],
        deletedMediaIds: []
      });
    });
    expect(screen.getByText("2/5 Media Terpilih")).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
    expect(router.refresh).not.toHaveBeenCalled();
  });
});
