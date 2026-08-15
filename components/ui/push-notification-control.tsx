"use client";

import * as React from "react";
import { BellOff, BellRing, Check, Settings2, ShieldAlert } from "lucide-react";

type PushState = { configured: boolean; enabled: boolean; publicKey: string | null };
type PushFeedbackTone = "neutral" | "success" | "error";

type PushNotificationControlProps = {
  variant?: "compact" | "mobile";
};

const BLOCKED_PERMISSION_MESSAGE = "Notifikasi diblokir di browser ini. Buka setelan situs pada browser, izinkan Notifikasi, lalu kembali ke halaman ini.";
const UNDECIDED_PERMISSION_MESSAGE = "Izin belum disetujui. Pilih Izinkan pada prompt browser, atau buka setelan situs untuk mengaktifkannya.";
const PUSH_SERVICE_WORKER_URL = "/push-service-worker.js?v=2";

function toUint8Array(value: string) {
  const padded = value.padEnd(Math.ceil(value.length / 4) * 4, "=").replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(window.atob(padded), (character) => character.charCodeAt(0));
}

function getPermission() {
  return typeof window === "undefined" || !("Notification" in window) ? "unsupported" : Notification.permission;
}

function supportsPush() {
  return typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
}

async function registerPushServiceWorker() {
  const registration = await navigator.serviceWorker.register(PUSH_SERVICE_WORKER_URL, { updateViaCache: "none" });
  await registration.update();
  return registration;
}

export function PushServiceWorkerUpdater() {
  React.useEffect(() => {
    if (supportsPush()) {
      void registerPushServiceWorker().catch(() => undefined);
    }
  }, []);

  return null;
}

export function PushNotificationControl({ variant = "compact" }: PushNotificationControlProps) {
  const [state, setState] = React.useState<PushState | null>(null);
  const [permission, setPermission] = React.useState<NotificationPermission | "unsupported">("unsupported");
  const [message, setMessage] = React.useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = React.useState<PushFeedbackTone>("neutral");
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    setPermission(getPermission());
    if (supportsPush()) {
      void registerPushServiceWorker().catch(() => undefined);
    }
    void fetch("/api/push/subscription")
      .then(async (response) => (response.ok ? ((await response.json()).data as PushState) : null))
      .then((nextState) => {
        if (nextState) {
          setState(nextState);
          return;
        }
        setState({ configured: false, enabled: false, publicKey: null });
        setFeedbackTone("error");
        setMessage("Pengaturan notifikasi belum dapat dimuat. Muat ulang halaman, lalu coba kembali.");
      })
      .catch(() => {
        setState({ configured: false, enabled: false, publicKey: null });
        setFeedbackTone("error");
        setMessage("Pengaturan notifikasi belum dapat dimuat. Muat ulang halaman, lalu coba kembali.");
      });
  }, []);

  const enable = async () => {
    if (!state?.configured || !state.publicKey || !supportsPush()) {
      setFeedbackTone("error");
      setMessage("Notifikasi perangkat belum tersedia di browser atau server ini.");
      return;
    }

    if (permission === "denied") {
      setFeedbackTone("error");
      setMessage(BLOCKED_PERMISSION_MESSAGE);
      return;
    }

    setPending(true);
    try {
      const nextPermission = await Notification.requestPermission();
      setPermission(nextPermission);

      if (nextPermission !== "granted") {
        setFeedbackTone("error");
        setMessage(nextPermission === "denied" ? BLOCKED_PERMISSION_MESSAGE : UNDECIDED_PERMISSION_MESSAGE);
        return;
      }

      const registration = await registerPushServiceWorker();
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toUint8Array(state.publicKey) }));
      const response = await fetch("/api/push/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription)
      });
      if (!response.ok) throw new Error("Subscription push tidak dapat disimpan.");

      setState({ ...state, enabled: true });
      setFeedbackTone("success");
      setMessage("Notifikasi perangkat aktif di perangkat ini.");
    } catch (error) {
      setFeedbackTone("error");
      setMessage(error instanceof Error ? error.message : "Notifikasi perangkat belum dapat diaktifkan. Coba lagi.");
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
        await fetch("/api/push/subscription", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });
        await subscription.unsubscribe();
      }
      if (state) setState({ ...state, enabled: false });
      setFeedbackTone("neutral");
      setMessage("Notifikasi perangkat dinonaktifkan.");
    } catch {
      setFeedbackTone("error");
      setMessage("Perangkat belum dapat dinonaktifkan. Coba lagi.");
    } finally {
      setPending(false);
    }
  };

  const isEnabled = Boolean(state?.enabled);
  const isBlocked = permission === "denied";
  const statusLabel = isEnabled ? "Aktif di perangkat ini" : isBlocked ? "Izin diblokir" : state ? "Belum aktif" : "Memeriksa perangkat";
  const statusClass = isEnabled
    ? "bg-emerald-50 text-emerald-800 ring-emerald-700/12"
    : isBlocked || feedbackTone === "error"
      ? "bg-rose-50 text-rose-800 ring-rose-700/12"
      : "bg-amber-50 text-amber-800 ring-amber-700/12";
  const buttonLabel = pending
    ? "Memproses"
    : isEnabled
      ? "Nonaktifkan perangkat"
      : isBlocked
        ? "Lihat cara mengaktifkan"
        : "Aktifkan notifikasi perangkat";
  const statusMessage =
    message ??
    (isEnabled
      ? "Perangkat ini akan menerima pembaruan penting, termasuk saat aplikasi ditutup."
      : "Terima pembaruan lelang dan pembayaran penting, termasuk saat aplikasi ditutup.");

  const handleClick = () => void (isEnabled ? disable() : enable());

  if (variant === "mobile") {
    const MobileIcon = isEnabled ? Check : isBlocked || feedbackTone === "error" ? ShieldAlert : BellRing;

    return (
      <section aria-label="Notifikasi perangkat" className="rounded-[1.75rem] bg-[#dcece3] p-1 shadow-[0_20px_48px_-34px_rgba(8,69,50,0.46)] sm:hidden" data-testid="buyer-mobile-push-panel">
        <div className="rounded-[1.48rem] bg-white px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)]">
          <div className="flex items-start gap-3.5">
            <span className="grid size-11 shrink-0 place-items-center rounded-[1rem] bg-[#e9f6ee] text-[#08704b] ring-1 ring-[#08704b]/10">
              <MobileIcon className="size-5" strokeWidth={1.65} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                <h2 className="font-headline text-[1.08rem] font-black tracking-tight text-[#123126]">Notifikasi perangkat</h2>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[0.66rem] font-bold ring-1 ${statusClass}`}>{statusLabel}</span>
              </div>
              <p aria-live="polite" className="mt-2 text-[0.84rem] font-medium leading-5 text-[#5b6c64]">{statusMessage}</p>
            </div>
          </div>

          <button aria-label={buttonLabel} className="group mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#08704b] px-5 text-sm font-black text-white shadow-[0_14px_26px_-18px_rgba(8,112,75,0.72)] transition-[transform,background-color,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#075d3f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#08704b]/20 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-55" disabled={pending || state === null} onClick={handleClick} type="button">
            <span className="grid size-6 place-items-center rounded-full bg-white/14 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-0.5">
              {isEnabled ? <BellOff className="size-3.5" strokeWidth={1.8} /> : <Settings2 className="size-3.5" strokeWidth={1.8} />}
            </span>
            {pending ? "Memproses" : isEnabled ? "Nonaktifkan notifikasi" : isBlocked ? "Lihat cara mengaktifkan" : "Aktifkan notifikasi"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="mt-2 flex items-center justify-between gap-2 border-t border-black/6 pt-2 dark:border-white/8">
      <p aria-live="polite" className="min-w-0 text-[0.63rem] leading-snug text-black/48 dark:text-slate-300/60">{statusMessage}</p>
      <button aria-label={buttonLabel} className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full border border-black/8 bg-white px-2.5 py-1 text-[0.65rem] font-semibold text-[#0a6a49] transition-[transform,background-color,box-shadow] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#eef6f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a6a49]/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/6 dark:text-emerald-100" disabled={pending || state === null} onClick={handleClick} type="button">
        {isEnabled ? <BellOff className="size-3" strokeWidth={1.7} /> : <BellRing className="size-3" strokeWidth={1.7} />}
        {buttonLabel}
      </button>
    </div>
  );
}
