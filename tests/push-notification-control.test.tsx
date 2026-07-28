import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PushNotificationControl } from "@/components/ui/push-notification-control";

const pushState = { configured: true, enabled: false, publicKey: "BElp_2hBqqkSGGkRrnZbJ1Qj7pQfPAAqR4mJjK2Y0aY" };

function renderControlWithPermission(permission: NotificationPermission, nextPermission = permission) {
  const requestPermission = vi.fn().mockResolvedValue(nextPermission);

  vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response(JSON.stringify({ data: pushState }), { status: 200 }))));
  vi.stubGlobal("Notification", { permission, requestPermission });
  vi.stubGlobal("PushManager", class PushManager {});
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: { register: vi.fn(), getRegistration: vi.fn() }
  });

  render(<PushNotificationControl />);
  return { requestPermission };
}

describe("PushNotificationControl", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("explains how to recover when the browser has blocked notification permission", async () => {
    const { requestPermission } = renderControlWithPermission("denied");
    const user = userEvent.setup();

    const button = await screen.findByRole("button", { name: /lihat cara mengaktifkan/i });
    await waitFor(() => expect(button).toBeEnabled());
    await user.click(button);

    expect(requestPermission).not.toHaveBeenCalled();
    expect(screen.getByText(/notifikasi diblokir di browser ini/i)).toBeInTheDocument();
    expect(screen.getByText(/buka setelan situs/i)).toBeInTheDocument();
  });

  it("registers the current device after the browser grants notification permission", async () => {
    const subscription = { endpoint: "https://fcm.googleapis.com/fcm/send/device-1", toJSON: () => ({ endpoint: "https://fcm.googleapis.com/fcm/send/device-1" }) };
    const pushManager = { getSubscription: vi.fn().mockResolvedValue(null), subscribe: vi.fn().mockResolvedValue(subscription) };
    const update = vi.fn().mockResolvedValue(undefined);
    const register = vi.fn().mockResolvedValue({ pushManager, update });
    const requestPermission = vi.fn().mockResolvedValue("granted");
    const fetchMock = vi.fn((_: RequestInfo | URL, init?: RequestInit) =>
      Promise.resolve(
        new Response(
          JSON.stringify({ data: init?.method === "POST" ? { enabled: true } : pushState }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("Notification", { permission: "default", requestPermission });
    vi.stubGlobal("PushManager", class PushManager {});
    Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: { register, getRegistration: vi.fn() } });

    const user = userEvent.setup();
    render(<PushNotificationControl />);
    const button = await screen.findByRole("button", { name: /aktifkan notifikasi perangkat/i });
    await waitFor(() => expect(button).toBeEnabled());
    await user.click(button);

    expect(await screen.findByText(/notifikasi perangkat aktif di perangkat ini/i)).toBeInTheDocument();
    expect(requestPermission).toHaveBeenCalledOnce();
    expect(register).toHaveBeenCalledWith("/push-service-worker.js?v=2", { updateViaCache: "none" });
    expect(pushManager.subscribe).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/push/subscription",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("updates the worker for an already subscribed device when the control mounts", async () => {
    const update = vi.fn().mockResolvedValue(undefined);
    const register = vi.fn().mockResolvedValue({ update });
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response(JSON.stringify({ data: { ...pushState, enabled: true } }), { status: 200 }))));
    vi.stubGlobal("Notification", { permission: "granted", requestPermission: vi.fn() });
    vi.stubGlobal("PushManager", class PushManager {});
    Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: { register, getRegistration: vi.fn() } });

    render(<PushNotificationControl />);

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith("/push-service-worker.js?v=2", { updateViaCache: "none" });
      expect(update).toHaveBeenCalledOnce();
    });
  });
});
