import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdminApiSession: vi.fn(),
  requireSuperAdminApiSession: vi.fn(),
  updateAccountProfile: vi.fn()
}));

vi.mock("@/lib/auth/session", () => ({
  requireAdminApiSession: mocks.requireAdminApiSession,
  requireSuperAdminApiSession: mocks.requireSuperAdminApiSession
}));

vi.mock("@/lib/services/account-profile.service", () => ({
  updateAccountProfile: mocks.updateAccountProfile
}));

describe("profile email routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminApiSession.mockResolvedValue({
      ok: true,
      session: {
        user: {
          id: "admin-1"
        }
      },
      unitId: "unit-1"
    });
    mocks.requireSuperAdminApiSession.mockResolvedValue({
      ok: true,
      session: {
        user: {
          id: "owner-1"
        }
      }
    });
  });

  it("updates the current admin unit email through the account profile service", async () => {
    mocks.updateAccountProfile.mockResolvedValueOnce({
      id: "admin-1",
      email: "admin.baru@pegadaian.co.id"
    });

    const { PUT } = await import("@/app/api/admin/profil/route");
    const response = await PUT(
      new Request("http://localhost:3000/api/admin/profil", {
        method: "PUT",
        body: JSON.stringify({
          name: "Admin Unit",
          email: "ADMIN.BARU@PEGADAIAN.CO.ID",
          phoneNumber: "081234567890"
        })
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.updateAccountProfile).toHaveBeenCalledWith("admin-1", "admin_unit", {
      name: "Admin Unit",
      email: "ADMIN.BARU@PEGADAIAN.CO.ID",
      phoneNumber: "081234567890"
    });
    await expect(response.json()).resolves.toEqual({
      data: {
        id: "admin-1",
        email: "admin.baru@pegadaian.co.id"
      }
    });
  });

  it("updates the current superadmin email through the account profile service", async () => {
    mocks.updateAccountProfile.mockResolvedValueOnce({
      id: "owner-1",
      email: "owner.baru@pegadaian.co.id"
    });

    const { PUT } = await import("@/app/api/superadmin/profil/route");
    const response = await PUT(
      new Request("http://localhost:3000/api/superadmin/profil", {
        method: "PUT",
        body: JSON.stringify({
          name: "Owner Nasional",
          email: "owner.baru@pegadaian.co.id",
          phoneNumber: "081299990000"
        })
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.updateAccountProfile).toHaveBeenCalledWith("owner-1", "super_admin", {
      name: "Owner Nasional",
      email: "owner.baru@pegadaian.co.id",
      phoneNumber: "081299990000"
    });
  });
});
