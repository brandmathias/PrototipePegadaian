import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdminApiSession: vi.fn(),
  requireBuyerApiSession: vi.fn(),
  ensureVickreyLossNotifications: vi.fn(),
  syncBuyerRestrictionNotifications: vi.fn(),
  listUserNotifications: vi.fn(),
  getUnreadNotificationCount: vi.fn(),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn()
}));

vi.mock("@/lib/auth/session", () => ({
  requireAdminApiSession: mocks.requireAdminApiSession,
  requireBuyerApiSession: mocks.requireBuyerApiSession
}));

vi.mock("@/lib/services/notification.service", () => ({
  listUserNotifications: mocks.listUserNotifications,
  getUnreadNotificationCount: mocks.getUnreadNotificationCount,
  markNotificationRead: mocks.markNotificationRead,
  markAllNotificationsRead: mocks.markAllNotificationsRead
}));

vi.mock("@/lib/services/notification-events", () => ({
  ensureVickreyLossNotifications: mocks.ensureVickreyLossNotifications,
  syncBuyerRestrictionNotifications: mocks.syncBuyerRestrictionNotifications
}));

const buyerAccess = {
  ok: true as const,
  userId: "buyer-1",
  session: {
    user: {
      id: "buyer-1"
    }
  }
};

const adminAccess = {
  ok: true as const,
  userId: "admin-1",
  session: {
    user: {
      id: "admin-1"
    }
  }
};

describe("buyer notification routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminApiSession.mockResolvedValue(adminAccess);
    mocks.requireBuyerApiSession.mockResolvedValue(buyerAccess);
    mocks.ensureVickreyLossNotifications.mockResolvedValue(undefined);
    mocks.syncBuyerRestrictionNotifications.mockResolvedValue(undefined);
  });

  it("lists buyer notifications with unread filter", async () => {
    mocks.listUserNotifications.mockResolvedValueOnce([
      {
        id: "notif-1",
        title: "Anda memenangkan lelang",
        isRead: false
      }
    ]);

    const { GET } = await import("@/app/api/user/notifikasi/route");
    const response = await GET(new Request("http://localhost:3000/api/user/notifikasi?unread=true&limit=5"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: [
        {
          id: "notif-1",
          title: "Anda memenangkan lelang",
          isRead: false
        }
      ]
    });
    expect(mocks.listUserNotifications).toHaveBeenCalledWith("buyer-1", {
      unreadOnly: true,
      limit: 5
    });
    expect(mocks.ensureVickreyLossNotifications).toHaveBeenCalledWith("buyer-1");
    expect(mocks.syncBuyerRestrictionNotifications).toHaveBeenCalledWith("buyer-1");
  });

  it("returns unread notification count", async () => {
    mocks.getUnreadNotificationCount.mockResolvedValueOnce(3);

    const { GET } = await import("@/app/api/user/notifikasi/unread-count/route");
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        count: 3
      }
    });
    expect(mocks.syncBuyerRestrictionNotifications).toHaveBeenCalledWith("buyer-1");
  });

  it("marks one notification read in the buyer scope", async () => {
    mocks.markNotificationRead.mockResolvedValueOnce({
      id: "notif-1",
      isRead: true
    });

    const { PATCH } = await import("@/app/api/user/notifikasi/[id]/route");
    const response = await PATCH(new Request("http://localhost:3000/api/user/notifikasi/notif-1"), {
      params: Promise.resolve({ id: "notif-1" })
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        id: "notif-1",
        isRead: true
      }
    });
    expect(mocks.markNotificationRead).toHaveBeenCalledWith("buyer-1", "notif-1");
  });

  it("marks all buyer notifications read", async () => {
    mocks.markAllNotificationsRead.mockResolvedValueOnce(4);

    const { POST } = await import("@/app/api/user/notifikasi/read-all/route");
    const response = await POST();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        updated: 4
      }
    });
  });

  it("rejects unauthenticated buyer notification access", async () => {
    mocks.requireBuyerApiSession.mockResolvedValueOnce({
      ok: false,
      status: 401,
      message: "Silakan masuk sebagai pembeli terlebih dahulu."
    });

    const { GET } = await import("@/app/api/user/notifikasi/route");
    const response = await GET(new Request("http://localhost:3000/api/user/notifikasi"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      message: "Silakan masuk sebagai pembeli terlebih dahulu."
    });
    expect(mocks.listUserNotifications).not.toHaveBeenCalled();
  });
});

describe("admin unit notification routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminApiSession.mockResolvedValue(adminAccess);
    mocks.requireBuyerApiSession.mockResolvedValue(buyerAccess);
    mocks.ensureVickreyLossNotifications.mockResolvedValue(undefined);
    mocks.syncBuyerRestrictionNotifications.mockResolvedValue(undefined);
  });

  it("lists admin unit notifications without buyer-only reconciliation", async () => {
    mocks.listUserNotifications.mockResolvedValueOnce([
      {
        id: "notif-admin-1",
        title: "Bukti pembayaran masuk",
        isRead: false
      }
    ]);

    const { GET } = await import("@/app/api/admin/notifikasi/route");
    const response = await GET(new Request("http://localhost:3000/api/admin/notifikasi?unread=true&limit=8"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: [
        {
          id: "notif-admin-1",
          title: "Bukti pembayaran masuk",
          isRead: false
        }
      ]
    });
    expect(mocks.listUserNotifications).toHaveBeenCalledWith("admin-1", {
      unreadOnly: true,
      limit: 8
    });
    expect(mocks.ensureVickreyLossNotifications).not.toHaveBeenCalled();
  });

  it("marks one admin unit notification read", async () => {
    mocks.markNotificationRead.mockResolvedValueOnce({
      id: "notif-admin-1",
      isRead: true
    });

    const { PATCH } = await import("@/app/api/admin/notifikasi/[id]/route");
    const response = await PATCH(new Request("http://localhost:3000/api/admin/notifikasi/notif-admin-1"), {
      params: Promise.resolve({ id: "notif-admin-1" })
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        id: "notif-admin-1",
        isRead: true
      }
    });
    expect(mocks.markNotificationRead).toHaveBeenCalledWith("admin-1", "notif-admin-1");
  });

  it("marks all admin unit notifications read", async () => {
    mocks.markAllNotificationsRead.mockResolvedValueOnce(2);

    const { POST } = await import("@/app/api/admin/notifikasi/read-all/route");
    const response = await POST();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        updated: 2
      }
    });
    expect(mocks.markAllNotificationsRead).toHaveBeenCalledWith("admin-1");
  });

  it("rejects unauthenticated admin notification access", async () => {
    mocks.requireAdminApiSession.mockResolvedValueOnce({
      ok: false,
      status: 401,
      message: "Silakan masuk sebagai admin unit terlebih dahulu."
    });

    const { GET } = await import("@/app/api/admin/notifikasi/route");
    const response = await GET(new Request("http://localhost:3000/api/admin/notifikasi"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      message: "Silakan masuk sebagai admin unit terlebih dahulu."
    });
    expect(mocks.listUserNotifications).not.toHaveBeenCalled();
  });
});
