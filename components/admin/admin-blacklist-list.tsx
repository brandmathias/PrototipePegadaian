"use client";

import Link from "next/link";
import {
  startTransition,
  useDeferredValue,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  CalendarClock,
  Eye,
  Gavel,
  Search,
  ShieldAlert,
  UserRound,
} from "lucide-react";

import { AdminLiveCountdown } from "@/components/admin/admin-live-countdown";
import {
  AdminPaginationFooter,
  useAdminPagination,
} from "@/components/admin/admin-pagination";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AdminBlacklistItem = Record<string, any>;
type BlacklistFilter = "SEMUA" | "AKTIF" | "PERMANEN" | "BERAKHIR_DEKAT";
const DAY_MS = 86_400_000;

function isActiveRestriction(entry: AdminBlacklistItem) {
  return String(entry.status ?? "").toUpperCase() === "AKTIF";
}

function getDaysUntil(dateLabel: string | null | undefined) {
  if (!dateLabel || dateLabel === "-") return null;
  const parsed = new Date(`${dateLabel}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime())) return null;

  const today = new Date();
  const todayUtc = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );
  const targetUtc = Date.UTC(
    parsed.getUTCFullYear(),
    parsed.getUTCMonth(),
    parsed.getUTCDate(),
  );

  return Math.ceil((targetUtc - todayUtc) / 86_400_000);
}

function isDueSoon(entry: AdminBlacklistItem) {
  const ruleDeadline = getRuleDeadline(entry);
  const days = ruleDeadline
    ? getDaysUntil(ruleDeadline.toISOString().slice(0, 10))
    : getDaysUntil(entry.until);

  return isActiveRestriction(entry) && days !== null && days >= 0 && days <= 7;
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getRestrictionCopy(entry: AdminBlacklistItem) {
  if (!isActiveRestriction(entry)) {
    return "Pembatasan selesai";
  }
  if (isPermanentBlacklist(entry)) {
    return "Blacklist permanen";
  }
  if (isDueSoon(entry)) {
    return "Berakhir dekat";
  }

  return "Aktif";
}

function getRestrictionTone(entry: AdminBlacklistItem) {
  if (!isActiveRestriction(entry)) return "neutral";
  if (isPermanentBlacklist(entry)) return "danger";
  if (isDueSoon(entry)) return "warning";

  return "success";
}

function getCountdownTarget(entry: AdminBlacklistItem) {
  if (!isActiveRestriction(entry)) return null;
  const ruleDeadline = getRuleDeadline(entry);

  if (ruleDeadline) return ruleDeadline.toISOString();
  if (entry.blockedUntilAt) return String(entry.blockedUntilAt);
  if (!entry.until || entry.until === "-") return null;

  return `${entry.until}T23:59:59.000Z`;
}

function getLevelTone(entry: AdminBlacklistItem) {
  const level = getEntryLevel(entry);

  if (level >= 3) return "danger";
  if (level === 2) return "warning";
  if (level === 1) return "success";

  return "neutral";
}

function getLevelDuration(level: number) {
  if (level >= 3) return "365 hari";
  if (level === 2) return "30 hari";
  if (level === 1) return "7 hari";

  return "0 hari";
}

function getLevelDurationDays(level: number) {
  if (level >= 3) return 365;
  if (level === 2) return 30;
  if (level === 1) return 7;

  return 0;
}

function getEntryLevel(entry: AdminBlacklistItem) {
  return Number(
    entry.level ?? Math.min(Math.max(Number(entry.violations ?? 0), 0), 3),
  );
}

function parseDateValue(value: unknown) {
  if (!value || value === "-") return null;

  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function getIncidentDate(entry: AdminBlacklistItem) {
  const traces = Array.isArray(entry.unpaidAuctionTraces)
    ? entry.unpaidAuctionTraces
    : [];

  return parseDateValue(
    entry.latestUnpaidAuction?.occurredAt ??
      traces[0]?.occurredAt ??
      entry.lastIncidentAt,
  );
}

function getRuleDeadline(entry: AdminBlacklistItem) {
  const baseDate = getIncidentDate(entry);
  const durationDays = getLevelDurationDays(getEntryLevel(entry));

  if (!baseDate || durationDays <= 0) return null;

  return new Date(baseDate.getTime() + durationDays * DAY_MS);
}

function formatShortDate(date: Date | null) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    timeZone: "Asia/Makassar",
    year: "numeric",
  }).format(date);
}

function isPermanentBlacklist(entry: AdminBlacklistItem) {
  return (
    isActiveRestriction(entry) &&
    (Boolean(entry.requiresManualReview) ||
      getEntryLevel(entry) >= 3 ||
      Number(entry.violations ?? 0) >= 3)
  );
}

function parseIncidentDate(value: unknown) {
  if (!value || value === "-") return null;
  const date = new Date(String(value));

  return Number.isNaN(date.getTime()) ? null : date;
}

function countRecentViolations(entry: AdminBlacklistItem) {
  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const traces = Array.isArray(entry.unpaidAuctionTraces)
    ? entry.unpaidAuctionTraces
    : [];
  const recentTraces = traces.filter((trace: Record<string, any>) => {
    const date = parseIncidentDate(trace.occurredAt ?? trace.createdAt);
    return date
      ? now - date.getTime() >= 0 && now - date.getTime() <= sevenDaysMs
      : false;
  });

  if (recentTraces.length > 0) return recentTraces.length;

  const fallbackDate = parseIncidentDate(
    entry.lastIncidentAt ?? entry.latestUnpaidAuction?.occurredAt,
  );
  return fallbackDate &&
    now - fallbackDate.getTime() >= 0 &&
    now - fallbackDate.getTime() <= sevenDaysMs
    ? 1
    : 0;
}

function getLevelPalette(entry: AdminBlacklistItem) {
  const level = getEntryLevel(entry);

  if (level >= 3) {
    return {
      avatar:
        "bg-[radial-gradient(circle_at_35%_22%,#fff1f2,#fda4af_58%,#be123c)] text-white",
      border: "ring-rose-200/80",
      countdown: "border-rose-200 bg-rose-50 text-rose-700",
      icon: "bg-white text-rose-700",
      label: "text-rose-700",
      shell: "bg-rose-50/74",
    };
  }

  if (level === 2) {
    return {
      avatar:
        "bg-[radial-gradient(circle_at_35%_22%,#fffbeb,#fcd34d_58%,#b45309)] text-white",
      border: "ring-amber-200/80",
      countdown: "border-amber-200 bg-amber-50 text-amber-800",
      icon: "bg-white text-amber-800",
      label: "text-amber-800",
      shell: "bg-amber-50/72",
    };
  }

  if (level === 1) {
    return {
      avatar:
        "bg-[radial-gradient(circle_at_35%_22%,#effaf1,#b7dcc1_62%,#0b6a45)] text-white",
      border: "ring-emerald-200/70",
      countdown: "border-emerald-200 bg-emerald-50 text-[#0a6a49]",
      icon: "bg-white text-[#0a6a49]",
      label: "text-[#0a6a49]",
      shell: "bg-emerald-50/58",
    };
  }

  return {
    avatar: "bg-[#f0f0ee] text-black/60",
    border: "ring-black/8",
    countdown: "border-black/10 bg-[#f7f6f1] text-black/62",
    icon: "bg-white text-black/58",
    label: "text-black/58",
    shell: "bg-[#f3f2ed]",
  };
}

function MetricTile({
  icon,
  label,
  tone = "neutral",
  value,
}: {
  icon: ReactNode;
  label: string;
  tone?: "danger" | "neutral" | "success" | "warning";
  value: number;
}) {
  return (
    <div className="rounded-[1.35rem] border border-black/8 bg-white px-4 py-3 shadow-[0_16px_42px_-36px_rgba(8,69,50,0.38),inset_0_1px_0_rgba(255,255,255,0.9)]">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-2xl",
            tone === "danger" && "bg-rose-50 text-rose-700",
            tone === "warning" && "bg-amber-50 text-amber-700",
            tone === "success" && "bg-[#e9f6ef] text-[#0a6a49]",
            tone === "neutral" && "bg-[#f3f4ef] text-black/58",
          )}
        >
          {icon}
        </span>
        <div>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-black/42">
            {label}
          </p>
          <p className="mt-1 font-headline text-2xl font-black leading-none tracking-[-0.03em] text-[#122018]">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function RestrictionPill({ entry }: { entry: AdminBlacklistItem }) {
  const tone = getRestrictionTone(entry);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.68rem] font-black uppercase tracking-[0.12em]",
        tone === "danger" && "bg-rose-50 text-rose-700",
        tone === "warning" && "bg-amber-50 text-amber-700",
        tone === "success" && "bg-[#e9f6ef] text-[#0a6a49]",
        tone === "neutral" && "bg-[#f0f0ee] text-black/58",
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {getRestrictionCopy(entry)}
    </span>
  );
}

function LevelPill({ entry }: { entry: AdminBlacklistItem }) {
  const tone = getLevelTone(entry);
  const level = getEntryLevel(entry);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1.5 text-[0.68rem] font-black uppercase tracking-[0.12em]",
        tone === "danger" && "bg-rose-50 text-rose-700",
        tone === "warning" && "bg-amber-50 text-amber-700",
        tone === "success" && "bg-[#e9f6ef] text-[#0a6a49]",
        tone === "neutral" && "bg-[#f0f0ee] text-black/58",
      )}
    >
      Level {level} - {getLevelDuration(level)}
    </span>
  );
}

export function AdminBlacklistList({
  entries,
}: {
  entries: AdminBlacklistItem[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<BlacklistFilter>("SEMUA");
  const deferredQuery = useDeferredValue(query);
  const metrics = useMemo(() => {
    return {
      permanent: entries.filter(isPermanentBlacklist).length,
      recent: entries.reduce(
        (total, entry) => total + countRecentViolations(entry),
        0,
      ),
      total: entries.length,
    };
  }, [entries]);
  const filters: Array<{ id: BlacklistFilter; label: string; count: number }> =
    [
      { id: "SEMUA", label: "Semua", count: metrics.total },
      {
        id: "AKTIF",
        label: "Blacklist Aktif",
        count: entries.filter(isActiveRestriction).length,
      },
      {
        id: "PERMANEN",
        label: "Blacklist Permanen",
        count: metrics.permanent,
      },
      {
        id: "BERAKHIR_DEKAT",
        label: "Berakhir Dekat",
        count: entries.filter(isDueSoon).length,
      },
    ];
  const filteredEntries = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return entries.filter((entry) => {
      const matchesFilter =
        filter === "SEMUA" ||
        (filter === "AKTIF" && isActiveRestriction(entry)) ||
        (filter === "PERMANEN" && isPermanentBlacklist(entry)) ||
        (filter === "BERAKHIR_DEKAT" && isDueSoon(entry));
      const matchesQuery =
        !normalizedQuery ||
        [entry.name, entry.email, entry.userId, entry.reason, entry.until]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(normalizedQuery),
          );

      return matchesFilter && matchesQuery;
    });
  }, [deferredQuery, entries, filter]);
  const pagination = useAdminPagination(
    filteredEntries,
    `${filter}-${deferredQuery}`,
  );

  return (
    <section className="overflow-hidden rounded-[2rem] bg-white shadow-[0_28px_90px_-64px_rgba(8,69,50,0.46)] ring-1 ring-black/6">
      <div className="border-b border-black/6 bg-[linear-gradient(180deg,rgba(251,250,245,0.96),rgba(255,255,255,0.98))] p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-3">
          <MetricTile
            icon={<UserRound className="size-5" />}
            label="Total Blacklist"
            value={metrics.total}
          />
          <MetricTile
            icon={<CalendarClock className="size-5" />}
            label="Pelanggaran 7 Hari Terakhir"
            tone="danger"
            value={metrics.recent}
          />
          <MetricTile
            icon={<AlertTriangle className="size-5" />}
            label="Blacklist Permanen"
            tone="danger"
            value={metrics.permanent}
          />
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(20rem,1fr)_auto] xl:items-center">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#0a6a49]/42" />
            <Input
              className="h-12 rounded-[1.35rem] border-0 bg-[#f4f3ef] pl-12 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] focus:bg-white focus-visible:ring-2 focus-visible:ring-[#0a6a49]/15 sm:text-base"
              placeholder="Cari nama, email, atau alasan pembatasan..."
              value={query}
              onChange={(event) => {
                const value = event.target.value;
                startTransition(() => setQuery(value));
              }}
            />
          </div>

          <div className="admin-choice-shell flex flex-wrap gap-2 rounded-[1.35rem] p-1">
            {filters.map((option) => {
              const active = filter === option.id;

              return (
                <button
                  aria-pressed={active}
                  className="admin-choice-button inline-flex items-center gap-2 rounded-[1.05rem] px-3 py-2 text-[0.72rem] font-black uppercase tracking-[0.12em]"
                  data-active={active}
                  key={option.id}
                  type="button"
                  onClick={() => setFilter(option.id)}
                >
                  {option.label}
                  <span className="admin-choice-count">{option.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-2 2xl:grid-cols-3">
        {pagination.visibleItems.length > 0 ? (
          pagination.visibleItems.map((entry) => {
            const countdownTarget = getCountdownTarget(entry);
            const palette = getLevelPalette(entry);
            const ruleDeadline = getRuleDeadline(entry);
            const level = getEntryLevel(entry);

            return (
              <article
                className="group relative flex min-h-[16.25rem] flex-col overflow-hidden rounded-[1.45rem] border border-black/8 bg-white p-4 shadow-[0_16px_42px_-38px_rgba(18,24,21,0.36)] transition duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-[#0a6a49]/18 hover:shadow-[0_22px_56px_-46px_rgba(18,24,21,0.46)]"
                key={entry.userId}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className={cn(
                      "grid size-11 shrink-0 place-items-center rounded-2xl text-sm font-black shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]",
                      level >= 3
                        ? "bg-rose-50 text-rose-700"
                        : level === 2
                          ? "bg-amber-50 text-amber-800"
                          : "bg-[#e9f6ef] text-[#0a6a49]",
                    )}
                  >
                    {getInitials(entry.name || "User")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      className="block truncate font-headline text-lg font-black tracking-[-0.02em] text-[#122018] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-[#0a6a49]"
                      href={`/admin/blacklist/${entry.userId}`}
                    >
                      {entry.name}
                    </Link>
                    <p className="mt-1 break-all text-sm font-semibold leading-5 text-black/46">
                      {entry.email || entry.userId}
                    </p>
                    {entry.phone && entry.phone !== "-" ? (
                      <p className="mt-0.5 truncate text-xs font-semibold text-black/36">
                        {entry.phone}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <RestrictionPill entry={entry} />
                  <LevelPill entry={entry} />
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f0f0ee] px-3 py-1.5 text-[0.68rem] font-black uppercase tracking-[0.12em] text-black/52">
                    <Gavel className="size-3.5" />
                    {Number(entry.unpaidAuctionCount ?? 0)} jejak lelang
                  </span>
                </div>

                <div
                  className={cn(
                    "mt-5 rounded-[1.15rem] border px-4 py-3",
                    isActiveRestriction(entry)
                      ? "border-rose-200 bg-rose-50 text-rose-700"
                      : palette.countdown,
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "grid size-10 shrink-0 place-items-center rounded-2xl shadow-[0_12px_28px_-24px_rgba(18,24,21,0.52)]",
                        palette.icon,
                      )}
                    >
                      <CalendarClock className="size-5 text-[#d72b43]" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[0.64rem] font-black uppercase tracking-[0.16em] opacity-70">
                        Masa pembatasan
                      </p>
                      <AdminLiveCountdown
                        className="mt-1 block text-sm font-black"
                        expiredLabel="Masa pembatasan berakhir"
                        fallbackLabel={
                          isActiveRestriction(entry)
                            ? ruleDeadline
                              ? formatShortDate(ruleDeadline)
                              : getLevelDuration(level)
                            : "Pembatasan selesai"
                        }
                        prefix="Sisa waktu"
                        serverNow={new Date().toISOString()}
                        targetAt={countdownTarget}
                      />
                      <p className="mt-1 text-xs font-semibold opacity-70">
                        Insiden terakhir{" "}
                        {entry.latestUnpaidAuction?.occurredAtLabel ??
                          entry.lastIncident ??
                          "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
                  <span
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full bg-[#f7f6f1] px-3 py-2 text-xs font-black",
                      palette.label,
                    )}
                  >
                    {isPermanentBlacklist(entry)
                      ? "Blacklist permanen"
                      : ruleDeadline
                        ? `Berakhir ${formatShortDate(ruleDeadline)}`
                        : `Durasi aturan ${getLevelDuration(level)}`}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      className="inline-flex h-10 items-center gap-2 rounded-full border border-[#0a6a49]/14 bg-white px-4 text-sm font-black text-[#0a6a49] shadow-[0_14px_30px_-26px_rgba(8,69,50,0.48)] transition duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-[#0a6a49]/26 hover:bg-[#eef7f0] active:scale-[0.985]"
                      href={`/admin/blacklist/${entry.userId}`}
                    >
                      <Eye className="size-4" />
                      Lihat Detail
                    </Link>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="px-5 py-12 text-center text-sm text-black/55 md:col-span-2 2xl:col-span-3">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#eff6f2] text-[#0a6a49]">
              <ShieldAlert className="size-7" />
            </div>
            <p className="mt-4 font-headline text-xl font-black text-black/80">
              {entries.length
                ? "Tidak ada akun yang cocok."
                : "Belum ada akun yang dibatasi."}
            </p>
            <p className="mx-auto mt-2 max-w-md leading-6">
              {entries.length
                ? "Ubah kata kunci atau filter untuk melihat daftar pelanggaran lain."
                : "Daftar ini akan terisi otomatis ketika ada akun yang perlu pembatasan dari unit ini."}
            </p>
          </div>
        )}
      </div>

      <AdminPaginationFooter
        itemLabel="akun"
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
        totalItems={pagination.totalItems}
        onPageIndexChange={pagination.setPageIndex}
        onPageSizeChange={pagination.setPageSize}
      />
    </section>
  );
}
