"use client";

import Link from "next/link";
import {
  startTransition,
  useDeferredValue,
  useMemo,
  useState,
} from "react";
import {
  Building2,
  CalendarClock,
  Eye,
  Gavel,
  Search,
  SearchX,
  ShieldAlert,
  ShieldBan,
} from "lucide-react";

import { AdminLiveCountdown } from "@/components/admin/admin-live-countdown";
import {
  AdminPaginationFooter,
  useAdminPagination,
} from "@/components/admin/admin-pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AdminBlacklistItem = Record<string, any>;
type BlacklistFilter =
  | "SEMUA"
  | "AKTIF"
  | "LEVEL_1"
  | "LEVEL_2"
  | "LEVEL_3"
  | "BERAKHIR_DEKAT";
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

function getRestrictionLevelMeta(level: number) {
  if (level >= 3) {
    return {
      avatar: "bg-rose-50 text-rose-700 ring-rose-100",
      badge:
        "bg-red-600 text-white shadow-[0_14px_26px_-20px_rgba(220,38,38,0.72)]",
      label: "Level 3 (365 Hari)",
      text: "text-rose-700",
    };
  }

  if (level === 2) {
    return {
      avatar: "bg-orange-50 text-orange-700 ring-orange-100",
      badge:
        "bg-orange-500 text-white shadow-[0_14px_26px_-20px_rgba(249,115,22,0.72)]",
      label: "Level 2 (30 Hari)",
      text: "text-orange-700",
    };
  }

  if (level === 1) {
    return {
      avatar: "bg-amber-50 text-amber-800 ring-amber-100",
      badge:
        "bg-amber-400 text-amber-950 shadow-[0_14px_26px_-20px_rgba(245,158,11,0.72)]",
      label: "Level 1 (7 Hari)",
      text: "text-amber-800",
    };
  }

  return {
    avatar: "bg-[#f0f0ee] text-black/58 ring-black/8",
    badge: "bg-[#f0f0ee] text-black/58",
    label: "Level 0",
    text: "text-black/58",
  };
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
      recent: entries.reduce(
        (total, entry) => total + countRecentViolations(entry),
        0,
      ),
      total: entries.length,
      active: entries.filter(isActiveRestriction).length,
      dueSoon: entries.filter(isDueSoon).length,
      levelThree: entries.filter((entry) => getEntryLevel(entry) >= 3).length,
    };
  }, [entries]);
  const filters: Array<{ id: BlacklistFilter; label: string; count: number }> =
    [
      { id: "SEMUA", label: "Semua", count: metrics.total },
      {
        id: "AKTIF",
        label: "Aktif",
        count: metrics.active,
      },
      {
        id: "LEVEL_1",
        label: "Level 1",
        count: entries.filter((entry) => getEntryLevel(entry) === 1).length,
      },
      {
        id: "LEVEL_2",
        label: "Level 2",
        count: entries.filter((entry) => getEntryLevel(entry) === 2).length,
      },
      {
        id: "LEVEL_3",
        label: "Level 3",
        count: metrics.levelThree,
      },
      {
        id: "BERAKHIR_DEKAT",
        label: "Berakhir Dekat",
        count: metrics.dueSoon,
      },
    ];
  const filteredEntries = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return entries.filter((entry) => {
      const matchesFilter =
        filter === "SEMUA" ||
        (filter === "AKTIF" && isActiveRestriction(entry)) ||
        (filter === "LEVEL_1" && getEntryLevel(entry) === 1) ||
        (filter === "LEVEL_2" && getEntryLevel(entry) === 2) ||
        (filter === "LEVEL_3" && getEntryLevel(entry) >= 3) ||
        (filter === "BERAKHIR_DEKAT" && isDueSoon(entry));
      const matchesQuery =
        !normalizedQuery ||
        [
          entry.name,
          entry.email,
          entry.userId,
          entry.phone,
          entry.reason,
          entry.unit,
          entry.levelLabel,
          entry.until,
        ]
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
    <section className="overflow-hidden rounded-[1.35rem] border border-[#d8e4de] bg-white shadow-[0_26px_76px_-62px_rgba(8,69,50,0.44)]">
      <div className="border-b border-[#edf2ee] p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-headline text-lg font-black tracking-[-0.02em] text-[#13211c]">
              Pembatasan Unit
            </h2>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              Ledger blacklist buyer di unit ini berdasarkan level pelanggaran
              real dari sistem.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-[0.68rem] font-black uppercase tracking-[0.12em]">
            <span className="inline-flex items-center gap-2 rounded-lg bg-[#e7f4ed] px-3 py-1.5 text-[#005f3e] ring-1 ring-[#cfe7d8]">
              <ShieldAlert className="size-3.5" />
              {metrics.active} aktif
            </span>
            <span className="inline-flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-1.5 text-rose-700 ring-1 ring-rose-100">
              <ShieldBan className="size-3.5" />
              Level 3: {metrics.levelThree}
            </span>
            <span className="inline-flex items-center gap-2 rounded-lg bg-[#f3f4f6] px-3 py-1.5 text-slate-500 ring-1 ring-slate-200">
              <CalendarClock className="size-3.5" />
              {metrics.recent} insiden 7 hari
            </span>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#0a6a49]/42" />
            <Input
              className="h-12 rounded-[1.05rem] border-[#dbe7df] bg-[#fbfcfb] pl-12 text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] focus:bg-white focus-visible:ring-2 focus-visible:ring-[#0a6a49]/15"
              placeholder="Cari nama, email, unit, level, atau alasan..."
              value={query}
              onChange={(event) => {
                const value = event.target.value;
                startTransition(() => setQuery(value));
              }}
            />
          </div>

          <div className="admin-choice-shell flex flex-wrap gap-2 rounded-[1.15rem] p-1">
            {filters.map((option) => {
              const active = filter === option.id;

              return (
                <button
                  aria-pressed={active}
                  className="admin-choice-button inline-flex items-center gap-2 rounded-[0.92rem] px-3 py-2 text-[0.72rem] font-black uppercase tracking-[0.12em]"
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

      {entries.length === 0 ? (
        <div className="p-4 sm:p-5">
          <EmptyState
            className="p-6"
            description="Daftar ini akan terisi otomatis ketika ada akun yang perlu pembatasan dari unit ini."
            icon={ShieldBan}
            title="Belum ada akun yang dibatasi"
          />
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="p-4 sm:p-5">
          <EmptyState
            className="p-6"
            description="Ubah kata kunci atau filter untuk melihat daftar pelanggaran lain."
            icon={SearchX}
            title="Data tidak ditemukan"
          />
        </div>
      ) : (
        <>
          <div className="hidden grid-cols-[minmax(13rem,1.15fr)_minmax(9rem,0.65fr)_minmax(11rem,0.75fr)_minmax(13rem,0.9fr)_7rem] gap-4 border-b border-[#edf2ee] bg-[#fbfcfb] px-5 py-3 text-[0.68rem] font-black uppercase tracking-[0.14em] text-[#536279] lg:grid">
            <div>Pengguna</div>
            <div>Unit</div>
            <div>Tingkat Pelanggaran</div>
            <div>Masa Pembatasan</div>
            <div className="text-right">Aksi</div>
          </div>

          <div className="divide-y divide-[#edf2ee]">
            {pagination.visibleItems.map((entry) => {
              const countdownTarget = getCountdownTarget(entry);
              const ruleDeadline = getRuleDeadline(entry);
              const level = getEntryLevel(entry);
              const meta = getRestrictionLevelMeta(level);

              return (
                <article
                  className="grid gap-4 px-4 py-4 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#fbfcfb] lg:grid-cols-[minmax(13rem,1.15fr)_minmax(9rem,0.65fr)_minmax(11rem,0.75fr)_minmax(13rem,0.9fr)_7rem] lg:items-center sm:px-5"
                  key={entry.userId}
                >
                  <div className="flex min-w-0 items-start gap-3 lg:items-center">
                    <span
                      className={cn(
                        "grid size-10 shrink-0 place-items-center rounded-full text-sm font-black ring-1",
                        meta.avatar,
                      )}
                    >
                      {getInitials(entry.name || "User")}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-headline text-sm font-black tracking-[-0.01em] text-[#111827]">
                        {entry.name}
                      </p>
                      <p className="mt-1 break-all text-xs font-semibold text-[#42526b]">
                        {entry.email || entry.userId}
                      </p>
                      {entry.phone && entry.phone !== "-" ? (
                        <p className="mt-1 truncate text-[0.68rem] font-semibold text-[#64748b]">
                          {entry.phone}
                        </p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap gap-2 lg:hidden">
                        <RestrictionPill entry={entry} />
                        <LevelPill entry={entry} />
                      </div>
                    </div>
                  </div>

                  <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[#42526b]">
                    <Building2 className="size-4 shrink-0 text-[#536279]" />
                    <span className="truncate">{entry.unit ?? "Unit ini"}</span>
                  </div>

                  <div>
                    <span
                      className={cn(
                        "inline-flex min-w-[9.1rem] justify-center rounded-md px-3 py-1.5 text-xs font-black",
                        meta.badge,
                      )}
                    >
                      {meta.label}
                    </span>
                    <p className="mt-1 text-[0.68rem] font-bold text-muted-foreground">
                      {Number(entry.violations ?? 0)} pelanggaran
                    </p>
                  </div>

                  <div>
                    {countdownTarget ? (
                      <AdminLiveCountdown
                        className="text-xs font-black text-[#42526b]"
                        expiredLabel="Masa pembatasan berakhir"
                        fallbackLabel={
                          ruleDeadline
                            ? formatShortDate(ruleDeadline)
                            : entry.until ?? getLevelDuration(level)
                        }
                        prefix="Sisa waktu"
                        serverNow={new Date().toISOString()}
                        targetAt={countdownTarget}
                      />
                    ) : (
                      <p className="text-xs font-black text-[#42526b]">
                        {isActiveRestriction(entry)
                          ? ruleDeadline
                            ? formatShortDate(ruleDeadline)
                            : entry.until ?? "-"
                          : "Pembatasan selesai"}
                      </p>
                    )}
                    <p className="mt-1 flex items-center gap-1.5 text-[0.68rem] font-semibold text-muted-foreground">
                      <Gavel className={cn("size-3.5", meta.text)} />
                      {Number(entry.unpaidAuctionCount ?? 0)} jejak lelang
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-start gap-3 lg:justify-end">
                    <Link
                      className="inline-flex items-center gap-2 text-sm font-black text-[#005f3e] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-[#003d27] active:scale-[0.98]"
                      href={`/admin/blacklist/${entry.userId}`}
                    >
                      <Eye className="size-4" />
                      Detail
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      {filteredEntries.length > 0 ? (
        <AdminPaginationFooter
          itemLabel="akun"
          pageIndex={pagination.pageIndex}
          pageSize={pagination.pageSize}
          totalItems={pagination.totalItems}
          onPageIndexChange={pagination.setPageIndex}
          onPageSizeChange={pagination.setPageSize}
        />
      ) : null}
    </section>
  );
}
