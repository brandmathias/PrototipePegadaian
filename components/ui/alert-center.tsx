"use client";

import * as React from "react";
import { Bell, CheckCheck, Clock3, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

type AlertCenterProps = {
  scope: "buyer" | "admin-unit" | "superadmin";
  className?: string;
};

function formatTimeLabel(timestamp: number) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(timestamp);
}

export function AlertCenter({ scope, className }: AlertCenterProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const { notifications, markAllAsRead, markAsRead } = useToast();

  const scopedNotifications = React.useMemo(
    () =>
      notifications.filter(
        (notification) =>
          notification.scope === scope || notification.scope === "global"
      ),
    [notifications, scope]
  );

  const unreadCount = React.useMemo(
    () => scopedNotifications.filter((notification) => !notification.read).length,
    [scopedNotifications]
  );
  const copy = React.useMemo(() => {
    if (scope === "buyer") {
      return {
        label: "Pusat Alert Pembeli",
        title: "Aktivitas akun terbaru",
        description: "Ringkasan transaksi, bid, pembayaran, dan profil tersimpan di sini.",
        emptyTitle: "Belum ada alert akun.",
        emptyDescription: "Setelah Anda membeli, bid, atau memperbarui profil, respon sistem akan muncul di sini."
      };
    }

    return {
      label: "Pusat Alert",
      title: "Respons sistem terbaru",
      description: "Semua notifikasi penting dari aksi admin unit tersimpan di sini.",
      emptyTitle: "Belum ada alert baru.",
      emptyDescription: "Saat admin memproses aksi, ringkasan respon sistem akan muncul di sini."
    };
  }, [scope]);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  React.useEffect(() => {
    if (isOpen && unreadCount > 0) {
      markAllAsRead(scope);
    }
  }, [isOpen, unreadCount, markAllAsRead, scope]);

  return (
    <div className={cn("relative", className)} ref={panelRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="Buka pusat alert"
        className="interactive-tap relative inline-flex size-12 items-center justify-center rounded-2xl border border-black/10 bg-white text-[#085a41] shadow-sm transition-[transform,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-[#eef6f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7a57]"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <Bell aria-hidden="true" className="size-5" />
        {unreadCount > 0 ? (
          <span className="absolute right-2 top-2 inline-flex min-w-5 items-center justify-center rounded-full bg-[#0f7a57] px-1.5 py-0.5 text-[0.68rem] font-bold leading-none text-white shadow-sm">
            {Math.min(unreadCount, 9)}{unreadCount > 9 ? "+" : ""}
          </span>
        ) : null}
        {unreadCount > 0 ? (
          <span className="status-pulse absolute right-1.5 top-1.5 size-3 rounded-full bg-[#0f7a57]/35" />
        ) : null}
      </button>

      {isOpen ? (
        <div
          className="feedback-pop absolute right-0 top-[calc(100%+0.85rem)] z-[90] w-[min(28rem,calc(100vw-2rem))] overflow-hidden rounded-[1.6rem] border border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,247,244,0.98))] shadow-[0_24px_60px_rgba(15,23,42,0.16)] backdrop-blur-xl"
          role="dialog"
        >
          <div className="border-b border-black/6 px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[#0a6a49]/58">
                  {copy.label}
                </p>
                <h3 className="mt-2 font-headline text-[1.45rem] font-black text-[#085a41]">
                  {copy.title}
                </h3>
                <p className="mt-1 text-sm leading-6 text-black/58">
                  {copy.description}
                </p>
              </div>
              <button
                className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white px-3 py-2 text-xs font-semibold text-[#0a6a49] transition-colors hover:bg-[#eef6f1]"
                onClick={() => markAllAsRead(scope)}
                type="button"
              >
                <CheckCheck className="size-4" />
                Tandai dibaca
              </button>
            </div>
          </div>

          <div className="max-h-[26rem] overflow-y-auto px-3 py-3">
            {scopedNotifications.length ? (
              <div className="space-y-2">
                {scopedNotifications.map((notification, index) => (
                  <button
                    className={cn(
                      "group interactive-card flex w-full items-start gap-3 rounded-[1.25rem] border px-4 py-3 text-left transition-[transform,border-color,background-color,box-shadow] duration-200",
                      notification.read
                        ? "border-black/6 bg-white/70"
                        : "border-[#9fd1bc] bg-[#f3fbf6] shadow-[0_8px_22px_rgba(8,90,65,0.08)]"
                    )}
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    style={{ animationDelay: `${index * 40}ms` }}
                    type="button"
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl",
                        notification.variant === "success"
                          ? "bg-primary/12 text-primary"
                          : notification.variant === "error"
                            ? "bg-destructive/12 text-destructive"
                            : "bg-accent/20 text-accent-foreground"
                      )}
                    >
                      <Sparkles aria-hidden="true" className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-black/82">
                          {notification.title}
                        </p>
                        {!notification.read ? (
                          <span className="mt-1 size-2 rounded-full bg-[#0f7a57]" />
                        ) : null}
                      </div>
                      {notification.description ? (
                        <p className="mt-1 text-sm leading-6 text-black/58">
                          {notification.description}
                        </p>
                      ) : null}
                      <div className="mt-2 flex items-center gap-2 text-xs font-medium text-black/42">
                        <Clock3 aria-hidden="true" className="size-3.5" />
                        {formatTimeLabel(notification.createdAt)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-[1.25rem] border border-dashed border-black/10 bg-white/70 px-5 py-8 text-center">
                <p className="text-sm font-semibold text-black/72">{copy.emptyTitle}</p>
                <p className="mt-1 text-sm leading-6 text-black/52">
                  {copy.emptyDescription}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
