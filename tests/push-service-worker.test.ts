import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";

import sharp from "sharp";
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
  it("uses a transparent compact badge mask instead of an opaque square", async () => {
    const { data, info } = await sharp("public/brand/ruang-agunan-badge-v2.png")
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const alphaAt = (x: number, y: number) => data[(y * info.width + x) * 4 + 3];

    expect(alphaAt(0, 0)).toBe(0);
    expect(alphaAt(Math.floor(info.width / 2), Math.floor(info.height / 2))).toBeGreaterThan(0);
  });

  it.each([
    "payment_rejected",
    "payment_verified",
    "vickrey_win",
    "vickrey_loss",
    "admin_payment_proof_uploaded",
    "admin_vickrey_result",
    "unknown"
  ])("keeps the Ruang Agunan badge in the Android status bar for %s", async (type) => {
    const showNotification = await receivePush(type);

    expect(showNotification).toHaveBeenCalledWith(
      "Notifikasi",
      expect.objectContaining({
        actions: [{ action: "open_detail", title: "Lihat detail" }],
        badge: "/brand/ruang-agunan-badge-v2.png",
        icon: "/brand/push-icon-transparent.png"
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
