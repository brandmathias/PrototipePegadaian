import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  class SuperAdminAccountError extends Error {
    status: number;

    constructor(message: string, status = 400) {
      super(message);
      this.status = status;
    }
  }

  return {
    SuperAdminAccountError,
    requireSuperAdminApiSession: vi.fn(),
    listSuperAdminAccounts: vi.fn(),
    createSuperAdminAccount: vi.fn(),
    updateSuperAdminAccount: vi.fn(),
    resetSuperAdminPassword: vi.fn(),
    listUserNotifications: vi.fn(),
    markNotificationRead: vi.fn(),
    markAllNotificationsRead: vi.fn()
  };
});

vi.mock("@/lib/auth/session", () => ({
  requireSuperAdminApiSession: mocks.requireSuperAdminApiSession
}));

vi.mock("@/lib/services/superadmin-account.service", () => ({
  SuperAdminAccountError: mocks.SuperAdminAccountError,
  listSuperAdminAccounts: mocks.listSuperAdminAccounts,
  createSuperAdminAccount: mocks.createSuperAdminAccount,
  updateSuperAdminAccount: mocks.updateSuperAdminAccount,
  resetSuperAdminPassword: mocks.resetSuperAdminPassword
}));

vi.mock("@/lib/services/notification.service", () => ({
  listUserNotifications: mocks.listUserNotifications,
  markNotificationRead: mocks.markNotificationRead,
  markAllNotificationsRead: mocks.markAllNotificationsRead
}));

const superAdminAccess = {
  ok: true as const,
  session: {
    user: {
      id: "owner-1"
    }
  }
};

describe("superadmin account routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireSuperAdminApiSession.mockResolvedValue(superAdminAccess);
  });

  it("lists superadmin accounts for the current superadmin", async () => {
    mocks.listSuperAdminAccounts.mockResolvedValueOnce({
      accounts: [{ id: "owner-1", name: "Owner Nasional" }]
    });

    const { GET } = await import("@/app/api/superadmin/accounts/route");
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        accounts: [{ id: "owner-1", name: "Owner Nasional" }]
      }
    });
    expect(mocks.listSuperAdminAccounts).toHaveBeenCalledWith("owner-1");
  });

  it("creates a superadmin account with the actor id from session", async () => {
    mocks.createSuperAdminAccount.mockResolvedValueOnce({
      id: "operator-1",
      level: "operator"
    });

    const { POST } = await import("@/app/api/superadmin/accounts/route");
    const response = await POST(
      new Request("http://localhost:3000/api/superadmin/accounts", {
        method: "POST",
        body: JSON.stringify({
          name: "Operator Nasional",
          email: "operator@pegadaian.test",
          temporaryPassword: "rahasia-123"
        })
      })
    );

    expect(response.status).toBe(201);
    expect(mocks.createSuperAdminAccount).toHaveBeenCalledWith(
      "owner-1",
      expect.objectContaining({
        email: "operator@pegadaian.test"
      })
    );
  });

  it("returns service status for protected account conflicts", async () => {
    mocks.createSuperAdminAccount.mockRejectedValueOnce(
      new mocks.SuperAdminAccountError("Email superadmin sudah dipakai.", 409)
    );

    const { POST } = await import("@/app/api/superadmin/accounts/route");
    const response = await POST(
      new Request("http://localhost:3000/api/superadmin/accounts", {
        method: "POST",
        body: JSON.stringify({ name: "Owner", email: "owner@pegadaian.test", temporaryPassword: "rahasia-123" })
      })
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      message: "Email superadmin sudah dipakai."
    });
  });

  it("updates account level and resets password through scoped routes", async () => {
    mocks.updateSuperAdminAccount.mockResolvedValueOnce({ id: "operator-1", level: "owner" });
    mocks.resetSuperAdminPassword.mockResolvedValueOnce({
      id: "operator-1",
      status: "Password sementara berhasil diperbarui."
    });

    const accountRoute = await import("@/app/api/superadmin/accounts/[id]/route");
    const updateResponse = await accountRoute.PATCH(
      new Request("http://localhost:3000/api/superadmin/accounts/operator-1", {
        method: "PATCH",
        body: JSON.stringify({ level: "owner" })
      }),
      { params: Promise.resolve({ id: "operator-1" }) }
    );

    const resetRoute = await import("@/app/api/superadmin/accounts/[id]/reset-password/route");
    const resetResponse = await resetRoute.POST(
      new Request("http://localhost:3000/api/superadmin/accounts/operator-1/reset-password", {
        method: "POST",
        body: JSON.stringify({ temporaryPassword: "baru-12345" })
      }),
      { params: Promise.resolve({ id: "operator-1" }) }
    );

    expect(updateResponse.status).toBe(200);
    expect(resetResponse.status).toBe(200);
    expect(mocks.updateSuperAdminAccount).toHaveBeenCalledWith("owner-1", "operator-1", { level: "owner" });
    expect(mocks.resetSuperAdminPassword).toHaveBeenCalledWith("owner-1", "operator-1", {
      temporaryPassword: "baru-12345"
    });
  });

  it("uses superadmin notification endpoints with the current user id", async () => {
    mocks.listUserNotifications.mockResolvedValueOnce([{ id: "notif-1", title: "Akses diperbarui" }]);
    mocks.markNotificationRead.mockResolvedValueOnce({ id: "notif-1", isRead: true });
    mocks.markAllNotificationsRead.mockResolvedValueOnce(2);

    const listRoute = await import("@/app/api/superadmin/notifikasi/route");
    const listResponse = await listRoute.GET(
      new Request("http://localhost:3000/api/superadmin/notifikasi?unread=true&limit=5")
    );
    const itemRoute = await import("@/app/api/superadmin/notifikasi/[id]/route");
    const readResponse = await itemRoute.PATCH(
      new Request("http://localhost:3000/api/superadmin/notifikasi/notif-1", { method: "PATCH" }),
      { params: Promise.resolve({ id: "notif-1" }) }
    );
    const readAllRoute = await import("@/app/api/superadmin/notifikasi/read-all/route");
    const readAllResponse = await readAllRoute.POST();

    expect(listResponse.status).toBe(200);
    expect(readResponse.status).toBe(200);
    expect(readAllResponse.status).toBe(200);
    expect(mocks.listUserNotifications).toHaveBeenCalledWith("owner-1", {
      unreadOnly: true,
      limit: 5
    });
    expect(mocks.markNotificationRead).toHaveBeenCalledWith("owner-1", "notif-1");
    expect(mocks.markAllNotificationsRead).toHaveBeenCalledWith("owner-1");
  });
});
