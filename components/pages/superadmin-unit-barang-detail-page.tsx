import Link from "next/link";
import type { ReactNode } from "react";
import {
  BadgeCheck,
  Building2,
  CalendarClock,
  CalendarDays,
  CarFront,
  FileText,
  FileWarning,
  Gavel,
  Gem,
  Hash,
  Landmark,
  Medal,
  MonitorSmartphone,
  Package2,
  PackagePlus,
  Phone,
  ReceiptText,
  Ruler,
  Scale,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
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

  if (categoryValue.includes("emas") || categoryValue.includes("perhias")) {
    if (rowValue.includes("berat")) return Scale;
    if (rowValue.includes("panjang") || rowValue.includes("diameter")) return Ruler;
    if (rowValue.includes("sertifikat")) return ShieldCheck;
    return Gem;
  }
  if (categoryValue.includes("logam")) return rowValue.includes("berat") ? Scale : Medal;
  if (categoryValue.includes("kendara")) return rowValue.includes("nomor") ? Hash : CarFront;
  if (categoryValue.includes("elektronik")) {
    return rowValue.includes("garansi") ? ShieldCheck : MonitorSmartphone;
  }
  if (rowValue.includes("ukuran")) return Ruler;
  if (rowValue.includes("material")) return Sparkles;
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

function InfoCard({
  icon: Icon,
  label: title,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-[1rem] border border-[#e7eeea] bg-white px-4 py-4 shadow-[0_10px_26px_-24px_rgba(8,69,50,0.24)]">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-[#f4fbf7] text-[#0a9f62] ring-1 ring-[#d8eadf]">
          <Icon className="size-4.5" />
        </span>
        <div className="min-w-0">
          <p className="text-[0.72rem] font-medium text-[#667085]">{title}</p>
          <p className="mt-1.5 break-words text-[0.98rem] font-medium leading-6 text-[#14213d]">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function AssetTimeline({
  detail,
}: {
  detail: SuperAdminUnitBarangDetail;
}) {
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
            createdAtLabel: String(detail.item.pawnedAt ?? detail.item.date ?? "-"),
          },
        ];
  const icons: Partial<Record<string, LucideIcon>> = {
    input_baru: PackagePlus,
    perpanjangan: CalendarClock,
    ditebus: ReceiptText,
    dipasarkan: Gavel,
    terjual: BadgeCheck,
    gagal: FileWarning,
  };

  return (
    <aside className="flex h-full max-h-[min(44rem,calc(100vh-8rem))] min-h-0 flex-col overflow-hidden rounded-3xl border border-[#e2ebe6] bg-white shadow-[0_18px_54px_-46px_rgba(8,69,50,0.34)]">
      <div className="flex items-center gap-3 px-4 py-4">
        <span className="grid size-10 place-items-center rounded-full border border-[#e3efe7] bg-[#f8fcf9] text-[#0a9f62]">
          <ShoppingBag className="size-4.5" />
        </span>
        <h3 className="text-[1.28rem] font-medium tracking-[-0.02em] text-[#14213d]">
          Riwayat Kronologi Aset
        </h3>
      </div>
      <div className="scrollbar-none relative min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <div className="absolute bottom-5 left-[2.95rem] top-2 w-px bg-[#dceddf]" />
        {entries.map((entry) => {
          const Icon = icons[entry.actionKey] ?? FileText;
          const stamp = String(entry.createdAtLabel ?? "").split(",");
          return (
            <div
              className="relative grid grid-cols-[2.8rem_minmax(0,1fr)_5.8rem] gap-3 py-3.5"
              key={entry.id}
            >
              <div className="relative flex justify-center">
                <span className="grid size-9 place-items-center rounded-full border border-[#e3efe7] bg-[#f8fcf9] text-[#0a9f62]">
                  <Icon className="size-4" />
                </span>
                <span className="absolute -right-1 top-3 size-2.5 rounded-full bg-[#099561] ring-4 ring-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[0.93rem] font-medium leading-6 text-[#14213d]">
                  {entry.actionLabel}
                </h3>
                <p className="mt-1.5 text-[0.88rem] leading-6 text-[#667085]">{entry.note}</p>
                <p className="mt-1 text-[0.74rem] font-semibold leading-5 text-[#0a6a49]">
                  Aktor Internal: {entry.actorName || "Sistem Otomatis"}
                </p>
              </div>
              <div className="pt-0.5 text-right text-[0.78rem] leading-6 text-[#667085]">
                <p>{stamp[0]?.trim() || "-"}</p>
                <p>{stamp.slice(1).join(",").trim()}</p>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

export function SuperAdminUnitBarangDetailPage({
  detail,
}: {
  detail: SuperAdminUnitBarangDetail | null;
}) {
  if (!detail) {
    return (
      <Card className="border border-border/70 bg-white p-8">
        <p className="text-muted-foreground">Barang tidak ditemukan pada unit ini.</p>
      </Card>
    );
  }

  const { item, marketing, unit } = detail;
  const itemName = String(item.name ?? "Detail Barang");
  const itemCode = String(item.code ?? item.id);
  const media = Array.isArray(item.media) ? item.media : marketing?.media ?? [];
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
    { label: "Jatuh Tempo", value: item.dueDate || "-", icon: CalendarClock },
  ];
  const bottomInfoRows = [
    { label: "Tanggal Gadai", value: item.pawnedAt || item.date || "-", icon: CalendarDays },
    { label: "Nama Nasabah", value: item.ownerName || "-", icon: UserRound },
    { label: "Nomor Telepon Nasabah", value: item.customerNumber || "-", icon: Phone },
  ];

  return (
    <div className="space-y-5">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-[0.72rem] font-bold text-[#536279]">
        <span>Superadmin / Detail Barang</span>
        <span className="text-[#c5d1cb]">/</span>
        <Link className="hover:text-[#00563b]" href={`/superadmin/unit/${unit.id}`}>
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
            <span className={cn("inline-flex items-center gap-2 rounded-full px-4 py-2 text-[0.72rem] font-black uppercase tracking-[0.14em] ring-1", toneClass(detail.operationalTone))}>
              <span className={cn("size-1.5 rounded-full", dotClass(detail.operationalTone))} />
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

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_21.5rem]">
        <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
          <div className="space-y-5 p-4 lg:p-5">
            <div className="relative overflow-hidden rounded-[1.35rem] border border-[#dcebe2] bg-[linear-gradient(135deg,rgba(223,242,232,0.88),rgba(255,255,255,0.98))] p-4 lg:p-5">
              <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start">
                <div className="w-full shrink-0 lg:w-[18rem]">
                  <AdminBarangDetailMediaViewer category={categoryLabel(String(item.category ?? ""))} media={media} title={itemName} />
                </div>
                <div className="min-w-0 flex-1 space-y-4">
                  <div>
                    <p className="font-headline text-[2rem] font-black tracking-[-0.04em] text-[#14213d] sm:text-[2.45rem]">{itemName}</p>
                    <p className="mt-3 text-[0.95rem] text-[#667085]">
                      Kode Barang: <span className="font-medium text-[#0a9f62]">{itemCode}</span>
                    </p>
                  </div>
                  <div className="grid gap-2.5 sm:grid-cols-3">
                    <InfoCard icon={Package2} label="Kategori" value={categoryLabel(String(item.category ?? "-"))} />
                    <InfoCard icon={ShieldCheck} label="Kondisi" value={label(item.condition)} />
                    <InfoCard icon={Landmark} label="Nilai Taksiran" value={currency.format(Number(item.appraisalValue ?? 0))} />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-[#eef1ee] bg-white p-4">
              <p className="text-[0.7rem] font-black uppercase tracking-[0.14em] text-[#6a7d73]">Spesifikasi Barang</p>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {topInfoRows.map((row) => <InfoCard {...row} key={row.label} />)}
              </div>
              <div className="h-px bg-[#eef1ee]" />
              <p className="text-[0.7rem] font-black uppercase tracking-[0.14em] text-[#6a7d73]">Informasi Gadai</p>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {bottomInfoRows.map((row) => <InfoCard {...row} key={row.label} />)}
              </div>
            </div>

            <div className="rounded-2xl border border-[#eaeeeb] bg-white px-4 py-4">
              <div className="flex items-start gap-3.5">
                <span className="grid size-11 shrink-0 place-items-center rounded-[0.9rem] border border-[#ddf1e6] bg-[#f7fbf8] text-[#0a9f62]">
                  <FileText className="size-5" />
                </span>
                <div>
                  <h3 className="text-[1.05rem] font-medium text-[#0d8b56]">Deskripsi Barang</h3>
                  <p className="mt-3 text-justify text-[0.96rem] leading-7 text-[#5f6f86] [hyphens:auto] [text-justify:inter-word]">
                    {item.description || "Belum ada deskripsi barang yang dicatat."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <AssetTimeline detail={detail} />
      </div>

      {marketing ? (
        <DeferredSuperAdminMarketingAudit
          marketing={marketing}
          receiptContext={{
            itemCode,
            itemMedia: media,
            itemTitle: itemName,
            unitAddress: unit.address,
            unitName: unit.name,
          }}
        />
      ) : null}
    </div>
  );
}
