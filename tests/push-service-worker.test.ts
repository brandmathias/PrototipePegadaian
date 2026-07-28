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
    ["payment_rejected", "/brand/push-icons/alert.png"],
    ["blacklist_active", "/brand/push-icons/alert.png"],
    ["superadmin_policy_alert", "/brand/push-icons/alert.png"],
    ["payment_verified", "/brand/push-icons/success.png"],
    ["handover_proof_uploaded", "/brand/push-icons/success.png"],
    ["transaction_created", "/brand/push-icons/success.png"],
    ["push_subscription_confirmed", "/brand/push-icons/success.png"],
    ["payment_deadline", "/brand/push-icons/deadline.png"],
    ["vickrey_win", "/brand/push-icons/winner.png"],
    ["vickrey_loss", "/brand/push-icons/loss.png"],
    ["admin_payment_proof_uploaded", "/brand/push-icons/payment.png"],
    ["admin_bid_submitted", "/brand/push-icons/bid.png"],
    ["admin_vickrey_result", "/brand/push-icons/result.png"],
    ["admin_payment_overdue", "/brand/push-icons/alert.png"],
    ["unknown", "/brand/push-icons/info.png"]
  ])("uses the matching device icon for %s", async (type, icon) => {
    const showNotification = await receivePush(type);

    expect(showNotification).toHaveBeenCalledWith(
      "Notifikasi",
      expect.objectContaining({ icon, badge: "/brand/ruang-agunan-icon.png" })
    );
  });
});
