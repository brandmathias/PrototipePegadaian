"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  BadgeCheck,
  Ban,
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Gavel,
  Info,
  ReceiptText,
  Search,
  ShieldAlert,
  Trophy,
  UserRound,
  WalletCards
} from "lucide-react";

import type { PersistedNotification } from "@/components/ui/use-buyer-notifications";
import { PushNotificationControl } from "@/components/ui/push-notification-control";
import { APP_TIME_ZONE, APP_TIME_ZONE_LABEL } from "@/lib/timezone";
import { cn } from "@/lib/utils";

const BUYER_NOTIFICATION_HERO_IMAGE = "/uploads/Background Hero Section Halaman Notifikasi Buyer.png";

type BuyerNotificationsPageProps = {
  initialNotifications: PersistedNotification[];
};

type NotificationFilter = "all" | "unread";

type NotificationTone = {
  dot: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  iconWrap: string;
  row: string;
  unreadBg: string;
  unreadBorder: string;
};

function getMetadataTimestamp(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const record = metadata as Record<string, unknown>;
  const timestamp =
    typeof record.occurredAt === "string"
      ? record.occurredAt
      : typeof record.eventAt === "string"
        ? record.eventAt
        : null;

  return timestamp && !Number.isNaN(new Date(timestamp).getTime()) ? timestamp : null;
}

function getNotificationDisplayTimestamp(notification: PersistedNotification) {
  return getMetadataTimestamp(notification.metadata) ?? notification.createdAt;
}

function formatNotificationDateTime(timestamp: string | number) {
  const value = typeof timestamp === "number" ? timestamp : new Date(timestamp).getTime();

  if (Number.isNaN(value)) {
    return "-";
  }

  const dateLabel = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    timeZone: APP_TIME_ZONE,
    weekday: "long",
    year: "numeric"
  }).format(value);
  const timeParts = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    timeZone: APP_TIME_ZONE
  }).formatToParts(value);
  const hour = timeParts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = timeParts.find((part) => part.type === "minute")?.value ?? "00";

  return `${dateLabel} • ${hour}.${minute} ${APP_TIME_ZONE_LABEL}`;
}

function getNotificationTone(type: string): NotificationTone {
  if (type === "payment_failed" || type === "payment_rejected") {
    return {
      dot: "bg-[#ef1d1d]",
      icon: AlertTriangle,
      iconWrap: "bg-[#fff0f1] text-[#ef1d1d]",
      row: "hover:bg-[#fffafa]",
      unreadBg: "bg-[#fff5f6] hover:bg-[#fff0f2] border-red-200/80 shadow-[0_8px_30px_rgba(239,29,29,0.02)]",
      unreadBorder: "border-l-[5px] border-l-[#ef1d1d]"
    };
  }

  if (type === "blacklist_active") {
    return {
      dot: "bg-[#f28c13]",
      icon: ShieldAlert,
      iconWrap: "bg-[#fff7ec] text-[#f28c13]",
      row: "hover:bg-[#fffaf3]",
      unreadBg: "bg-[#fffbf2] hover:bg-[#fff7e6] border-amber-200/80 shadow-[0_8px_30px_rgba(242,140,19,0.02)]",
      unreadBorder: "border-l-[5px] border-l-[#f28c13]"
    };
  }

  if (type === "payment_deadline" || type === "vickrey_loss") {
    return {
      dot: "bg-[#1e6fcb]",
      icon: type === "vickrey_loss" ? Gavel : Clock3,
      iconWrap: "bg-[#eff6ff] text-[#1e6fcb]",
      row: "hover:bg-[#f8fbff]",
      unreadBg: "bg-[#f4f9ff] hover:bg-[#eaf3ff] border-blue-200/80 shadow-[0_8px_30px_rgba(30,111,203,0.02)]",
      unreadBorder: "border-l-[5px] border-l-[#1e6fcb]"
    };
  }

  if (type === "vickrey_win") {
    return {
      dot: "bg-[#0b7a4b]",
      icon: Trophy,
      iconWrap: "bg-[#effaf4] text-[#0b7a4b]",
      row: "hover:bg-[#f7fcf9]",
      unreadBg: "bg-[#f3fbf7] hover:bg-[#ebf7f0] border-emerald-200/80 shadow-[0_8px_30px_rgba(11,122,75,0.02)]",
      unreadBorder: "border-l-[5px] border-l-[#0b7a4b]"
    };
  }

  if (type === "payment_verified" || type === "handover_proof_uploaded" || type === "transaction_created") {
    return {
      dot: "bg-[#0b7a4b]",
      icon: type === "payment_verified" ? BadgeCheck : CheckCircle2,
      iconWrap: "bg-[#effaf4] text-[#0b7a4b]",
      row: "hover:bg-[#f7fcf9]",
      unreadBg: "bg-[#f3fbf7] hover:bg-[#ebf7f0] border-emerald-200/80 shadow-[0_8px_30px_rgba(11,122,75,0.02)]",
      unreadBorder: "border-l-[5px] border-l-[#0b7a4b]"
    };
  }

  return {
    dot: "bg-[#0b7a4b]",
    icon: Info,
    iconWrap: "bg-[#f1f7f4] text-[#0b5d3e]",
    row: "hover:bg-[#f8fbfa]",
    unreadBg: "bg-[#f8fbfa] hover:bg-[#f1f8f5] border-emerald-100/80 shadow-[0_8px_30px_rgba(11,122,75,0.01)]",
    unreadBorder: "border-l-[5px] border-l-[#0b7a4b]"
  };
}

export function BuyerNotificationsPage({ initialNotifications }: BuyerNotificationsPageProps) {
  const [notifications, setNotifications] = React.useState(() => initialNotifications);
  const [activeFilter, setActiveFilter] = React.useState<NotificationFilter>("all");

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;
  const visibleNotifications =
    activeFilter === "unread"
      ? notifications.filter((notification) => !notification.isRead)
      : notifications;
  const pageTitle = activeFilter === "unread" ? "Notifikasi Belum Dibaca" : "Semua Notifikasi";

  const markAsRead = React.useCallback((notificationId: string) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: true, readAt: notification.readAt ?? new Date().toISOString() }
          : notification
      )
    );

    void fetch(`/api/user/notifikasi/${notificationId}`, {
      method: "PATCH"
    }).catch(() => {
      // Polling popup dan reload halaman berikutnya tetap menjadi sumber rekonsiliasi.
    });
  }, []);

  const markAllAsRead = React.useCallback(() => {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        isRead: true,
        readAt: notification.readAt ?? new Date().toISOString()
      }))
    );

    void fetch("/api/user/notifikasi/read-all", {
      method: "POST"
    }).catch(() => {
      // Optimistic UI cukup; server state akan tersinkron saat halaman dibuka ulang.
    });
  }, []);

  const renderNotificationBody = (notification: PersistedNotification) => {
    const tone = getNotificationTone(notification.type);
    const Icon = tone.icon;
    const displayTimestamp = getNotificationDisplayTimestamp(notification);

    return (
      <>
        <span
          className={cn(
            "grid size-16 shrink-0 place-items-center rounded-[1.05rem] transition-[transform,box-shadow,opacity] duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.06] group-hover:shadow-[0_10px_22px_-16px_rgba(8,69,50,0.4)] motion-reduce:transition-none motion-reduce:transform-none",
            notification.isRead ? "opacity-40" : "",
            tone.iconWrap
          )}
        >
          <Icon className="size-7" strokeWidth={1.8} />
        </span>
        <span className="min-w-0">
          <span
            className={cn(
              "block font-headline text-base leading-tight md:text-[1.02rem]",
              notification.isRead
                ? "font-semibold text-[#9ca3af]"
                : "font-black text-[#111827]"
            )}
          >
            {notification.title}
          </span>
          <span
            className={cn(
              "mt-2 block text-justify text-sm leading-6",
              notification.isRead
                ? "font-medium text-[#c4cad4]"
                : "font-semibold text-[#6a6f78]"
            )}
          >
            {notification.message}
          </span>
        </span>
        <span
          className={cn(
            "flex items-center gap-3 text-sm font-semibold leading-6 md:justify-self-end md:text-right",
            notification.isRead ? "text-[#c4cad4]" : "text-[#6b7280]"
          )}
        >
          {formatNotificationDateTime(displayTimestamp)}
          <span className="relative flex size-2.5 shrink-0">
            {!notification.isRead && (
              <span className={cn("status-pulse absolute -inset-0.5 rounded-full", tone.dot, "opacity-75")} />
            )}
            <span
              aria-label={notification.isRead ? "Sudah dibaca" : "Belum dibaca"}
              className={cn("relative inline-block size-2.5 shrink-0 rounded-full", tone.dot, notification.isRead && "opacity-25")}
            />
          </span>
        </span>
      </>
    );
  };

  return (
    <div className="space-y-6 md:space-y-7">
      <section
        className="relative min-h-0 overflow-hidden rounded-[1.75rem] border border-primary/10 bg-white shadow-[0_24px_70px_-48px_rgba(8,69,50,0.46)] md:min-h-[380px] md:rounded-[2rem] md:bg-[linear-gradient(90deg,#fffdf8_0%,#f8f3ff_58%,#efe9ff_100%)]"
        data-testid="buyer-notifications-hero"
      >
        <Image
          alt="Ilustrasi notifikasi pembeli"
          className="hidden object-contain object-right md:block"
          fill
          quality={60}
          sizes="(max-width: 767px) 1px, 1280px"
          src={BUYER_NOTIFICATION_HERO_IMAGE}
        />
        <div className="absolute inset-0 hidden bg-[linear-gradient(90deg,rgba(255,255,255,0.99)_0%,rgba(255,255,255,0.95)_42%,rgba(255,255,255,0.2)_78%,rgba(255,255,255,0)_100%)] md:block" />
        <div className="relative flex min-h-0 max-w-3xl flex-col justify-center px-5 py-7 sm:px-6 md:min-h-[380px] md:px-10 md:py-8">
          <h1 className="max-w-3xl font-headline text-[2.05rem] font-black leading-[1.04] tracking-tight text-[#101923] sm:text-4xl md:text-5xl">
            Pusat Notifikasi Ruang Agunan
          </h1>
          <p className="mt-3 max-w-xl text-[0.92rem] font-medium leading-6 text-[#506079] md:text-base md:leading-7">
            Temukan pembaruan terbaru, pengingat penting, status pembayaran, aktivitas lelang, dan informasi penting akun Anda dalam satu tempat yang terstruktur dan mudah dipantau.
          </p>

          <div aria-label="Kategori notifikasi" className="mt-5 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#f1f7f4] px-3 py-2 text-[0.78rem] font-bold text-[#24513f] ring-1 ring-[#0b7a4b]/8 md:text-sm">
              <ReceiptText className="size-4 text-[#0b7a4b]" strokeWidth={1.7} />
              Transaksi
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#f1f7f4] px-3 py-2 text-[0.78rem] font-bold text-[#24513f] ring-1 ring-[#0b7a4b]/8 md:text-sm">
              <WalletCards className="size-4 text-[#0b7a4b]" strokeWidth={1.7} />
              Pembayaran
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#f1f7f4] px-3 py-2 text-[0.78rem] font-bold text-[#24513f] ring-1 ring-[#0b7a4b]/8 md:text-sm">
              <UserRound className="size-4 text-[#0b7a4b]" strokeWidth={1.7} />
              Aktivitas Akun
            </span>
          </div>

          <label className="relative mt-6 block w-full max-w-3xl" htmlFor="buyer-notification-search">
            <span className="sr-only">Cari notifikasi</span>
            <Search className="pointer-events-none absolute left-5 top-1/2 size-6 -translate-y-1/2 text-[#101923]" strokeWidth={1.8} />
            <input
              aria-label="Cari notifikasi, status pembayaran, atau aktivitas akun"
              className="h-12 w-full rounded-xl border border-slate-200 bg-white/90 pl-14 pr-5 text-sm font-semibold text-[#24365f] shadow-[0_12px_34px_-28px_rgba(15,23,42,0.45),inset_0_1px_0_rgba(255,255,255,0.92)] outline-none transition-[border-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] placeholder:text-[#697796] md:text-base focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
              id="buyer-notification-search"
              placeholder="Cari notifikasi, status pembayaran, atau aktivitas akun..."
              type="search"
            />
          </label>
        </div>
      </section>

      <PushNotificationControl variant="mobile" />

      <div className="inline-flex rounded-full border border-[#b8d9ca] bg-white p-1 shadow-[0_14px_34px_-28px_rgba(8,69,50,0.42)]">
        <button
          className={cn(
            "interactive-tap inline-flex min-w-[8.4rem] items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black font-jakarta transition-[transform,background-color,color,box-shadow] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
            activeFilter === "all"
              ? "bg-[#0b6b44] text-white shadow-[0_16px_30px_-22px_rgba(8,69,50,0.7)]"
              : "text-[#1f2a26] hover:bg-[#f4faf7]"
          )}
          onClick={() => setActiveFilter("all")}
          type="button"
        >
          Semua
          <span className={cn("rounded-full px-2 py-0.5 text-xs", activeFilter === "all" ? "bg-white text-[#0b6b44]" : "bg-[#eef5f1] text-[#4c5c55]")}>
            {notifications.length}
          </span>
        </button>
        <button
          className={cn(
            "interactive-tap inline-flex min-w-[10.4rem] items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black font-jakarta transition-[transform,background-color,color,box-shadow] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
            activeFilter === "unread"
              ? "bg-[#0b6b44] text-white shadow-[0_16px_30px_-22px_rgba(8,69,50,0.7)]"
              : "text-[#1f2a26] hover:bg-[#f4faf7]"
          )}
          onClick={() => setActiveFilter("unread")}
          type="button"
        >
          Belum Dibaca
          <span className={cn("rounded-full px-2 py-0.5 text-xs", activeFilter === "unread" ? "bg-white text-[#0b6b44]" : "bg-[#eef5f1] text-[#4c5c55]")}>
            {unreadCount}
          </span>
        </button>
      </div>

      <section className="overflow-hidden rounded-[1.75rem] border border-black/[0.05] bg-white px-5 py-5 shadow-[0_24px_70px_-48px_rgba(8,69,50,0.38)] md:px-8 md:py-7">
        <div className="flex flex-col gap-4 border-b border-black/[0.06] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-headline text-2xl font-black tracking-tight text-[#111827]">
              {pageTitle}
            </h2>
            <p className="mt-2 text-sm font-semibold text-[#6b7280]">
              {visibleNotifications.length} notifikasi
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              className="interactive-tap inline-flex min-h-12 items-center justify-center gap-2 rounded-[0.9rem] bg-[#f3f4f3] px-4 text-sm font-black font-jakarta text-[#0b6b44] transition-[transform,background-color] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[#eaf4ef] disabled:cursor-not-allowed disabled:opacity-55"
              disabled={unreadCount === 0}
              onClick={markAllAsRead}
              type="button"
            >
              <CheckCheck className="size-4" />
              Tandai semua dibaca
            </button>
          </div>
        </div>

        {visibleNotifications.length > 0 ? (
          <div className="divide-y divide-black/[0.07]">
            {visibleNotifications.map((notification) => {
              const tone = getNotificationTone(notification.type);
              const className = cn(
                "group relative grid w-full gap-4 rounded-[1.1rem] border-l-[5px] px-2.5 py-5 text-left transition-[transform,background-color,box-shadow,border-color] duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 hover:shadow-[0_16px_34px_-26px_rgba(8,69,50,0.48)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b6b44]/25 focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none sm:grid-cols-[4.5rem_minmax(0,1fr)] md:grid-cols-[4.5rem_minmax(0,1fr)_minmax(13rem,18rem)] md:items-center md:px-3.5",
                notification.isRead
                  ? "border-l-[#e5e7eb] bg-[#f9fafb] hover:bg-[#f3f4f6]"
                  : cn(tone.unreadBg, tone.unreadBorder)
              );

              if (notification.actionHref) {
                return (
                  <Link
                    className={className}
                    href={notification.actionHref}
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                  >
                    {renderNotificationBody(notification)}
                  </Link>
                );
              }

              return (
                <button
                  className={className}
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  type="button"
                >
                  {renderNotificationBody(notification)}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid min-h-[15rem] place-items-center rounded-[1.25rem] bg-[#f8fbf9] px-6 py-10 text-center">
            <div>
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-white text-[#0b6b44] shadow-[inset_0_1px_0_rgba(255,255,255,0.86)] ring-1 ring-black/[0.05]">
                <Bell className="size-6" />
              </span>
              <h3 className="mt-4 font-headline text-lg font-black text-[#111827]">
                {activeFilter === "unread" ? "Belum ada notifikasi belum dibaca" : "Belum ada notifikasi"}
              </h3>
              <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-[#6b7280]">
                Notifikasi akan muncul saat ada hasil lelang, perubahan pembayaran, batas waktu, atau pembatasan akun.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
