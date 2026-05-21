import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const db = {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn()
  };

  return { db };
});

vi.mock("@/lib/db/client", () => ({
  db: mocks.db
}));

import {
  createNotification,
  createNotificationOnce,
  listUserNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from "@/lib/services/notification.service";

const notificationRow = {
  id: "notif-1",
  userId: "buyer-1",
  title: "Anda memenangkan lelang",
  message: "Silakan lanjutkan pembayaran langsung di unit.",
  type: "vickrey_win",
  entityType: "transaction",
  entityId: "trx-1",
  actionHref: "/transaksi/trx-1",
  isRead: false,
  createdAt: new Date("2026-05-22T01:00:00.000Z"),
  readAt: null,
  metadata: { amount: 100000000 }
};

function mockSelectRows(rows: unknown[]) {
  const limit = vi.fn().mockResolvedValue(rows);
  const orderBy = vi.fn().mockReturnValue({ limit });
  const where = vi.fn().mockReturnValue({ orderBy, limit });
  const from = vi.fn().mockReturnValue({ where });

  mocks.db.select.mockReturnValueOnce({ from });

  return { from, where, orderBy, limit };
}

describe("notification service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a persisted buyer notification", async () => {
    const returning = vi.fn().mockResolvedValue([notificationRow]);
    const values = vi.fn().mockReturnValue({ returning });
    mocks.db.insert.mockReturnValueOnce({ values });

    await expect(
      createNotification({
        userId: "buyer-1",
        title: "Anda memenangkan lelang",
        message: "Silakan lanjutkan pembayaran langsung di unit.",
        type: "vickrey_win",
        entityType: "transaction",
        entityId: "trx-1",
        actionHref: "/transaksi/trx-1",
        metadata: { amount: 100000000 }
      })
    ).resolves.toMatchObject({
      id: "notif-1",
      userId: "buyer-1",
      title: "Anda memenangkan lelang",
      isRead: false,
      createdAt: "2026-05-22T01:00:00.000Z"
    });

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "buyer-1",
        type: "vickrey_win",
        entityType: "transaction",
        entityId: "trx-1",
        actionHref: "/transaksi/trx-1",
        isRead: false
      })
    );
  });

  it("does not duplicate event notifications for the same user, type, and entity", async () => {
    mockSelectRows([notificationRow]);

    await expect(
      createNotificationOnce({
        userId: "buyer-1",
        title: "Anda memenangkan lelang",
        message: "Silakan lanjutkan pembayaran langsung di unit.",
        type: "vickrey_win",
        entityType: "transaction",
        entityId: "trx-1",
        actionHref: "/transaksi/trx-1"
      })
    ).resolves.toMatchObject({
      id: "notif-1",
      entityId: "trx-1"
    });

    expect(mocks.db.insert).not.toHaveBeenCalled();
  });

  it("lists latest notifications and supports unread filtering", async () => {
    const chain = mockSelectRows([notificationRow]);

    await expect(listUserNotifications("buyer-1", { unreadOnly: true, limit: 5 })).resolves.toEqual([
      expect.objectContaining({
        id: "notif-1",
        isRead: false,
        createdAt: "2026-05-22T01:00:00.000Z"
      })
    ]);

    expect(chain.limit).toHaveBeenCalledWith(5);
  });

  it("marks one notification read only inside the owner scope", async () => {
    const readRow = {
      ...notificationRow,
      isRead: true,
      readAt: new Date("2026-05-22T01:05:00.000Z")
    };
    const returning = vi.fn().mockResolvedValue([readRow]);
    const where = vi.fn().mockReturnValue({ returning });
    const set = vi.fn().mockReturnValue({ where });
    mocks.db.update.mockReturnValueOnce({ set });

    await expect(markNotificationRead("buyer-1", "notif-1")).resolves.toMatchObject({
      id: "notif-1",
      isRead: true,
      readAt: "2026-05-22T01:05:00.000Z"
    });

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        isRead: true,
        readAt: expect.any(Date)
      })
    );
  });

  it("marks all unread notifications read for one buyer", async () => {
    const returning = vi.fn().mockResolvedValue([notificationRow]);
    const where = vi.fn().mockReturnValue({ returning });
    const set = vi.fn().mockReturnValue({ where });
    mocks.db.update.mockReturnValueOnce({ set });

    await expect(markAllNotificationsRead("buyer-1")).resolves.toBe(1);

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        isRead: true,
        readAt: expect.any(Date)
      })
    );
  });
});
