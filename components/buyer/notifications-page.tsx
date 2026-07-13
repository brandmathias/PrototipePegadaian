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
  ShieldAlert,
  Trophy
} from "lucide-react";

import type { PersistedNotification } from "@/components/ui/use-buyer-notifications";
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
  if (type === "payment_rejected") {
    return {
      dot: "bg-[#ef1d1d]",
      icon: AlertTriangle,
      iconWrap: "bg-[#fff0f1] text-[#ef1d1d]",
      row: "hover:bg-[#fffafa]"
    };
  }

  if (type === "blacklist_active") {
    return {
      dot: "bg-[#f28c13]",
      icon: ShieldAlert,
      iconWrap: "bg-[#fff7ec] text-[#f28c13]",
      row: "hover:bg-[#fffaf3]"
    };
  }

  if (type === "payment_deadline" || type === "vickrey_loss") {
    return {
      dot: "bg-[#1e6fcb]",
      icon: type === "vickrey_loss" ? Gavel : Clock3,
      iconWrap: "bg-[#eff6ff] text-[#1e6fcb]",
      row: "hover:bg-[#f8fbff]"
    };
  }

  if (type === "vickrey_win") {
    return {
      dot: "bg-[#0b7a4b]",
      icon: Trophy,
      iconWrap: "bg-[#effaf4] text-[#0b7a4b]",
      row: "hover:bg-[#f7fcf9]"
    };
  }

  if (type === "payment_verified" || type === "handover_proof_uploaded" || type === "transaction_created") {
    return {
      dot: "bg-[#0b7a4b]",
      icon: type === "payment_verified" ? BadgeCheck : CheckCircle2,
      iconWrap: "bg-[#effaf4] text-[#0b7a4b]",
      row: "hover:bg-[#f7fcf9]"
    };
  }

  return {
    dot: "bg-[#0b7a4b]",
    icon: Info,
    iconWrap: "bg-[#f1f7f4] text-[#0b5d3e]",
    row: "hover:bg-[#f8fbfa]"
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
        <span className={cn("grid size-16 shrink-0 place-items-center rounded-[1.05rem]", tone.iconWrap)}>
          <Icon className="size-7" strokeWidth={1.8} />
        </span>
        <span className="min-w-0">
          <span className="block font-headline text-base font-black leading-tight text-[#111827] md:text-[1.02rem]">
            {notification.title}
          </span>
          <span className="mt-2 block text-sm font-semibold leading-6 text-[#6a6f78]">
            {notification.message}
          </span>
        </span>
        <span className="flex items-center gap-3 text-sm font-semibold leading-6 text-[#6b7280] md:justify-self-end md:text-right">
          {formatNotificationDateTime(displayTimestamp)}
          <span
            aria-label={notification.isRead ? "Sudah dibaca" : "Belum dibaca"}
            className={cn("inline-block size-2.5 shrink-0 rounded-full", tone.dot, notification.isRead && "opacity-35")}
          />
        </span>
      </>
    );
  };

  return (
    <div className="space-y-6 md:space-y-7">
      <section className="relative min-h-[340px] overflow-hidden rounded-[2rem] border border-primary/10 bg-[linear-gradient(90deg,#fffdf8_0%,#f8f3ff_58%,#efe9ff_100%)] shadow-[0_24px_70px_-48px_rgba(8,69,50,0.46)] md:min-h-[380px]">
        <Image
          alt="Ilustrasi notifikasi pembeli"
          className="object-contain object-right"
          fill
          priority
          fetchPriority="high"
          quality={60}
          sizes="(max-width: 768px) 100vw, 1280px"
          src={BUYER_NOTIFICATION_HERO_IMAGE}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,249,0.98)_0%,rgba(255,255,249,0.86)_42%,rgba(255,255,249,0.18)_78%)]" />
        <div className="relative flex min-h-[340px] max-w-3xl flex-col justify-center px-6 py-8 md:min-h-[380px] md:px-10">
          <h1 className="font-sans text-4xl font-black tracking-tight text-[#101214] md:text-5xl">
            Notifikasi
          </h1>
          <p className="mt-5 max-w-sm font-sans text-base font-semibold leading-8 text-[#2f3339] md:text-lg">
            Informasi terbaru dan penting yang perlu Anda ketahui.
          </p>
          <aside
            aria-label="Ringkasan notifikasi"
            className="mt-6 max-w-[34rem] rounded-[1.2rem] border border-[#cfe4d7] bg-white/78 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_14px_32px_-28px_rgba(8,69,50,0.42)]"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#eaf5ee] text-[#0b6b44]">
                <Bell className="size-5" />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#0b6b44]">Ringkasan notifikasi</p>
                <p className="mt-1 text-sm font-semibold text-[#2f3339]">
                  <strong className="font-black">{unreadCount}</strong> membutuhkan perhatian
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs font-semibold leading-5 text-[#59635d]">
              Pembayaran, lelang, dan keamanan akun dirangkum di satu tempat.
            </p>
          </aside>
        </div>
      </section>

      <div className="inline-flex rounded-full border border-[#b8d9ca] bg-white p-1 shadow-[0_14px_34px_-28px_rgba(8,69,50,0.42)]">
        <button
          className={cn(
            "interactive-tap inline-flex min-w-[8.4rem] items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black transition-[transform,background-color,color,box-shadow] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
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
            "interactive-tap inline-flex min-w-[10.4rem] items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black transition-[transform,background-color,color,box-shadow] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
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
              className="interactive-tap inline-flex min-h-12 items-center justify-center gap-2 rounded-[0.9rem] bg-[#f3f4f3] px-4 text-sm font-black text-[#0b6b44] transition-[transform,background-color] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[#eaf4ef] disabled:cursor-not-allowed disabled:opacity-55"
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
                "grid w-full gap-4 py-5 text-left transition-[transform,background-color] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] sm:grid-cols-[4.5rem_minmax(0,1fr)] md:grid-cols-[4.5rem_minmax(0,1fr)_minmax(13rem,18rem)] md:items-center",
                tone.row,
                !notification.isRead && "bg-white"
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
