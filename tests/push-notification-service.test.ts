import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  onConflictDoUpdate: vi.fn(),
  values: vi.fn(),
  insert: vi.fn(),
  setVapidDetails: vi.fn(),
  sendNotification: vi.fn()
}));

vi.mock("@/lib/db/client", () => ({
  db: {
    insert: mocks.insert
  }
}));

vi.mock("web-push", () => ({
  default: {
    setVapidDetails: mocks.setVapidDetails,
    sendNotification: mocks.sendNotification
  }
}));

import {
  buildPushPayload,
  getPushConfiguration,
  normalizePushSubscription,
  processPendingPushDeliveries,
  queuePushDelivery,
  sendPushNotification
} from "@/lib/services/push-notification.service";

const environment = { ...process.env };

afterEach(() => {
  process.env = { ...environment };
});

describe("push notification service", () => {
  afterEach(() => {
    mocks.onConflictDoUpdate.mockReset();
    mocks.values.mockReset();
    mocks.insert.mockReset();
  });

  it("accepts a secure browser subscription and retains only the required fields", () => {
    expect(
      normalizePushSubscription({
        endpoint: "https://fcm.googleapis.com/fcm/send/subscription-1",
        expirationTime: null,
        keys: {
          p256dh: "browser-public-key",
          auth: "browser-auth-key"
        }
      })
    ).toEqual({
      endpoint: "https://fcm.googleapis.com/fcm/send/subscription-1",
      p256dh: "browser-public-key",
      auth: "browser-auth-key"
    });
  });

  it("rejects an insecure or incomplete browser subscription", () => {
    expect(() => normalizePushSubscription({ endpoint: "http://example.test", keys: { p256dh: "key", auth: "auth" } })).toThrow(
      "Endpoint push harus menggunakan HTTPS."
    );
    expect(() => normalizePushSubscription({ endpoint: "https://example.test", keys: { p256dh: "", auth: "auth" } })).toThrow(
      "Kunci subscription push tidak lengkap."
    );
  });

  it("uses a safe internal notification destination in the push payload", () => {
    expect(
      buildPushPayload({
        title: "Pembayaran diverifikasi",
        message: "Buka transaksi untuk melihat detail.",
        type: "payment_verified",
        actionHref: "https://malicious.example"
      })
    ).toEqual({
      title: "Pembayaran diverifikasi",
      body: "Buka transaksi untuk melihat detail.",
      type: "payment_verified",
      href: "/notifikasi"
    });
  });

  it("requires complete VAPID configuration before delivery is enabled", () => {
    delete process.env.VAPID_SUBJECT;
    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;

    expect(getPushConfiguration()).toBeNull();

    process.env.VAPID_SUBJECT = "mailto:admin@example.test";
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "public-key";
    process.env.VAPID_PRIVATE_KEY = "private-key";

    expect(getPushConfiguration()).toEqual({
      subject: "mailto:admin@example.test",
      publicKey: "public-key",
      privateKey: "private-key"
    });
  });

  it("queues delivery locally without waiting for a push gateway", async () => {
    mocks.onConflictDoUpdate.mockResolvedValue(undefined);
    mocks.values.mockReturnValue({ onConflictDoUpdate: mocks.onConflictDoUpdate });
    mocks.insert.mockReturnValue({ values: mocks.values });

    await queuePushDelivery({
      id: "notification-1",
      userId: "buyer-1",
      title: "Pembayaran diverifikasi",
      message: "Buka transaksi untuk melihat detail.",
      type: "payment_verified",
      actionHref: "/transaksi/trx-1"
    });

    expect(mocks.onConflictDoUpdate).toHaveBeenCalledOnce();
  });

  it("does not query or deliver queued items until VAPID is configured", async () => {
    delete process.env.VAPID_SUBJECT;
    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;

    await expect(processPendingPushDeliveries()).resolves.toEqual({
      processed: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      removedSubscriptions: 0
    });
  });

  it("sends a confirmation push to the newly subscribed device", async () => {
    process.env.VAPID_SUBJECT = "mailto:admin@example.test";
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "public-key";
    process.env.VAPID_PRIVATE_KEY = "private-key";
    mocks.sendNotification.mockResolvedValue(undefined);

    await sendPushNotification(
      { endpoint: "https://fcm.googleapis.com/fcm/send/subscription-1", p256dh: "browser-public-key", auth: "browser-auth-key" },
      {
        title: "Notifikasi perangkat aktif",
        message: "Perangkat ini siap menerima informasi penting.",
        type: "push_subscription_confirmed",
        actionHref: "/notifikasi"
      }
    );

    expect(mocks.setVapidDetails).toHaveBeenCalledWith("mailto:admin@example.test", "public-key", "private-key");
    expect(mocks.sendNotification).toHaveBeenCalledWith(
      {
        endpoint: "https://fcm.googleapis.com/fcm/send/subscription-1",
        keys: { p256dh: "browser-public-key", auth: "browser-auth-key" }
      },
      JSON.stringify({
        title: "Notifikasi perangkat aktif",
        body: "Perangkat ini siap menerima informasi penting.",
        type: "push_subscription_confirmed",
        href: "/notifikasi"
      }),
      { TTL: 60 * 60 }
    );
  });
});
