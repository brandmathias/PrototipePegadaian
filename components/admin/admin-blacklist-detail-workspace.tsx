"use client";

import Image from "next/image";
import { useMemo, useState, type ReactNode } from "react";
import {
  BadgeCheck,
  Clock3,
  PackageOpen,
  ScrollText,
  TimerReset,
} from "lucide-react";

import { AdminLiveCountdown } from "@/components/admin/admin-live-countdown";
import { currency } from "@/lib/formatters/currency";
import { cn } from "@/lib/utils";

type AdminBlacklistItem = Record<string, any>;
type ViolationItem = {
  date: string;
  id: string;
  level: number;
  note: string;
  title: string;
  trace: Record<string, any> | null;
};

const LEVEL_RULES: Record<
  number,
  {
    duration: string;
    durationDays: number;
    label: string;
    restriction: string;
    tone: "danger" | "neutral" | "success" | "warning";
  }
> = {
  0: {
    duration: "0 hari",
    durationDays: 0,
    label: "Tidak ada pembatasan",
    restriction: "Akun tidak sedang dibatasi.",
    tone: "neutral",
  },
  1: {
    duration: "7 hari",
    durationDays: 7,
    label: "Level 1: Lelang Tertutup dibatasi",
    restriction: "Tidak bisa ikut Lelang Tertutup. Harga Tetap masih boleh.",
    tone: "success",
  },
  2: {
    duration: "30 hari",
    durationDays: 30,
    label: "Level 2: Transaksi baru dibatasi",
    restriction:
      "Tidak bisa ikut Lelang Tertutup dan tidak bisa membuat transaksi Harga Tetap baru.",
    tone: "warning",
  },
  3: {
    duration: "365 hari",
    durationDays: 365,
    label: "Level 3: Ditangguhkan 365 hari",
    restriction:
      "Tidak bisa membuat transaksi baru sampai masa pembatasan 365 hari selesai.",
    tone: "danger",
  },
};

const DAY_MS = 86_400_000;

function clampLevel(value: number) {
  return Math.min(Math.max(value, 0), 3);
}

function getEffectiveViolationTotal(entry: AdminBlacklistItem, itemCount = 0) {
  return Math.max(
    Number(entry.level ?? 0),
    Number(entry.violations ?? 0),
    Number(entry.unpaidAuctionCount ?? 0),
    itemCount
  );
}

function getCurrentLevel(entry: AdminBlacklistItem) {
  return clampLevel(getEffectiveViolationTotal(entry));
}

function getHistoricalLevel(entry: AdminBlacklistItem, index: number, itemCount = 0) {
  return Math.min(Math.max(getEffectiveViolationTotal(entry, itemCount) - index, 1), 3);
}

function getLevelRule(level: number) {
  return LEVEL_RULES[Math.min(Math.max(level, 0), 3)] ?? LEVEL_RULES[0];
}

function humanize(value?: string | null) {
  if (!value) return "-";

  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function parseDate(value: unknown) {
  if (!value || value === "-") return null;

  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDisplayDate(date: Date | null) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    timeZone: "Asia/Makassar",
    year: "numeric",
  }).format(date);
}

function formatDisplayDateTime(date: Date | null) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "long",
    timeZone: "Asia/Makassar",
    year: "numeric",
  }).format(date);
}

function formatMoney(value: unknown) {
  const numeric = Number(value ?? 0);

  return Number.isFinite(numeric) && numeric > 0 ? currency.format(numeric) : "-";
}

function getViolationDeadline(item: ViolationItem | undefined) {
  if (!item) return null;

  const rule = getLevelRule(item.level);
  const occurredAt = parseDate(
    item.trace?.occurredAt ?? item.trace?.createdAt ?? item.date,
  );

  if (!occurredAt || rule.durationDays <= 0) return null;

  return new Date(occurredAt.getTime() + rule.durationDays * DAY_MS);
}

function getViolationItems(entry: AdminBlacklistItem): ViolationItem[] {
  const traces = Array.isArray(entry.unpaidAuctionTraces)
    ? entry.unpaidAuctionTraces
    : [];

  if (traces.length > 0) {
    return traces.map((trace: Record<string, any>, index: number) => ({
      date:
        trace.occurredAtLabel ??
        trace.paymentDeadlineLabel ??
        entry.lastIncident ??
        "-",
      id: String(
        trace.id ?? trace.transactionId ?? `${trace.lotCode}-${index}`,
      ),
      level: getHistoricalLevel(entry, index, traces.length),
      note:
        trace.note ??
        entry.reason ??
        "Pemenang lelang tidak menyelesaikan pembayaran sampai batas waktu.",
      title:
        trace.itemName ??
        trace.lotLabel ??
        trace.lotCode ??
        `Pelanggaran ${index + 1}`,
      trace,
    }));
  }

  const history = Array.isArray(entry.history) ? entry.history : [];
  if (history.length > 0) {
    return history.map((item: Record<string, any>, index: number) => ({
      date: item.date ?? entry.lastIncident ?? "-",
      id: String(`${item.date ?? "history"}-${item.action ?? index}`),
      level: getHistoricalLevel(entry, index, history.length),
      note: item.note ?? entry.reason ?? "-",
      title: item.actionLabel ?? item.action ?? `Pelanggaran ${index + 1}`,
      trace: null,
    }));
  }

  return [
    {
      date: entry.lastIncident ?? "-",
      id: "fallback",
      level: getCurrentLevel(entry),
      note: entry.reason ?? "Pelanggaran pembayaran lelang.",
      title: "Pelanggaran lelang",
      trace: entry.latestUnpaidAuction ?? null,
    },
  ];
}

function LevelBadge({ level }: { level: number }) {
  const rule = getLevelRule(level);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1.5 text-[0.68rem] font-black uppercase tracking-[0.12em]",
        rule.tone === "danger" && "bg-rose-50 text-rose-700",
        rule.tone === "warning" && "bg-amber-50 text-amber-800",
        rule.tone === "success" && "bg-[#e9f6ef] text-[#0a6a49]",
        rule.tone === "neutral" && "bg-[#f0f0ee] text-black/58",
      )}
    >
      Level {level}
    </span>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[2.1rem_minmax(0,1fr)] gap-3 rounded-[1rem] bg-[#f8f7f3] p-3 ring-1 ring-black/5">
      <span className="grid size-8 place-items-center rounded-xl bg-white text-[#0a6a49]">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-black/38">
          {label}
        </p>
        <div className="mt-1 text-sm font-bold leading-6 text-[#122018]">
          {value}
        </div>
      </div>
    </div>
  );
}

function DetailTile({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-[1rem] bg-white px-3 py-3 ring-1 ring-black/6">
      <p className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-black/38">
        {label}
      </p>
      <div className="mt-1 text-sm font-black leading-6 text-[#122018]">
        {value}
      </div>
    </div>
  );
}

function AuctionDetailPanel({ trace }: { trace: Record<string, any> | null }) {
  if (!trace) {
    return (
      <div className="rounded-[1.25rem] border border-dashed border-black/10 bg-[#fbfbf8] p-5 text-sm font-semibold leading-6 text-black/52">
        Detail barang lelang belum terhubung dengan kasus ini.
      </div>
    );
  }

  const imageUrl = trace.imageUrl ?? trace.primaryImage?.url ?? null;
  const itemName = trace.itemName ?? "Barang lelang";
  const basePrice = trace.basePrice ?? trace.fixedPrice ?? trace.price;

  return (
    <div className="overflow-hidden rounded-[1.25rem] bg-[#f8f7f3] ring-1 ring-black/6">
      <div className="grid gap-0 md:grid-cols-[11rem_minmax(0,1fr)]">
        <div className="relative min-h-[12rem] bg-[#ecebe5]">
          {imageUrl ? (
            <Image
              alt={`Foto barang ${itemName}`}
              className="object-cover"
              fill
              sizes="(max-width: 768px) 100vw, 192px"
              src={imageUrl}
            />
          ) : (
            <div className="grid h-full min-h-[12rem] place-items-center text-[#0a6a49]">
              <PackageOpen className="size-10" />
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[0.66rem] font-black uppercase tracking-[0.16em] text-[#0a6a49]/64">
                {trace.lotLabel ?? trace.itemCode ?? trace.lotCode ?? "-"}
              </p>
              <h4 className="mt-1 font-headline text-xl font-black tracking-[-0.03em] text-[#122018]">
                {itemName}
              </h4>
              <p className="mt-1 text-sm font-semibold leading-6 text-black/52">
                {humanize(trace.itemCategory)} - Kondisi{" "}
                {humanize(trace.itemCondition)}
              </p>
            </div>
            <span className="rounded-full bg-white px-3 py-1.5 text-[0.68rem] font-black uppercase tracking-[0.12em] text-[#0a6a49] ring-1 ring-black/6">
              {humanize(trace.auctionMode)}
            </span>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <DetailTile label="Harga Dasar" value={formatMoney(basePrice)} />
            <DetailTile
              label="Nilai Taksiran"
              value={formatMoney(trace.itemAppraisalValue)}
            />
            <DetailTile
              label="Nominal Menang"
              value={formatMoney(trace.amount ?? trace.finalPrice)}
            />
            <DetailTile
              label="Batas Bayar"
              value={trace.paymentDeadlineLabel ?? "-"}
            />
          </div>

          {trace.itemDescription ? (
            <p className="mt-3 rounded-[1rem] bg-white px-3 py-2 text-sm font-semibold leading-6 text-black/56 ring-1 ring-black/5">
              {trace.itemDescription}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function TraceCard({ trace }: { trace: Record<string, any> }) {
  return (
    <article className="rounded-[1rem] bg-[#f8f7f3] p-3 ring-1 ring-black/5">
      <p className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-[#0a6a49]/62">
        {trace.lotLabel ?? trace.lotCode ?? "-"}
      </p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <h4 className="truncate text-sm font-black text-[#122018]">
            {trace.itemName ?? "Barang lelang"}
          </h4>
          <p className="text-xs font-semibold text-black/46">
            {formatMoney(trace.amount)} - {trace.paymentDeadlineLabel ?? "-"}
          </p>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-[0.1em] text-black/54">
          {humanize(trace.transactionStatus)}
        </span>
      </div>
    </article>
  );
}

export function AdminBlacklistDetailWorkspace({
  entry,
}: {
  entry: AdminBlacklistItem;
}) {
  const items = useMemo(() => getViolationItems(entry), [entry]);
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");
  const selected = items.find((item) => item.id === selectedId) ?? items[0];
  const selectedTrace = selected?.trace ?? entry.latestUnpaidAuction ?? null;
  const selectedRule = getLevelRule(selected?.level ?? getCurrentLevel(entry));
  const selectedDeadline = getViolationDeadline(selected);
  const traces = Array.isArray(entry.unpaidAuctionTraces)
    ? entry.unpaidAuctionTraces
    : [];
  const serverNow = new Date().toISOString();

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_23rem]">
        <section className="rounded-[1.5rem] border border-black/8 bg-white p-4 shadow-[0_18px_54px_-48px_rgba(8,69,50,0.34)] sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-headline text-2xl font-black tracking-[-0.03em] text-[#122018]">
                Detail Pelanggaran
              </h3>
              <p className="mt-2 text-sm leading-6 text-black/56">
                Informasi lelang yang tidak dibayar dan batas pembatasannya.
              </p>
            </div>
            <LevelBadge level={selected?.level ?? getCurrentLevel(entry)} />
          </div>

          <div className="mt-4 grid gap-3">
            <AuctionDetailPanel trace={selectedTrace} />
            <div className="grid gap-3 lg:grid-cols-3">
              <SummaryRow
                icon={<ScrollText className="size-4" />}
                label="Alasan"
                value={selected?.note ?? entry.reason ?? "-"}
              />
              <SummaryRow
                icon={<BadgeCheck className="size-4" />}
                label="Aturan Level"
                value={
                  <span className="inline-flex flex-col gap-1">
                    <span>{selectedRule.label}</span>
                    <span className="text-xs font-semibold leading-5 text-black/56">
                      {selectedRule.duration}. {selectedRule.restriction}
                    </span>
                  </span>
                }
              />
              <SummaryRow
                icon={<Clock3 className="size-4 text-[#d72b43]" />}
                label="Masa Pembatasan"
                value={
                  <span className="inline-flex flex-col gap-1">
                    <span>
                      {selectedDeadline
                        ? `Berakhir ${formatDisplayDateTime(selectedDeadline)}`
                        : "Tanggal akhir belum tersedia"}
                    </span>
                    <AdminLiveCountdown
                      className="text-sm font-black text-rose-700"
                      expiredLabel="Masa pembatasan berakhir"
                      fallbackLabel={
                        selectedDeadline
                          ? formatDisplayDate(selectedDeadline)
                          : "Tanggal akhir belum tersedia"
                      }
                      prefix="Sisa waktu"
                      serverNow={serverNow}
                      targetAt={selectedDeadline?.toISOString() ?? null}
                    />
                  </span>
                }
              />
            </div>
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-black/8 bg-white p-4 shadow-[0_18px_54px_-48px_rgba(8,69,50,0.34)] sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-headline text-xl font-black tracking-[-0.03em] text-[#122018]">
                Riwayat Pelanggaran
              </h3>
              <p className="mt-1 text-sm leading-6 text-black/52">
                Pilih kasus untuk melihat detailnya.
              </p>
            </div>
            <span className="rounded-full bg-[#f0f0ee] px-3 py-1.5 text-[0.68rem] font-black uppercase tracking-[0.12em] text-black/58">
              {items.length} kasus
            </span>
          </div>
          <div className="mt-4 space-y-2.5">
            {items.map((item, index) => {
              const active = item.id === selected.id;

              return (
                <button
                  aria-label={`Pilih riwayat pelanggaran level ${item.level} ${item.title}`}
                  aria-pressed={active}
                  className={cn(
                    "grid w-full grid-cols-[1rem_minmax(0,1fr)] gap-3 text-left transition duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    active ? "opacity-100" : "opacity-78 hover:opacity-100",
                  )}
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                >
                  <span className="relative flex justify-center">
                    <span
                      className={cn(
                        "mt-4 size-2.5 rounded-full ring-4",
                        active
                          ? "bg-[#0a6a49] ring-[#dff3e8]"
                          : "bg-black/28 ring-black/5",
                      )}
                    />
                    {index < items.length - 1 ? (
                      <span className="absolute top-8 h-[calc(100%+0.75rem)] w-px bg-[#d8e7dd]" />
                    ) : null}
                  </span>
                  <span
                    className={cn(
                      "rounded-[1rem] p-3 ring-1 transition duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      active
                        ? "bg-[#f7f6f1] ring-[#0a6a49]/16"
                        : "bg-white ring-black/8 hover:bg-[#fbfaf5]",
                    )}
                  >
                    <span className="flex flex-wrap items-start justify-between gap-3">
                      <span>
                        <span className="block text-sm font-black text-[#122018]">
                          {item.title}
                        </span>
                        <span className="mt-1 block text-xs font-semibold text-black/42">
                          {item.date}
                        </span>
                      </span>
                      <LevelBadge level={item.level} />
                    </span>
                    <span className="mt-3 line-clamp-2 block text-sm font-semibold leading-6 text-black/58">
                      {item.note}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <section className="rounded-[1.5rem] border border-black/8 bg-white p-4 shadow-[0_18px_54px_-48px_rgba(8,69,50,0.34)] sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-headline text-xl font-black tracking-[-0.03em] text-[#122018]">
              Barang Tidak Dibayar
            </h3>
            <p className="mt-2 text-sm leading-6 text-black/56">
              Arsip barang yang memicu pelanggaran pada akun ini.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#f0f0ee] px-3 py-1.5 text-[0.68rem] font-black uppercase tracking-[0.12em] text-black/58">
            <TimerReset className="size-4 text-[#0a6a49]" />
            {traces.length} kasus
          </span>
        </div>

        {traces.length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {traces.map((trace: Record<string, any>) => (
              <TraceCard
                key={trace.id ?? `${trace.lotCode}-${trace.transactionId}`}
                trace={trace}
              />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-[1.25rem] border border-dashed border-black/10 bg-[#fbfbf8] p-6 text-center text-sm font-semibold leading-6 text-black/52">
            Belum ada jejak barang lelang yang terhubung dengan kasus ini.
          </div>
        )}
      </section>
    </>
  );
}
