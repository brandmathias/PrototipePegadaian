"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import {
  BadgeCheck,
  Ban,
  Building2,
  CalendarClock,
  CalendarDays,
  CarFront,
  Circle,
  Cpu,
  FileText,
  Gauge,
  Gem,
  HardDrive,
  Hash,
  Layers,
  Medal,
  Megaphone,
  MonitorSmartphone,
  Package2,
  PackageCheck,
  PackagePlus,
  Phone,
  ReceiptText,
  Ruler,
  Scale,
  ScrollText,
  Shapes,
  ShieldCheck,
  StickyNote,
  Tag,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { AdminPageHero } from "@/components/admin/admin-page-hero";
import { AdminBarangDetailMediaViewer } from "@/components/admin-unit/admin-barang-detail-media-viewer";
import { DeferredSuperAdminMarketingAudit } from "@/components/pages/deferred-superadmin-marketing-audit";
import type {
  SuperAdminUnitBarangDetail,
  SuperAdminUnitBarangItem,
} from "@/components/pages/superadmin-pages";
import {
  ItemDetailInfoCard,
  ItemDetailPriceFrame,
  ItemDetailSectionHeading,
} from "@/components/shared/item-detail-card-primitives";
import { Card } from "@/components/ui/card";
import { getBarangSpecificationRows } from "@/lib/admin-unit/specifications";
import { currency } from "@/lib/formatters/currency";
import { cn } from "@/lib/utils";

function label(value: unknown) {
  return String(value ?? "-")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function categoryLabel(value: string) {
  return label(value);
}

function specificationIcon(category: unknown, rowLabel: string) {
  const categoryValue = String(category ?? "").toLowerCase();
  const rowValue = rowLabel.toLowerCase();

  // Emas & Perhiasan
  if (categoryValue.includes("emas") || categoryValue.includes("perhias")) {
    if (rowValue.includes("jenis")) return Gem;
    if (rowValue.includes("kadar")) return Gauge;
    if (rowValue.includes("berat")) return Scale;
    if (rowValue.includes("bentuk")) return Shapes;
    if (rowValue.includes("panjang")) return Ruler;
    if (rowValue.includes("diameter")) return Circle;
    if (rowValue.includes("sertifikat")) return ScrollText;
    return Gem;
  }

  // Logam Mulia
  if (categoryValue.includes("logam")) {
    if (rowValue.includes("jenis")) return Medal;
    if (rowValue.includes("brand")) return Tag;
    if (rowValue.includes("kadar")) return Gauge;
    if (rowValue.includes("berat")) return Scale;
    if (rowValue.includes("sertifikat") || rowValue.includes("nomor"))
      return ScrollText;
    return Medal;
  }

  // Kendaraan
  if (categoryValue.includes("kendara")) {
    if (rowValue.includes("merek")) return Tag;
    if (rowValue.includes("tipe")) return CarFront;
    if (rowValue.includes("tahun")) return CalendarClock;
    if (rowValue.includes("nomor")) return Hash;
    if (rowValue.includes("kilometer")) return Gauge;
    if (rowValue.includes("dokumen")) return FileText;
    return CarFront;
  }

  // Elektronik
  if (categoryValue.includes("elektronik")) {
    if (rowValue.includes("merek")) return Tag;
    if (rowValue.includes("model")) return Layers;
    if (rowValue.includes("spesifikasi")) return Cpu;
    if (rowValue.includes("kapasitas")) return HardDrive;
    if (rowValue.includes("kelengkapan")) return PackageCheck;
    if (rowValue.includes("garansi")) return ShieldCheck;
    return MonitorSmartphone;
  }

  // Lainnya
  if (rowValue.includes("jenis")) return Package2;
  if (rowValue.includes("material")) return Layers;
  if (rowValue.includes("ukuran")) return Ruler;
  if (rowValue.includes("kelengkapan")) return PackageCheck;
  if (rowValue.includes("catatan")) return StickyNote;
  return Package2;
}

function toneClass(tone: SuperAdminUnitBarangItem["operationalTone"]) {
  const classes = {
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    red: "bg-rose-50 text-rose-700 ring-rose-100",
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
  };
  return classes[tone];
}

function dotClass(tone: SuperAdminUnitBarangItem["operationalTone"]) {
  return {
    amber: "bg-amber-500",
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    red: "bg-rose-500",
    slate: "bg-slate-500",
  }[tone];
}

function AssetTimeline({ detail }: { detail: SuperAdminUnitBarangDetail }) {
  const entries =
    detail.history.length > 0
      ? detail.history
      : [
          {
            id: `${detail.item.id}-received`,
            actionKey: "input_baru" as const,
            actionLabel: "Barang Diterima Unit",
            note: "Barang dicatat sebagai aset jaminan unit.",
            actorName: "Admin Unit",
            createdAtLabel: String(
              detail.item.pawnedAt ?? detail.item.date ?? "-",
            ),
          },
        ];
  const icons: Partial<Record<string, LucideIcon>> = {
    input_baru: PackagePlus,
    perpanjangan: CalendarClock,
    ditebus: ReceiptText,
    dipasarkan: Megaphone,
    terjual: BadgeCheck,
    gagal: Ban,
  };

  return (
    <aside
      className="overflow-hidden rounded-[1.35rem] border border-[#e2ebe6] bg-white shadow-[0_18px_54px_-46px_rgba(8,69,50,0.34)]"
      data-testid="route-real-superadmin-asset-timeline"
    >
      <div className="px-4 pb-2 pt-4">
        <p className="text-[0.72rem] font-black uppercase tracking-[0.16em] text-[#006747]">
          Riwayat Kronologi Aset
        </p>
      </div>

      <div className="scrollbar-none max-h-[22rem] overflow-y-auto px-4 pb-4">
        <table className="w-full table-fixed border-separate border-spacing-0 text-left">
          <colgroup>
            <col className="w-[16%]" />
            <col className="w-[20%]" />
            <col />
            <col className="w-[25%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-[#edf2ee] text-[0.62rem] font-black uppercase tracking-[0.14em] text-[#006747]">
              <th className="border-b border-[#edf2ee] px-3 py-3">Status</th>
              <th className="border-b border-[#edf2ee] px-3 py-3">
                Tanggal & Jam
              </th>
              <th className="border-b border-[#edf2ee] px-3 py-3">Deskripsi</th>
              <th className="border-b border-[#edf2ee] px-3 py-3">
                Aktor / Sumber
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edf2ee] text-[0.78rem] font-semibold text-[#52655d]">
            {entries.map((entry) => {
              const Icon = icons[entry.actionKey] ?? FileText;
              const failed = entry.actionKey === "gagal";

              return (
                <tr className="align-top" key={entry.id}>
                  <td className="px-3 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-2 font-black",
                        failed ? "text-[#dc2626]" : "text-[#006747]",
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      {entry.actionLabel}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-mono text-[0.72rem] leading-5 text-[#40558b]">
                    {entry.createdAtLabel || "-"}
                  </td>
                  <td className="px-3 py-3 leading-5">{entry.note}</td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-2 font-black text-[#006747]">
                      <UserRound className="size-4 shrink-0" />
                      Aktor Internal: {entry.actorName || "Sistem Otomatis"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </aside>
  );
}

export function SuperAdminUnitBarangDetailPage({
  detail,
  initialMarketingIterationId,
}: {
  detail: SuperAdminUnitBarangDetail | null;
  initialMarketingIterationId?: string;
}) {
  const [selectedMarketingIterationId, setSelectedMarketingIterationId] =
    useState(() => initialMarketingIterationId ?? detail?.marketing?.id ?? "");

  useEffect(() => {
    setSelectedMarketingIterationId(initialMarketingIterationId ?? detail?.marketing?.id ?? "");
  }, [detail?.marketing?.id, initialMarketingIterationId]);

  if (!detail) {
    return (
      <Card className="border border-border/70 bg-white p-8">
        <p className="text-muted-foreground">
          Barang tidak ditemukan pada unit ini.
        </p>
      </Card>
    );
  }

  const { item, marketing, unit } = detail;
  const itemName = String(item.name ?? "Detail Barang");
  const itemCode = String(item.code ?? item.id);
  const media = Array.isArray(item.media)
    ? item.media
    : (marketing?.media ?? []);
  const marketingIterations = marketing?.iterationHistory?.length
    ? [
        marketing,
        ...marketing.iterationHistory.filter(
          (entry) => entry.id !== marketing.id,
        ),
      ]
    : marketing
      ? [marketing]
      : [];
  const selectedMarketingIteration =
    marketingIterations.find(
      (entry) => entry.id === selectedMarketingIterationId,
    ) ??
    marketingIterations[0] ??
    marketing;
  const marketingMode = String(
    selectedMarketingIteration?.mode ?? "",
  ).toLowerCase();
  const isVickreyMarketing =
    marketingMode.includes("vickrey") || marketingMode.includes("auction");
  const heroPriceLabel = isVickreyMarketing
    ? "Lelang Tertutup"
    : selectedMarketingIteration
      ? "Harga Tetap"
      : "Nilai Taksiran";
  const heroPriceValue = isVickreyMarketing
    ? (selectedMarketingIteration?.finalPrice ??
      selectedMarketingIteration?.basePrice ??
      item.appraisalValue ??
      0)
    : (selectedMarketingIteration?.price ??
      selectedMarketingIteration?.finalPrice ??
      item.appraisalValue ??
      0);
  const specificationRows = getBarangSpecificationRows(
    String(item.category ?? ""),
    item.specifications ?? {},
  );
  const topInfoRows = [
    ...specificationRows.map((row) => ({
      label: row.label,
      value: row.value || "-",
      icon: specificationIcon(item.category, row.label),
    })),
    {
      label: "Kategori",
      value: categoryLabel(String(item.category ?? "-")),
      icon: Layers,
    },
    { label: "Jatuh Tempo", value: item.dueDate || "-", icon: CalendarClock },
    { label: "Kondisi", value: label(item.condition), icon: BadgeCheck },
  ];
  const bottomInfoRows = [
    {
      label: "Tanggal Gadai",
      value: item.pawnedAt || item.date || "-",
      icon: CalendarDays,
    },
    { label: "Nama Nasabah", value: item.ownerName || "-", icon: UserRound },
    {
      label: "Nomor Telepon Nasabah",
      value: item.customerNumber || "-",
      icon: Phone,
    },
  ];

  return (
    <div className="space-y-5">
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-2 text-[0.72rem] font-bold text-[#536279]"
      >
        <span>Superadmin / Detail Barang</span>
        <span className="text-[#c5d1cb]">/</span>
        <Link
          className="hover:text-[#00563b]"
          href={`/superadmin/unit/${unit.id}`}
        >
          {unit.name}
        </Link>
        <span className="text-[#c5d1cb]">/</span>
        <span className="text-[#13211c]">{itemCode}</span>
      </nav>

      <AdminPageHero
        description="Pantau detail barang lintas unit secara read-only, termasuk aset, media, status pemasaran, transaksi, dan riwayat iterasinya."
        eyebrow="Superadmin / Monitoring Unit"
        icon={ShieldCheck}
        rightRail={
          <>
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-[0.72rem] font-black uppercase tracking-[0.14em] ring-1",
                toneClass(detail.operationalTone),
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  dotClass(detail.operationalTone),
                )}
              />
              Status {detail.operationalStatus}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/78 px-4 py-2 text-[0.72rem] font-black uppercase tracking-[0.14em] text-[#006747] ring-1 ring-[#8fd0a9]/65">
              <Building2 className="size-4" />
              {unit.name}
            </span>
          </>
        }
        title={itemName}
      />

      <div
        className="grid gap-4"
        data-testid="route-real-superadmin-item-audit-stack"
      >
        <section
          className="space-y-5 rounded-[1.45rem] border border-[#e5ece8] bg-white p-4 shadow-[0_18px_44px_-36px_rgba(8,69,50,0.28)] lg:p-5"
          data-testid="route-real-superadmin-item-detail-main-card"
        >
          <div className="grid gap-7 lg:grid-cols-[minmax(18rem,29.5rem)_minmax(0,1fr)] lg:items-start">
            <AdminBarangDetailMediaViewer
              category={categoryLabel(String(item.category ?? ""))}
              media={media}
              title={itemName}
            />

            <div className="min-w-0 space-y-5">
              <div>
                <p className="font-headline text-[2.35rem] font-black leading-[1.06] tracking-[-0.045em] text-[#111827] sm:text-[3.15rem]">
                  {itemName}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-2 text-[1rem] text-[#667085]">
                  <span className="font-medium">Kode Barang:</span>
                  <span className="font-medium text-[#057a35]">{itemCode}</span>
                </div>
              </div>

              <ItemDetailPriceFrame
                label={heroPriceLabel}
                testId="route-real-superadmin-item-price-frame"
                value={currency.format(Number(heroPriceValue))}
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.1rem] border border-[#e6ece8] bg-white">
            <div className="space-y-4 p-4">
              <ItemDetailSectionHeading>
                Spesifikasi Barang
              </ItemDetailSectionHeading>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {topInfoRows.map((row) => (
                  <ItemDetailInfoCard {...row} key={row.label} />
                ))}
              </div>
            </div>

            <div className="space-y-4 border-t border-[#eef2ef] p-4">
              <ItemDetailSectionHeading>
                Informasi Gadai
              </ItemDetailSectionHeading>
              <div className="grid gap-4 md:grid-cols-3">
                {bottomInfoRows.map((row) => (
                  <ItemDetailInfoCard {...row} key={row.label} />
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[0.95rem] border border-[#15965d] bg-white px-4 py-4 shadow-[0_18px_36px_-34px_rgba(8,69,50,0.24)]">
            <ItemDetailSectionHeading>
              Deskripsi Barang
            </ItemDetailSectionHeading>
            <div className="mt-5 flex items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-full border border-[#d9eadf] bg-[#f8fbf9] text-[#057a35]">
                <FileText className="size-5" />
              </span>
              <p className="min-w-0 text-justify text-[0.92rem] leading-7 text-[#3f4a5a] [hyphens:auto] [text-justify:inter-word]">
                {item.description || "Belum ada deskripsi barang yang dicatat."}
              </p>
            </div>
          </div>
        </section>
        <AssetTimeline detail={detail} />
      </div>

      {marketing ? (
        <DeferredSuperAdminMarketingAudit
          marketing={marketing}
          onSelectedIterationChange={setSelectedMarketingIterationId}
          receiptContext={{
            itemCode,
            itemMedia: media,
            itemTitle: itemName,
            unitAddress: unit.address,
            unitName: unit.name,
          }}
          selectedIterationId={
            selectedMarketingIteration?.id ?? selectedMarketingIterationId
          }
        />
      ) : null}
    </div>
  );
}
