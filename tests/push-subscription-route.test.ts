import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuthenticatedApiSession: vi.fn(),
  getPushConfiguration: vi.fn(),
  hasPushSubscription: vi.fn(),
  normalizePushSubscription: vi.fn(),
  removePushSubscription: vi.fn(),
  savePushSubscription: vi.fn(),
  sendPushNotification: vi.fn()
}));

vi.mock("@/lib/auth/session", () => ({
  requireAuthenticatedApiSession: mocks.requireAuthenticatedApiSession
}));

vi.mock("@/lib/services/push-notification.service", () => ({
  getPushConfiguration: mocks.getPushConfiguration,
  hasPushSubscription: mocks.hasPushSubscription,
  normalizePushSubscription: mocks.normalizePushSubscription,
  removePushSubscription: mocks.removePushSubscription,
  savePushSubscription: mocks.savePushSubscription,
  sendPushNotification: mocks.sendPushNotification
}));

function jsonRequest(body: unknown, method = "POST") {
  return new Request("https://ruang-agunan.test/api/push/subscription", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

describe("push subscription route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuthenticatedApiSession.mockResolvedValue({ ok: true, userId: "buyer-1" });
    mocks.getPushConfiguration.mockReturnValue({ publicKey: "public-vapid-key" });
    mocks.hasPushSubscription.mockResolvedValue(false);
    mocks.sendPushNotification.mockResolvedValue(undefined);
    mocks.normalizePushSubscription.mockImplementation((input) => {
      if (input.endpoint?.startsWith("http://")) throw new Error("Endpoint push harus menggunakan HTTPS.");
      return {
        endpoint: input.endpoint,
        p256dh: input.keys?.p256dh,
        auth: input.keys?.auth
      };
    });
  });

  it("stores a valid subscription for the session user instead of any body user id", async () => {
    const { POST } = await import("@/app/api/push/subscription/route");
    const response = await POST(
      jsonRequest({
        userId: "superadmin-1",
        endpoint: "https://fcm.googleapis.com/fcm/send/subscription-1",
        keys: { p256dh: "browser-public-key", auth: "browser-auth-key" }
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ data: { enabled: true } });
    expect(mocks.savePushSubscription).toHaveBeenCalledWith("buyer-1", {
      endpoint: "https://fcm.googleapis.com/fcm/send/subscription-1",
      p256dh: "browser-public-key",
      auth: "browser-auth-key",
      userAgent: null
    });
    expect(mocks.sendPushNotification).toHaveBeenCalledWith(
      {
        endpoint: "https://fcm.googleapis.com/fcm/send/subscription-1",
        p256dh: "browser-public-key",
        auth: "browser-auth-key"
      },
      {
        title: "Notifikasi perangkat aktif",
        message: "Perangkat ini siap menerima informasi penting dari Ruang Agunan.",
        type: "push_subscription_confirmed",
        actionHref: "/notifikasi"
      }
    );
  });

  it("rejects malformed subscriptions before storing them", async () => {
    const { POST } = await import("@/app/api/push/subscription/route");
    const response = await POST(jsonRequest({ endpoint: "http://example.test", keys: { p256dh: "key", auth: "auth" } }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ message: "Endpoint push harus menggunakan HTTPS." });
    expect(mocks.savePushSubscription).not.toHaveBeenCalled();
  });

  it("reports configuration and subscription state only for the current session", async () => {
    mocks.hasPushSubscription.mockResolvedValue(true);
    const { GET } = await import("@/app/api/push/subscription/route");
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: { configured: true, enabled: true, publicKey: "public-vapid-key" }
    });
    expect(mocks.hasPushSubscription).toHaveBeenCalledWith("buyer-1");
  });

  it("rejects requests without an authenticated session", async () => {
    mocks.requireAuthenticatedApiSession.mockResolvedValue({
      ok: false,
      status: 401,
      message: "Silakan masuk terlebih dahulu."
    });
    const { DELETE } = await import("@/app/api/push/subscription/route");
    const response = await DELETE(jsonRequest({ endpoint: "https://fcm.googleapis.com/fcm/send/subscription-1" }, "DELETE"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ message: "Silakan masuk terlebih dahulu." });
    expect(mocks.removePushSubscription).not.toHaveBeenCalled();
  });
});
