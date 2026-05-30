import { randomUUID } from "node:crypto";

import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { notifications } from "@/lib/db/schema";

export type NotificationType =
  | "vickrey_win"
  | "vickrey_loss"
  | "payment_verified"
  | "payment_rejected"
  | "payment_deadline"
  | "blacklist_active"
  | "blacklist_review_submitted"
  | "blacklist_review_approved"
  | "blacklist_review_rejected"
  | "transaction_created";

export type NotificationEntityType = "transaction" | "pemasaran" | "blacklist" | "blacklist_review" | "barang";

export type NotificationInput = {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  entityType?: NotificationEntityType;
  entityId?: string;
  actionHref?: string;
  metadata?: Record<string, unknown>;
};

export type NotificationListOptions = {
  unreadOnly?: boolean;
  limit?: number;
};

type NotificationRow = typeof notifications.$inferSelect;

function serializeNotification(row: NotificationRow) {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    message: row.message,
    type: row.type,
    entityType: row.entityType,
    entityId: row.entityId,
    actionHref: row.actionHref,
    isRead: row.isRead,
    createdAt: row.createdAt.toISOString(),
    readAt: row.readAt?.toISOString() ?? null,
    metadata: row.metadata
  };
}

function normalizeLimit(limit: number | undefined) {
  if (!Number.isFinite(limit)) {
    return 20;
  }

  return Math.min(Math.max(Math.trunc(limit ?? 20), 1), 50);
}

export async function createNotification(input: NotificationInput) {
  const [created] = await db
    .insert(notifications)
    .values({
      id: randomUUID(),
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      actionHref: input.actionHref ?? null,
      isRead: false,
      metadata: input.metadata ?? null
    })
    .returning();

  if (!created) {
    throw new Error("Notifikasi gagal dibuat.");
  }

  return serializeNotification(created);
}

export async function createNotificationOnce(input: NotificationInput) {
  if (input.entityId) {
    const [existing] = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, input.userId),
          eq(notifications.type, input.type),
          eq(notifications.entityId, input.entityId)
        )
      )
      .limit(1);

    if (existing) {
      return serializeNotification(existing);
    }
  }

  return createNotification(input);
}

export async function listUserNotifications(userId: string, options: NotificationListOptions = {}) {
  const whereClause = options.unreadOnly
    ? and(eq(notifications.userId, userId), eq(notifications.isRead, false))
    : eq(notifications.userId, userId);

  const rows = await db
    .select()
    .from(notifications)
    .where(whereClause)
    .orderBy(desc(notifications.createdAt))
    .limit(normalizeLimit(options.limit));

  return rows.map(serializeNotification);
}

export async function getUnreadNotificationCount(userId: string) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

  return Number(row?.count ?? 0);
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const [updated] = await db
    .update(notifications)
    .set({
      isRead: true,
      readAt: new Date()
    })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
    .returning();

  if (!updated) {
    throw new Error("Notifikasi tidak ditemukan.");
  }

  return serializeNotification(updated);
}

export async function markAllNotificationsRead(userId: string) {
  const updated = await db
    .update(notifications)
    .set({
      isRead: true,
      readAt: new Date()
    })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
    .returning();

  return updated.length;
}
