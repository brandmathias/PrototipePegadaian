import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, vi } from "vitest";

import { AdminProfileWorkspace, type AdminProfileData } from "@/components/admin/admin-profile-workspace";

const router = {
  refresh: vi.fn()
};

vi.mock("next/navigation", () => ({
  useRouter: () => router
}));

const profile: AdminProfileData = {
  activeSessionCount: 2,
  email: "admin.ranotana@pegadaian.co.id",
  image: null,
  joinedAt: "10 Januari 2024",
  name: "Admin Unit",
  passwordUpdatedAt: "13 Mei 2025",
  phone: "+62 812 3456 7890",
  roleLabel: "Administrator",
  sessionHistory: ["Chrome - Windows - 25 Mei 2026, 06.36 WIB", "Mobile App - Android - 24 Mei 2026, 20.15 WIB"],
  unitAddress: "Jl. Poros Malahona No. 45, Kendari, Sulawesi Tenggara",
  unitCode: "UPC-RNT",
  unitName: "UPC Ranotana",
  updatedAt: "13 Mei 2025"
};

describe("AdminProfileWorkspace", () => {
  beforeEach(() => {
    router.refresh.mockClear();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: { email: "admin.baru@pegadaian.co.id" } })
      })
    );
  });

  it("renders admin unit profile hero, security access, and toggled forms", () => {
    render(<AdminProfileWorkspace profile={profile} />);

    expect(screen.getByRole("heading", { name: /profil admin unit/i })).toBeInTheDocument();
    expect(screen.getByText("admin.ranotana@pegadaian.co.id")).toBeInTheDocument();
    expect(screen.getByText("Keamanan & Akses")).toBeInTheDocument();
    expect(screen.getByText(/terakhir diubah 13 mei 2025/i)).toBeInTheDocument();
    expect(screen.getAllByText(/2 sesi aktif/i).length).toBeGreaterThan(0);
    expect(screen.queryByText("Sesi Login Terbaru")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /edit profil/i }));
    expect(screen.getByRole("heading", { name: /perbarui informasi admin unit/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /ubah password/i }));
    expect(screen.getByRole("heading", { name: /ubah kata sandi/i })).toBeInTheDocument();
  });

  it("lets admin unit change email and persists it through the profile endpoint", async () => {
    const user = userEvent.setup();

    render(<AdminProfileWorkspace profile={profile} />);

    await user.click(screen.getByRole("button", { name: /edit profil/i }));

    const emailInput = screen.getByLabelText(/email kerja/i, { selector: "input" });
    expect(emailInput).not.toBeDisabled();

    await user.clear(emailInput);
    await user.type(emailInput, "admin.baru@pegadaian.co.id");
    await user.click(screen.getByRole("button", { name: /simpan perubahan/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/admin/profil",
        expect.objectContaining({
          method: "PUT",
          body: expect.any(String)
        })
      );
    });

    const [, requestInit] = vi.mocked(fetch).mock.calls[0];
    expect(JSON.parse(String(requestInit?.body))).toEqual(
      expect.objectContaining({
        email: "admin.baru@pegadaian.co.id"
      })
    );
    expect(router.refresh).toHaveBeenCalled();
  });
});
