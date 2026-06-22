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

import { GavelIcon } from "@/components/buyer/auction-loser-icons";
import { APP_TIME_ZONE, APP_TIME_ZONE_LABEL } from "@/lib/timezone";
import { cn } from "@/lib/utils";
import {
  useAdminUnitNotifications,
  useBuyerNotifications,
  useSuperAdminNotifications,
  type PersistedNotification
} from "@/components/ui/use-buyer-notifications";

type AlertCenterProps = {
  scope: "buyer" | "admin-unit" | "superadmin";
  className?: string;
};

function formatNotificationDateTime(timestamp: number | string) {
  const value = typeof timestamp === "number" ? timestamp : new Date(timestamp).getTime();

  if (Number.isNaN(value)) {
    return "-";
  }

  const dateLabel = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    timeZone: APP_TIME_ZONE,
    weekday: "long",
    year: "numeric",
  }).format(value);
  const timeParts = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    timeZone: APP_TIME_ZONE,
  }).formatToParts(value);
  const hour = timeParts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = timeParts.find((part) => part.type === "minute")?.value ?? "00";

  return `${dateLabel} • ${hour}.${minute} ${APP_TIME_ZONE_LABEL}`;
}

function getPersistedVariant(type: string) {
  if (type === "payment_rejected" || type === "blacklist_active" || type === "superadmin_policy_alert") {
    return "error" as const;
  }

  if (type === "payment_deadline" || type === "vickrey_loss" || type === "admin_vickrey_result") {
    return "info" as const;
  }

  return "success" as const;
}

function getMetadataTimestamp(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const record = metadata as Record<string, unknown>;
  const timestamp = typeof record.occurredAt === "string"
    ? record.occurredAt
    : typeof record.eventAt === "string"
      ? record.eventAt
      : null;

  if (!timestamp) {
    return null;
  }

  return Number.isNaN(new Date(timestamp).getTime()) ? null : timestamp;
}

function getNotificationDisplayTimestamp(notification: PersistedNotification) {
  return getMetadataTimestamp(notification.metadata) ?? notification.createdAt;
}

function getNotificationIcon(type: string, variant: "success" | "error" | "info") {
  if (type === "vickrey_win") {
    return Trophy;
  }

  if (type === "vickrey_loss") {
    return GavelIcon;
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

  if (type === "admin_payment_proof_uploaded") {
    return BadgeCheck;
  }

  if (type === "admin_vickrey_result") {
    return GavelIcon;
  }

  if (type === "superadmin_policy_alert") {
    return AlertTriangle;
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
  const buyerNotifications = useBuyerNotifications(scope === "buyer");
  const adminUnitNotifications = useAdminUnitNotifications(scope === "admin-unit");
  const superAdminNotifications = useSuperAdminNotifications(scope === "superadmin");

  const persistedNotifications = React.useMemo(
    () => {
      const sourceNotifications =
        scope === "buyer"
          ? buyerNotifications.notifications
          : scope === "admin-unit"
            ? adminUnitNotifications.notifications
            : superAdminNotifications.notifications;

      return sourceNotifications.map((notification) => ({
        id: notification.id,
        title: notification.title,
        description: notification.message,
        variant: getPersistedVariant(notification.type),
        createdAt: getNotificationDisplayTimestamp(notification),
        read: notification.isRead,
        href: notification.actionHref ?? undefined,
        type: notification.type,
        source: "server" as const,
        raw: notification
      }));
    },
    [
      adminUnitNotifications.notifications,
      buyerNotifications.notifications,
      scope,
      superAdminNotifications.notifications
    ]
  );
  const displayedNotifications = React.useMemo(
    () =>
      persistedNotifications
        .sort((left, right) => {
          const leftTime = typeof left.createdAt === "number" ? left.createdAt : new Date(left.createdAt).getTime();
          const rightTime = typeof right.createdAt === "number" ? right.createdAt : new Date(right.createdAt).getTime();

          return rightTime - leftTime;
        })
        .slice(0, 12),
    [persistedNotifications]
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

    if (scope === "superadmin") {
      return {
        label: "Pusat Alert Superadmin",
        title: "Alert kebijakan nasional",
        description: "Risiko operasional lintas unit seperti pembatasan buyer dan pelanggaran pembayaran tersimpan di sini.",
        emptyTitle: "Belum ada alert operasional.",
        emptyDescription: "Pembuatan akun dan reset password tetap menjadi toast aksi, bukan notifikasi lonceng."
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
    if (scope === "buyer") {
      void buyerNotifications.markAllAsRead();
    }
    if (scope === "admin-unit") {
      void adminUnitNotifications.markAllAsRead();
    }
    if (scope === "superadmin") {
      void superAdminNotifications.markAllAsRead();
    }
  }, [adminUnitNotifications, buyerNotifications, scope, superAdminNotifications]);

  const handleMarkAsRead = React.useCallback(
    (notification: (typeof displayedNotifications)[number]) => {
      if (scope === "buyer") {
        void buyerNotifications.markAsRead(notification.id);
      }
      if (scope === "admin-unit") {
        void adminUnitNotifications.markAsRead(notification.id);
      }
      if (scope === "superadmin") {
        void superAdminNotifications.markAsRead(notification.id);
      }
    },
    [adminUnitNotifications, buyerNotifications, scope, superAdminNotifications]
  );

  const renderNotificationContent = React.useCallback(
    (notification: (typeof displayedNotifications)[number]) => {
      const Icon = getNotificationIcon(notification.type, notification.variant);
      const isLoserNotification = notification.type === "vickrey_loss";

      return (
        <>
          <div
            className={cn(
              "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl",
              notification.variant === "success"
                ? "bg-primary/12 text-primary dark:bg-emerald-300/10 dark:text-emerald-200"
                : notification.variant === "error"
                  ? "bg-destructive/12 text-destructive dark:bg-rose-300/10 dark:text-rose-200"
                  : "bg-accent/20 text-accent-foreground dark:bg-amber-300/10 dark:text-amber-200",
              isLoserNotification
                ? "border border-[#f1d3d6] bg-[linear-gradient(180deg,rgba(255,250,250,0.98),rgba(255,239,241,0.96))] text-[#c43d48] shadow-[0_14px_28px_-22px_rgba(196,61,72,0.55)]"
                : ""
            )}
          >
            <Icon aria-hidden="true" className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className={cn("text-sm font-semibold text-black/82 dark:text-slate-100", isLoserNotification ? "text-[#3f2529] dark:text-rose-100" : "")}>
              {notification.title}
            </p>
            {!notification.read ? (
              <span className={cn("mt-1 size-2 rounded-full bg-[#0f7a57]", isLoserNotification ? "bg-[#d14f59]" : "")} />
            ) : null}
          </div>
          {notification.description ? (
            <p className={cn("mt-1 text-sm leading-6 text-black/58 dark:text-slate-300/70", isLoserNotification ? "text-[#6f5054] dark:text-rose-100/68" : "")}>
              {notification.description}
            </p>
          ) : null}
          <div className={cn("mt-2 flex items-center justify-between gap-3 text-xs font-medium text-black/42 dark:text-slate-400", isLoserNotification ? "text-[#8d6c70] dark:text-rose-100/52" : "")}>
            <span className="inline-flex items-center gap-2">
              <Clock3 aria-hidden="true" className="size-3.5" />
              {formatNotificationDateTime(notification.createdAt)}
            </span>
            {notification.href ? (
              <span className={cn("font-semibold text-[#0a6a49] dark:text-emerald-200", isLoserNotification ? "text-[#c43d48] dark:text-rose-200" : "")}>Buka detail</span>
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
        className="interactive-tap relative inline-flex size-10 items-center justify-center rounded-[1.15rem] border border-black/10 bg-white text-[#085a41] shadow-sm transition-[transform,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-[#eef6f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7a57] dark:border-emerald-200/14 dark:bg-[#102019] dark:text-emerald-100 dark:shadow-[0_18px_36px_-28px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.08)] dark:hover:bg-[#14271f] sm:size-12 sm:rounded-2xl"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <Bell aria-hidden="true" className="size-5" />
        {unreadCount > 0 ? (
          <span className="absolute right-1.5 top-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-[#0f7a57] px-1.5 py-0.5 text-[0.68rem] font-bold leading-none text-white shadow-sm sm:right-2 sm:top-2">
            {Math.min(unreadCount, 9)}{unreadCount > 9 ? "+" : ""}
          </span>
        ) : null}
        {unreadCount > 0 ? (
          <span className="status-pulse absolute right-1 top-1 size-3 rounded-full bg-[#0f7a57]/35 sm:right-1.5 sm:top-1.5" />
        ) : null}
      </button>

      {isOpen ? (
        <>
          <button
            aria-label="Tutup pusat alert"
            className="fixed inset-0 z-[85] bg-[#0c2319]/10 backdrop-blur-[2px] sm:hidden"
            onClick={() => setIsOpen(false)}
            type="button"
          />
          <div
            className="feedback-pop modal-viewport fixed inset-x-3 top-[calc(env(safe-area-inset-top)+4.75rem)] z-[90] overflow-hidden rounded-[1.25rem] border border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.985),rgba(247,247,244,0.98))] shadow-[0_24px_60px_rgba(15,23,42,0.16)] backdrop-blur-xl dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(16,26,21,0.98),rgba(9,18,14,0.98))] dark:shadow-[0_28px_70px_rgba(0,0,0,0.5)] sm:absolute sm:right-0 sm:left-auto sm:top-[calc(100%+0.85rem)] sm:w-[min(28rem,calc(100vw-1.5rem))] sm:max-w-[calc(100vw-1.5rem)] sm:rounded-[1.6rem]"
            role="dialog"
          >
          <div className="border-b border-black/6 px-5 py-4 dark:border-white/8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[#0a6a49]/58 dark:text-emerald-200/62">
                  {copy.label}
                </p>
                <h3 className="mt-2 font-headline text-[1.2rem] font-black leading-tight text-[#085a41] dark:text-emerald-100 sm:text-[1.45rem]">
                  {copy.title}
                </h3>
                <p className="mt-1 text-sm leading-6 text-black/58 dark:text-slate-300/72">
                  {copy.description}
                </p>
              </div>
              <button
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-black/8 bg-white px-3 py-2 text-xs font-semibold text-[#0a6a49] transition-colors hover:bg-[#eef6f1] dark:border-white/10 dark:bg-white/6 dark:text-emerald-100 dark:hover:bg-white/10 sm:w-auto"
                onClick={handleMarkAllAsRead}
                type="button"
              >
                <CheckCheck className="size-4" />
                Tandai dibaca
              </button>
            </div>
          </div>

          <div className="max-h-[calc(100dvh-env(safe-area-inset-top)-7rem)] overflow-y-auto overscroll-contain px-3 py-3 sm:max-h-[min(26rem,calc(100dvh-12rem))]">
            {displayedNotifications.length ? (
              <div className="space-y-2">
                {displayedNotifications.map((notification, index) => {
                  const isLoserNotification = notification.type === "vickrey_loss";
                  const className = cn(
                    "group interactive-card flex w-full items-start gap-3 rounded-[1.25rem] border px-4 py-3 text-left transition-[transform,border-color,background-color,box-shadow] duration-200",
                    notification.read
                      ? "border-black/6 bg-white/70 dark:border-white/8 dark:bg-white/[0.045]"
                      : "border-[#9fd1bc] bg-[#f3fbf6] shadow-[0_8px_22px_rgba(8,90,65,0.08)] dark:border-emerald-300/18 dark:bg-emerald-300/8 dark:shadow-[0_12px_30px_-24px_rgba(52,211,153,0.28)]",
                    isLoserNotification &&
                      (notification.read
                        ? "border-[#f0d9dc] bg-[linear-gradient(180deg,rgba(255,249,249,0.9),rgba(255,244,244,0.82))] shadow-[0_10px_24px_-24px_rgba(196,61,72,0.25)]"
                        : "border-[#f1c7cd] bg-[linear-gradient(180deg,rgba(255,247,248,1),rgba(255,238,240,0.98))] shadow-[0_18px_36px_-28px_rgba(196,61,72,0.38)]")
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
              <div className="rounded-[1.25rem] border border-dashed border-black/10 bg-white/70 px-5 py-8 text-center dark:border-white/10 dark:bg-white/[0.04]">
                <p className="text-sm font-semibold text-black/72 dark:text-slate-100">{copy.emptyTitle}</p>
                <p className="mt-1 text-sm leading-6 text-black/52 dark:text-slate-300/68">
                  {copy.emptyDescription}
                </p>
              </div>
            )}
          </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
