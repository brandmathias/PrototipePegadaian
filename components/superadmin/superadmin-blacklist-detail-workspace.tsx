"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Ban,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock3,
  FileWarning,
  Lock,
  MapPin,
  PackageOpen,
  Receipt,
  ShieldAlert,
  ShoppingBag,
  Timer
} from "lucide-react";

import { AdminPageHero } from "@/components/admin/admin-page-hero";
import { deriveBlacklistEscalationMilestones } from "@/lib/blacklist/escalation";
import { currency } from "@/lib/formatters/currency";
import { cn } from "@/lib/utils";

type SuperadminBlacklistDetailEntry = Record<string, any>;
type BlacklistDetailScope = "superadmin" | "admin-unit";
type ViolationItem = {
  date: string;
  id: string;
  isCurrent: boolean;
  level: number;
  note: string;
  title: string;
  trace: Record<string, any> | null;
};

const DAY_MS = 86_400_000;
const PAYMENT_DEADLINE_EXPLANATION = "Tidak Bayar Dalam 1x24 Jam";

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
    year: "numeric"
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
    year: "numeric"
  }).format(date);
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

function formatMoney(value: unknown) {
  const numeric = Number(value ?? 0);

  return Number.isFinite(numeric) && numeric > 0 ? currency.format(numeric) : "-";
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function clampLevel(value: number) {
  return Math.min(Math.max(value, 0), 3);
}

function getEffectiveViolationTotal(entry: SuperadminBlacklistDetailEntry, itemCount = 0) {
  return Math.max(
    Number(entry.level ?? 0),
    Number(entry.violations ?? 0),
    itemCount
  );
}

function getLevel(entry: SuperadminBlacklistDetailEntry) {
  return clampLevel(getEffectiveViolationTotal(entry));
}

function getHistoricalLevel(entry: SuperadminBlacklistDetailEntry, index: number, itemCount = 0) {
  return Math.min(Math.max(getEffectiveViolationTotal(entry, itemCount) - index, 1), 3);
}

function getTraceRestrictionLevel(trace: Record<string, any>, fallback: number) {
  const explicitLevel = Number(trace.restrictionLevel ?? trace.violationLevel ?? trace.level);

  return Number.isFinite(explicitLevel) && explicitLevel > 0
    ? clampLevel(explicitLevel)
    : fallback;
}

function getLevelTone(level: number, completed = false) {
  if (completed) {
    return {
      badge: "bg-[#e9f6ef] text-[#0a6a49] ring-[#bde6cf]",
      border: "border-[#bde6cf]",
      dot: "bg-[#0a6a49] ring-[#dff3e8]",
      glow: "ring-[#e2f4e9]",
      line: "border-[#bde6cf]",
      text: "text-[#0a6a49]"
    };
  }

  if (level >= 3) {
    return {
      badge: "bg-rose-50 text-rose-700 ring-rose-200",
      border: "border-rose-300",
      dot: "bg-red-600 ring-red-100",
      glow: "ring-red-50",
      line: "border-red-500",
      text: "text-red-600"
    };
  }

  if (level === 2) {
    return {
      badge: "bg-orange-50 text-orange-700 ring-orange-200",
      border: "border-orange-300",
      dot: "bg-orange-500 ring-orange-100",
      glow: "ring-orange-50",
      line: "border-orange-500",
      text: "text-orange-600"
    };
  }

  return {
    badge: "bg-amber-50 text-amber-800 ring-amber-200",
    border: "border-amber-300",
    dot: "bg-amber-400 ring-amber-100",
    glow: "ring-amber-50",
    line: "border-amber-400",
    text: "text-amber-700"
  };
}

function getDurationDays(level: number) {
  if (level >= 3) return 365;
  if (level === 2) return 30;
  if (level === 1) return 7;

  return 0;
}

function getDeadline(item: ViolationItem | undefined) {
  if (!item) return null;

  const occurredAt = parseDate(item.trace?.occurredAt ?? item.trace?.createdAt ?? item.date);
  const durationDays = getDurationDays(item.level);

  if (!occurredAt || durationDays <= 0) return null;

  return new Date(occurredAt.getTime() + durationDays * DAY_MS);
}

function getViolationStartDate(item: ViolationItem | undefined) {
  return parseDate(item?.trace?.occurredAt ?? item?.trace?.createdAt ?? item?.date);
}

function getCurrentViolationItem(items: ViolationItem[]) {
  return items.find((item) => item.isCurrent) ?? items[0];
}

function getPaymentDeadlineFromWinTime(trace: Record<string, any> | null | undefined) {
  const explicitDeadline = parseDate(trace?.paymentDeadline);
  if (explicitDeadline) return explicitDeadline;

  const wonAt = parseDate(trace?.wonAt ?? trace?.transactionCreatedAt ?? trace?.createdAt);

  return wonAt ? new Date(wonAt.getTime() + DAY_MS) : null;
}

function getViolationItems(entry: SuperadminBlacklistDetailEntry): ViolationItem[] {
  const traces = Array.isArray(entry.unpaidAuctionTraces) ? entry.unpaidAuctionTraces : [];

  if (traces.length > 0) {
    const milestones = deriveBlacklistEscalationMilestones(traces)
      .sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime());

    if (milestones.length > 0) {
      return milestones.map(({ level, trace }, index) => {
        const restrictionLevel = getTraceRestrictionLevel(trace, level);

        return {
          date: trace.occurredAtLabel ?? trace.paymentDeadlineLabel ?? entry.lastIncident ?? "-",
          id: String(trace.id ?? trace.transactionId ?? `${trace.lotCode}-${index}`),
          isCurrent: index === 0 && String(entry.status ?? "").toUpperCase() === "AKTIF",
          level: restrictionLevel,
          note:
            trace.note ??
            entry.reason ??
            "User memenangkan lelang tetapi gagal melakukan pelunasan hingga batas waktu berakhir.",
          title: `Kasus #${restrictionLevel}: ${trace.itemName ?? trace.lotLabel ?? trace.lotCode ?? `Pelanggaran ${restrictionLevel}`}`,
          trace
        };
      });
    }
  }

  const history = Array.isArray(entry.history) ? entry.history : [];
  if (history.length > 0) {
    return history.map((item: Record<string, any>, index: number) => ({
      date: item.date ?? entry.lastIncident ?? "-",
      id: String(`${item.date ?? "history"}-${item.action ?? index}`),
      isCurrent: index === 0 && String(entry.status ?? "").toUpperCase() === "AKTIF",
      level: getHistoricalLevel(entry, index, history.length),
      note: item.note ?? entry.reason ?? "-",
      title: item.actionLabel ?? item.action ?? `Pelanggaran ${index + 1}`,
      trace: null
    }));
  }

  return [
    {
      date: entry.lastIncident ?? "-",
      id: "fallback",
      isCurrent: String(entry.status ?? "").toUpperCase() === "AKTIF",
      level: getLevel(entry),
      note: entry.reason ?? "Pelanggaran pembayaran lelang.",
      title: "Pelanggaran lelang",
      trace: entry.latestUnpaidAuction ?? null
    }
  ];
}

function getTickerState(targetAt: string | null | undefined, now: number) {
  if (!targetAt) {
    return {
      days: "00",
      hours: "00",
      isExpired: true,
      label: "Tanggal akhir belum tersedia",
      minutes: "00",
      seconds: "00"
    };
  }

  const targetTime = new Date(targetAt).getTime();
  if (Number.isNaN(targetTime)) {
    return {
      days: "00",
      hours: "00",
      isExpired: true,
      label: "Tanggal akhir belum tersedia",
      minutes: "00",
      seconds: "00"
    };
  }

  const diff = Math.max(targetTime - now, 0);
  const days = Math.floor(diff / DAY_MS);
  const hours = Math.floor((diff % DAY_MS) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  const isExpired = diff <= 0;

  return {
    days: String(days).padStart(2, "0"),
    hours: String(hours).padStart(2, "0"),
    isExpired,
    label: isExpired
      ? "Masa pembatasan berakhir"
      : `Sisa waktu ${days} hari ${hours} jam ${minutes} menit ${seconds} detik`,
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0")
  };
}

function getSyncedNow(serverNow?: string) {
  const serverNowMs = serverNow ? new Date(serverNow).getTime() : Number.NaN;

  return Number.isNaN(serverNowMs) ? Date.now() : serverNowMs;
}

function DossierTile({
  icon,
  label,
  value
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-[0.95rem] border border-[#e3ebe7] bg-[#fbfcfb] p-3">
      <p className="flex items-center gap-1.5 text-[0.62rem] font-black uppercase tracking-[0.13em] text-[#536279]">
        {icon}
        {label}
      </p>
      <div className="mt-2 text-xs font-black leading-5 text-[#15231d] sm:text-sm">
        {value}
      </div>
    </div>
  );
}

function TriggerCaseCard({
  trace,
  unitFallback = "-"
}: {
  trace: Record<string, any> | null;
  unitFallback?: string;
}) {
  const itemName = trace?.itemName ?? "Barang lelang";
  const imageUrl = trace?.imageUrl ?? trace?.primaryImage?.url ?? null;

  return (
    <section className="flex h-full flex-col rounded-[1.35rem] border border-[#d8e4de] bg-white p-4 shadow-[0_22px_60px_-52px_rgba(8,69,50,0.42)] sm:p-5">
      <h2 className="font-headline text-lg font-black tracking-[-0.02em] text-[#15231d]">
        Kasus Terakhir
      </h2>
      <div className="mt-4 grid gap-4 rounded-[1.1rem] border border-[#edf1ee] bg-[#fbfcfb] p-3 sm:grid-cols-[8rem_minmax(0,1fr)_auto] sm:items-center">
        <div className="relative min-h-32 overflow-hidden rounded-[1rem] border border-[#e1e8e4] bg-white">
          {imageUrl ? (
            <Image
              alt={`Foto barang ${itemName}`}
              className="object-cover"
              fill
              sizes="128px"
              src={imageUrl}
            />
          ) : (
            <div className="grid h-full min-h-32 place-items-center text-[#0a6a49]">
              <PackageOpen className="size-9" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-headline text-xl font-black tracking-[-0.02em] text-[#15231d]">
              {itemName}
            </h3>
            <span className="inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1 text-[0.68rem] font-black uppercase leading-4 tracking-[0.08em] text-red-600 ring-1 ring-red-100 sm:max-w-[32rem]">
              <FileWarning className="size-3.5 shrink-0" />
              {PAYMENT_DEADLINE_EXPLANATION}
            </span>
          </div>
          <div className="mt-3 flex w-max max-w-full items-center gap-2 rounded-lg border border-[#dfe8e3] bg-white px-3 py-2 text-xs font-black text-[#42526b]">
            <MapPin className="size-4 text-[#64756e]" />
            <span className="truncate">{trace?.unitName ?? unitFallback}</span>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-[#536279]">
            Nilai Tagihan
          </p>
          <p className="mt-1 font-headline text-2xl font-black tracking-[-0.03em] text-[#006747]">
            {formatMoney(trace?.amount ?? trace?.finalPrice)}
          </p>
        </div>
      </div>
    </section>
  );
}

function TimelineItemCard({
  expanded,
  item,
  onToggle
}: {
  expanded: boolean;
  item: ViolationItem;
  onToggle: () => void;
}) {
  const completed = !item.isCurrent;
  const tone = getLevelTone(item.level, completed);
  const trace = item.trace;
  const wonAt = parseDate(trace?.wonAt ?? trace?.transactionCreatedAt ?? trace?.createdAt);
  const paymentDeadline = getPaymentDeadlineFromWinTime(trace);

  return (
    <div className={cn("relative border-l-[3px] pb-4 pl-7 last:pb-0", tone.line)}>
      <span className={cn("absolute -left-[10px] top-1 size-[17px] rounded-full ring-4", tone.dot)} />
      <article
        className={cn(
          "-mt-1 overflow-hidden rounded-[1rem] border bg-white shadow-[0_18px_42px_-38px_rgba(15,23,42,0.4)] ring-4 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          tone.border,
          tone.glow
        )}
      >
        <button
          aria-expanded={expanded}
          className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#fbfcfb] active:scale-[0.995]"
          type="button"
          onClick={onToggle}
        >
          <span>
            <span className={cn("block text-base font-black", tone.text)}>
              Pelanggaran Level {item.level}
            </span>
            <span className="mt-1 block text-xs font-black text-[#0a6a49]">
              {item.title}
            </span>
            <span className="mt-1 block text-xs font-black text-[#0a6a49]">
              {item.isCurrent ? "Masa hukuman aktif" : "Masa hukuman selesai"}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-3 text-xs font-black text-[#42526b]">
            {item.date}
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </span>
        </button>
        {expanded ? (
          <div className="border-t border-[#edf2ee] px-4 pb-4 pt-3">
            <p className="text-sm font-semibold leading-6 text-[#52625b]">
              Pemenang lelang tidak melakukan pembayaran dalam batas waktu 24 jam.
            </p>
            <div className="mt-4 grid gap-3 rounded-[1rem] border border-[#dfe8e3] bg-[#f8fafc] p-3 md:grid-cols-4">
              <DossierTile
                icon={<ShoppingBag className="size-3.5" />}
                label="Nama Barang"
                value={item.title}
              />
              <DossierTile
                icon={<Clock3 className="size-3.5" />}
                label="Waktu Menang Lelang"
                value={formatDisplayDateTime(wonAt) === "-" ? item.date : formatDisplayDateTime(wonAt)}
              />
              <DossierTile
                icon={<Timer className="size-3.5 text-red-500" />}
                label="Batas Waktu Bayar"
                value={<span className="text-red-600">{formatDisplayDateTime(paymentDeadline)}</span>}
              />
              <DossierTile
                icon={<Receipt className="size-3.5" />}
                label="Winning Bid"
                value={formatMoney(trace?.amount ?? trace?.finalPrice)}
              />
            </div>
          </div>
        ) : null}
      </article>
    </div>
  );
}

function CountdownPanel({
  currentViolation,
  entry,
  serverNow
}: {
  currentViolation: ViolationItem | undefined;
  entry: SuperadminBlacklistDetailEntry;
  serverNow: string;
}) {
  const level = currentViolation?.level ?? getLevel(entry);
  const storedDeadline = parseDate(entry.blockedUntilAt);
  const derivedDeadline = getDeadline(currentViolation);
  const deadline = (derivedDeadline ?? storedDeadline)?.toISOString() ?? null;
  const startDate =
    getViolationStartDate(currentViolation) ?? parseDate(entry.lastIncidentAt ?? entry.lastIncident);
  const [now, setNow] = useState(() => getSyncedNow(serverNow));
  const ticker = getTickerState(deadline, now);
  const tone = getLevelTone(level, String(entry.status ?? "").toUpperCase() !== "AKTIF");

  useEffect(() => {
    const serverNowMs = serverNow ? new Date(serverNow).getTime() : Number.NaN;
    const performanceStart = typeof performance !== "undefined" ? performance.now() : 0;
    const dateStart = Date.now();

    function getNow() {
      if (Number.isNaN(serverNowMs)) {
        return Date.now();
      }

      const elapsedMs =
        typeof performance !== "undefined"
          ? performance.now() - performanceStart
          : Date.now() - dateStart;

      return serverNowMs + Math.max(0, elapsedMs);
    }

    setNow(getNow());
    const intervalId = window.setInterval(() => setNow(getNow()), 1000);

    return () => window.clearInterval(intervalId);
  }, [serverNow]);

  return (
    <section className="flex h-full flex-col rounded-[1.35rem] border border-[#d8e4de] bg-white p-4 shadow-[0_22px_60px_-52px_rgba(8,69,50,0.42)] sm:p-5">
      <h2 className="font-headline text-lg font-black tracking-[-0.02em] text-[#15231d]">
        Masa Berlaku Hukuman
      </h2>
      <p className="mt-3 flex items-center gap-2 text-sm font-black text-[#42526b]">
        <CalendarClock className="size-4" />
        {formatDisplayDate(startDate)} - {formatDisplayDate(parseDate(deadline))}
      </p>
      <div className="mt-5 grid grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-center gap-1.5">
        {[
          ["Hari", ticker.days],
          ["Jam", ticker.hours],
          ["Mnt", ticker.minutes],
          ["Dtk", ticker.seconds]
        ].map(([label, value], index) => (
          <div className="contents" key={label}>
            <div className="rounded-[0.9rem] border border-[#e2e8f0] bg-white px-2 py-3 text-center shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]">
              <p className={cn("font-headline text-[1.45rem] font-black leading-none sm:text-[1.65rem]", tone.text)}>
                {value}
              </p>
              <p className="mt-1 text-[0.58rem] font-black uppercase tracking-[0.1em] text-[#536279]">
                {label}
              </p>
            </div>
            {index < 3 ? <span className="pb-5 text-lg font-black text-[#94a3b8]">:</span> : null}
          </div>
        ))}
      </div>
      <p className={cn("mt-3 text-sm font-black xl:mt-auto xl:pt-4", tone.text)}>
        {ticker.label}
      </p>
    </section>
  );
}

function getViolationRecordSummary(entry: SuperadminBlacklistDetailEntry, recordedCount: number) {
  const summary = entry.crossUnitViolationSummary;
  const currentUnitCount = Math.max(
    0,
    Number(summary?.currentUnitViolationCount ?? recordedCount),
  );
  const externalUnitCount = Math.max(0, Number(summary?.externalViolationCount ?? 0));

  return {
    currentUnitCount,
    externalUnitCount,
    total: Math.max(recordedCount, currentUnitCount + externalUnitCount),
  };
}

function ViolationRecordSummary({
  summary,
}: {
  summary: ReturnType<typeof getViolationRecordSummary>;
}) {
  return (
    <dl className="grid grid-cols-3 divide-x divide-[#e1ebe5] overflow-hidden rounded-[0.95rem] border border-[#dfe8e3] bg-[#fbfcfb] text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
      {[
        ["Pelanggaran Tercatat", summary.total],
        ["Di Unit Terkait", summary.currentUnitCount],
        ["Di Luar Unit", summary.externalUnitCount],
      ].map(([label, value]) => (
        <div className="min-w-0 px-2 py-2.5" key={label}>
          <dt className="text-[0.56rem] font-black uppercase tracking-[0.08em] text-[#64756e] sm:text-[0.6rem]">
            {label}
          </dt>
          <dd className="mt-1 text-xs font-black text-[#0a6a49] sm:text-sm">
            {value} kasus
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ViolationLevelGuide() {
  const levels = [
    {
      badgeTone: "bg-amber-100 text-amber-700 ring-amber-200",
      cardTone: "border-amber-300 bg-amber-50/30",
      description: "Selama 7 hari, buyer tidak bisa menawar pada Lelang Tertutup. Pembelian barang Harga Tetap tetap tersedia, sehingga buyer masih bisa membeli barang dengan harga langsung.",
      icon: AlertTriangle,
      iconTone: "text-amber-600",
      label: "Level 1",
    },
    {
      badgeTone: "bg-orange-100 text-orange-700 ring-orange-200",
      cardTone: "border-orange-300 bg-orange-50/25",
      description: "Selama 30 hari, buyer tidak bisa menawar pada Lelang Tertutup dan tidak bisa membeli barang Harga Tetap. Akun tetap dapat dibuka untuk melihat riwayat dan informasi.",
      icon: AlertTriangle,
      iconTone: "text-orange-600",
      label: "Level 2",
    },
    {
      badgeTone: "bg-rose-100 text-rose-700 ring-rose-200",
      cardTone: "border-rose-300 bg-rose-50/45",
      description: "Selama 365 hari, akun buyer ditangguhkan. Buyer tidak bisa login masuk ke sistem sampai masa penangguhan selesai.",
      icon: Lock,
      iconTone: "text-rose-600",
      label: "Level 3",
    },
  ];

  return (
    <section className="rounded-[1.35rem] border border-[#d8e4de] bg-white px-4 py-4 shadow-[0_18px_48px_-44px_rgba(8,69,50,0.34)] sm:px-5">
      <h2 className="font-headline text-base font-black tracking-[-0.02em] text-[#15231d]">
        Keterangan Level Pelanggaran
      </h2>
      <p className="mt-1 max-w-[62rem] text-xs font-semibold leading-5 text-[#52625b]">
        Level pelanggaran menunjukkan tingkat pembatasan akun berdasarkan riwayat gagal bayar dan akumulasi pelanggaran buyer.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {levels.map((level) => {
          const Icon = level.icon;

          return (
            <article className={cn("rounded-[1rem] border px-4 py-3.5", level.cardTone)} key={level.label}>
              <div className={cn("inline-flex items-center gap-2 rounded-full px-2.5 py-1.5 text-sm font-black ring-1", level.badgeTone)}>
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/70 ring-1 ring-white/80">
                  <Icon className={cn("size-3.5", level.iconTone)} />
                </span>
                <h3 className="font-headline text-sm font-black tracking-[-0.01em]">{level.label}</h3>
              </div>
              <p className="mt-3 text-justify text-xs font-semibold leading-5 text-[#52625b]">{level.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function SuperadminBlacklistDetailWorkspace({
  entry,
  scope = "superadmin",
  serverNow
}: {
  entry: SuperadminBlacklistDetailEntry;
  scope?: BlacklistDetailScope;
  serverNow: string;
}) {
  const items = useMemo(() => getViolationItems(entry), [entry]);
  const [expandedId, setExpandedId] = useState(items[0]?.id ?? "");
  const selected = items.find((item) => item.id === expandedId) ?? items[0];
  const currentViolation = getCurrentViolationItem(items);
  const selectedTrace = selected?.trace ?? entry.latestUnpaidAuction ?? null;
  const level = currentViolation?.level ?? getLevel(entry);
  const levelTone = getLevelTone(level, String(entry.status ?? "").toUpperCase() !== "AKTIF");
  const isAdminUnit = scope === "admin-unit";
  const listHref = isAdminUnit ? "/admin/blacklist" : "/superadmin/blacklist";
  const unitFallback = isAdminUnit ? (entry.unitName ?? entry.unit ?? "Unit ini") : (entry.unitName ?? entry.unit ?? "-");
  const violationRecordSummary = getViolationRecordSummary(entry, items.length);

  return (
    <div className="space-y-6">
      <AdminPageHero
        description={
          isAdminUnit
            ? "Dossier unit untuk membaca pemicu pelanggaran, status pembatasan, dan kronologi gagal bayar buyer pada barang lelang unit ini."
            : "Dossier nasional untuk membaca pemicu pelanggaran, status pembatasan, dan kronologi gagal bayar buyer lintas unit."
        }
        eyebrow={isAdminUnit ? "Admin Unit / Detail Pelanggaran" : "Superadmin / Detail Pelanggaran"}
        icon={Ban}
        title="Detail Pelanggaran Pengguna"
      />

      <nav className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-[#64756e]">
        <Link className="transition hover:text-[#006747]" href={listHref}>
          Pelanggaran
        </Link>
        <ChevronRight className="size-3.5 text-[#94a3b8]" />
        <span>Detail Dossier</span>
        <ChevronRight className="size-3.5 text-[#94a3b8]" />
        <span className="text-[#15231d]">{entry.name}</span>
      </nav>

      <section className="rounded-[1.35rem] border border-[#d8e4de] bg-white p-5 shadow-[0_24px_72px_-58px_rgba(8,69,50,0.44)]">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <span className={cn("grid size-16 shrink-0 place-items-center rounded-full text-2xl font-black ring-1", levelTone.badge)}>
              {getInitials(entry.name || "Buyer")}
            </span>
            <div className="min-w-0">
              <h1 className="truncate font-headline text-2xl font-black tracking-[-0.03em] text-[#15231d]">
                {entry.name}
              </h1>
              <p className="mt-1 truncate text-sm font-semibold text-[#42526b]">
                {entry.email ?? entry.userId}
              </p>
            </div>
          </div>
          <div className={cn("inline-flex items-center gap-2 rounded-[1rem] px-4 py-3 text-sm font-black uppercase tracking-[0.08em] shadow-[0_16px_34px_-28px_rgba(15,23,42,0.45)] ring-1", levelTone.badge)}>
            <ShieldAlert className="size-4" />
            Status: Level {level} ({getDurationDays(level)} Hari)
          </div>
        </div>
      </section>

      <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(21rem,0.95fr)]">
        <TriggerCaseCard trace={selectedTrace} unitFallback={unitFallback} />
        <CountdownPanel currentViolation={currentViolation} entry={entry} serverNow={serverNow} />
      </div>

      <section className="rounded-[1.35rem] border border-[#d8e4de] bg-white p-4 shadow-[0_22px_60px_-52px_rgba(8,69,50,0.42)] sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h2 className="font-headline text-lg font-black tracking-[-0.02em] text-[#15231d]">
            Riwayat Pelanggaran (Timeline)
          </h2>
          <div className="w-full sm:w-[24rem]">
            <ViolationRecordSummary summary={violationRecordSummary} />
          </div>
        </div>
        <div className="mt-5">
          {items.map((item) => (
            <TimelineItemCard
              expanded={item.id === expandedId}
              item={item}
              key={item.id}
              onToggle={() => setExpandedId((current) => (current === item.id ? "" : item.id))}
            />
          ))}
        </div>
      </section>

      <ViolationLevelGuide />
    </div>
  );
}
