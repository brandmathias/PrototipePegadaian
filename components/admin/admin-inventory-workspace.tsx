"use client";

import Link from "next/link";
import { startTransition, useDeferredValue, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  CheckCheck,
  Clock3,
  FilePlus2,
  Gavel,
  ReceiptText,
  ScrollText,
  Search,
  UserRound
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { cn } from "@/lib/utils";
import { currency } from "@/lib/formatters/currency";

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

export function AdminInventoryWorkspace({
  items,
  history
}: {
  items: AdminInventoryItem[];
  history: AdminBarangHistoryEntry[];
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("SEMUA");
  const [categoryFilter, setCategoryFilter] = useState("SEMUA");
  const deferredQuery = useDeferredValue(query);

  const categories = useMemo(() => {
    return ["SEMUA", ...new Set(items.map((item) => String(item.category ?? "").trim()).filter(Boolean))];
  }, [items]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return items.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          item.code,
          item.name,
          item.ownerName,
          item.customerNumber,
          item.category,
          item.condition
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery));

      const matchesStatus = statusFilter === "SEMUA" || String(item.status).toUpperCase() === statusFilter;
      const matchesCategory =
        categoryFilter === "SEMUA" || String(item.category).toLowerCase() === categoryFilter.toLowerCase();

      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [categoryFilter, deferredQuery, items, statusFilter]);

  const filteredHistory = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return history.filter((entry) => {
      if (!normalizedQuery) {
        return true;
      }

      return [
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
    });
  }, [deferredQuery, history]);

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[2rem] bg-white shadow-[0_28px_90px_-64px_rgba(8,69,50,0.48)] ring-1 ring-black/6">
        <div className="border-b border-black/6 bg-[linear-gradient(180deg,rgba(251,250,245,0.96),rgba(255,255,255,0.98))] p-4 sm:p-5">
          <div className="grid gap-3 xl:grid-cols-[minmax(18rem,1.35fr)_13rem_13rem]">
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
            <select
              className="h-12 rounded-[1.35rem] border-0 bg-[#f4f3ef] px-4 text-sm font-semibold text-black/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] outline-none transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] focus:bg-white focus:ring-2 focus:ring-[#0a6a49]/15"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="SEMUA">Semua Status</option>
              <option value="JAMINAN">Jaminan</option>
              <option value="DIPASARKAN">Dipasarkan</option>
              <option value="TERJUAL">Terjual</option>
              <option value="GAGAL">Gagal</option>
              <option value="DITEBUS">Ditebus</option>
            </select>
            <select
              className="h-12 rounded-[1.35rem] border-0 bg-[#f4f3ef] px-4 text-sm font-semibold text-black/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] outline-none transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] focus:bg-white focus:ring-2 focus:ring-[#0a6a49]/15"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === "SEMUA" ? "Semua Kategori" : category}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-black/52">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#eef5ef] px-3 py-1 text-[0.73rem] font-bold uppercase tracking-[0.16em] text-[#0a6a49]">
              <CheckCheck className="size-3.5" />
              Pencarian langsung aktif
            </span>
            <span>
              Menampilkan <strong className="font-black text-black/78">{filteredItems.length}</strong> dari{" "}
              <strong className="font-black text-black/78">{items.length}</strong> barang.
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[82rem] text-left">
            <thead className="bg-[#f7f5ef] text-[0.68rem] uppercase tracking-[0.18em] text-black/45">
              <tr>
                <th className="px-5 py-4">Kode Barang</th>
                <th className="px-5 py-4">Nama Barang</th>
                <th className="px-5 py-4">Nasabah</th>
                <th className="px-6 py-4">Nilai Taksiran</th>
                <th className="px-5 py-4">Tanggal Kredit</th>
                <th className="px-5 py-4">Jatuh Tempo</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr
                    className="border-t border-black/8 text-sm transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#fbfaf5]"
                    key={item.id}
                  >
                    <td className="px-5 py-4 font-black tracking-[-0.01em] text-[#0a6a49]">{item.code}</td>
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-semibold text-black/86">{item.name}</p>
                        <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-black/42">
                          {item.category} / {item.condition}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-semibold text-black/82">{item.ownerName}</p>
                        <p className="mt-1 text-xs font-semibold text-black/45">{item.customerNumber || "-"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-black/78">
                      {currency.format(item.appraisalValue)}
                    </td>
                    <td className="px-5 py-4 text-black/62">{item.pawnedAt}</td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-black/76">{item.dueDate}</p>
                      <p
                        className={cn(
                          "mt-1 text-xs font-bold",
                          (getInventoryDaysUntil(item.dueDate) ?? 99) <= 7 ? "text-amber-700" : "text-black/42",
                          (getInventoryDaysUntil(item.dueDate) ?? 1) < 0 && "text-rose-700"
                        )}
                      >
                        {getInventoryDueCopy(item.dueDate)}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <AdminStatusBadge status={item.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        className="group inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm font-bold text-[#0a6a49] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-[#0a6a49]/25 hover:bg-[#eef7f0]"
                        href={`/admin/barang/${item.id}`}
                      >
                        Detail
                        <ArrowRight className="size-4 transition duration-500 group-hover:translate-x-0.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-5 py-12 text-center text-sm text-black/55" colSpan={8}>
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
      </section>

      <section className="overflow-hidden rounded-[2rem] bg-white shadow-[0_28px_90px_-64px_rgba(8,69,50,0.44)] ring-1 ring-black/6">
        <div className="flex flex-col gap-3 border-b border-black/6 bg-[linear-gradient(180deg,#fffefb,#f9f7f2)] px-5 py-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
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
          <div className="inline-flex items-center gap-2 self-start rounded-full bg-[#f3f4ef] px-4 py-2 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-black/56">
            <Clock3 className="size-3.5 text-[#0a6a49]" />
            {filteredHistory.length} catatan
          </div>
        </div>

        <div className="divide-y divide-black/6">
          {filteredHistory.length > 0 ? (
            filteredHistory.map((entry) => {
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
      </section>
    </div>
  );
}
