"use client";

import Image from "next/image";
import Link from "next/link";
import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CalendarClock,
  CarFront,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FilePlus2,
  Gavel,
  Gem,
  Landmark,
  Layers3,
  ListChecks,
  Medal,
  MonitorSmartphone,
  Package2,
  PackageCheck,
  Printer,
  RefreshCw,
  ReceiptText,
  ScrollText,
  Search,
  ShieldCheck,
  UserRound,
  XCircle
} from "lucide-react";

import { AdminPaginationFooter, useAdminPagination } from "@/components/admin/admin-pagination";
import { AdminSelect } from "@/components/admin/admin-select";
import { DetailActionLink } from "@/components/shared/detail-action-link";
import { Input } from "@/components/ui/input";
import {
  isAdminInventoryDueSoon,
  isAdminInventoryListItem,
  isAdminInventoryReadyForMarketing
} from "@/lib/admin-unit/operational-metrics";
import { getBarangSpecificationRows } from "@/lib/admin-unit/specifications";
import { ADMIN_UNIT_CATEGORY_OPTIONS } from "@/lib/catalog/categories";
import { currency } from "@/lib/formatters/currency";
import { cn } from "@/lib/utils";

type AdminInventoryItem = Record<string, any>;

type AdminBarangHistoryEntry = {
  id: string;
  barangId: string;
  barangCode: string;
  barangName: string;
  category?: string;
  condition?: string;
  description?: string | null;
  specifications?: unknown;
  ownerName: string;
  customerNumber: string;
  actionKey: "input_baru" | "perpanjangan" | "ditebus" | "dipasarkan" | "terjual" | "gagal";
  actionLabel: string;
  actionTone: "default" | "success" | "warning" | "danger";
  note: string;
  actorName: string;
  actorRole?: string | null;
  createdAt: string;
  createdAtLabel: string;
};

const ADMIN_HISTORY_CATEGORY_LABELS = new Map(
  ADMIN_UNIT_CATEGORY_OPTIONS.map((option) => [String(option.value), option.label])
);

function getInventoryDaysUntil(dateLabel: string | null | undefined) {
  if (!dateLabel || dateLabel === "-") return null;

  const date = new Date(`${dateLabel}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;

  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const targetUtc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

  return Math.ceil((targetUtc - todayUtc) / 86_400_000);
}

function parseInventoryDueDate(value: unknown) {
  if (typeof value !== "string" || !value.trim() || value === "-") {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getInventoryDueCopy(dateLabel: string | null | undefined) {
  const days = getInventoryDaysUntil(dateLabel);

  if (days === null) return "-";
  if (days < 0) return `Lewat ${Math.abs(days)} hari`;
  if (days === 0) return "Jatuh tempo hari ini";
  return `${days} hari lagi`;
}

const historyToneClasses: Record<AdminBarangHistoryEntry["actionTone"], string> = {
  default: "border-[#cfe0ff] bg-[#eef5ff] text-[#2563eb]",
  success: "border-[#bbf7d0] bg-[#ecfdf3] text-[#047857]",
  warning: "border-[#fde68a] bg-[#fff8e5] text-[#a16207]",
  danger: "border-[#fecaca] bg-[#fff1f2] text-[#be123c]"
};

const historyActionToneClasses: Partial<Record<AdminBarangHistoryEntry["actionKey"], string>> = {
  input_baru: "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]",
  perpanjangan: "border-[#fde68a] bg-[#fffbeb] text-[#a16207]",
  ditebus: "border-[#ddd6fe] bg-[#f5f3ff] text-[#6d28d9]",
  dipasarkan: "border-[#99f6e4] bg-[#ecfdfa] text-[#0f766e]",
  terjual: "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]",
  gagal: "border-[#fecaca] bg-[#fff1f2] text-[#be123c]"
};

function getHistoryStatusClasses(entry: AdminBarangHistoryEntry) {
  return historyActionToneClasses[entry.actionKey] ?? historyToneClasses[entry.actionTone];
}

const historyIconMap: Record<AdminBarangHistoryEntry["actionKey"], typeof FilePlus2> = {
  input_baru: FilePlus2,
  perpanjangan: CalendarClock,
  ditebus: ReceiptText,
  dipasarkan: Gavel,
  terjual: PackageCheck,
  gagal: XCircle
};

const historyFilterOptions: Array<{ value: "SEMUA" | AdminBarangHistoryEntry["actionKey"]; label: string }> = [
  { value: "SEMUA", label: "Semua Proses" },
  { value: "input_baru", label: "Barang Masuk" },
  { value: "perpanjangan", label: "Perpanjang" },
  { value: "ditebus", label: "Tebus" },
  { value: "dipasarkan", label: "Dipasarkan" },
  { value: "terjual", label: "Terjual" },
  { value: "gagal", label: "Gagal" }
];

const inventoryFilterOptions = [
  { value: "SEMUA", label: "Semua Barang", icon: Package2 },
  { value: "SIAP_DIPASARKAN", label: "Siap Dipasarkan", icon: PackageCheck },
  { value: "JATUH_TEMPO_DEKAT", label: "Jatuh Tempo Dekat", icon: CalendarClock }
] as const;

function formatDisplayLabel(value: unknown) {
  const normalized = String(value ?? "-")
    .replace(/_/g, " ")
    .trim();

  if (!normalized || normalized === "-") {
    return "-";
  }

  return normalized
    .toLowerCase()
    .replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
}

function getCategoryIcon(category: unknown) {
  const normalized = String(category ?? "").toLowerCase();

  if (normalized.includes("emas") || normalized.includes("perhias")) {
    return Gem;
  }
  if (normalized.includes("logam")) {
    return Medal;
  }
  if (normalized.includes("kendara") || normalized.includes("motor") || normalized.includes("mobil")) {
    return CarFront;
  }
  if (normalized.includes("elektronik") || normalized.includes("televisi") || normalized.includes("gadget")) {
    return MonitorSmartphone;
  }
  return Package2;
}

function normalizeSearchValue(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function getHistoryCategoryDetail(entry: AdminBarangHistoryEntry) {
  const specs = getBarangSpecificationRows(entry.category ?? "", entry.specifications ?? {});
  const preferred = specs.find((row) =>
    ["jenis", "model", "tipe", "merek", "bentuk"].some((keyword) => row.label.toLowerCase().includes(keyword))
  );

  return preferred?.value ?? formatDisplayLabel(entry.condition ?? "");
}

function parseHistoryDate(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function sameCalendarDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

const timelineFilterOptions = [
  { value: "all", label: "Semua Waktu", icon: CalendarClock },
  { value: "today", label: "Hari Ini", icon: Clock3 },
  { value: "7days", label: "7 Hari Terakhir", icon: CalendarClock },
  { value: "30days", label: "30 Hari Terakhir", icon: CalendarClock },
  { value: "3months", label: "Beberapa Bulan Terakhir (3 Bln)", icon: CalendarClock },
  { value: "year", label: "Tahun Terakhir", icon: CalendarClock }
] as const;

type TimelineFilter = (typeof timelineFilterOptions)[number]["value"] | "date";

const dayLabels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function buildCalendarCells(month: Date) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const firstDayOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: Array<number | null> = Array.from({ length: firstDayOffset }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day);
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function getInitialCalendarMonth(history: AdminBarangHistoryEntry[]) {
  const firstDate = history.map((entry) => parseHistoryDate(entry.createdAt)).find((date): date is Date => Boolean(date));
  const source = firstDate ?? new Date();
  return new Date(source.getFullYear(), source.getMonth(), 1);
}

function timelineLabel(filter: TimelineFilter, selectedDate: Date | null) {
  if (filter === "date" && selectedDate) {
    return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(selectedDate);
  }

  return timelineFilterOptions.find((option) => option.value === filter)?.label ?? "Semua Waktu";
}

function matchesTimelineFilter(entry: AdminBarangHistoryEntry, filter: TimelineFilter, selectedDate: Date | null) {
  if (filter === "all") return true;

  const entryDate = parseHistoryDate(entry.createdAt);
  if (!entryDate) return false;

  if (filter === "date") {
    return selectedDate ? sameCalendarDay(entryDate, selectedDate) : true;
  }

  const now = new Date();
  const today = startOfDay(now);

  if (filter === "today") {
    return sameCalendarDay(entryDate, now);
  }

  const daysBack = filter === "7days" ? 7 : filter === "30days" ? 30 : filter === "3months" ? 92 : 365;
  const threshold = new Date(today);
  threshold.setDate(today.getDate() - daysBack);

  return entryDate >= threshold;
}

function InventoryHistoryList({
  entries,
  onSortTime,
  sortDirection
}: {
  entries: AdminBarangHistoryEntry[];
  onSortTime: () => void;
  sortDirection: "asc" | "desc";
}) {
  const TimeSortIcon = sortDirection === "desc" ? ArrowDown : ArrowUp;
  const historyGridTemplate =
    "lg:grid-cols-[minmax(12.5rem,1.12fr)_9.1rem_minmax(10.8rem,0.9fr)_8.8rem_minmax(10.4rem,0.82fr)_minmax(12.8rem,1fr)_6.7rem]";

  return (
    <div>
      <div
        className={cn(
          "hidden gap-2.5 border-b border-[#e4ece7] bg-[#fbfcfa] text-[0.68rem] font-black uppercase tracking-[0.14em] text-[#344c40]/72 lg:grid",
          historyGridTemplate
        )}
      >
        <div className="px-3 py-3.5 lg:pl-[0.5rem]">Informasi Barang</div>
        <div className="px-2 py-3.5">Kategori</div>
        <div className="px-2.5 py-3.5 text-center">Nasabah Pemilik</div>
        <div className="grid place-items-center px-0 py-3.5 text-center">Status</div>
        <div className="grid place-items-center px-0 py-3.5 text-center">Aktor Internal</div>
        <div className="px-3.5 py-3.5">
          <button
            aria-label={`Urutkan Waktu Proses ${sortDirection === "desc" ? "terlama dulu" : "terbaru dulu"}`}
            className="inline-flex items-center gap-1.5 rounded-lg text-inherit outline-none transition duration-300 hover:text-[#0a6a49] focus-visible:ring-2 focus-visible:ring-[#0a6a49]/16"
            type="button"
            onClick={onSortTime}
          >
            Waktu Proses
            <TimeSortIcon aria-hidden="true" className="size-3.5 text-[#0a6a49]" strokeWidth={2.4} />
          </button>
        </div>
        <div className="grid place-items-center px-0 py-3.5 text-center">Aksi</div>
      </div>
      {entries.length > 0 ? (
        entries.map((entry) => {
          const ActionIcon = historyIconMap[entry.actionKey];
          const CategoryIcon = getCategoryIcon(entry.category);
          const categoryLabel = formatDisplayLabel(entry.category ?? "lainnya");
          const categoryDetail = getHistoryCategoryDetail(entry);

          return (
            <div
              className={cn(
                "grid gap-2.5 border-b border-[#e4ece7] px-3.5 py-4 text-[0.82rem] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#fbfaf6] lg:items-center",
                historyGridTemplate
              )}
              key={entry.id}
            >
              <div className="min-w-0 lg:pl-2">
                <p className="min-w-0 font-black tracking-[-0.02em] text-[#13211c]">{entry.barangName}</p>
                <p className="mt-1 truncate font-mono text-[0.68rem] font-black uppercase tracking-[0.03em] text-[#52655d]">
                  {entry.barangCode}
                </p>
              </div>

              <div className="min-w-0 lg:-ml-1">
                <div className="flex items-center gap-2">
                  <span className="grid size-8 shrink-0 place-items-center rounded-xl border border-[#d8e7de] bg-[#f5f8f6] text-[#0a6a49]">
                    <CategoryIcon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[0.78rem] font-black text-[#13211c]">{categoryLabel}</p>
                    <p className="truncate text-[0.72rem] font-semibold text-[#52655d]">{categoryDetail || "-"}</p>
                  </div>
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex min-w-0 items-start gap-2 lg:justify-center">
                  <UserRound className="mt-0.5 size-4 shrink-0 text-[#0a6a49]" />
                  <div className="min-w-0 lg:max-w-[8.6rem]">
                    <p className="truncate font-black text-[#13211c]">{entry.ownerName}</p>
                    <p className="mt-0.5 truncate text-[0.72rem] font-semibold text-[#52655d]">{entry.customerNumber || "-"}</p>
                  </div>
                </div>
              </div>

              <div className="flex min-w-0 items-start gap-3 lg:grid lg:place-items-center">
                <span className="grid size-10 shrink-0 place-items-center rounded-[0.95rem] bg-[#f0f5f0] text-[#0a6a49] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] lg:hidden">
                  <ActionIcon className="size-4.5" />
                </span>
                <div className="min-w-0 lg:min-w-0 lg:pt-0.5">
                  <div
                    className={cn(
                      "inline-flex min-w-[7.5rem] max-w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-[0.06em]",
                      getHistoryStatusClasses(entry)
                    )}
                  >
                    <span className="size-1.5 shrink-0 rounded-full bg-current" />
                    {entry.actionLabel}
                  </div>
                </div>
              </div>

              <div className="min-w-0 text-left lg:grid lg:place-items-center lg:text-center">
                <p
                  className="w-full max-w-[10rem] truncate text-[0.78rem] font-black tracking-[-0.01em] text-[#13211c]"
                  title={entry.actorName || "Sistem Otomatis"}
                >
                  {entry.actorName || "Sistem Otomatis"}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-[0.82rem] font-black leading-5 text-[#13211c]">{entry.createdAtLabel}</p>
                <p className="mt-1 text-[0.72rem] font-semibold text-[#52655d]">{entry.note}</p>
              </div>

              <div className="flex justify-start lg:grid lg:place-items-center">
                <DetailActionLink
                  href={`/admin/barang/${entry.barangId}`}
                />
              </div>
            </div>
          );
        })
      ) : (
        <div className="px-5 py-12 text-center text-sm text-black/55">
          <p className="font-headline text-xl font-black text-black/80">Belum ada riwayat yang cocok.</p>
          <p className="mt-2">Ubah kata kunci, proses, kategori, atau linimasa agar catatan kembali muncul.</p>
        </div>
      )}
    </div>
  );
}

function HistoryPrintDocument({
  actionFilter,
  categoryFilter,
  entries,
  generatedAtLabel,
  selectedDate,
  sortDirection,
  timelineFilter,
  totalEntries
}: {
  actionFilter: "SEMUA" | AdminBarangHistoryEntry["actionKey"];
  categoryFilter: string;
  entries: AdminBarangHistoryEntry[];
  generatedAtLabel: string;
  selectedDate: Date | null;
  sortDirection: "asc" | "desc";
  timelineFilter: TimelineFilter;
  totalEntries: number;
}) {
  const actionStats = historyFilterOptions
    .filter((option) => option.value !== "SEMUA")
    .map((option) => ({
      label: option.label,
      value: entries.filter((entry) => entry.actionKey === option.value).length
    }));
  const activeActionLabel =
    historyFilterOptions.find((option) => option.value === actionFilter)?.label ?? "Semua Proses";
  const activeCategoryLabel = categoryFilter === "SEMUA" ? "Semua Kategori" : formatDisplayLabel(categoryFilter);
  const sortLabel = sortDirection === "desc" ? "Terbaru ke terlama" : "Terlama ke terbaru";
  const reportNumber = `RWB-${new Date().getFullYear()}-${String(totalEntries).padStart(3, "0")}`;

  return (
    <article
      className="admin-history-print-document hidden bg-white text-[#10251c] print:block"
      data-testid="admin-history-print-document"
    >
      <header className="break-inside-avoid rounded-[1.45rem] border border-[#c2ddc8] bg-[linear-gradient(100deg,#00513d_0%,#056a49_58%,#b29216_100%)] px-6 py-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
        <div className="admin-history-print-header-grid grid gap-5 print:grid-cols-[minmax(0,1fr)_15.75rem] print:items-start lg:grid-cols-[minmax(0,1fr)_15.75rem] lg:items-start">
          <div className="flex min-w-0 items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-[1rem] bg-white text-[#0a6a49]">
              <Landmark className="size-6" />
            </span>
            <div className="min-w-0">
              <p className="whitespace-normal break-words text-[0.58rem] font-black uppercase leading-4 tracking-[0.32em] text-white/82">
                Ruang Agunan
              </p>
              <h1 className="mt-2 whitespace-normal break-words font-headline text-[1.58rem] font-black leading-tight tracking-[-0.02em]">
                Laporan Riwayat Barang
              </h1>
              <p className="mt-1.5 max-w-[46rem] whitespace-normal break-words text-[0.76rem] font-semibold leading-5 text-white/88">
                Dokumen audit aktivitas barang admin unit berdasarkan filter, kategori, dan urutan waktu yang sedang
                aktif.
              </p>
            </div>
          </div>

          <div className="relative rounded-[1rem] bg-[linear-gradient(135deg,rgba(245,246,198,0.30),rgba(185,165,58,0.36))] p-3 text-[0.66rem] font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] ring-1 ring-white/18">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-7 rounded-t-[1rem] bg-[rgba(255,255,255,0.14)]" />
            <div className="relative">
              <p className="whitespace-normal break-words text-[0.57rem] font-black uppercase leading-4 tracking-[0.22em] text-white">
                Dokumen Audit Unit
              </p>
              <dl className="mt-2.5 space-y-2">
                <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2">
                  <dt className="text-white/74">Nomor</dt>
                  <dd className="break-words text-right font-black text-white">{reportNumber}</dd>
                </div>
                <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2">
                  <dt className="text-white/74">Dicetak</dt>
                  <dd className="break-words text-right font-black text-white">{generatedAtLabel}</dd>
                </div>
                <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2">
                  <dt className="text-white/74">Data</dt>
                  <dd className="break-words text-right font-black text-white">
                    {entries.length} dari {totalEntries}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </header>

      <section className="admin-history-print-metrics-grid mt-3 grid break-inside-avoid gap-3 print:grid-cols-4 lg:grid-cols-4">
        {[
          { icon: ListChecks, label: "Catatan Dicetak", value: entries.length },
          { icon: Layers3, label: "Total Aktivitas", value: totalEntries },
          { icon: ShieldCheck, label: "Proses Aktif", value: activeActionLabel },
          { icon: Clock3, label: "Urutan Waktu", value: sortLabel }
        ].map((metric) => {
          const Icon = metric.icon;

          return (
            <div className="rounded-[1rem] border border-[#d7e8dd] bg-[#fbfdfb] px-4 py-3" key={metric.label}>
              <div className="flex items-center gap-2 text-[#0a6a49]">
                <Icon className="size-3.5 shrink-0" />
                <p className="whitespace-normal break-words text-[0.54rem] font-black uppercase leading-4 tracking-[0.2em] text-[#52655d]">
                  {metric.label}
                </p>
              </div>
              <p className="mt-2 whitespace-normal break-words text-[0.98rem] font-black leading-snug text-[#13211c]">
                {metric.value}
              </p>
            </div>
          );
        })}
      </section>

      <section className="mt-3 break-inside-avoid rounded-[1rem] border border-[#d7e8dd] bg-[#fbfdfb] px-4 py-3">
        <div className="admin-history-print-filter-grid grid gap-4 print:grid-cols-[1fr_1fr_1fr_1.35fr] lg:grid-cols-[1fr_1fr_1fr_1.35fr]">
          <div>
            <p className="whitespace-normal break-words text-[0.54rem] font-black uppercase leading-4 tracking-[0.2em] text-[#6c7c73]">
              Periode
            </p>
            <p className="mt-1 whitespace-normal break-words text-[0.72rem] font-bold leading-5 text-[#13211c]">
              {timelineLabel(timelineFilter, selectedDate)}
            </p>
          </div>
          <div>
            <p className="whitespace-normal break-words text-[0.54rem] font-black uppercase leading-4 tracking-[0.2em] text-[#6c7c73]">
              Proses
            </p>
            <p className="mt-1 whitespace-normal break-words text-[0.72rem] font-bold leading-5 text-[#13211c]">
              {activeActionLabel}
            </p>
          </div>
          <div>
            <p className="whitespace-normal break-words text-[0.54rem] font-black uppercase leading-4 tracking-[0.2em] text-[#6c7c73]">
              Kategori
            </p>
            <p className="mt-1 whitespace-normal break-words text-[0.72rem] font-bold leading-5 text-[#13211c]">
              {activeCategoryLabel}
            </p>
          </div>
          <div>
            <p className="whitespace-normal break-words text-[0.54rem] font-black uppercase leading-4 tracking-[0.2em] text-[#6c7c73]">
              Komposisi
            </p>
            <p className="mt-1 whitespace-normal break-words text-[0.72rem] font-bold leading-5 text-[#13211c]">
              {actionStats.map((stat) => `${stat.label}: ${stat.value}`).join(" | ")}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-[#d7e8dd]">
        <table className="admin-history-print-table w-full table-fixed border-collapse text-left">
          <thead className="bg-[#eff7f1] text-[0.58rem] uppercase tracking-[0.16em] text-[#344c40]">
            <tr>
              <th className="w-[3rem] px-3 py-3">#</th>
              <th className="px-3 py-3">Informasi Barang</th>
              <th className="w-[10.5rem] px-3 py-3">Kategori</th>
              <th className="w-[11.5rem] px-3 py-3">Nasabah</th>
              <th className="w-[8.8rem] px-3 py-3">Status</th>
              <th className="w-[10.5rem] px-3 py-3">Aktor Internal</th>
              <th className="w-[14.5rem] px-3 py-3">Waktu Proses</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#dfe9e3] text-[0.72rem]">
            {entries.length > 0 ? (
              entries.map((entry, index) => (
                <tr className="break-inside-avoid bg-white align-top" key={entry.id}>
                  <td className="px-3 py-3 font-black text-[#0a6a49]">{index + 1}</td>
                  <td className="px-3 py-3">
                    <p className="whitespace-normal break-words font-black text-[#13211c]">{entry.barangName}</p>
                    <p className="mt-1 whitespace-normal break-words font-mono text-[0.62rem] font-black text-[#52655d]">
                      {entry.barangCode}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="whitespace-normal break-words font-black text-[#13211c]">
                      {formatDisplayLabel(entry.category ?? "lainnya")}
                    </p>
                    <p className="mt-1 whitespace-normal break-words text-[0.68rem] font-semibold text-[#52655d]">
                      {getHistoryCategoryDetail(entry) || "-"}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="whitespace-normal break-words font-black text-[#13211c]">{entry.ownerName}</p>
                    <p className="mt-1 whitespace-normal break-words text-[0.66rem] font-semibold text-[#52655d]">
                      {entry.customerNumber || "-"}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={cn(
                        "admin-history-print-status inline-flex whitespace-normal break-words rounded-full border px-2.5 py-1 text-[0.58rem] font-black uppercase tracking-[0.08em]",
                        getHistoryStatusClasses(entry)
                      )}
                    >
                      {entry.actionLabel}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <p className="whitespace-normal break-words font-black text-[#13211c]">
                      {entry.actorName || "Sistem Otomatis"}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="whitespace-normal break-words font-black leading-5 text-[#13211c]">
                      {entry.createdAtLabel}
                    </p>
                    <p className="mt-1 whitespace-normal break-words text-[0.68rem] font-semibold leading-5 text-[#52655d]">
                      {entry.note}
                    </p>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-8 text-center text-sm font-bold text-[#52655d]" colSpan={7}>
                  Tidak ada catatan yang cocok dengan filter laporan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <footer className="mt-4 grid gap-5 border-t border-[#d7e8dd] pt-4 text-[0.68rem] font-semibold text-[#52655d] lg:grid-cols-[minmax(0,1fr)_14rem]">
        <p className="whitespace-normal break-words leading-5">
          Dokumen ini dihasilkan otomatis dari sistem Ruang Agunan berdasarkan catatan riwayat barang yang
          tersimpan pada unit aktif.
        </p>
        <div className="text-right">
          <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-[#0a6a49]">Admin Unit</p>
          <div className="mt-10 border-t border-[#9fb8ab] pt-2 text-[0.58rem] font-semibold text-[#6c7c73]">
            Tanda tangan / validasi
          </div>
        </div>
      </footer>
    </article>
  );
}

export function AdminInventoryWorkspace({ items }: { items: AdminInventoryItem[] }) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("SEMUA");
  const [inventoryFilter, setInventoryFilter] = useState<(typeof inventoryFilterOptions)[number]["value"]>("SEMUA");
  const [dueDateSortDirection, setDueDateSortDirection] = useState<"asc" | "desc">("asc");
  const deferredQuery = useDeferredValue(query);
  const inventoryItems = useMemo(() => items.filter(isAdminInventoryListItem), [items]);

  const categories = useMemo(() => {
    return ["SEMUA", ...new Set(inventoryItems.map((item) => String(item.category ?? "").trim()).filter(Boolean))];
  }, [inventoryItems]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return inventoryItems.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        [item.code, item.name, item.ownerName, item.customerNumber, item.category, item.condition]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery));

      const matchesCategory =
        categoryFilter === "SEMUA" || String(item.category).toLowerCase() === categoryFilter.toLowerCase();
      const matchesInventoryFilter =
        inventoryFilter === "SEMUA" ||
        (inventoryFilter === "SIAP_DIPASARKAN" && isAdminInventoryReadyForMarketing(item)) ||
        (inventoryFilter === "JATUH_TEMPO_DEKAT" && isAdminInventoryDueSoon(item));

      return matchesQuery && matchesCategory && matchesInventoryFilter;
    });
  }, [categoryFilter, deferredQuery, inventoryFilter, inventoryItems]);
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((left, right) => {
      const leftTime = parseInventoryDueDate(left.dueDate)?.getTime();
      const rightTime = parseInventoryDueDate(right.dueDate)?.getTime();

      if (leftTime == null && rightTime == null) {
        return String(left.code ?? "").localeCompare(String(right.code ?? ""), "id");
      }
      if (leftTime == null) return 1;
      if (rightTime == null) return -1;

      const direction = dueDateSortDirection === "desc" ? -1 : 1;

      return (leftTime - rightTime) * direction || String(left.code ?? "").localeCompare(String(right.code ?? ""), "id");
    });
  }, [dueDateSortDirection, filteredItems]);
  const pagination = useAdminPagination(sortedItems, `${categoryFilter}-${inventoryFilter}-${dueDateSortDirection}-${deferredQuery}`);
  const DueDateSortIcon = dueDateSortDirection === "desc" ? ArrowDown : ArrowUp;

  return (
    <section className="overflow-hidden rounded-[2rem] bg-white shadow-[0_28px_90px_-64px_rgba(8,69,50,0.48)] ring-1 ring-[#cfe5d6]">
      <div className="border-b border-[#dce9df] bg-[linear-gradient(180deg,rgba(251,250,245,0.96),rgba(255,255,255,0.98))] p-4 sm:p-5">
        <div className="grid gap-3 xl:grid-cols-[minmax(22rem,1fr)_15rem]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#0a6a49]/42" />
            <Input
              className="h-12 rounded-[1.35rem] border-0 bg-[#f4f3ef] pl-12 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] focus:bg-white focus-visible:ring-2 focus-visible:ring-[#0a6a49]/15 sm:text-base"
              placeholder="Cari kode, nama barang, nasabah, atau nomor nasabah..."
              value={query}
              onChange={(event) => {
                const value = event.target.value;
                startTransition(() => setQuery(value));
              }}
            />
          </div>
          <AdminSelect
            ariaLabel="Filter kategori barang"
            className="w-full"
            options={categories.map((category) => ({
              value: category,
              label: category === "SEMUA" ? "Semua Kategori" : formatDisplayLabel(category)
            }))}
            value={categoryFilter}
            onValueChange={setCategoryFilter}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-black/52">
          <div className="admin-choice-shell flex flex-wrap gap-2 rounded-[1.35rem] p-1">
            {inventoryFilterOptions.map((option) => {
              const active = inventoryFilter === option.value;
              const FilterIcon = option.icon;

              return (
                <button
                  className={cn(
                    "admin-choice-button inline-flex items-center gap-2 rounded-[1.05rem] px-3 py-2 text-[0.74rem] font-black uppercase tracking-[0.12em]"
                  )}
                  aria-pressed={active}
                  data-active={active}
                  key={option.value}
                  type="button"
                  onClick={() => setInventoryFilter(option.value)}
                >
                  <FilterIcon className="size-3.5" />
                  {option.label}
                </button>
              );
            })}
          </div>
          <span>
            Menampilkan <strong className="font-black text-black/78">{filteredItems.length}</strong> dari{" "}
            <strong className="font-black text-black/78">{inventoryItems.length}</strong> barang.
          </span>
        </div>
      </div>

      <div className="overflow-hidden">
        <table className="w-full table-fixed text-left">
          <thead className="bg-[#f7f5ef] text-[0.6rem] uppercase tracking-[0.13em] text-black/46 xl:text-[0.64rem]">
            <tr>
              <th className="w-[11%] px-3 py-4">Kode Barang</th>
              <th className="w-[15%] px-3 py-4">Barang</th>
              <th className="w-[12%] px-3 py-4">Kategori</th>
              <th className="w-[11%] px-3 py-4">Nama Nasabah</th>
              <th className="w-[9%] px-3 py-4">No. Nasabah</th>
              <th className="w-[10%] px-3 py-4">Tanggal Kredit</th>
              <th className="w-[11%] px-3 py-4">
                <button
                  aria-label={`Urutkan Jatuh Tempo ${dueDateSortDirection === "desc" ? "terdekat dulu" : "terjauh dulu"}`}
                  className="inline-flex items-center gap-1.5 rounded-lg text-inherit outline-none transition duration-300 hover:text-[#0a6a49] focus-visible:ring-2 focus-visible:ring-[#0a6a49]/16"
                  type="button"
                  onClick={() => setDueDateSortDirection((current) => (current === "desc" ? "asc" : "desc"))}
                >
                  Jatuh Tempo
                  <DueDateSortIcon aria-hidden="true" className="size-3.5 text-[#0a6a49]" strokeWidth={2.4} />
                </button>
              </th>
              <th className="w-[11%] px-3 py-4">Nilai Taksiran</th>
              <th className="w-[10%] px-3 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {pagination.visibleItems.length > 0 ? (
              pagination.visibleItems.map((item) => {
                const CategoryIcon = getCategoryIcon(item.category);

                return (
                <tr
                  className="border-t border-[#e0ebe3] text-[0.76rem] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#fbfaf5] xl:text-[0.82rem]"
                  key={item.id}
                >
                  <td className="px-3 py-3.5 align-middle">
                    <Link
                      className="block whitespace-normal break-all font-black leading-5 tracking-[-0.01em] text-[#0a6a49] transition hover:text-[#063f2f]"
                      href={`/admin/barang/${item.id}`}
                      title={item.code}
                    >
                      {item.code}
                    </Link>
                  </td>
                  <td className="px-3 py-3.5 align-middle">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="relative size-11 shrink-0 overflow-hidden rounded-xl border border-[#d6e7db] bg-[#edf4ef] shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
                        {item.previewImageUrl ? (
                          <Image
                            alt={item.name}
                            className="object-cover"
                            fill
                            sizes="44px"
                            src={item.previewImageUrl}
                          />
                        ) : (
                          <div className="grid size-full place-items-center text-[#0a6a49]/54">
                            <Package2 className="size-7" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-black/86">{item.name}</p>
                        <p className="mt-0.5 truncate text-[0.72rem] font-medium text-black/42">
                          {formatDisplayLabel(item.condition)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 align-middle">
                    <div className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[#f3f4ef] px-2.5 py-1 text-[0.68rem] font-semibold leading-4 text-black/62 xl:text-[0.72rem]">
                      <CategoryIcon className="size-3 shrink-0 text-[#0a6a49]" />
                      <span className="whitespace-normal break-words">{formatDisplayLabel(item.category)}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 align-middle">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-black/82">{item.ownerName}</p>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 align-middle">
                    <span className="block truncate font-semibold text-black/54">{item.customerNumber || "-"}</span>
                  </td>
                  <td className="px-3 py-3.5 align-middle">
                    <span className="block truncate text-black/62">{item.pawnedAt}</span>
                  </td>
                  <td className="px-3 py-3.5 align-middle">
                    <p className="font-semibold leading-5 text-black/78">{item.dueDate}</p>
                    <p
                      className={cn(
                        "mt-0.5 text-[0.72rem] font-bold leading-4",
                        (getInventoryDaysUntil(item.dueDate) ?? 99) <= 7 ? "text-amber-700" : "text-black/42",
                        (getInventoryDaysUntil(item.dueDate) ?? 1) < 0 && "text-rose-700"
                      )}
                    >
                      {getInventoryDueCopy(item.dueDate)}
                    </p>
                  </td>
                  <td className="px-3 py-3.5 align-middle">
                    <span className="block truncate font-semibold leading-5 text-black/78">
                      {currency.format(item.appraisalValue)}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-right align-middle">
                    <DetailActionLink
                      className="min-h-8 text-[0.7rem] xl:text-[0.74rem]"
                      href={`/admin/barang/${item.id}`}
                    />
                  </td>
                </tr>
                );
              })
            ) : (
              <tr>
                <td className="px-5 py-12 text-center text-sm text-black/55" colSpan={9}>
                  <div>
                    <p className="font-headline text-xl font-black text-black/80">Belum ada hasil yang cocok.</p>
                    <p className="mt-2">Ubah kata kunci atau filter agar daftar barang kembali muncul.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminPaginationFooter
        itemLabel="barang"
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
        totalItems={pagination.totalItems}
        onPageIndexChange={pagination.setPageIndex}
        onPageSizeChange={pagination.setPageSize}
      />
    </section>
  );
}

export function AdminInventoryHistoryWorkspace({ history }: { history: AdminBarangHistoryEntry[] }) {
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<"SEMUA" | AdminBarangHistoryEntry["actionKey"]>("SEMUA");
  const [categoryFilter, setCategoryFilter] = useState("SEMUA");
  const [timeSortDirection, setTimeSortDirection] = useState<"asc" | "desc">("desc");
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>("all");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => getInitialCalendarMonth(history));
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [printReportReady, setPrintReportReady] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const printDocumentTitleRef = useRef<string | null>(null);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    if (!datePickerOpen) return;

    function closeOnOutsidePointer(event: PointerEvent) {
      const target = event.target as Node;
      if (!popoverRef.current?.contains(target)) {
        setDatePickerOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDatePickerOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [datePickerOpen]);

  const categories = useMemo(() => {
    const masterCategories = ADMIN_UNIT_CATEGORY_OPTIONS.map((option) => String(option.value));
    const historyCategories = history.map((entry) => String(entry.category ?? "").trim()).filter(Boolean);
    const extraCategories = historyCategories.filter((category) => !masterCategories.includes(category));

    return ["SEMUA", ...masterCategories, ...Array.from(new Set(extraCategories))];
  }, [history]);

  const filteredHistory = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(deferredQuery);

    return history.filter((entry) => {
      const matchesAction = actionFilter === "SEMUA" || entry.actionKey === actionFilter;
      const matchesCategory =
        categoryFilter === "SEMUA" || normalizeSearchValue(entry.category) === normalizeSearchValue(categoryFilter);
      const matchesTimeline = matchesTimelineFilter(entry, timelineFilter, selectedDate);
      const matchesQuery =
        !normalizedQuery ||
        [
          entry.barangCode,
          entry.barangName,
          entry.category,
          entry.condition,
          entry.ownerName,
          entry.customerNumber,
          entry.actionLabel,
          entry.note,
          entry.actorName,
          entry.description
        ]
          .filter(Boolean)
          .some((value) => normalizeSearchValue(value).includes(normalizedQuery));

      return matchesAction && matchesCategory && matchesTimeline && matchesQuery;
    });
  }, [actionFilter, categoryFilter, deferredQuery, history, selectedDate, timelineFilter]);
  const sortedHistory = useMemo(() => {
    return [...filteredHistory].sort((left, right) => {
      const leftTime = parseHistoryDate(left.createdAt)?.getTime() ?? 0;
      const rightTime = parseHistoryDate(right.createdAt)?.getTime() ?? 0;
      const direction = timeSortDirection === "desc" ? -1 : 1;

      return (leftTime - rightTime) * direction;
    });
  }, [filteredHistory, timeSortDirection]);
  const pagination = useAdminPagination(
    sortedHistory,
    `${actionFilter}-${categoryFilter}-${timelineFilter}-${selectedDate?.toISOString() ?? "all"}-${timeSortDirection}-${deferredQuery}`
  );
  const calendarCells = useMemo(() => buildCalendarCells(calendarMonth), [calendarMonth]);
  const monthLabel = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(calendarMonth);
  const generatedAtLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(new Date()),
    []
  );
  const hasActiveFilter =
    query.trim() ||
    actionFilter !== "SEMUA" ||
    categoryFilter !== "SEMUA" ||
    timelineFilter !== "all" ||
    selectedDate;

  useEffect(() => {
    if (!printReportReady) return;

    function clearPrintReport() {
      if (printDocumentTitleRef.current !== null) {
        document.title = printDocumentTitleRef.current;
        printDocumentTitleRef.current = null;
      }
      setPrintReportReady(false);
    }

    window.addEventListener("afterprint", clearPrintReport);

    return () => {
      window.removeEventListener("afterprint", clearPrintReport);
    };
  }, [printReportReady]);

  function resetFilters() {
    setQuery("");
    setActionFilter("SEMUA");
    setCategoryFilter("SEMUA");
    setTimelineFilter("all");
    setSelectedDate(null);
  }

  function printHistoryReport() {
    setPrintReportReady(true);
    printDocumentTitleRef.current = document.title;
    document.title = " ";

    window.setTimeout(() => {
      try {
        window.print();
      } finally {
        if (printDocumentTitleRef.current !== null) {
          document.title = printDocumentTitleRef.current;
          printDocumentTitleRef.current = null;
        }
      }
    }, 0);
  }

  return (
    <section className="relative overflow-visible rounded-[2rem] bg-white shadow-[0_28px_90px_-64px_rgba(8,69,50,0.44)] ring-1 ring-[#d7e8dd] print:rounded-none print:bg-white print:shadow-none print:ring-0">
      <div className="print:hidden">
        <div className="relative z-30 rounded-t-[2rem] border-b border-[#dce9df] bg-[linear-gradient(180deg,#fffefb,#fbfcfa)] px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative min-w-0 xl:w-[38rem] xl:max-w-[58%]">
            <Search className="absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-[#0a6a49]/42" />
            <Input
              className="h-11 rounded-[1rem] border border-[#dce9df] bg-white pl-10 pr-3.5 text-[0.83rem] font-semibold shadow-[0_14px_30px_-28px_rgba(8,69,50,0.32)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] placeholder:text-black/36 focus:border-[#0a6a49]/38 focus:bg-white focus-visible:ring-4 focus-visible:ring-[#0a6a49]/8"
              placeholder="Cari barang, nasabah, atau staf penginput"
              value={query}
              onChange={(event) => {
                const value = event.target.value;
                startTransition(() => setQuery(value));
              }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 xl:justify-end">
            <button
              className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-[1rem] px-3.5 text-[0.76rem] font-black text-[#66756e] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white hover:text-[#006747] disabled:cursor-not-allowed disabled:opacity-45"
              disabled={!hasActiveFilter}
              type="button"
              onClick={resetFilters}
            >
              <RefreshCw className="size-3.5" />
              Reset Filter
            </button>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-[1rem] border border-[#dce9df] bg-white px-4 text-[0.78rem] font-black text-[#13211c] shadow-[0_14px_30px_-28px_rgba(8,69,50,0.32)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[#0a6a49]/30 hover:text-[#006747]"
              type="button"
              onClick={printHistoryReport}
            >
              <Printer className="size-5" />
              Cetak
            </button>
          </div>
        </div>

        <div className="mt-2.5 grid max-w-[53rem] gap-2.5 md:grid-cols-[17rem_15rem_16rem]">
          <div className="relative" ref={popoverRef}>
            <button
              className={cn(
                "flex h-11 w-full items-center justify-between gap-2.5 rounded-[1rem] border px-3.5 text-left text-[0.76rem] font-black shadow-[0_14px_30px_-28px_rgba(8,69,50,0.32)] outline-none transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:border-[#0a6a49]/55 focus-visible:ring-4 focus-visible:ring-[#0a6a49]/14",
                datePickerOpen || timelineFilter !== "all"
                  ? "border-[#0a6a49]/60 bg-[#f3fbf6] text-[#06472e] ring-4 ring-[#0a6a49]/10"
                  : "border-[#dce9df] bg-white text-[#13211c]"
              )}
              type="button"
              onClick={() => setDatePickerOpen((current) => !current)}
            >
              <span className="flex min-w-0 items-center gap-2">
                <CalendarClock className="size-4 shrink-0 text-[#0a6a49]" />
                <span className="whitespace-nowrap">Linimasa: {timelineLabel(timelineFilter, selectedDate)}</span>
              </span>
              <ChevronDown className={cn("size-4 shrink-0 transition duration-500", datePickerOpen && "rotate-180")} />
            </button>

            {datePickerOpen ? (
              <div className="absolute left-1/2 top-full z-[90] mt-2 grid w-[min(36.25rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-[1.55rem] border border-[#dcebe3] bg-white shadow-[0_30px_80px_-42px_rgba(0,70,48,0.38),0_8px_26px_-20px_rgba(0,0,0,0.18)] ring-1 ring-white/80 transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:left-1/2 sm:right-auto sm:grid-cols-[15rem_minmax(0,1fr)] xl:left-0 xl:translate-x-0">
                <div className="space-y-1 border-b border-[#edf2ef] bg-[#f8fbf8] p-2 sm:border-b-0 sm:border-r">
                  <p className="px-2 py-1 text-[0.6rem] font-black uppercase tracking-[0.2em] text-[#52655d]">
                    Shortcut Periode
                  </p>
                  {timelineFilterOptions.map((option) => {
                    const Icon = option.icon;
                    const active = timelineFilter === option.value && !selectedDate;

                    return (
                      <button
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-[0.76rem] font-bold outline-none transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:ring-2 focus-visible:ring-[#0a6a49]/14",
                          active ? "bg-[#ecf8f1] text-[#006747]" : "text-[#334155] hover:bg-white"
                        )}
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setTimelineFilter(option.value);
                          setSelectedDate(null);
                          setDatePickerOpen(false);
                        }}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <Icon className="size-4 shrink-0" />
                          <span className="truncate">{option.label}</span>
                        </span>
                        {active ? <Check className="size-4 shrink-0" /> : null}
                      </button>
                    );
                  })}
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between gap-4 border-b border-[#edf2ef] pb-3">
                    <button
                      aria-label="Bulan sebelumnya"
                      className="grid size-9 place-items-center rounded-full text-[#006747] outline-none transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#eef7f1] active:scale-95 focus-visible:ring-2 focus-visible:ring-[#0a6a49]/14"
                      type="button"
                      onClick={() =>
                        setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
                      }
                    >
                      <ChevronLeft className="size-4.5" strokeWidth={2} />
                    </button>
                    <p className="rounded-full px-4 py-2 text-center font-black tracking-[-0.01em] text-black/78">{monthLabel}</p>
                    <button
                      aria-label="Bulan berikutnya"
                      className="grid size-9 place-items-center rounded-full text-[#006747] outline-none transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#eef7f1] active:scale-95 focus-visible:ring-2 focus-visible:ring-[#0a6a49]/14"
                      type="button"
                      onClick={() =>
                        setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
                      }
                    >
                      <ChevronRight className="size-4.5" strokeWidth={2} />
                    </button>
                  </div>
                  <div className="mt-4 grid grid-cols-7 gap-0.5 text-center text-[0.62rem] font-black uppercase tracking-[0.08em] text-black/38">
                    {dayLabels.map((day) => (
                      <span className="py-1" key={day}>{day}</span>
                    ))}
                  </div>
                  <div className="mt-1.5 grid grid-cols-7 gap-0.5 text-center text-[0.78rem] font-bold">
                    {calendarCells.map((day, index) => {
                      if (!day) {
                        return <span aria-hidden="true" key={`empty-${index}`} />;
                      }

                      const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
                      const active = selectedDate ? sameCalendarDay(date, selectedDate) : false;

                      return (
                        <button
                          className={cn(
                            "mx-auto grid size-9 place-items-center rounded-full font-mono outline-none transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#eef7f1] hover:text-[#006747] active:scale-95 focus-visible:ring-2 focus-visible:ring-[#0a6a49]/14",
                            active && "bg-[#006747] text-white shadow-[0_14px_24px_-14px_rgba(0,103,71,0.72)] hover:bg-[#006747] hover:text-white"
                          )}
                          key={`${calendarMonth.toISOString()}-${day}`}
                          type="button"
                          onClick={() => {
                            setSelectedDate(date);
                            setTimelineFilter("date");
                            setDatePickerOpen(false);
                          }}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <AdminSelect
            ariaLabel="Filter proses riwayat barang"
            className="w-full [&_.admin-select-trigger]:h-11 [&_.admin-select-trigger]:rounded-[1rem] [&_.admin-select-trigger]:px-3.5 [&_.admin-select-trigger]:text-[0.76rem]"
            options={historyFilterOptions}
            value={actionFilter}
            onValueChange={(nextValue) => setActionFilter(nextValue as typeof actionFilter)}
          />
          <AdminSelect
            ariaLabel="Filter kategori riwayat barang"
            className="w-full [&_.admin-select-trigger]:h-11 [&_.admin-select-trigger]:rounded-[1rem] [&_.admin-select-trigger]:px-3.5 [&_.admin-select-trigger]:text-[0.76rem]"
            options={categories.map((category) => ({
              value: category,
              label:
                category === "SEMUA"
                  ? "Semua Kategori"
                  : (ADMIN_HISTORY_CATEGORY_LABELS.get(category) ?? formatDisplayLabel(category))
            }))}
            value={categoryFilter}
            onValueChange={setCategoryFilter}
          />
        </div>

        <div className="mt-3 flex justify-end text-[0.72rem] font-semibold text-[#52655d]">
          <span className="text-right">
            Menampilkan audit dari <strong className="font-black text-[#13211c]">{history.length}</strong> aktivitas barang unit.
          </span>
        </div>
      </div>

        <InventoryHistoryList
          entries={pagination.visibleItems}
          sortDirection={timeSortDirection}
          onSortTime={() => setTimeSortDirection((current) => (current === "desc" ? "asc" : "desc"))}
        />
        <AdminPaginationFooter
          itemLabel="catatan"
          pageIndex={pagination.pageIndex}
          pageSize={pagination.pageSize}
          totalItems={pagination.totalItems}
          onPageIndexChange={pagination.setPageIndex}
          onPageSizeChange={pagination.setPageSize}
        />
      </div>
      {printReportReady ? (
        <HistoryPrintDocument
          actionFilter={actionFilter}
          categoryFilter={categoryFilter}
          entries={sortedHistory}
          generatedAtLabel={generatedAtLabel}
          selectedDate={selectedDate}
          sortDirection={timeSortDirection}
          timelineFilter={timelineFilter}
          totalEntries={history.length}
        />
      ) : null}
    </section>
  );
}
