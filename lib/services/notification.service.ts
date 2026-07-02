import { randomUUID } from "node:crypto";

import { and, desc, eq, ilike, isNull, ne, not, or, sql } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { notifications } from "@/lib/db/schema";

export type NotificationType =
  | "vickrey_win"
  | "vickrey_loss"
  | "payment_verified"
  | "payment_rejected"
  | "payment_deadline"
  | "blacklist_active"
  | "transaction_created"
  | "admin_payment_proof_uploaded"
  | "admin_bid_submitted"
  | "admin_vickrey_result"
  | "admin_payment_overdue"
  | "superadmin_policy_alert";

export type NotificationEntityType =
  | "transaction"
  | "pemasaran"
  | "blacklist"
  | "barang"
  | "superadmin_account";

export type NotificationInput = {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  entityType?: NotificationEntityType;
  entityId?: string;
  actionHref?: string;
  createdAt?: Date;
  metadata?: Record<string, unknown>;
};

export type NotificationListOptions = {
  unreadOnly?: boolean;
  limit?: number;
};

type NotificationRow = typeof notifications.$inferSelect;

const LEGACY_BUYER_NOTIFICATION_PATTERNS = [
  "review insiden",
  "pengajuan review insiden",
  "permohonan anda sudah masuk antrean review",
  "pembatasan untuk insiden ini"
];

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

function canonicalBlacklistEntityId(userId: string) {
  return `blacklist-${userId}`;
}

function isLegacyBuyerNotification(row: NotificationRow) {
  const haystack = `${row.type} ${row.title} ${row.message}`.toLowerCase();

  return (
    haystack.includes("blacklist_review") ||
    LEGACY_BUYER_NOTIFICATION_PATTERNS.some((pattern) => haystack.includes(pattern))
  );
}

function isStaleBlacklistNotification(row: NotificationRow, userId: string) {
  return row.type === "blacklist_active" && row.entityId !== canonicalBlacklistEntityId(userId);
}

function isDisplayableNotification(row: NotificationRow, userId: string) {
  return !isLegacyBuyerNotification(row) && !isStaleBlacklistNotification(row, userId);
}

function displayableNotificationWhere(userId: string) {
  const legacyClauses = LEGACY_BUYER_NOTIFICATION_PATTERNS.flatMap((pattern) => [
    ilike(notifications.title, `%${pattern}%`),
    ilike(notifications.message, `%${pattern}%`)
  ]);
  const hiddenNotificationClause = or(
    ilike(notifications.type, "%blacklist_review%"),
    ...legacyClauses,
    and(
      eq(notifications.type, "blacklist_active"),
      or(isNull(notifications.entityId), ne(notifications.entityId, canonicalBlacklistEntityId(userId)))
    )
  );

  return and(
    eq(notifications.userId, userId),
    hiddenNotificationClause ? not(hiddenNotificationClause) : undefined
  );
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
      ...(input.createdAt ? { createdAt: input.createdAt } : {}),
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

export async function createOrRefreshNotification(input: NotificationInput, options: { markUnread?: boolean } = {}) {
  if (!input.entityId) {
    return createNotification(input);
  }

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

  if (!existing) {
    return createNotification(input);
  }

  const shouldMarkUnread = options.markUnread !== false;
  const timestampPatch = input.createdAt ? { createdAt: input.createdAt } : {};
  const unreadPatch = shouldMarkUnread
    ? {
        createdAt: input.createdAt ?? new Date(),
        isRead: false,
        readAt: null
      }
    : {};
  const [updated] = await db
    .update(notifications)
    .set({
      title: input.title,
      message: input.message,
      entityType: input.entityType ?? null,
      actionHref: input.actionHref ?? null,
      metadata: input.metadata ?? null,
      ...timestampPatch,
      ...unreadPatch
    })
    .where(eq(notifications.id, existing.id))
    .returning();

  return serializeNotification(updated ?? existing);
}

export async function listUserNotifications(userId: string, options: NotificationListOptions = {}) {
  const whereClause = options.unreadOnly
    ? and(displayableNotificationWhere(userId), eq(notifications.isRead, false))
    : displayableNotificationWhere(userId);

  const rows = await db
    .select()
    .from(notifications)
    .where(whereClause)
    .orderBy(desc(notifications.createdAt))
    .limit(normalizeLimit(options.limit));

  return rows.filter((row) => isDisplayableNotification(row, userId)).map(serializeNotification);
}

export async function getUnreadNotificationCount(userId: string) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(displayableNotificationWhere(userId), eq(notifications.isRead, false)));

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
