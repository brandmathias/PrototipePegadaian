"use client";

import * as React from "react";
import { BellOff, BellRing } from "lucide-react";

type PushState = { configured: boolean; enabled: boolean; publicKey: string | null };

function toUint8Array(value: string) {
  const padded = value.padEnd(Math.ceil(value.length / 4) * 4, "=").replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(window.atob(padded), (character) => character.charCodeAt(0));
}

export function PushNotificationControl() {
  const [state, setState] = React.useState<PushState | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    void fetch("/api/push/subscription")
      .then(async (response) => (response.ok ? ((await response.json()).data as PushState) : null))
      .then(setState)
      .catch(() => setState(null));
  }, []);

  const enable = async () => {
    if (!state?.configured || !("serviceWorker" in navigator) || !("PushManager" in window) || !state.publicKey) {
      setMessage("Notifikasi perangkat belum tersedia di browser atau server ini.");
      return;
    }
    setPending(true);
    try {
      if ((await Notification.requestPermission()) !== "granted") throw new Error("Izin notifikasi belum diberikan.");
      const registration = await navigator.serviceWorker.register("/push-service-worker.js");
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toUint8Array(state.publicKey) });
      const response = await fetch("/api/push/subscription", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription) });
      if (!response.ok) throw new Error("Subscription push tidak dapat disimpan.");
      setState({ ...state, enabled: true });
      setMessage("Notifikasi perangkat berhasil diaktifkan.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Notifikasi perangkat belum dapat diaktifkan.");
    } finally {
      setPending(false);
    }
  };

  const disable = async () => {
    setPending(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration("/push-service-worker.js");
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/subscription", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: subscription.endpoint }) });
        await subscription.unsubscribe();
      }
      if (state) setState({ ...state, enabled: false });
      setMessage("Notifikasi perangkat dinonaktifkan.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mt-2 flex items-center justify-between gap-2 border-t border-black/6 pt-2 dark:border-white/8">
      <p aria-live="polite" className="min-w-0 text-[0.63rem] leading-snug text-black/48 dark:text-slate-300/60">{message ?? "Aktifkan agar informasi penting tetap muncul saat aplikasi ditutup."}</p>
      <button className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded-full border border-black/8 bg-white px-2.5 py-1 text-[0.65rem] font-semibold text-[#0a6a49] transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#eef6f1] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/6 dark:text-emerald-100" disabled={pending || state === null} onClick={() => void (state?.enabled ? disable() : enable())} type="button">
        {state?.enabled ? <BellOff className="size-3" /> : <BellRing className="size-3" />}
        {pending ? "Memproses" : state?.enabled ? "Nonaktifkan perangkat" : "Aktifkan notifikasi perangkat"}
      </button>
    </div>
  );
}
