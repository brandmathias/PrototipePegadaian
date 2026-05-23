"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Ban,
  BadgeCheck,
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock3,
  Info,
  Trophy
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { useBuyerNotifications, type BuyerNotification } from "@/components/ui/use-buyer-notifications";

type AlertCenterProps = {
  scope: "buyer" | "admin-unit" | "superadmin";
  className?: string;
};

function formatTimeLabel(timestamp: number | string) {
  const value = typeof timestamp === "number" ? timestamp : new Date(timestamp).getTime();

  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(value);
}

function getPersistedVariant(type: string) {
  if (type === "payment_rejected" || type === "blacklist_active") {
    return "error" as const;
  }

  if (type === "payment_deadline") {
    return "info" as const;
  }

  return "success" as const;
}

function getNotificationIcon(type: string, variant: "success" | "error" | "info") {
  if (type === "vickrey_win") {
    return Trophy;
  }

  if (type === "payment_verified") {
    return BadgeCheck;
  }

  if (type === "payment_rejected") {
    return AlertTriangle;
  }

  if (type === "payment_deadline") {
    return Clock3;
  }

  if (type === "blacklist_active") {
    return Ban;
  }

  if (variant === "success") {
    return CheckCircle2;
  }

  if (variant === "error") {
    return AlertTriangle;
  }

  return Info;
}

export function AlertCenter({ scope, className }: AlertCenterProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const { notifications, markAllAsRead, markAsRead } = useToast();
  const buyerNotifications = useBuyerNotifications(scope === "buyer");

  const scopedNotifications = React.useMemo(
    () =>
      notifications.filter(
        (notification) =>
          notification.scope === scope || notification.scope === "global"
      ),
    [notifications, scope]
  );

  const persistedNotifications = React.useMemo(
    () =>
      scope === "buyer"
        ? buyerNotifications.notifications.map((notification) => ({
            id: notification.id,
            title: notification.title,
            description: notification.message,
            variant: getPersistedVariant(notification.type),
            createdAt: notification.createdAt,
            read: notification.isRead,
            href: notification.actionHref ?? undefined,
            type: notification.type,
            source: "server" as const,
            raw: notification
          }))
        : [],
    [buyerNotifications.notifications, scope]
  );
  const localNotifications = React.useMemo(
    () =>
      scopedNotifications.map((notification) => ({
        id: notification.id,
        title: notification.title,
        description: notification.description,
        variant: notification.variant,
        createdAt: notification.createdAt,
        read: notification.read,
        href: undefined,
        type: `local_${notification.variant}`,
        source: "local" as const,
        raw: null as BuyerNotification | null
      })),
    [scopedNotifications]
  );
  const displayedNotifications = React.useMemo(
    () =>
      [...persistedNotifications, ...localNotifications]
        .sort((left, right) => {
          const leftTime = typeof left.createdAt === "number" ? left.createdAt : new Date(left.createdAt).getTime();
          const rightTime = typeof right.createdAt === "number" ? right.createdAt : new Date(right.createdAt).getTime();

          return rightTime - leftTime;
        })
        .slice(0, 12),
    [localNotifications, persistedNotifications]
  );
  const unreadCount = React.useMemo(
    () => displayedNotifications.filter((notification) => !notification.read).length,
    [displayedNotifications]
  );
  const copy = React.useMemo(() => {
    if (scope === "buyer") {
      return {
        label: "Pusat Notifikasi Pembeli",
        title: "Notifikasi penting",
        description: "Ringkasan penting dari lelang, pembayaran, dan pembatasan akun tersimpan di sini.",
        emptyTitle: "Belum ada notifikasi penting.",
        emptyDescription: "Notifikasi akan muncul saat ada hasil lelang, perubahan pembayaran, deadline, atau pembatasan akun."
      };
    }

    return {
      label: "Pusat Notifikasi",
      title: "Notifikasi operasional",
      description: "Notifikasi hanya berisi kejadian penting yang membutuhkan perhatian antar peran.",
      emptyTitle: "Belum ada notifikasi baru.",
      emptyDescription: "Aksi rutin seperti menambah katalog atau menyimpan form tidak disimpan sebagai notifikasi."
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

  const handleMarkAllAsRead = React.useCallback(() => {
    markAllAsRead(scope);
    if (scope === "buyer") {
      void buyerNotifications.markAllAsRead();
    }
  }, [buyerNotifications, markAllAsRead, scope]);

  const handleMarkAsRead = React.useCallback(
    (notification: (typeof displayedNotifications)[number]) => {
      if (notification.source === "server") {
        void buyerNotifications.markAsRead(notification.id);
      } else {
        markAsRead(notification.id);
      }
    },
    [buyerNotifications, markAsRead]
  );

  const renderNotificationContent = React.useCallback(
    (notification: (typeof displayedNotifications)[number]) => {
      const Icon = getNotificationIcon(notification.type, notification.variant);

      return (
        <>
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
            <Icon aria-hidden="true" className="size-4" />
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
          <div className="mt-2 flex items-center justify-between gap-3 text-xs font-medium text-black/42">
            <span className="inline-flex items-center gap-2">
              <Clock3 aria-hidden="true" className="size-3.5" />
              {formatTimeLabel(notification.createdAt)}
            </span>
            {notification.href ? (
              <span className="font-semibold text-[#0a6a49]">Buka detail</span>
            ) : null}
          </div>
        </div>
        </>
      );
    },
    []
  );

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
                onClick={handleMarkAllAsRead}
                type="button"
              >
                <CheckCheck className="size-4" />
                Tandai dibaca
              </button>
            </div>
          </div>

          <div className="max-h-[26rem] overflow-y-auto px-3 py-3">
            {displayedNotifications.length ? (
              <div className="space-y-2">
                {displayedNotifications.map((notification, index) => {
                  const className = cn(
                    "group interactive-card flex w-full items-start gap-3 rounded-[1.25rem] border px-4 py-3 text-left transition-[transform,border-color,background-color,box-shadow] duration-200",
                    notification.read
                      ? "border-black/6 bg-white/70"
                      : "border-[#9fd1bc] bg-[#f3fbf6] shadow-[0_8px_22px_rgba(8,90,65,0.08)]"
                  );

                  if (notification.href) {
                    return (
                      <Link
                        className={className}
                        href={notification.href}
                        key={notification.id}
                        onClick={() => handleMarkAsRead(notification)}
                        style={{ animationDelay: `${index * 40}ms` }}
                      >
                        {renderNotificationContent(notification)}
                      </Link>
                    );
                  }

                  return (
                    <button
                      className={className}
                      key={notification.id}
                      onClick={() => handleMarkAsRead(notification)}
                      style={{ animationDelay: `${index * 40}ms` }}
                      type="button"
                    >
                      {renderNotificationContent(notification)}
                    </button>
                  );
                })}
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
