import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";

import { describe, expect, it, vi } from "vitest";

type PushHandler = (event: {
  data: { json: () => unknown } | null;
  waitUntil: (promise: Promise<unknown>) => void;
}) => void;

async function receivePush(type: string) {
  const listeners: Record<string, unknown> = {};
  const showNotification = vi.fn().mockResolvedValue(undefined);
  const source = await readFile("public/push-service-worker.js", "utf8");

  runInNewContext(source, {
    URL,
    self: {
      addEventListener: (name: string, handler: unknown) => {
        listeners[name] = handler;
      },
      registration: { showNotification },
      location: { origin: "https://app.example.test" }
    }
  });

  const waitUntil = vi.fn();
  (listeners.push as PushHandler)({
    data: { json: () => ({ title: "Notifikasi", body: "Isi", type, href: "/notifikasi" }) },
    waitUntil
  });

  await waitUntil.mock.calls[0][0];
  return showNotification;
}

describe("push service worker", () => {
  it.each([
    ["payment_rejected", "/brand/push-badges/alert.png"],
    ["blacklist_active", "/brand/push-badges/blacklist.png"],
    ["superadmin_policy_alert", "/brand/push-badges/alert.png"],
    ["payment_verified", "/brand/push-badges/verified.png"],
    ["handover_proof_uploaded", "/brand/push-badges/success.png"],
    ["transaction_created", "/brand/push-badges/success.png"],
    ["push_subscription_confirmed", "/brand/push-badges/success.png"],
    ["payment_deadline", "/brand/push-badges/deadline.png"],
    ["vickrey_win", "/brand/push-badges/winner.png"],
    ["vickrey_loss", "/brand/push-badges/loss.png"],
    ["admin_payment_proof_uploaded", "/brand/push-badges/payment.png"],
    ["admin_bid_submitted", "/brand/push-badges/bid.png"],
    ["admin_vickrey_result", "/brand/push-badges/result.png"],
    ["admin_payment_overdue", "/brand/push-badges/alert.png"],
    ["unknown", "/brand/push-badges/info.png"]
  ])("uses the matching Android badge and detail action for %s", async (type, badge) => {
    const showNotification = await receivePush(type);

    expect(showNotification).toHaveBeenCalledWith(
      "Notifikasi",
      expect.objectContaining({
        actions: [{ action: "open_detail", title: "Lihat detail" }],
        badge,
        icon: "/brand/ruang-agunan-icon.png"
      })
    );
  });

  it("activates a newly deployed worker without waiting for old pages to close", async () => {
    const listeners: Record<string, (event: { waitUntil: (promise: Promise<unknown>) => void }) => void> = {};
    const skipWaiting = vi.fn().mockResolvedValue(undefined);
    const claim = vi.fn().mockResolvedValue(undefined);
    const source = await readFile("public/push-service-worker.js", "utf8");

    runInNewContext(source, {
      URL,
      self: {
        addEventListener: (name: string, handler: (event: { waitUntil: (promise: Promise<unknown>) => void }) => void) => {
          listeners[name] = handler;
        },
        clients: { claim },
        location: { origin: "https://app.example.test" },
        registration: { showNotification: vi.fn() },
        skipWaiting
      }
    });

    const installWaitUntil = vi.fn();
    listeners.install?.({ waitUntil: installWaitUntil });
    await installWaitUntil.mock.calls[0]?.[0];

    const activateWaitUntil = vi.fn();
    listeners.activate?.({ waitUntil: activateWaitUntil });
    await activateWaitUntil.mock.calls[0]?.[0];

    expect(skipWaiting).toHaveBeenCalledOnce();
    expect(claim).toHaveBeenCalledOnce();
  });
});
