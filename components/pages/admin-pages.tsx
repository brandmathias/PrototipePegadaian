import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileWarning,
  Gavel,
  ImagePlus,
  Landmark,
  PackagePlus,
  PencilLine,
  Printer,
  ReceiptText,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldEllipsis,
  ShoppingBag,
  UploadCloud,
  UserRound,
  Wallet
} from "lucide-react";

import { AdminLiveCountdown } from "@/components/admin/admin-live-countdown";
import { AdminUnitActionButton } from "@/components/admin-unit/admin-unit-action-button";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  adminAuctions,
  adminBlacklist,
  adminInventory,
  adminTransactions,
  currency,
  getAdminAuctionById,
  getAdminBlacklistByUserId,
  getAdminInventoryById,
  getAdminTransactionById
} from "@/lib/mock-data";

type AdminInventoryItem = Record<string, any>;
type AdminAuctionItem = Record<string, any>;
type AdminTransactionItem = Record<string, any>;
type AdminBlacklistItem = Record<string, any>;

function dateAfter(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function isDueDateReached(dueDate: string) {
  const due = new Date(`${dueDate}T00:00:00.000Z`).getTime();
  return Number.isFinite(due) && due <= Date.now();
}

function buildBarangPayload(item?: AdminInventoryItem) {
  return {
    name: item?.name ?? "Barang Gadai Baru",
    category: item?.category ?? "Perhiasan",
    condition: item?.condition ?? "baik",
    description: item?.description ?? "Barang gadai dicatat oleh admin unit untuk diproses sesuai workflow PRD.",
    appraisalValue: Number(item?.appraisalValue ?? item?.price ?? 1000000),
    loanValue: Number(item?.loanValue ?? 750000),
    ownerName: item?.ownerName ?? "Nasabah Unit",
    customerNumber: item?.customerNumber ?? `NAS-${Date.now().toString().slice(-6)}`,
    pawnedAt: String(item?.pawnedAt ?? new Date().toISOString().slice(0, 10)),
    dueDate: String(item?.dueDate ?? dateAfter(30))
  };
}

function AdminPageIntro({
  eyebrow,
  title,
  description,
  actions
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <section className="hero-surface section-reveal p-5 sm:p-6 lg:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-4xl">
          <p className="page-heading-eyebrow">
            {eyebrow}
          </p>
          <h2 className="page-heading-title mt-3 font-headline text-3xl font-black tracking-tight text-[#0a6a49] sm:text-4xl lg:text-[2.85rem]">
            {title}
          </h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-foreground/72 sm:text-lg">
            {description}
          </p>
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </section>
  );
}

function PanelTitle({
  title,
  description,
  action
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/8 px-5 py-5 sm:px-6">
      <div>
        <h3 className="font-headline text-[1.55rem] font-black text-black/85 sm:text-[1.8rem]">
          {title}
        </h3>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-black/60 sm:text-base">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-black/50 sm:text-xs">
      {children}
    </label>
  );
}

function DetailTile({
  label,
  value
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="interactive-card rounded-2xl border border-black/10 bg-[#fbfbfb] p-4 sm:p-5">
      <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-black/45 sm:text-xs">
        {label}
      </p>
      <div className="mt-2 text-base font-semibold text-black/80 sm:text-lg">{value}</div>
    </div>
  );
}

function AdminAuctionDeadline({
  auction,
  prefix,
  className
}: {
  auction: AdminAuctionItem;
  prefix?: string;
  className?: string;
}) {
  return (
    <AdminLiveCountdown
      className={className}
      expiredLabel="Deadline terlewati"
      fallbackLabel={auction.ending}
      prefix={prefix}
      targetAt={auction.endingAt}
    />
  );
}

function AdminTransactionDeadline({
  transaction,
  prefix,
  className
}: {
  transaction: AdminTransactionItem;
  prefix?: string;
  className?: string;
}) {
  return (
    <AdminLiveCountdown
      className={className}
      expiredLabel="Batas waktu terlewati"
      fallbackLabel={transaction.deadline}
      prefix={prefix}
      targetAt={transaction.deadlineAt}
    />
  );
}

function EmptyPanel({ text }: { text: string }) {
  return (
    <div className="feedback-pop rounded-[1.4rem] border border-dashed border-black/10 bg-[#fcfcfa] p-5 text-sm text-black/55">
      {text}
    </div>
  );
}

function WorkflowActionCard({
  title,
  description,
  href,
  icon: Icon,
  variant = "secondary"
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: "default" | "secondary";
}) {
  return (
    <div className="interactive-card section-reveal rounded-[1.5rem] border border-black/10 bg-[#fafaf8] p-5">
      <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-white text-[#0a6a49] shadow-sm">
        <Icon className="size-5" />
      </div>
      <h4 className="mt-4 text-lg font-bold text-black/85">{title}</h4>
      <p className="mt-2 text-sm leading-6 text-black/60">{description}</p>
      <div className="mt-5">
        <Link href={href}>
          <Button className="w-full rounded-2xl" variant={variant}>
            Lanjutkan proses
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function AdminInventoryPage({ items = adminInventory }: { items?: AdminInventoryItem[] }) {
  const statusGroups = [
    {
      label: "GADAI",
      items: items.filter((item) => item.status === "GADAI"),
      description: "Masih berada dalam masa tebus dan perlu dipantau kedaluwarsanya."
    },
    {
      label: "JAMINAN",
      items: items.filter((item) => item.status === "JAMINAN"),
      description: "Sudah masuk aset unit dan siap disiapkan untuk penjualan."
    },
    {
      label: "DIPASARKAN",
      items: items.filter((item) => item.status === "DIPASARKAN"),
      description: "Sudah tayang di katalog dan sedang berjalan di pasar."
    },
    {
      label: "GAGAL",
      items: items.filter((item) => item.status === "GAGAL"),
      description: "Perlu evaluasi ulang sebelum dipasarkan kembali."
    }
  ];

  return (
    <div className="space-y-6">
      <AdminPageIntro
        eyebrow="Admin Unit / Barang"
        title="Kelola Barang Unit"
        description="Semua alur barang unit dikelola di sini, mulai dari pencatatan awal, tindak lanjut jatuh tempo, perpindahan ke aset unit, penayangan ke katalog, hingga evaluasi barang yang belum laku."
        actions={
          <>
            <Link href="/admin/barang/tambah">
              <Button className="h-12 rounded-2xl px-4 text-sm sm:text-base">
                <PackagePlus className="size-4" />
                Input Barang Gadai
              </Button>
            </Link>
            <Link href="/admin/lelang">
              <Button className="h-12 rounded-2xl px-4 text-sm sm:text-base" variant="secondary">
                <Gavel className="size-4" />
                Pantau penjualan
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statusGroups.map((group) => (
          <Card className="border border-black/8 bg-white shadow-[0_14px_34px_rgba(0,0,0,0.03)]" key={group.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-black/48">
                  {group.label}
                </p>
                <AdminStatusBadge status={group.label as any} />
              </div>
              <p className="mt-5 font-headline text-[2.6rem] font-black leading-none text-[#0a6a49]">
                {group.items.length}
              </p>
              <p className="mt-3 text-sm leading-6 text-black/60">{group.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
        <PanelTitle
          action={
            <div className="flex flex-wrap gap-2">
              {["SEMUA", "GADAI", "JAMINAN", "DIPASARKAN", "TERJUAL", "GAGAL", "DITEBUS"].map((filter) => (
                <button
                  className="rounded-full border border-black/15 px-3 py-2 text-xs font-semibold text-black/65 hover:border-[#0a6a49] hover:text-[#0a6a49] sm:text-sm"
                  key={filter}
                  type="button"
                >
                  {filter}
                </button>
              ))}
            </div>
          }
          description="Buka detail barang untuk melihat langkah berikutnya yang tersedia pada setiap status."
          title="Daftar Barang Unit"
        />
        <div className="border-b border-black/10 px-6 py-4">
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-black/40" />
            <Input
              className="h-12 rounded-2xl bg-[#f3f3f3] pl-12 text-sm sm:text-base"
              placeholder="Cari kode, nama barang, kategori, atau nomor nasabah..."
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[76rem] text-left lg:min-w-[86rem]">
            <thead className="bg-[#f3f3f3] text-xs uppercase tracking-[0.12em] text-black/50 sm:text-sm">
              <tr>
                <th className="px-6 py-4">Kode</th>
                <th className="px-6 py-4">Barang</th>
                <th className="px-6 py-4">Nilai Taksiran</th>
                <th className="px-6 py-4">Nilai Gadai</th>
                <th className="px-6 py-4">Jatuh Tempo</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Mode Pemasaran</th>
                <th className="px-6 py-4">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr className="border-t border-black/10 text-sm sm:text-base" key={item.id}>
                  <td className="px-6 py-4 font-semibold text-[#0a6a49]">{item.code}</td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-black/85">{item.name}</p>
                      <p className="mt-1 text-sm text-black/55">
                        {item.category} - {item.ownerName}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-black/80">
                    {currency.format(item.appraisalValue)}
                  </td>
                  <td className="px-6 py-4 text-black/65">{currency.format(item.loanValue)}</td>
                  <td className="px-6 py-4 text-black/65">{item.dueDate}</td>
                  <td className="px-6 py-4">
                    <AdminStatusBadge status={item.status} />
                  </td>
                  <td className="px-6 py-4 text-black/65">
                    {item.marketingMode ? item.marketingMode : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      className="inline-flex items-center gap-2 rounded-xl border border-black/15 px-3 py-2 text-xs font-semibold text-[#0a6a49] sm:text-sm"
                      href={`/admin/barang/${item.id}`}
                    >
                      Detail
                      <ArrowRight className="size-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function AdminInventoryCreatePage() {
  return (
    <div className="space-y-6">
      <AdminPageIntro
        eyebrow="Admin Unit / Input Barang"
        title="Tambahkan Barang Gadai"
        description="Gunakan formulir ini untuk mencatat barang masuk beserta appraisal, informasi nasabah, jadwal jatuh tempo, dan media pendukung sebelum lanjut ke proses berikutnya."
      />

      <div className="grid gap-6 xl:grid-cols-[1.22fr_0.78fr]">
        <div className="rounded-2xl border border-black/10 bg-white">
          <PanelTitle
            description="Data awal ini akan menjadi dasar operasional selama barang masih berada dalam masa tebus."
            title="Data Barang"
          />
          <div className="grid gap-5 p-6 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <FieldLabel>Nama barang</FieldLabel>
              <Input className="h-12 text-sm sm:text-base" placeholder="Contoh: Kalung Emas 24K 10 gram" />
            </div>
            <div className="space-y-2">
              <FieldLabel>Kategori</FieldLabel>
              <Input className="h-12 text-sm sm:text-base" placeholder="emas / elektronik / kendaraan" />
            </div>
            <div className="space-y-2">
              <FieldLabel>Kondisi</FieldLabel>
              <Input className="h-12 text-sm sm:text-base" placeholder="baik / cukup / rusak_ringan" />
            </div>
            <div className="space-y-2">
              <FieldLabel>Nilai taksiran</FieldLabel>
              <Input className="h-12 text-sm sm:text-base" placeholder="0" type="number" />
            </div>
            <div className="space-y-2">
              <FieldLabel>Nilai gadai</FieldLabel>
              <Input className="h-12 text-sm sm:text-base" placeholder="0" type="number" />
            </div>
            <div className="space-y-2">
              <FieldLabel>Tanggal gadai</FieldLabel>
              <Input className="h-12 text-sm sm:text-base" type="date" />
            </div>
            <div className="space-y-2">
              <FieldLabel>Tanggal jatuh tempo</FieldLabel>
              <Input className="h-12 text-sm sm:text-base" type="date" />
            </div>
            <div className="space-y-2">
              <FieldLabel>Nama penggadai</FieldLabel>
              <Input className="h-12 text-sm sm:text-base" placeholder="Data internal admin" />
            </div>
            <div className="space-y-2">
              <FieldLabel>Nomor nasabah</FieldLabel>
              <Input className="h-12 text-sm sm:text-base" placeholder="ID nasabah" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <FieldLabel>Deskripsi barang</FieldLabel>
              <Textarea
                className="min-h-40 text-sm sm:text-base"
                placeholder="Jelaskan kondisi fisik, spesifikasi, dan catatan appraisal."
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-dashed border-[#93c7b0] bg-[#f1faf5] p-6">
            <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-white text-[#0a6a49] shadow-sm">
              <UploadCloud className="size-6" />
            </div>
            <h3 className="mt-4 font-headline text-2xl font-black text-[#0a6a49]">
              Upload Media Barang
            </h3>
            <p className="mt-2 text-sm leading-7 text-black/70 sm:text-base">
              Minimal satu foto utama perlu tersedia. Selama barang belum tayang,
              media masih bisa ditambah, diganti, atau dirapikan.
            </p>
            <div className="mt-4 rounded-2xl border border-dashed border-[#93c7b0] bg-white p-8 text-center text-sm text-black/50 sm:text-base">
              Dropzone foto dan video
            </div>
          </div>

          <Card className="rounded-2xl border border-black/10">
            <CardHeader>
              <CardTitle className="text-xl">Checklist sebelum simpan</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Pastikan data inti sudah aman sebelum barang disimpan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-7 text-black/70 sm:text-base">
              <p>- Nilai gadai tidak boleh melebihi nilai taksiran.</p>
              <p>- Tanggal jatuh tempo harus berada setelah tanggal gadai.</p>
              <p>- Setelah disimpan, barang akan masuk ke tahap gadai aktif.</p>
            </CardContent>
          </Card>

          <AdminUnitActionButton
            className="h-12 w-full rounded-2xl text-sm sm:text-base"
            endpoint="/api/admin/barang"
            pendingTitle="Menyimpan barang baru"
            pendingDescription="Data utama dan status awal barang sedang direkam ke sistem unit."
            payload={buildBarangPayload()}
            redirectTo="/admin/barang"
            successDescription="Barang baru sudah masuk ke daftar gadai aktif unit."
            successTitle="Barang gadai tersimpan"
          >
            <PackagePlus className="size-4" />
            Simpan Barang Gadai
          </AdminUnitActionButton>
        </div>
      </div>
    </div>
  );
}

export function AdminInventoryDetailPage({ itemId, item: providedItem }: { itemId?: string; item?: AdminInventoryItem }) {
  const item = providedItem ?? getAdminInventoryById(itemId ?? adminInventory[0].id);
  const gadaiActions = [
    {
      title: "Catat Perpanjangan",
      description: "Perbarui tanggal jatuh tempo tanpa mengubah tahap barang saat ini.",
      href: `/admin/barang/${item.id}/perpanjang`,
      icon: CalendarClock
    },
    {
      title: "Catat Penebusan",
      description: "Catat pelunasan nasabah dan tutup proses barang dengan rapi.",
      href: `/admin/barang/${item.id}/tebus`,
      icon: ReceiptText
    },
    ...(isDueDateReached(item.dueDate)
      ? [
          {
            title: "Jadikan Jaminan",
            description: "Pindahkan ke aset unit karena masa tebus sudah berakhir tanpa pelunasan.",
            href: `/admin/barang/${item.id}/jadikan-jaminan`,
            icon: ShieldAlert
          }
        ]
      : []),
    {
      title: "Edit Data Barang",
      description: "Rapikan data barang selama masih berada dalam proses gadai.",
      href: `/admin/barang/${item.id}/edit`,
      icon: PencilLine,
      variant: "secondary" as const
    }
  ];

  const actions =
    item.status === "GADAI"
      ? gadaiActions
      : item.status === "JAMINAN"
        ? [
            {
              title: "Tayangkan Barang",
              description: "Tentukan skema penjualan yang paling pas lalu tayangkan ke katalog.",
              href: `/admin/barang/${item.id}/pasarkan`,
              icon: Gavel
            },
            {
              title: "Edit Data Barang",
              description: "Lengkapi deskripsi, media, dan appraisal agar siap tayang tanpa revisi berulang.",
              href: `/admin/barang/${item.id}/edit`,
              icon: PencilLine,
              variant: "secondary" as const
            }
          ]
        : item.status === "GAGAL"
          ? [
              {
                title: "Tayangkan Ulang",
                description: "Atur ulang strategi penjualan untuk barang yang belum berhasil terjual.",
                href: `/admin/barang/${item.id}/pasarkan-ulang`,
                icon: RotateCcw
              }
            ]
          : item.status === "DIPASARKAN"
            ? [
                {
                  title: "Buka Sesi Pemasaran",
                  description: "Lihat perkembangan sesi, tenggat waktu, dan status keterbukaan hasil.",
                  href: "/admin/lelang",
                  icon: Gavel
                }
              ]
            : item.status === "MENUNGGU_PEMBAYARAN"
              ? [
                  {
                    title: "Buka Antrian Pembayaran",
                    description: "Amankan penyelesaian pembayaran sebelum tenggat 24 jam terlewati.",
                    href: "/admin/transaksi",
                    icon: Wallet
                  }
                ]
              : [];

  return (
    <div className="space-y-6">
      <AdminPageIntro
        eyebrow="Admin Unit / Detail Barang"
        title={item.name}
        description="Gunakan halaman ini untuk melihat posisi barang saat ini, memeriksa data pendukung, dan melanjutkan langkah yang memang tersedia."
        actions={<AdminStatusBadge className="text-[0.95rem]" status={item.status} />}
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <DetailTile label="Kode Barang" value={item.code} />
            <DetailTile label="Kategori" value={item.category} />
            <DetailTile label="Nilai Taksiran" value={currency.format(item.appraisalValue)} />
            <DetailTile label="Nilai Gadai" value={currency.format(item.loanValue)} />
            <DetailTile label="Tanggal Gadai" value={item.pawnedAt} />
            <DetailTile label="Jatuh Tempo" value={item.dueDate} />
            <DetailTile label="Media" value={item.mediaSummary} />
            <DetailTile label="Status Barang" value={<AdminStatusBadge status={item.status} />} />
          </div>

          <Card className="rounded-2xl border border-black/10">
            <CardHeader>
              <CardTitle className="text-xl sm:text-[1.45rem]">Data Internal & Appraisal</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <div className="space-y-4 md:col-span-2">
                <div>
                  <FieldLabel>Deskripsi barang</FieldLabel>
                  <p className="mt-2 text-sm leading-7 text-black/70 sm:text-base">{item.description}</p>
                </div>
              </div>
              <div>
                <FieldLabel>Nama penggadai</FieldLabel>
                <p className="mt-2 text-base font-semibold text-black/80">{item.ownerName}</p>
              </div>
              <div>
                <FieldLabel>Nomor nasabah</FieldLabel>
                <p className="mt-2 text-base font-semibold text-black/80">{item.customerNumber}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl border border-black/10">
            <CardHeader>
              <CardTitle className="text-xl sm:text-[1.45rem]">Langkah yang Bisa Dilanjutkan</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Tindakan yang muncul di sini sudah disesuaikan dengan status barang saat ini.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {actions.length ? (
                actions.map((action) => (
                  <WorkflowActionCard
                    description={action.description}
                    href={action.href}
                    icon={action.icon}
                    key={action.title}
                    title={action.title}
                    variant={action.variant}
                  />
                ))
              ) : (
                <EmptyPanel text="Saat ini barang cukup dipantau. Belum ada perubahan status yang perlu dilakukan dari halaman ini." />
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-black/10 bg-[#f8faf8]">
            <CardHeader>
              <CardTitle className="text-xl sm:text-[1.4rem]">Catatan proses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-7 text-black/70 sm:text-base">
              <p>- Setiap perubahan tahap perlu dicatat lewat aksi yang tepat agar riwayat proses tetap rapi.</p>
              <p>- Setelah barang tayang di katalog, alurnya tidak kembali ke tahap gadai atau aset unit.</p>
              <p>- Jika memakai mode Vickrey, nominal penawaran tetap tertutup sampai sesi berakhir.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function AdminInventoryEditPage({ itemId, item: providedItem }: { itemId?: string; item?: AdminInventoryItem }) {
  const item = providedItem ?? getAdminInventoryById(itemId ?? adminInventory[0].id);

  return (
    <div className="space-y-6">
      <AdminPageIntro
        eyebrow="Admin Unit / Edit Barang"
        title="Edit Data Barang"
        description="Perbarui informasi barang selama masih berada di tahap yang memungkinkan. Setelah tayang, perubahan inti dibatasi agar informasi publik tetap konsisten."
        actions={<AdminStatusBadge className="text-[0.95rem]" status={item.status} />}
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-black/10 bg-white">
          <PanelTitle description="Form ini sudah terisi dari data barang yang sedang Anda buka." title="Form Edit Barang" />
          <div className="grid gap-5 p-6 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <FieldLabel>Nama barang</FieldLabel>
              <Input className="h-12 text-sm sm:text-base" defaultValue={item.name} />
            </div>
            <div className="space-y-2">
              <FieldLabel>Kategori</FieldLabel>
              <Input className="h-12 text-sm sm:text-base" defaultValue={item.category} />
            </div>
            <div className="space-y-2">
              <FieldLabel>Kondisi</FieldLabel>
              <Input className="h-12 text-sm sm:text-base" defaultValue={item.condition} />
            </div>
            <div className="space-y-2">
              <FieldLabel>Nilai taksiran</FieldLabel>
              <Input className="h-12 text-sm sm:text-base" defaultValue={item.appraisalValue} type="number" />
            </div>
            <div className="space-y-2">
              <FieldLabel>Nilai gadai</FieldLabel>
              <Input className="h-12 text-sm sm:text-base" defaultValue={item.loanValue} type="number" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <FieldLabel>Deskripsi</FieldLabel>
              <Textarea className="min-h-40 text-sm sm:text-base" defaultValue={item.description} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl border border-black/10">
            <CardHeader>
              <CardTitle className="text-xl sm:text-[1.4rem]">Pengelolaan Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-dashed border-[#9fd0bb] bg-[#f1faf5] p-6">
                <ImagePlus className="size-7 text-[#0a6a49]" />
                <p className="mt-3 text-sm leading-7 text-black/65 sm:text-base">
                  {item.status === "DIPASARKAN"
                    ? "Media tambahan masih bisa diunggah, tetapi file yang sudah tayang tidak bisa dihapus dari sini."
                    : "Selama barang belum tayang, media masih bisa ditambah atau dirapikan sesuai kebutuhan."}
                </p>
              </div>
              <Button className="w-full rounded-2xl" variant="secondary">
                Tambah Foto / Video
              </Button>
            </CardContent>
          </Card>
          <AdminUnitActionButton
            className="h-12 w-full rounded-2xl text-sm sm:text-base"
            endpoint={`/api/admin/barang/${item.id}`}
            method="PUT"
            pendingTitle="Memperbarui data barang"
            pendingDescription="Perubahan data barang sedang diselaraskan dengan workflow unit."
            payload={buildBarangPayload(item)}
            refresh
            successDescription="Data barang sudah diperbarui dan siap dilanjutkan sesuai statusnya."
            successTitle="Perubahan barang tersimpan"
          >
            Simpan Perubahan
          </AdminUnitActionButton>
        </div>
      </div>
    </div>
  );
}

function WorkflowFormShell({
  eyebrow,
  title,
  description,
  children,
  itemId,
  itemStatus
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  itemId: string;
  itemStatus: any;
}) {
  return (
    <div className="space-y-6">
      <AdminPageIntro
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={
          <>
            <AdminStatusBadge className="text-[0.95rem]" status={itemStatus} />
            <Link href={`/admin/barang/${itemId}`}>
              <Button className="rounded-2xl" variant="secondary">
                Kembali ke Detail Barang
              </Button>
            </Link>
          </>
        }
      />
      {children}
    </div>
  );
}

export function AdminInventoryExtendPage({ itemId, item: providedItem }: { itemId?: string; item?: AdminInventoryItem }) {
  const item = providedItem ?? getAdminInventoryById(itemId ?? adminInventory[0].id);

  return (
    <WorkflowFormShell
      description="Gunakan halaman ini saat nasabah memperpanjang masa gadai. Tanggal baru sebaiknya melanjutkan periode aktif yang sedang berjalan."
      eyebrow="Admin Unit / Perpanjangan"
      itemId={item.id}
      itemStatus={item.status}
      title="Perpanjang Masa Gadai"
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card className="rounded-2xl border border-black/10 bg-white">
          <PanelTitle title="Form Perpanjangan" />
          <div className="grid gap-5 p-6 md:grid-cols-2">
            <div className="space-y-2">
              <FieldLabel>Tanggal jatuh tempo saat ini</FieldLabel>
              <Input className="h-12" defaultValue={item.dueDate} readOnly />
            </div>
            <div className="space-y-2">
              <FieldLabel>Tanggal jatuh tempo baru</FieldLabel>
              <Input className="h-12" type="date" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <FieldLabel>Catatan perpanjangan</FieldLabel>
              <Textarea className="min-h-32" placeholder="Tambahkan catatan singkat jika ada referensi kontrak atau informasi penting lainnya." />
            </div>
          </div>
        </Card>
        <Card className="rounded-2xl border border-black/10 bg-[#f8faf8]">
          <CardHeader>
            <CardTitle className="text-xl">Pengecekan Sebelum Simpan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-7 text-black/70">
            <p>- Pastikan barang masih berada dalam masa gadai aktif.</p>
            <p>- Tanggal jatuh tempo baru harus lebih akhir dari jadwal yang berjalan saat ini.</p>
            <p>- Riwayat perpanjangan perlu dicatat agar pelacakan proses tetap lengkap.</p>
            <AdminUnitActionButton
              className="mt-4 w-full rounded-2xl"
              endpoint={`/api/admin/barang/${item.id}/perpanjang`}
              pendingTitle="Mencatat perpanjangan"
              pendingDescription="Tanggal jatuh tempo baru sedang diperbarui di riwayat barang."
              payload={{
                newDueDate: dateAfter(30),
                note: "Perpanjangan dicatat melalui dashboard admin unit."
              }}
              redirectTo={`/admin/barang/${item.id}`}
              successDescription="Tanggal jatuh tempo sudah diperbarui."
              successTitle="Perpanjangan tersimpan"
            >
              Simpan perpanjangan
            </AdminUnitActionButton>
          </CardContent>
        </Card>
      </div>
    </WorkflowFormShell>
  );
}

export function AdminInventoryRedeemPage({ itemId, item: providedItem }: { itemId?: string; item?: AdminInventoryItem }) {
  const item = providedItem ?? getAdminInventoryById(itemId ?? adminInventory[0].id);

  return (
    <WorkflowFormShell
      description="Catat penebusan saat nasabah melunasi kewajibannya. Setelah dikonfirmasi, barang keluar dari alur penjualan dan tersimpan sebagai riwayat."
      eyebrow="Admin Unit / Penebusan"
      itemId={item.id}
      itemStatus={item.status}
      title="Selesaikan Penebusan"
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card className="rounded-2xl border border-black/10 bg-white">
          <PanelTitle title="Data Penebusan" />
          <div className="grid gap-5 p-6 md:grid-cols-2">
            <div className="space-y-2">
              <FieldLabel>Nama penggadai</FieldLabel>
              <Input className="h-12" defaultValue={item.ownerName} readOnly />
            </div>
            <div className="space-y-2">
              <FieldLabel>Nomor nasabah</FieldLabel>
              <Input className="h-12" defaultValue={item.customerNumber} readOnly />
            </div>
            <div className="space-y-2">
              <FieldLabel>Tanggal penebusan</FieldLabel>
              <Input className="h-12" type="date" />
            </div>
            <div className="space-y-2">
              <FieldLabel>Nomor referensi penebusan</FieldLabel>
              <Input className="h-12" placeholder="Ref kuitansi / transaksi offline" />
            </div>
          </div>
        </Card>
        <Card className="rounded-2xl border border-black/10 bg-[#f8faf8]">
          <CardHeader>
            <CardTitle className="text-xl">Yang Akan Terjadi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-7 text-black/70">
            <p>- Barang ditandai selesai ditebus.</p>
            <p>- Setelah itu, barang tidak lagi masuk ke alur penjualan atau lelang.</p>
            <p>- Riwayat tetap tersimpan untuk kebutuhan pelacakan internal.</p>
            <AdminUnitActionButton
              className="mt-4 w-full rounded-2xl"
              confirmDescription="Setelah penebusan dikonfirmasi, barang keluar dari alur penjualan unit dan tercatat sebagai riwayat selesai."
              confirmLabel="Ya, konfirmasi tebus"
              confirmTitle="Konfirmasi penebusan barang"
              confirmVariant="destructive"
              endpoint={`/api/admin/barang/${item.id}/tebus`}
              pendingDescription="Sistem sedang menutup alur barang ini sebagai barang yang ditebus nasabah."
              pendingTitle="Mengonfirmasi penebusan"
              payload={{
                redeemedAt: new Date().toISOString().slice(0, 10),
                reference: `TEBUS-${Date.now().toString().slice(-6)}`
              }}
              redirectTo={`/admin/barang/${item.id}`}
              successDescription="Barang keluar dari alur penjualan dan tersimpan sebagai riwayat tebus."
              successTitle="Penebusan dikonfirmasi"
            >
              Konfirmasi Penebusan
            </AdminUnitActionButton>
          </CardContent>
        </Card>
      </div>
    </WorkflowFormShell>
  );
}

export function AdminInventoryConvertPage({ itemId, item: providedItem }: { itemId?: string; item?: AdminInventoryItem }) {
  const item = providedItem ?? getAdminInventoryById(itemId ?? adminInventory[1].id);

  return (
    <WorkflowFormShell
      description="Gunakan halaman ini saat barang tidak ditebus sampai jatuh tempo dan perlu dipindahkan menjadi aset unit."
      eyebrow="Admin Unit / Pindahkan ke Aset Unit"
      itemId={item.id}
      itemStatus={item.status}
      title="Pindahkan ke Aset Unit"
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_0.92fr]">
        <Card className="rounded-2xl border border-black/10 bg-white">
          <PanelTitle title="Ringkasan Barang Jatuh Tempo" />
          <CardContent className="grid gap-4 p-6 md:grid-cols-2">
            <DetailTile label="Nama Barang" value={item.name} />
            <DetailTile label="Jatuh Tempo" value={item.dueDate} />
            <DetailTile label="Nomor Nasabah" value={item.customerNumber} />
            <DetailTile label="Status Saat Ini" value={<AdminStatusBadge status={item.status} />} />
            <div className="md:col-span-2 rounded-2xl bg-[#f6faf7] p-5 text-sm leading-7 text-black/70">
              Pastikan tidak ada proses tebus atau perpanjangan yang masih berjalan sebelum status barang diubah.
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border border-black/10 bg-[#f8faf8]">
          <CardHeader>
            <CardTitle className="text-xl">Konfirmasi Perubahan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-black/70">
            <p>- Perubahan di halaman ini memindahkan barang dari masa gadai ke aset unit.</p>
            <p>- Setelah dipindahkan, barang tidak kembali ke tahap gadai.</p>
            <p>- Langkah berikutnya adalah menyiapkan skema penjualan saat barang siap ditawarkan.</p>
            <AdminUnitActionButton
              className="mt-4 w-full rounded-2xl"
              confirmDescription="Barang akan dipindahkan ke aset unit dan langkah berikutnya adalah menyiapkannya untuk pemasaran."
              confirmLabel="Pindahkan sekarang"
              confirmTitle="Jadikan barang sebagai aset unit"
              endpoint={`/api/admin/barang/${item.id}/jadikan-jaminan`}
              pendingDescription="Status barang sedang dipindahkan dari masa tebus ke aset unit."
              pendingTitle="Memindahkan ke aset unit"
              redirectTo={`/admin/barang/${item.id}`}
              successDescription="Barang sudah berpindah ke aset unit dan siap disiapkan untuk pemasaran."
              successTitle="Barang menjadi aset unit"
            >
              Pindahkan ke aset unit
            </AdminUnitActionButton>
          </CardContent>
        </Card>
      </div>
    </WorkflowFormShell>
  );
}

export function AdminInventoryMarketPage({ itemId, item: providedItem }: { itemId?: string; item?: AdminInventoryItem }) {
  const item = providedItem ?? getAdminInventoryById(itemId ?? adminInventory[2].id);

  return (
    <WorkflowFormShell
      description="Tentukan cara barang akan dijual, lengkapi pengaturan harganya, lalu publikasikan ke katalog agar siap dilihat calon pembeli."
      eyebrow="Admin Unit / Tayangkan Barang"
      itemId={item.id}
      itemStatus={item.status}
      title="Tayangkan ke Katalog"
    >
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-2xl border border-black/10 bg-white">
          <PanelTitle title="Pilih Cara Menjual" />
          <CardContent className="space-y-4 p-6">
            <div className="rounded-[1.5rem] border border-[#0a6a49]/20 bg-[#f4faf7] p-5">
              <p className="font-semibold text-black/85">Fixed Price</p>
              <p className="mt-2 text-sm leading-6 text-black/65">
                Cocok untuk barang yang siap dijual langsung dengan harga pasti dan alur transaksi yang lebih singkat.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-black/10 bg-[#fafaf8] p-5">
              <p className="font-semibold text-black/85">Vickrey Auction</p>
              <p className="mt-2 text-sm leading-6 text-black/65">
                Gunakan saat Anda ingin membuka lelang tertutup dengan harga dasar dan durasi yang terukur.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border border-black/10 bg-white">
          <PanelTitle title="Atur Harga dan Jadwal" />
          <div className="grid gap-5 p-6 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <FieldLabel>Mode yang dipilih</FieldLabel>
              <Input className="h-12" placeholder="Pilih fixed price atau vickrey" />
            </div>
            <div className="space-y-2">
              <FieldLabel>Harga jual / harga dasar</FieldLabel>
              <Input className="h-12" placeholder="0" type="number" />
            </div>
            <div className="space-y-2">
              <FieldLabel>Durasi lelang (hari)</FieldLabel>
              <Input className="h-12" placeholder="Isi jika menggunakan lelang vickrey" type="number" />
            </div>
            <div className="space-y-2">
              <FieldLabel>Tanggal mulai</FieldLabel>
              <Input className="h-12" type="datetime-local" />
            </div>
            <div className="space-y-2">
              <FieldLabel>Estimasi selesai</FieldLabel>
              <Input className="h-12" readOnly value="Terisi otomatis mengikuti durasi" />
            </div>
            <div className="md:col-span-2">
            <AdminUnitActionButton
              className="h-12 w-full rounded-2xl"
              endpoint={`/api/admin/barang/${item.id}/pasarkan`}
              pendingDescription="Sistem sedang menyiapkan tayangan katalog dan detail harga awal."
              pendingTitle="Mempublikasikan barang"
              payload={{
                mode: "fixed_price",
                price: Number(item.price ?? item.appraisalValue ?? 1000000)
              }}
              redirectTo="/admin/lelang"
              successDescription="Barang sudah dipublikasikan sebagai fixed price."
              successTitle="Barang tayang di katalog"
            >
              Tayangkan ke katalog
            </AdminUnitActionButton>
            </div>
          </div>
        </Card>
      </div>
    </WorkflowFormShell>
  );
}

export function AdminInventoryRelistPage({ itemId, item: providedItem }: { itemId?: string; item?: AdminInventoryItem }) {
  const item = providedItem ?? getAdminInventoryById(itemId ?? adminInventory[7].id);

  return (
    <WorkflowFormShell
      description="Gunakan halaman ini untuk menyiapkan ulang barang yang belum berhasil terjual, lengkap dengan evaluasi harga dan strategi penjualan yang baru."
      eyebrow="Admin Unit / Tayangkan Ulang"
      itemId={item.id}
      itemStatus={item.status}
      title="Siapkan Penayangan Ulang"
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card className="rounded-2xl border border-black/10 bg-white">
          <PanelTitle title="Ringkasan Barang Gagal" />
          <CardContent className="grid gap-4 p-6 md:grid-cols-2">
            <DetailTile label="Barang" value={item.name} />
            <DetailTile label="Iterasi Pemasaran" value={`Siklus ke-${item.marketingIteration}`} />
            <DetailTile label="Mode Sebelumnya" value={item.marketingMode ?? "-"} />
            <DetailTile label="Aksi Berikutnya" value={item.nextAction} />
          </CardContent>
        </Card>
        <Card className="rounded-2xl border border-black/10 bg-white">
          <PanelTitle title="Konfigurasi Re-Listing" />
          <div className="grid gap-5 p-6">
            <div className="space-y-2">
              <FieldLabel>Mode pemasaran baru</FieldLabel>
              <Input className="h-12" placeholder="fixed_price / vickrey" />
            </div>
            <div className="space-y-2">
              <FieldLabel>Harga baru</FieldLabel>
              <Input className="h-12" type="number" />
            </div>
            <div className="space-y-2">
              <FieldLabel>Catatan evaluasi</FieldLabel>
              <Textarea className="min-h-32" placeholder="Tambahkan catatan evaluasi bila ada perubahan harga, mode, atau pertimbangan lain." />
            </div>
            <AdminUnitActionButton
              className="h-12 w-full rounded-2xl"
              endpoint={`/api/admin/barang/${item.id}/pasarkan-ulang`}
              pendingDescription="Strategi pemasaran baru sedang diterapkan agar barang bisa tayang kembali."
              pendingTitle="Menayangkan ulang barang"
              payload={{
                mode: "fixed_price",
                price: Number(item.price ?? item.appraisalValue ?? 1000000)
              }}
              redirectTo="/admin/lelang"
              successDescription="Barang sudah aktif kembali dengan strategi pemasaran baru."
              successTitle="Barang ditayangkan ulang"
            >
              <RotateCcw className="size-4" />
              Tayangkan ulang barang
            </AdminUnitActionButton>
          </div>
        </Card>
      </div>
    </WorkflowFormShell>
  );
}

export function AdminAuctionListPage({ auctions = adminAuctions }: { auctions?: AdminAuctionItem[] }) {
  return (
    <div className="space-y-6">
      <AdminPageIntro
        eyebrow="Admin Unit / Pemasaran"
        title="Pantau Penjualan & Lelang"
        description="Pantau seluruh sesi penjualan unit, baik yang masih berjalan, sudah selesai, maupun yang perlu dievaluasi ulang."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {auctions.map((auction) => (
          <Card className="rounded-2xl border border-black/10" key={auction.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-xl sm:text-[1.35rem]">{auction.lot}</CardTitle>
                  <CardDescription className="mt-2 text-sm sm:text-base">
                    {auction.id}
                  </CardDescription>
                </div>
                <AdminStatusBadge status={auction.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-7 text-black/70 sm:text-base">
              <p>Mode: {auction.mode}</p>
              <p>Peserta: {auction.participants} user</p>
              <p>
                <AdminAuctionDeadline auction={auction} prefix="Sisa waktu" />
              </p>
              <p>Visibilitas bid: {auction.visibility}</p>
              <p>{auction.note}</p>
              <Link
                className="inline-flex items-center gap-2 font-semibold text-[#0a6a49]"
                href={`/admin/lelang/${auction.id}`}
              >
                Lihat sesi
                <ArrowRight className="size-4" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function AdminAuctionDetailPage({ auctionId, auction: providedAuction }: { auctionId?: string; auction?: AdminAuctionItem }) {
  const auction = providedAuction ?? getAdminAuctionById(auctionId ?? adminAuctions[0].id);

  return (
    <div className="space-y-6">
      <AdminPageIntro
        eyebrow="Admin Unit / Detail Pemasaran"
        title={auction.lot}
        description="Gunakan halaman ini untuk memahami kondisi sesi, aturan keterbukaan hasil, dan ringkasan hasil setelah periode berakhir."
        actions={<AdminStatusBadge className="text-[0.95rem]" status={auction.status} />}
      />

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Card className="rounded-2xl border border-black/10">
          <CardHeader>
            <CardTitle className="text-xl sm:text-[1.45rem]">Ringkasan Sesi</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <DetailTile label="ID Pemasaran" value={auction.id} />
            <DetailTile label="Mode" value={auction.mode} />
            <DetailTile
              label="Sisa Waktu"
              value={<AdminAuctionDeadline auction={auction} />}
            />
            <DetailTile label="Peserta" value={`${auction.participants} peserta`} />
            <DetailTile label="Keterbukaan Hasil" value={auction.visibility} />
            <DetailTile label="Status" value={<AdminStatusBadge status={auction.status} />} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-black/10">
          <CardHeader>
            <CardTitle className="text-xl sm:text-[1.45rem]">Aturan Buka Hasil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-black/70 sm:text-base">
            <p>
              Halaman admin tidak menampilkan nominal bid sebelum waktu penutupan
              terlewati. Selama sesi aktif, admin hanya melihat jumlah peserta dan status
              sesi, tanpa mengetahui nilai penawaran.
            </p>
            <div className="rounded-2xl bg-[#f5f8f6] p-5">
              <p className="font-semibold text-black/80">Kondisi saat ini</p>
              <p className="mt-2">{auction.note}</p>
              {auction.visibility === "HASIL_DIBUKA" ? (
                <div className="mt-4 space-y-2">
                  <p>Pemenang: {auction.winner ?? "-"}</p>
                  <p>Harga final: {auction.finalPrice ? currency.format(auction.finalPrice) : "-"}</p>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function AdminTransactionsPage({ transactions = adminTransactions }: { transactions?: AdminTransactionItem[] }) {
  const filters = [
    "SEMUA",
    "MENUNGGU_PEMBAYARAN",
    "BUKTI_DIUNGGAH",
    "MENUNGGU_KONFIRMASI_LANGSUNG",
    "DITOLAK_BUKTI",
    "LUNAS"
  ];

  return (
    <div className="space-y-6">
      <AdminPageIntro
        eyebrow="Admin Unit / Transaksi"
        title="Kelola Pembayaran & Nota"
        description="Kelola seluruh penyelesaian pembayaran dari penjualan langsung maupun hasil lelang, lalu terbitkan nota saat transaksi sudah benar-benar selesai."
      />

      <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
        <PanelTitle
          action={
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  className="rounded-full border border-black/15 px-3 py-2 text-xs font-semibold text-black/65 sm:text-sm"
                  key={filter}
                  type="button"
                >
                  {filter}
                </button>
              ))}
            </div>
          }
          description="Fokuskan pekerjaan pada transaksi yang benar-benar membutuhkan respons admin unit."
          title="Daftar Transaksi Unit"
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[78rem] text-left lg:min-w-[88rem]">
            <thead className="bg-[#f3f3f3] text-xs uppercase tracking-[0.12em] text-black/50 sm:text-sm">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Pembeli</th>
                <th className="px-6 py-4">Barang</th>
                <th className="px-6 py-4">Mode</th>
                <th className="px-6 py-4">Metode</th>
                <th className="px-6 py-4">Deadline</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr className="border-t border-black/10 text-sm sm:text-base" key={transaction.id}>
                  <td className="px-6 py-4 font-semibold text-[#0a6a49]">{transaction.id}</td>
                  <td className="px-6 py-4">{transaction.buyer}</td>
                  <td className="px-6 py-4">{transaction.lot}</td>
                  <td className="px-6 py-4 text-black/65">{transaction.pemasaranMode}</td>
                  <td className="px-6 py-4 text-black/65">{transaction.method}</td>
                  <td className="px-6 py-4 text-black/65">
                    <AdminTransactionDeadline transaction={transaction} />
                  </td>
                  <td className="px-6 py-4">
                    <AdminStatusBadge status={transaction.status} />
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      className="inline-flex items-center gap-2 rounded-xl border border-black/15 px-3 py-2 text-xs font-semibold text-[#0a6a49] sm:text-sm"
                      href={`/admin/transaksi/${transaction.id}`}
                    >
                      Buka detail
                      <ArrowRight className="size-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function AdminTransactionDetailPage({ transactionId, transaction: providedTransaction }: { transactionId?: string; transaction?: AdminTransactionItem }) {
  const transaction = providedTransaction ?? getAdminTransactionById(transactionId ?? adminTransactions[0].id);
  const canPrint = transaction.printableReceipt || transaction.status === "LUNAS";
  const canVerifyTransfer = transaction.status === "BUKTI_DIUNGGAH" && transaction.method === "TRANSFER_BANK";
  const canConfirmDirect = transaction.status === "MENUNGGU_KONFIRMASI_LANGSUNG";
  const canTakePaymentAction = canVerifyTransfer || canConfirmDirect;

  return (
    <div className="space-y-6">
      <AdminPageIntro
        eyebrow="Admin Unit / Detail Transaksi"
        title={transaction.id}
        description="Semua konteks pembayaran, dokumen pendukung, dan keputusan verifikasi dirangkum di satu halaman agar tindak lanjut lebih cepat."
        actions={<AdminStatusBadge className="text-[0.95rem]" status={transaction.status} />}
      />

      <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <div className="space-y-6">
          <Card className="rounded-2xl border border-black/10">
            <CardHeader>
              <CardTitle className="text-xl sm:text-[1.45rem]">Ringkasan Transaksi</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <DetailTile label="Pembeli" value={transaction.buyer} />
              <DetailTile label="Barang" value={transaction.lot} />
              <DetailTile label="Mode Pemasaran" value={transaction.pemasaranMode} />
              <DetailTile label="Metode Bayar" value={transaction.method} />
              <DetailTile label="Total Bayar" value={currency.format(transaction.total)} />
              <DetailTile
                label="Sisa Waktu"
                value={<AdminTransactionDeadline transaction={transaction} />}
              />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-black/10">
            <CardHeader>
              <CardTitle className="text-xl sm:text-[1.45rem]">
                {transaction.method === "TRANSFER_BANK" ? "Bukti Pembayaran" : "Panduan Bayar di Unit"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {transaction.method === "TRANSFER_BANK" ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <DetailTile label="Bank Tujuan" value={transaction.bankName} />
                    <DetailTile label="Nomor Rekening" value={transaction.accountNumber} />
                    <div className="md:col-span-2">
                      <DetailTile label="Atas Nama" value={transaction.accountName} />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-dashed border-[#9fcab8] bg-[#f4faf6] p-8 text-center text-sm text-black/50 sm:p-10 sm:text-base">
                    {transaction.proofFile
                      ? `Bukti yang diterima: ${transaction.proofFile}`
                      : "Belum ada bukti pembayaran yang diunggah oleh pembeli."}
                  </div>
                  {transaction.rejectionReason ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-700">
                      Catatan penolakan sebelumnya: {transaction.rejectionReason}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="rounded-2xl bg-[#f5f8f6] p-5 text-sm leading-7 text-black/70 sm:text-base">
                  Pembeli memilih bayar langsung di unit. Pastikan dana benar-benar diterima sebelum transaksi ditandai selesai.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl border border-black/10">
            <CardHeader>
              <CardTitle className="text-xl sm:text-[1.45rem]">Tindakan Lanjutan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {canTakePaymentAction ? (
                <>
                  <div className="space-y-2">
                    <FieldLabel>Nomor referensi internal</FieldLabel>
                    <Input className="h-12" defaultValue={transaction.reference === "-" ? "" : transaction.reference} placeholder="Contoh: REF-MND-8821" />
                  </div>
                  {canVerifyTransfer ? (
                    <div className="space-y-2">
                      <FieldLabel>Alasan penolakan</FieldLabel>
                      <Textarea className="min-h-28" placeholder="Isi bila bukti transfer perlu dikembalikan ke pembeli." />
                    </div>
                  ) : null}

                  {canVerifyTransfer ? (
                    <>
                      <AdminUnitActionButton
                        className="h-12 w-full rounded-2xl"
                        confirmDescription="Setelah diverifikasi, transaksi akan ditandai lunas dan barang otomatis masuk status terjual."
                        confirmLabel="Setujui pembayaran"
                        confirmTitle="Verifikasi pembayaran transfer"
                        endpoint={`/api/admin/transaksi/${transaction.id}/verifikasi`}
                        pendingDescription="Bukti transfer sedang diperiksa dan status transaksi akan diperbarui."
                        pendingTitle="Memverifikasi pembayaran"
                        payload={{ reference: transaction.reference === "-" ? `REF-${Date.now().toString().slice(-6)}` : transaction.reference }}
                        refresh
                        successDescription="Transaksi sudah lunas dan barang ditandai terjual."
                        successTitle="Pembayaran disetujui"
                      >
                        <FileCheck2 className="size-4" />
                        Setujui pembayaran transfer
                      </AdminUnitActionButton>
                      <AdminUnitActionButton
                        className="h-12 w-full rounded-2xl"
                        confirmDescription="Pembeli akan diminta mengunggah bukti transfer yang baru atau lebih jelas."
                        confirmLabel="Kembalikan bukti"
                        confirmTitle="Kembalikan bukti pembayaran"
                        confirmVariant="destructive"
                        endpoint={`/api/admin/transaksi/${transaction.id}/tolak-bukti`}
                        pendingDescription="Sistem sedang mengirimkan catatan revisi agar pembeli memperbaiki bukti transfer."
                        pendingTitle="Mengembalikan bukti pembayaran"
                        payload={{ reason: "Bukti pembayaran perlu diperbaiki oleh pembeli." }}
                        refresh
                        successDescription="Pembeli perlu mengunggah bukti pembayaran yang benar."
                        successTitle="Bukti pembayaran dikembalikan"
                        variant="destructive"
                      >
                        <FileWarning className="size-4" />
                        Kembalikan untuk perbaikan
                      </AdminUnitActionButton>
                    </>
                  ) : null}

                  {canConfirmDirect ? (
                    <AdminUnitActionButton
                      className="h-12 w-full rounded-2xl"
                      confirmDescription="Gunakan ini hanya jika dana benar-benar sudah diterima langsung oleh petugas unit."
                      confirmLabel="Ya, dana sudah diterima"
                      confirmTitle="Konfirmasi bayar langsung di unit"
                      endpoint={`/api/admin/transaksi/${transaction.id}/konfirmasi-langsung`}
                      pendingDescription="Status pembayaran langsung sedang ditutup sebagai transaksi selesai."
                      pendingTitle="Mengonfirmasi bayar langsung"
                      payload={{ reference: transaction.reference === "-" ? `CASH-${Date.now().toString().slice(-6)}` : transaction.reference }}
                      refresh
                      successDescription="Pembayaran langsung sudah dikonfirmasi oleh unit."
                      successTitle="Pembayaran langsung selesai"
                      variant="secondary"
                    >
                      <Wallet className="size-4" />
                      Selesaikan bayar di unit
                    </AdminUnitActionButton>
                  ) : null}
                </>
              ) : null}

              {canPrint ? (
                <AdminUnitActionButton
                  className="h-12 w-full rounded-2xl"
                  pendingLabel="Membuka cetak..."
                  successTitle="Nota siap dicetak"
                  successDescription="Preview nota dibuka agar bisa langsung dicetak atau disimpan."
                  variant="accent"
                >
                  <Printer className="size-4" />
                  Cetak nota
                </AdminUnitActionButton>
              ) : (
                <div className="rounded-2xl border border-dashed border-black/10 bg-[#fbfbfa] p-4 text-sm text-black/55">
                  {canTakePaymentAction
                    ? "Nota baru dapat dicetak setelah transaksi selesai diverifikasi."
                    : "Tidak ada tindakan pembayaran yang tersedia untuk status transaksi saat ini."}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function AdminBlacklistPage({ entries = adminBlacklist }: { entries?: AdminBlacklistItem[] }) {
  return (
    <div className="space-y-6">
      <AdminPageIntro
        eyebrow="Admin Unit / Blacklist"
        title="Pelanggaran Pengguna"
      description="Pantau akun yang sedang dibatasi di unit Anda, baca riwayat pelanggarannya, dan perpanjang masa pembatasan bila memang diperlukan."
      />

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {entries.map((entry) => (
          <Card className="rounded-2xl border border-black/10" key={entry.userId}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-xl sm:text-[1.35rem]">{entry.name}</CardTitle>
                  <CardDescription className="mt-2 text-sm sm:text-base">
                    {entry.violations} pelanggaran - Unit {entry.unit}
                  </CardDescription>
                </div>
                <AdminStatusBadge status={entry.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-black/70 sm:text-base">
              <p>
                <span className="font-semibold text-black/80">Masa blokir:</span> {entry.until}
              </p>
              <p>{entry.activeAuctionRestriction}</p>
              <div className="flex flex-wrap gap-3">
                <Link href={`/admin/blacklist/${entry.userId}`}>
                  <Button className="rounded-2xl" variant="secondary">
                    Lihat detail
                  </Button>
                </Link>
                <Link href={`/admin/blacklist/${entry.userId}/perpanjang`}>
                  <Button className="rounded-2xl">
                    Perpanjang masa blokir
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function AdminBlacklistDetailPage({ userId, entry: providedEntry }: { userId?: string; entry?: AdminBlacklistItem }) {
  const entry = providedEntry ?? getAdminBlacklistByUserId(userId ?? adminBlacklist[0].userId);

  return (
    <div className="space-y-6">
      <AdminPageIntro
        eyebrow="Admin Unit / Detail Blacklist"
        title={entry.name}
        description="Lihat ringkasan pelanggaran, status pembatasan aktif, dan jejak tindakan yang sudah tercatat pada akun ini."
        actions={<AdminStatusBadge className="text-[0.95rem]" status={entry.status} />}
      />

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Card className="rounded-2xl border border-black/10">
          <CardHeader>
            <CardTitle className="text-xl sm:text-[1.45rem]">Ringkasan User</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <DetailTile label="User ID" value={entry.userId} />
            <DetailTile label="Status" value={<AdminStatusBadge status={entry.status} />} />
            <DetailTile label="Total Pelanggaran" value={entry.violations} />
            <DetailTile label="Blokir Sampai" value={entry.until} />
            <div className="md:col-span-2">
              <DetailTile label="Pembatasan Aktif" value={entry.activeAuctionRestriction} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-black/10">
          <CardHeader>
            <CardTitle className="text-xl sm:text-[1.45rem]">Riwayat Tindakan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(entry.history ?? []).map((history: { date: string; action: string; note: string }) => (
              <div className="rounded-[1.4rem] border border-black/10 bg-[#fafaf8] p-4" key={`${history.date}-${history.action}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-black/85">{history.action}</p>
                  <p className="text-sm text-black/55">{history.date}</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-black/65">{history.note}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function AdminBlacklistExtendPage({ userId, entry: providedEntry }: { userId?: string; entry?: AdminBlacklistItem }) {
  const entry = providedEntry ?? getAdminBlacklistByUserId(userId ?? adminBlacklist[0].userId);

  return (
    <div className="space-y-6">
      <AdminPageIntro
        eyebrow="Admin Unit / Perpanjang Blacklist"
      title={`Perpanjang masa pembatasan ${entry.name}`}
        description="Perpanjang masa pembatasan bila masih ada alasan operasional yang kuat. Riwayat pelanggaran tetap disimpan sebagai catatan."
        actions={<AdminStatusBadge className="text-[0.95rem]" status={entry.status} />}
      />

      <div className="grid gap-6 xl:grid-cols-[0.96fr_1.04fr]">
        <Card className="rounded-2xl border border-black/10 bg-white">
          <CardHeader>
            <CardTitle className="text-xl sm:text-[1.45rem]">Ringkasan User</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <DetailTile label="Nama User" value={entry.name} />
            <DetailTile label="Status Saat Ini" value={<AdminStatusBadge status={entry.status} />} />
            <DetailTile label="Pelanggaran" value={entry.violations} />
            <DetailTile label="Blokir Sampai" value={entry.until} />
          </CardContent>
        </Card>
        <Card className="rounded-2xl border border-black/10 bg-white">
          <CardHeader>
            <CardTitle className="text-xl sm:text-[1.45rem]">Form Perpanjangan</CardTitle>
          </CardHeader>
          <div className="grid gap-5 p-6">
            <div className="space-y-2">
              <FieldLabel>Tanggal blokir selesai baru</FieldLabel>
              <Input className="h-12" type="date" />
            </div>
            <div className="space-y-2">
              <FieldLabel>Alasan perpanjangan</FieldLabel>
              <Textarea className="min-h-32" placeholder="Tuliskan alasan yang jelas agar tim lain mudah menelusuri keputusan ini." />
            </div>
            <AdminUnitActionButton
              className="h-12 w-full rounded-2xl"
              confirmDescription="Perpanjangan blokir akan langsung memperbarui masa pembatasan pengguna di unit ini."
              confirmLabel="Simpan perpanjangan"
              confirmTitle="Perpanjang masa pembatasan"
              confirmVariant="destructive"
              endpoint={`/api/admin/blacklist/${entry.userId}/perpanjang`}
              pendingDescription="Tanggal berakhir blokir dan catatan alasan sedang diperbarui."
              pendingTitle="Memperpanjang blacklist"
              payload={{
                blockedUntil: dateAfter(30),
                reason: "Masa blokir diperpanjang berdasarkan evaluasi admin unit."
              }}
              redirectTo={`/admin/blacklist/${entry.userId}`}
              successDescription="Masa pembatasan akun sudah diperbarui."
              successTitle="Blacklist diperpanjang"
            >
              <ShieldEllipsis className="size-4" />
              Simpan pembaruan blokir
            </AdminUnitActionButton>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function AdminProfilePage() {
  return (
    <div className="space-y-6">
      <AdminPageIntro
        eyebrow="Admin Unit / Profil"
        title="Profil Admin Unit"
        description="Kelola identitas admin, informasi unit, dan pengingat operasional agar seluruh pekerjaan tetap berjalan sesuai cakupan unit Anda."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_0.82fr]">
        <Card className="rounded-2xl border border-black/10">
          <PanelTitle description="Data identitas admin untuk kebutuhan operasional harian." title="Informasi Profil" />
          <div className="grid gap-5 p-6 md:grid-cols-2">
            <div className="space-y-2">
              <FieldLabel>Nama Admin</FieldLabel>
              <Input className="h-12 text-sm sm:text-base" defaultValue="Admin Unit Manado" />
            </div>
            <div className="space-y-2">
              <FieldLabel>Email Kerja</FieldLabel>
              <Input className="h-12 text-sm sm:text-base" defaultValue="admin.manado@pegadaian.test" />
            </div>
            <div className="space-y-2">
              <FieldLabel>Unit</FieldLabel>
              <Input className="h-12 text-sm sm:text-base" defaultValue="Pegadaian Unit Manado" />
            </div>
            <div className="space-y-2">
              <FieldLabel>Nomor Petugas</FieldLabel>
              <Input className="h-12 text-sm sm:text-base" defaultValue="ADM-MND-01" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <FieldLabel>Alamat Unit</FieldLabel>
              <Textarea
                className="min-h-28 text-sm sm:text-base"
                defaultValue="Jl. Sam Ratulangi No. 88, Manado, Sulawesi Utara"
              />
            </div>
            <div className="md:col-span-2">
              <Button className="h-12 rounded-2xl text-sm sm:text-base">Simpan Perubahan Profil</Button>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-2xl border border-black/10 bg-[#f6faf7]">
            <CardHeader>
              <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-white text-[#0a6a49] shadow-sm">
                <UserRound className="size-6" />
              </div>
              <CardTitle className="text-xl sm:text-[1.4rem]">Panduan Singkat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-7 text-black/70 sm:text-base">
              <p>- Halaman barang dipakai untuk mengelola perpindahan dari barang masuk sampai selesai ditawarkan.</p>
              <p>- Halaman transaksi membantu Anda menuntaskan pembayaran hingga nota siap dicetak.</p>
              <p>- Seluruh data dan tindakan tetap dibatasi pada unit Anda agar pengelolaan tetap akurat.</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-black/10">
            <CardHeader>
              <CardTitle className="text-xl sm:text-[1.4rem]">Akses Cepat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/admin/barang/tambah">
                <Button className="w-full rounded-2xl" variant="secondary">
                  <ShoppingBag className="size-4" />
                  Input Barang Gadai
                </Button>
              </Link>
              <Link href="/admin/transaksi">
                <Button className="w-full rounded-2xl" variant="secondary">
                  <Wallet className="size-4" />
                  Buka antrian pembayaran
                </Button>
              </Link>
              <Link href="/admin/blacklist">
                <Button className="w-full rounded-2xl" variant="secondary">
                  <ShieldAlert className="size-4" />
                  Tinjau blacklist
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
