import { randomUUID } from "node:crypto";

import { and, asc, eq } from "drizzle-orm";
import webpush from "web-push";

import { db } from "@/lib/db/client";
import { notifications, pushDeliveries, pushSubscriptions } from "@/lib/db/schema";

export type PushSubscriptionInput = {
  endpoint?: unknown;
  keys?: {
    p256dh?: unknown;
    auth?: unknown;
  };
};

export type PushPayloadInput = {
  title: string;
  message: string;
  type: string;
  actionHref?: string | null;
};

export type PushDeliveryNotification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  actionHref?: string | null;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function normalizePushSubscription(input: PushSubscriptionInput) {
  const rawEndpoint = input.endpoint;
  const p256dh = input.keys?.p256dh;
  const auth = input.keys?.auth;

  if (!isNonEmptyString(rawEndpoint)) {
    throw new Error("Endpoint push tidak valid.");
  }

  const endpoint = new URL(rawEndpoint);

  if (endpoint.protocol !== "https:") {
    throw new Error("Endpoint push harus menggunakan HTTPS.");
  }

  if (!isNonEmptyString(p256dh) || !isNonEmptyString(auth)) {
    throw new Error("Kunci subscription push tidak lengkap.");
  }

  return {
    endpoint: endpoint.toString(),
    p256dh: p256dh.trim(),
    auth: auth.trim()
  };
}

export function buildPushPayload(input: PushPayloadInput) {
  return {
    title: input.title,
    body: input.message,
    type: input.type,
    href: input.actionHref?.startsWith("/") ? input.actionHref : "/notifikasi"
  };
}

export function getPushConfiguration() {
  const subject = process.env.VAPID_SUBJECT?.trim();
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();

  if (!subject || !publicKey || !privateKey) {
    return null;
  }

  return {
    subject,
    publicKey,
    privateKey
  };
}

export async function queuePushDelivery(notification: PushDeliveryNotification) {
  const now = new Date();

  await db
    .insert(pushDeliveries)
    .values({
      id: randomUUID(),
      notificationId: notification.id,
      userId: notification.userId,
      status: "pending",
      attempts: 0,
      createdAt: now,
      updatedAt: now
    })
    .onConflictDoUpdate({
      target: pushDeliveries.notificationId,
      set: {
        status: "pending",
        attempts: 0,
        lastError: null,
        processedAt: null,
        updatedAt: now
      }
    });
}

export async function savePushSubscription(
  userId: string,
  subscription: ReturnType<typeof normalizePushSubscription> & { userAgent?: string | null }
) {
  const now = new Date();

  await db
    .insert(pushSubscriptions)
    .values({
      id: randomUUID(),
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.p256dh,
      auth: subscription.auth,
      userAgent: subscription.userAgent ?? null,
      createdAt: now,
      updatedAt: now
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        userId,
        p256dh: subscription.p256dh,
        auth: subscription.auth,
        userAgent: subscription.userAgent ?? null,
        updatedAt: now
      }
    });
}

export async function hasPushSubscription(userId: string) {
  const [subscription] = await db
    .select({ id: pushSubscriptions.id })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId))
    .limit(1);

  return Boolean(subscription);
}

export async function removePushSubscription(userId: string, endpoint: string) {
  await db.delete(pushSubscriptions).where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)));
}

export type PushDeliverySummary = {
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
  removedSubscriptions: number;
};

function pushErrorStatus(error: unknown) {
  return typeof error === "object" && error !== null && "statusCode" in error && typeof error.statusCode === "number"
    ? error.statusCode
    : null;
}

export async function processPendingPushDeliveries(limit = 20): Promise<PushDeliverySummary> {
  const summary: PushDeliverySummary = { processed: 0, sent: 0, failed: 0, skipped: 0, removedSubscriptions: 0 };
  const config = getPushConfiguration();

  if (!config) return summary;

  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
  const boundedLimit = Math.min(Math.max(Math.trunc(limit), 1), 20);
  const pending = await db
    .select({ delivery: pushDeliveries, notification: notifications })
    .from(pushDeliveries)
    .innerJoin(notifications, eq(pushDeliveries.notificationId, notifications.id))
    .where(eq(pushDeliveries.status, "pending"))
    .orderBy(asc(pushDeliveries.createdAt))
    .limit(boundedLimit);

  for (const item of pending) {
    summary.processed += 1;
    const subscriptions = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, item.delivery.userId));

    if (subscriptions.length === 0) {
      await db
        .update(pushDeliveries)
        .set({ status: "skipped", processedAt: new Date(), updatedAt: new Date() })
        .where(eq(pushDeliveries.id, item.delivery.id));
      summary.skipped += 1;
      continue;
    }

    let delivered = false;
    let lastError: string | null = null;
    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
          JSON.stringify(buildPushPayload(item.notification)),
          { TTL: 60 * 60 }
        );
        delivered = true;
      } catch (error) {
        const status = pushErrorStatus(error);
        if (status === 404 || status === 410) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, subscription.id));
          summary.removedSubscriptions += 1;
        } else {
          lastError = error instanceof Error ? error.message.slice(0, 1000) : "Pengiriman Web Push gagal.";
        }
      }
    }

    const attempts = item.delivery.attempts + 1;
    const failed = !delivered && Boolean(lastError);
    await db
      .update(pushDeliveries)
      .set({
        status: delivered ? "sent" : failed && attempts < 3 ? "pending" : failed ? "failed" : "skipped",
        attempts,
        lastError,
        processedAt: delivered || attempts >= 3 ? new Date() : null,
        updatedAt: new Date()
      })
      .where(eq(pushDeliveries.id, item.delivery.id));

    if (delivered) summary.sent += 1;
    else if (failed && attempts >= 3) summary.failed += 1;
    else if (!failed) summary.skipped += 1;
  }

  return summary;
}
