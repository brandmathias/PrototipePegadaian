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
  createOrRefreshNotification,
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

  it("refreshes an existing notification without forcing it unread during data sync", async () => {
    mockSelectRows([
      {
        ...notificationRow,
        entityId: "blacklist-buyer-1",
        type: "blacklist_active"
      }
    ]);
    const refreshedRow = {
      ...notificationRow,
      entityId: "blacklist-buyer-1",
      message: "Pelanggaran saat ini: 2x.",
      type: "blacklist_active"
    };
    const returning = vi.fn().mockResolvedValue([refreshedRow]);
    const where = vi.fn().mockReturnValue({ returning });
    const set = vi.fn().mockReturnValue({ where });
    mocks.db.update.mockReturnValueOnce({ set });

    await expect(
      createOrRefreshNotification(
        {
          userId: "buyer-1",
          title: "Akun Anda dikenakan pembatasan",
          message: "Pelanggaran saat ini: 2x.",
          type: "blacklist_active",
          entityType: "blacklist",
          entityId: "blacklist-buyer-1",
          actionHref: "/pelanggaran",
          metadata: { totalViolations: 2 }
        },
        { markUnread: false }
      )
    ).resolves.toMatchObject({
      entityId: "blacklist-buyer-1",
      message: "Pelanggaran saat ini: 2x."
    });

    expect(mocks.db.insert).not.toHaveBeenCalled();
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        actionHref: "/pelanggaran",
        entityType: "blacklist",
        message: "Pelanggaran saat ini: 2x."
      })
    );
    expect(set.mock.calls[0]?.[0]).not.toHaveProperty("isRead");
    expect(set.mock.calls[0]?.[0]).not.toHaveProperty("readAt");
  });

  it("uses the supplied business timestamp when refreshing an unread notification", async () => {
    mockSelectRows([
      {
        ...notificationRow,
        createdAt: new Date("2026-06-21T23:56:00.000Z"),
        entityId: "blacklist-buyer-1",
        type: "blacklist_active"
      }
    ]);
    const occurredAt = new Date("2026-06-18T20:03:00.000Z");
    const refreshedRow = {
      ...notificationRow,
      createdAt: occurredAt,
      entityId: "blacklist-buyer-1",
      message: "Pelanggaran saat ini: 1x.",
      type: "blacklist_active"
    };
    const returning = vi.fn().mockResolvedValue([refreshedRow]);
    const where = vi.fn().mockReturnValue({ returning });
    const set = vi.fn().mockReturnValue({ where });
    mocks.db.update.mockReturnValueOnce({ set });

    await createOrRefreshNotification({
      userId: "buyer-1",
      title: "Akun Anda dikenakan pembatasan",
      message: "Pelanggaran saat ini: 1x.",
      type: "blacklist_active",
      entityType: "blacklist",
      entityId: "blacklist-buyer-1",
      actionHref: "/pelanggaran",
      createdAt: occurredAt,
      metadata: { occurredAt: occurredAt.toISOString(), totalViolations: 1 }
    } as any);

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        createdAt: occurredAt,
        isRead: false,
        readAt: null
      })
    );
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

  it("filters legacy review and stale transaction blacklist notifications from the buyer list", async () => {
    mockSelectRows([
      {
        ...notificationRow,
        id: "notif-current-blacklist",
        entityId: "blacklist-buyer-1",
        entityType: "blacklist",
        message: "Pelanggaran saat ini: 2x.",
        title: "Akun Anda dikenakan pembatasan",
        type: "blacklist_active"
      },
      {
        ...notificationRow,
        id: "notif-stale-blacklist",
        entityId: "trx-legacy-1",
        message: "Pelanggaran saat ini: 3x.",
        title: "Akun Anda dikenakan pembatasan",
        type: "blacklist_active"
      },
      {
        ...notificationRow,
        id: "notif-review-legacy",
        message: "Superadmin menyetujui review insiden Anda.",
        title: "Review insiden disetujui",
        type: "blacklist_review_approved"
      }
    ]);

    await expect(listUserNotifications("buyer-1", { limit: 12 })).resolves.toEqual([
      expect.objectContaining({
        id: "notif-current-blacklist",
        entityId: "blacklist-buyer-1",
        message: "Pelanggaran saat ini: 2x."
      })
    ]);
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
