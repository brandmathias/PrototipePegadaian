"use client";

import Image from "next/image";
import Link from "next/link";
import { startTransition, useDeferredValue, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  CarFront,
  Clock3,
  FilePlus2,
  Gavel,
  Gem,
  MonitorSmartphone,
  Package2,
  PackageCheck,
  ReceiptText,
  ScrollText,
  Search,
  UserRound
} from "lucide-react";

import { AdminPaginationFooter, useAdminPagination } from "@/components/admin/admin-pagination";
import { AdminSelect } from "@/components/admin/admin-select";
import { Input } from "@/components/ui/input";
import {
  isAdminInventoryDueSoon,
  isAdminInventoryListItem,
  isAdminInventoryReadyForMarketing
} from "@/lib/admin-unit/operational-metrics";
import { currency } from "@/lib/formatters/currency";
import { cn } from "@/lib/utils";

type AdminInventoryItem = Record<string, any>;

type AdminBarangHistoryEntry = {
  id: string;
  barangId: string;
  barangCode: string;
  barangName: string;
  ownerName: string;
  customerNumber: string;
  actionKey: "input_baru" | "perpanjangan" | "ditebus" | "dipasarkan";
  actionLabel: string;
  actionTone: "default" | "success" | "warning" | "danger";
  note: string;
  actorName: string;
  createdAt: string;
  createdAtLabel: string;
};

function getInventoryDaysUntil(dateLabel: string | null | undefined) {
  if (!dateLabel || dateLabel === "-") return null;

  const date = new Date(`${dateLabel}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;

  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const targetUtc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

  return Math.ceil((targetUtc - todayUtc) / 86_400_000);
}

function getInventoryDueCopy(dateLabel: string | null | undefined) {
  const days = getInventoryDaysUntil(dateLabel);

  if (days === null) return "-";
  if (days < 0) return `Lewat ${Math.abs(days)} hari`;
  if (days === 0) return "Jatuh tempo hari ini";
  return `${days} hari lagi`;
}

const historyToneClasses: Record<AdminBarangHistoryEntry["actionTone"], string> = {
  default: "border-slate-200 bg-slate-50 text-slate-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-rose-200 bg-rose-50 text-rose-700"
};

const historyIconMap: Record<AdminBarangHistoryEntry["actionKey"], typeof FilePlus2> = {
  input_baru: FilePlus2,
  perpanjangan: CalendarClock,
  ditebus: ReceiptText,
  dipasarkan: Gavel
};

const historyFilterOptions: Array<{ value: "SEMUA" | AdminBarangHistoryEntry["actionKey"]; label: string }> = [
  { value: "SEMUA", label: "Semua Proses" },
  { value: "input_baru", label: "Barang Masuk" },
  { value: "perpanjangan", label: "Perpanjang" },
  { value: "ditebus", label: "Tebus" },
  { value: "dipasarkan", label: "Dipasarkan" }
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
  if (normalized.includes("kendara") || normalized.includes("motor") || normalized.includes("mobil")) {
    return CarFront;
  }
  if (normalized.includes("elektronik") || normalized.includes("televisi") || normalized.includes("gadget")) {
    return MonitorSmartphone;
  }
  return Package2;
}

function InventoryHistoryList({ entries }: { entries: AdminBarangHistoryEntry[] }) {
  return (
    <div className="divide-y divide-black/6">
      {entries.length > 0 ? (
        entries.map((entry) => {
          const ActionIcon = historyIconMap[entry.actionKey];

          return (
            <div
              className="grid gap-4 px-5 py-4 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#fbfaf6] xl:grid-cols-[14rem_minmax(0,1.1fr)_minmax(0,1fr)_12rem]"
              key={entry.id}
            >
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-[0.95rem] bg-[#f0f5f0] text-[#0a6a49] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
                  <ActionIcon className="size-4.5" />
                </span>
                <div className="min-w-0">
                  <div
                    className={cn(
                      "inline-flex items-center rounded-full border px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.16em]",
                      historyToneClasses[entry.actionTone]
                    )}
                  >
                    {entry.actionLabel}
                  </div>
                  <p className="mt-2 text-sm font-semibold text-black/78">{entry.actorName}</p>
                </div>
              </div>

              <div className="min-w-0">
                <p className="text-sm font-black tracking-[-0.02em] text-[#13211c]">{entry.barangName}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-black/42">
                  {entry.barangCode}
                </p>
                <p className="mt-2 text-sm text-black/58">{entry.note}</p>
              </div>

              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#f5f3ee] px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-black/56">
                  <UserRound className="size-3.5 text-[#0a6a49]" />
                  Nasabah
                </div>
                <p className="mt-2 text-sm font-semibold text-black/78">{entry.ownerName}</p>
                <p className="mt-1 text-xs font-semibold text-black/45">{entry.customerNumber || "-"}</p>
              </div>

              <div className="xl:text-right">
                <p className="text-sm font-semibold text-black/74">{entry.createdAtLabel}</p>
                <Link
                  className="group mt-3 inline-flex items-center gap-2 text-sm font-bold text-[#0a6a49]"
                  href={`/admin/barang/${entry.barangId}`}
                >
                  Lihat barang
                  <ArrowRight className="size-4 transition duration-500 group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          );
        })
      ) : (
        <div className="px-5 py-12 text-center text-sm text-black/55">
          <p className="font-headline text-xl font-black text-black/80">Belum ada riwayat yang cocok.</p>
          <p className="mt-2">Riwayat akan tampil otomatis saat barang diinput, diperpanjang, ditebus, atau dipasarkan.</p>
        </div>
      )}
    </div>
  );
}

export function AdminInventoryWorkspace({ items }: { items: AdminInventoryItem[] }) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("SEMUA");
  const [inventoryFilter, setInventoryFilter] = useState<(typeof inventoryFilterOptions)[number]["value"]>("SEMUA");
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
  const pagination = useAdminPagination(filteredItems, `${categoryFilter}-${inventoryFilter}-${deferredQuery}`);

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
              <th className="w-[11%] px-3 py-4">Jatuh Tempo</th>
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
                    <p className="font-medium leading-5 text-black/76">{item.dueDate}</p>
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
                    <Link
                      className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-xl border border-black/10 bg-white px-3 text-[0.7rem] font-bold text-[#0a6a49] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-[#0a6a49]/25 hover:bg-[#eef7f0] xl:text-[0.74rem]"
                      href={`/admin/barang/${item.id}`}
                    >
                      Lihat Detail
                    </Link>
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
  const deferredQuery = useDeferredValue(query);

  const filteredHistory = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return history.filter((entry) => {
      const matchesAction = actionFilter === "SEMUA" || entry.actionKey === actionFilter;
      const matchesQuery =
        !normalizedQuery ||
        [
          entry.barangCode,
          entry.barangName,
          entry.ownerName,
          entry.customerNumber,
          entry.actionLabel,
          entry.note,
          entry.actorName
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery));

      return matchesAction && matchesQuery;
    });
  }, [actionFilter, deferredQuery, history]);
  const pagination = useAdminPagination(filteredHistory, `${actionFilter}-${deferredQuery}`);

  return (
    <section className="overflow-hidden rounded-[2rem] bg-white shadow-[0_28px_90px_-64px_rgba(8,69,50,0.44)] ring-1 ring-[#cfe5d6]">
      <div className="flex flex-col gap-3 border-b border-[#dce9df] bg-[linear-gradient(180deg,#fffefb,#f9f7f2)] px-5 py-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex-1">
          <div className="inline-flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-[1rem] bg-[#eef6f0] text-[#0a6a49] shadow-[inset_0_1px_0_rgba(255,255,255,0.78)]">
              <ScrollText className="size-5" />
            </span>
            <div>
              <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-black/42">Riwayat Barang</p>
              <h3 className="mt-1 font-headline text-2xl font-black tracking-[-0.04em] text-[#13211c]">
                Aktivitas operasional terbaru
              </h3>
            </div>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-black/58">
            Jejak input barang baru, perpanjangan, penebusan, dan pemasaran tercatat di sini agar admin unit bisa membaca progres operasional tanpa membuka detail satu per satu.
          </p>
        </div>
        <div className="w-full max-w-2xl space-y-3">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12.5rem]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#0a6a49]/42" />
              <Input
                className="h-12 rounded-[1.35rem] border-0 bg-[#f4f3ef] pl-12 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] focus:bg-white focus-visible:ring-2 focus-visible:ring-[#0a6a49]/15 sm:text-base"
                placeholder="Cari barang, nasabah, aktor, atau catatan riwayat..."
                value={query}
                onChange={(event) => {
                  const value = event.target.value;
                  startTransition(() => setQuery(value));
                }}
              />
            </div>
            <AdminSelect
              ariaLabel="Filter proses riwayat barang"
              className="w-full"
              options={historyFilterOptions}
              value={actionFilter}
              onValueChange={(nextValue) => setActionFilter(nextValue as typeof actionFilter)}
            />
          </div>
          <div className="inline-flex items-center gap-2 self-start rounded-full bg-[#f3f4ef] px-4 py-2 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-black/56">
            <Clock3 className="size-3.5 text-[#0a6a49]" />
            {filteredHistory.length} catatan
          </div>
        </div>
      </div>

      <InventoryHistoryList entries={pagination.visibleItems} />
      <AdminPaginationFooter
        itemLabel="catatan"
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
        totalItems={pagination.totalItems}
        onPageIndexChange={pagination.setPageIndex}
        onPageSizeChange={pagination.setPageSize}
      />
    </section>
  );
}
