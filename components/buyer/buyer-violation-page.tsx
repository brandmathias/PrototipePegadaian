"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  Coins,
  Eye,
  FileDown,
  History,
  ImageIcon,
  LockKeyhole,
  ReceiptText,
  ShieldAlert,
  ShoppingCart,
  XCircle
} from "lucide-react";

import { getBlacklistRestrictionPolicy } from "@/lib/blacklist/restrictions";
import type { BuyerViolationHistoryEntry, BuyerViolationPageData } from "@/lib/services/buyer.service";
import { cn } from "@/lib/utils";

const numberFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0
});

type BuyerViolationPageProps = {
  data: BuyerViolationPageData;
  serverNow: string;
};

function formatCurrency(value: number) {
  return `Rp ${numberFormatter.format(value)}`;
}

function getCountdownParts(untilAt: string | null, now: number) {
  if (!untilAt) {
    return [
      { label: "Hari", value: "00" },
      { label: "Jam", value: "00" },
      { label: "Menit", value: "00" },
      { label: "Detik", value: "00" }
    ];
  }

  const until = new Date(untilAt).getTime();
  const distance = Number.isFinite(until) && Number.isFinite(now) ? Math.max(0, until - now) : 0;
  const totalSeconds = Math.floor(distance / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  return [
    { label: "Hari", value: String(days).padStart(2, "0") },
    { label: "Jam", value: String(hours).padStart(2, "0") },
    { label: "Menit", value: String(minutes).padStart(2, "0") },
    { label: "Detik", value: String(seconds).padStart(2, "0") }
  ];
}

function FeatureRow({
  icon,
  title,
  description,
  tone = "success"
}: {
  icon: ReactNode;
  title: string;
  description: string;
  tone?: "success" | "danger";
}) {
  return (
    <div className="flex items-start gap-4 rounded-[1.25rem] border border-black/5 bg-white px-4 py-3.5 shadow-[0_16px_40px_-34px_rgba(10,31,25,0.38)]">
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-2xl",
          tone === "danger" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
        )}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-black text-[#101923]">{title}</p>
        <p className="mt-1 text-sm leading-6 text-[#506079]">{description}</p>
      </div>
    </div>
  );
}

function TimelineItem({
  entry,
  active,
  expanded,
  onToggle
}: {
  entry: BuyerViolationHistoryEntry;
  active: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const entryPolicy = entry.violationLevel > 0 ? getBlacklistRestrictionPolicy(entry.violationLevel) : null;
  const levelLabel = entryPolicy
    ? `Level ${entry.violationLevel} Pembatasan (${entryPolicy.durationDays} Hari)`
    : "Pelanggaran Tercatat";

  if (!expanded) {
    return (
      <article className="relative rounded-[1.1rem] border border-black/10 bg-white px-3 py-3 shadow-[0_14px_36px_-32px_rgba(10,31,25,0.28)] transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-emerald-200">
        <button
          aria-expanded={expanded}
          aria-label={`Buka detail pelanggaran ${entry.itemName}`}
          className="absolute right-4 top-4 grid size-8 place-items-center rounded-full text-[#24324a] transition hover:bg-slate-50 hover:text-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          onClick={onToggle}
          type="button"
        >
          <ChevronDown className="size-5" />
        </button>

        <div className="grid gap-4 pr-10 md:grid-cols-[13rem_minmax(0,1fr)] md:items-center xl:grid-cols-[13rem_minmax(0,1.05fr)_minmax(11rem,0.55fr)_minmax(11rem,0.55fr)_minmax(12rem,0.62fr)_auto]">
          <div className="relative h-24 overflow-hidden rounded-[0.85rem] bg-slate-100 md:h-20">
            {entry.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={`Foto ${entry.itemName}`}
                className="h-full w-full object-cover"
                src={entry.imageUrl}
              />
            ) : (
              <span className="grid h-full place-items-center text-[#8b968e]">
                <ImageIcon className="size-8" />
              </span>
            )}
          </div>

          <div className="min-w-0">
            <p className="text-xs font-black text-[#101923]">{entry.itemName}</p>
            <h3 className="mt-1 font-headline text-lg font-black text-[#101923]">{levelLabel}</h3>
            <p className="mt-1 text-sm leading-6 text-[#506079]">{entry.note}</p>
          </div>

          <div className="flex items-center gap-3 border-black/10 md:border-l md:pl-5">
            <Building2 className="size-5 shrink-0 text-[#33405a]" />
            <div>
              <p className="text-[0.68rem] font-medium text-[#728096]">Unit Pelaksana</p>
              <p className="mt-0.5 text-sm font-bold text-[#101923]">{entry.unitName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 border-black/10 md:border-l md:pl-5">
            <Coins className="size-5 shrink-0 text-[#33405a]" />
            <div>
              <p className="text-[0.68rem] font-medium text-[#728096]">Nilai Transaksi</p>
              <p className="mt-0.5 text-sm font-bold text-[#101923]">{formatCurrency(entry.amount)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 border-black/10 md:border-l md:pl-5">
            <CalendarClock className="size-5 shrink-0 text-[#33405a]" />
            <div>
              <p className="text-[0.68rem] font-medium text-[#728096]">Tanggal Terjadi</p>
              <p className="mt-0.5 text-sm font-bold text-[#101923]">{entry.occurredAtLabel}</p>
            </div>
          </div>

          <div>
            <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">
              <CheckCircle2 className="size-4" />
              {active ? "Masa sanksi aktif" : "Masa sanksi selesai"}
            </span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={cn(
        "relative rounded-[1.1rem] border bg-white px-3 py-3 shadow-[0_18px_44px_-36px_rgba(10,31,25,0.28)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        active ? "border-orange-300" : "border-black/10"
      )}
    >
      <button
        aria-expanded={expanded}
        aria-label={`Tutup detail pelanggaran ${entry.itemName}`}
        className="absolute right-4 top-4 z-[1] grid size-8 place-items-center rounded-full text-[#24324a] transition hover:bg-slate-50 hover:text-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
        onClick={onToggle}
        type="button"
      >
        <ChevronDown className="size-5 rotate-180 transition-transform" />
      </button>

      <div className="grid gap-4 pr-10 lg:grid-cols-[13rem_minmax(0,1fr)_1px_minmax(25rem,0.95fr)] lg:items-center">
        <div className="relative h-32 overflow-hidden rounded-[0.85rem] bg-slate-100">
          {entry.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={`Foto ${entry.itemName}`}
              className="h-full w-full object-cover"
              src={entry.imageUrl}
            />
          ) : (
            <span className="grid h-full place-items-center text-[#8b968e]">
              <ImageIcon className="size-9" />
            </span>
          )}
        </div>

        <div className="min-w-0">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-black text-[#101923]">{entry.itemName}</p>
              {active ? (
                <span className="rounded-md border border-orange-200 bg-orange-50 px-2 py-0.5 text-[0.66rem] font-black text-orange-600">
                  AKTIF
                </span>
              ) : null}
            </div>
            <h2 className="mt-1 font-headline text-xl font-black text-[#101923]">{levelLabel}</h2>
            <p className="mt-1 text-sm leading-6 text-[#506079]">{entry.note}</p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,0.9fr)]">
            <div className="flex items-center gap-3">
              <Building2 className="size-5 shrink-0 text-[#33405a]" />
              <div>
                <p className="text-[0.68rem] font-medium text-[#728096]">Unit Pelaksana</p>
                <p className="mt-0.5 text-sm font-bold text-[#101923]">{entry.unitName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 border-black/10 sm:border-l sm:pl-5">
              <Coins className="size-5 shrink-0 text-[#33405a]" />
              <div>
                <p className="text-[0.68rem] font-medium text-[#728096]">Nilai Transaksi</p>
                <p className="mt-0.5 text-sm font-bold text-[#101923]">{formatCurrency(entry.amount)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden h-24 w-px bg-black/10 lg:block" />

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[0.85rem] border border-black/10 bg-white px-4 py-3">
            <div className="flex items-center gap-3">
              <Clock3 className="size-9 shrink-0 text-[#46536a]" />
              <div>
                <p className="text-[0.65rem] font-black uppercase text-[#6b7586]">Waktu Menang Lelang</p>
                <p className="mt-1 text-sm font-black leading-6 text-[#101923]">{entry.occurredAtLabel}</p>
              </div>
            </div>
          </div>
          <div className="rounded-[0.85rem] border border-red-100 bg-white px-4 py-3">
            <div className="flex items-center gap-3">
              <CalendarClock className="size-9 shrink-0 text-red-600" />
              <div>
                <p className="text-[0.65rem] font-black uppercase text-[#6b7586]">Batas Waktu Bayar</p>
                <p className="mt-1 text-sm font-black leading-6 text-red-600">{entry.paymentDeadlineLabel}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function BuyerViolationPage({ data, serverNow }: BuyerViolationPageProps) {
  const { summary, blacklistUntilAt, violations } = data;
  const policy = getBlacklistRestrictionPolicy(summary.blacklist.violations);
  const hasRestriction = summary.blacklist.active;
  const [expandedViolationId, setExpandedViolationId] = useState<string | null>(
    () => violations[0]?.id ?? null
  );
  const syncedNow = useMemo(() => {
    const serverNowMs = serverNow ? new Date(serverNow).getTime() : Number.NaN;
    const clientStartMs = Date.now();

    return () => {
      if (Number.isNaN(serverNowMs)) {
        return Date.now();
      }

      return serverNowMs + Math.max(0, Date.now() - clientStartMs);
    };
  }, [serverNow]);
  const [now, setNow] = useState(() => syncedNow());
  const countdown = getCountdownParts(blacklistUntilAt, now);
  const restrictionTitle = hasRestriction
    ? "Sedang Dibatasi Sementara"
    : "Akun Dalam Kondisi Baik";
  const restrictionBadge = hasRestriction
    ? `Level ${policy.level} Pembatasan (${policy.durationDays} Hari)`
    : "Tidak Ada Pembatasan";
  const restrictedFeatures = hasRestriction
    ? [
        ...(policy.blocksVickrey
          ? [
              {
                icon: <XCircle className="size-5" />,
                title: "Pengajuan Bid Lelang Baru",
                description: "Anda belum dapat mengikuti Lelang Tertutup atau mengirim penawaran baru."
              }
            ]
          : []),
        ...(policy.blocksFixedPrice
          ? [
              {
                icon: <ShoppingCart className="size-5" />,
                title: "Pembelian Harga Tetap Baru",
                description: "Transaksi beli langsung baru ikut dibatasi sesuai level pembatasan aktif."
              }
            ]
          : []),
        ...(policy.blocksTransactionSettlement
          ? [
              {
                icon: <LockKeyhole className="size-5" />,
                title: "Penyelesaian Transaksi Berjalan",
                description: "Unggah bukti dan penyelesaian pembayaran baru ditahan sampai masa pembatasan selesai."
              }
            ]
          : [])
      ]
    : [
        {
          icon: <CheckCircle2 className="size-5" />,
          title: "Tidak Ada Fitur yang Dibatasi",
          description: "Akun dapat memakai fitur pembelian dan lelang sesuai aturan layanan."
        }
      ];
  const activeFeatures = [
    ...(hasRestriction && !policy.blocksFixedPrice
      ? [
          {
            icon: <ShoppingCart className="size-5" />,
            title: "Pembelian Harga Tetap (Beli Langsung)",
            description: "Level saat ini masih mengizinkan transaksi harga tetap baru."
          }
        ]
      : []),
    {
      icon: <FileDown className="size-5" />,
      title: "Unduh Bukti Transaksi Lama",
      description: "Riwayat, nota, dan bukti transaksi yang sudah selesai tetap dapat diakses."
    },
    {
      icon: <History className="size-5" />,
      title: "Akses Riwayat Transaksi",
      description: "Anda tetap dapat memantau arsip transaksi, status lama, dan detail pelanggaran."
    },
    {
      icon: <CircleHelp className="size-5" />,
      title: "Pusat Bantuan",
      description: "Gunakan informasi bantuan untuk memahami alasan pembatasan dan proses pemulihan."
    }
  ];

  useEffect(() => {
    const update = () => setNow(syncedNow());

    update();
    const intervalId = window.setInterval(update, 1000);

    return () => window.clearInterval(intervalId);
  }, [syncedNow]);

  useEffect(() => {
    if (expandedViolationId === null) {
      return;
    }

    if (!violations.some((entry) => entry.id === expandedViolationId)) {
      setExpandedViolationId(violations[0]?.id ?? null);
    }
  }, [expandedViolationId, violations]);

  return (
    <div className="relative left-1/2 -my-8 min-h-[calc(100dvh-4rem)] w-screen -translate-x-1/2 bg-white py-5 md:-my-10 md:py-6">
      <div className="container space-y-4 md:space-y-5">
        <section className="relative overflow-hidden rounded-[1.75rem] border border-black/5 bg-white shadow-[0_28px_80px_-58px_rgba(10,31,25,0.46)]">
          <div
            aria-hidden="true"
            className={cn(
              "absolute inset-y-0 left-0 w-2",
              hasRestriction ? "bg-orange-500" : "bg-emerald-600"
            )}
          />
          <div className="grid gap-6 p-6 md:p-8 xl:grid-cols-[minmax(0,1fr)_minmax(28rem,0.82fr)] xl:items-center">
            <div className="flex gap-5">
              <span
                className={cn(
                  "grid size-24 shrink-0 place-items-center rounded-[1.5rem]",
                  hasRestriction ? "bg-orange-50 text-orange-500" : "bg-emerald-50 text-emerald-700"
                )}
              >
                {hasRestriction ? <ShieldAlert className="size-11" /> : <CheckCircle2 className="size-11" />}
              </span>
              <div className="min-w-0">
                <p className="text-[0.72rem] font-black uppercase text-orange-600">
                  {restrictionBadge}
                </p>
                <h1 className="mt-3 font-headline text-3xl font-black leading-tight text-[#101923] md:text-4xl">
                  Status Penawaran Anda
                  <span className="block">{restrictionTitle}</span>
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#506079] md:text-base">
                  {hasRestriction
                    ? `${summary.blacklist.reason} Data ini diambil dari riwayat pelanggaran pembayaran akun Anda.`
                    : "Tidak ada pembatasan aktif. Akun Anda dapat mengikuti Harga Tetap dan Lelang Tertutup sesuai aturan layanan."}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="mb-3 text-sm font-semibold text-[#34435a]">
                  {hasRestriction ? "Fitur akan aktif kembali dalam:" : "Status pembatasan saat ini:"}
                </p>
                <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-center gap-2">
                  {countdown.map((part, index) => (
                    <div className="contents" key={part.label}>
                      <div className="rounded-[1.1rem] border border-black/10 bg-white px-3 py-3 text-center shadow-sm">
                        <p className="font-headline text-3xl font-black text-orange-500">{part.value}</p>
                        <p className="mt-1 text-xs font-semibold text-[#516078]">{part.label}</p>
                      </div>
                      {index < countdown.length - 1 ? (
                        <span className="text-2xl font-black text-[#516078]">:</span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 rounded-[1.2rem] border border-orange-100 bg-orange-50/55 px-4 py-3 text-sm font-semibold text-[#34435a]">
                <CalendarClock className="size-4 text-orange-600" />
                {hasRestriction ? (
                  <span>
                    Pemulihan otomatis pada:{" "}
                    <strong className="text-orange-600">{summary.blacklist.until}</strong>
                  </span>
                ) : (
                  <span>Akun dalam kondisi baik dan seluruh fitur utama tersedia.</span>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-[1.6rem] border border-red-100 bg-[linear-gradient(135deg,#fff6f6_0%,#fff_100%)] p-5 shadow-[0_22px_60px_-50px_rgba(137,18,18,0.38)]">
            <div className="flex items-start gap-4">
              <span className="grid size-16 shrink-0 place-items-center rounded-[1.25rem] bg-red-50 text-red-700">
                <LockKeyhole className="size-8" />
              </span>
              <div>
                <h2 className="font-headline text-2xl font-black text-red-700">Fitur yang Dibatasi</h2>
                <p className="mt-1 text-sm leading-6 text-[#506079]">
                  Fitur berikut mengikuti level pembatasan yang sedang berlaku di sistem.
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {restrictedFeatures.map((feature) => (
                <FeatureRow
                  description={feature.description}
                  icon={feature.icon}
                  key={feature.title}
                  title={feature.title}
                  tone="danger"
                />
              ))}
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-emerald-100 bg-[linear-gradient(135deg,#f5fff9_0%,#fff_100%)] p-5 shadow-[0_22px_60px_-50px_rgba(8,91,62,0.34)]">
            <div className="flex items-start gap-4">
              <span className="grid size-16 shrink-0 place-items-center rounded-[1.25rem] bg-emerald-50 text-emerald-700">
                <Eye className="size-8" />
              </span>
              <div>
                <h2 className="font-headline text-2xl font-black text-emerald-800">Fitur yang Tetap Aktif</h2>
                <p className="mt-1 text-sm leading-6 text-[#506079]">
                  Akses berikut tetap tersedia agar Anda masih bisa memantau arsip dan bantuan akun.
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {activeFeatures.map((feature) => (
                <FeatureRow
                  description={feature.description}
                  icon={feature.icon}
                  key={feature.title}
                  title={feature.title}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[1.45rem] border border-black/5 bg-white p-5 shadow-[0_20px_64px_-54px_rgba(10,31,25,0.34)] md:p-6">
          <div>
            <div>
              <h2 className="font-headline text-2xl font-black text-[#101923]">
                Riwayat Pelanggaran
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#506079]">
                Berikut adalah pelanggaran pembayaran yang dihitung sebagai akumulasi level sanksi akun.
              </p>
            </div>
          </div>

          {violations.length > 0 ? (
            <div className="relative mt-5 space-y-3 pl-8">
              <div aria-hidden="true" className="absolute bottom-5 left-3 top-5 w-px bg-[#dfe6dc]" />
              {violations.map((entry, index) => (
                <div className="relative" key={entry.id}>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute -left-8 grid place-items-center rounded-full border-[3px] border-white shadow-[0_0_0_1px_rgba(18,31,45,0.08)]",
                      index === 0 && hasRestriction
                        ? "top-4 size-6 bg-orange-500"
                        : "top-1/2 size-6 -translate-y-1/2 bg-emerald-700"
                    )}
                  >
                    {index === 0 && hasRestriction ? (
                      null
                    ) : (
                      <CheckCircle2 className="size-4 text-white" />
                    )}
                  </span>
                  <TimelineItem
                    active={index === 0 && hasRestriction}
                    entry={entry}
                    expanded={expandedViolationId === entry.id}
                    onToggle={() =>
                      setExpandedViolationId((current) => (current === entry.id ? null : entry.id))
                    }
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-[1.4rem] border border-emerald-100 bg-emerald-50/60 px-5 py-8 text-center">
              <CheckCircle2 className="mx-auto size-10 text-emerald-700" />
              <p className="mt-3 font-headline text-xl font-black text-[#101923]">Akun dalam kondisi baik</p>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#506079]">
                Tidak ada riwayat pelanggaran pembayaran yang tercatat pada akun Anda.
              </p>
            </div>
          )}
        </section>

        <section
          className="grid gap-4 rounded-[1.6rem] border border-black/5 bg-white p-5 shadow-[0_18px_56px_-48px_rgba(10,31,25,0.4)] lg:grid-cols-[1fr_1fr]"
          id="bantuan-pembatasan"
        >
          <div className="flex gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
              <ReceiptText className="size-5" />
            </span>
            <div>
              <h2 className="font-headline text-xl font-black text-[#101923]">Bantuan Pembatasan</h2>
              <p className="mt-2 text-sm leading-6 text-[#506079]">
                Jika data pembayaran sudah benar tetapi status belum berubah, siapkan bukti transaksi lama
                dan hubungi admin unit terkait untuk pengecekan manual.
              </p>
            </div>
          </div>
          <div className="rounded-[1.2rem] border border-black/10 bg-white px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase text-[#6b7586]">Ketentuan Sistem</p>
                <p className="mt-1 text-sm leading-6 text-[#34435a]">
                  Level pembatasan mengikuti milestone pelanggaran pembayaran 1x24 jam. Pelanggaran
                  tambahan dalam masa pembatasan yang sama tetap tercatat sistem, tetapi tidak menaikkan
                  level sanksi.
                </p>
              </div>
              <ChevronDown className="size-5 shrink-0 text-[#6b7586]" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
