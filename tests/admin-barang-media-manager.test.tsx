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

  it("uses the in-app confirmation dialog before deleting media", async () => {
    const confirmSpy = vi.spyOn(window, "confirm");

    renderWithToast(
      <AdminBarangMediaManager
        barangId="barang-1"
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
      expect(fetch).toHaveBeenCalledWith("/api/admin/barang/barang-1/media/media-1", {
        method: "DELETE"
      });
    });
    expect(router.refresh).toHaveBeenCalled();

    confirmSpy.mockRestore();
  });
});
