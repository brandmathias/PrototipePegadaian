import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Clock3,
  FileClock,
  Gavel,
  PackagePlus,
  ShieldAlert
} from "lucide-react";

import { AdminLiveCountdown } from "@/components/admin/admin-live-countdown";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminBlacklist, adminInventory, adminSummary, adminTransactions } from "@/lib/mock-data";

type AdminDashboardData = {
  summary?: { unitName: string; subtitle?: string; activeBank: string };
  inventory?: Array<any>;
  transactions?: Array<any>;
  blacklist?: Array<any>;
};

export function AdminDashboardPage({ data }: { data?: AdminDashboardData }) {
  const summary = data?.summary ?? adminSummary;
  const inventory = data?.inventory ?? adminInventory;
  const transactions = data?.transactions ?? adminTransactions;
  const blacklist = data?.blacklist ?? adminBlacklist;

  const gadai = inventory.filter((item) => item.status === "GADAI");
  const jaminan = inventory.filter((item) => item.status === "JAMINAN");
  const dipasarkan = inventory.filter((item) => item.status === "DIPASARKAN");
  const gagal = inventory.filter((item) => item.status === "GAGAL");
  const menungguPembayaranBarang = inventory.filter(
    (item) => item.status === "MENUNGGU_PEMBAYARAN"
  );

  const transactionQueue = transactions.filter((transaction) =>
    ["BUKTI_DIUNGGAH", "MENUNGGU_KONFIRMASI_LANGSUNG", "MENUNGGU_PEMBAYARAN", "DITOLAK_BUKTI"].includes(
      transaction.status
    )
  );

  const cards = [
    {
      title: "Barang Gadai Aktif",
      value: gadai.length,
      detail: "Pantau jatuh tempo lebih awal agar keputusan perpanjangan, tebus, atau konversi bisa diproses tepat waktu.",
      icon: FileClock,
      tone: "from-slate-50 to-white border-slate-200 text-slate-800"
    },
    {
      title: "Barang Siap Dijual",
      value: jaminan.length,
      detail: "Siap dipilihkan skema penjualan yang paling sesuai sebelum tayang ke katalog publik.",
      icon: ShieldAlert,
      tone: "from-amber-50 to-white border-amber-200 text-amber-900"
    },
    {
      title: "Barang Dipasarkan",
      value: dipasarkan.length,
      detail: "Sudah tayang di katalog dan perlu dipantau progres penjualan atau sesi lelangnya.",
      icon: Gavel,
      tone: "from-emerald-50 to-white border-emerald-200 text-emerald-800"
    },
    {
      title: "Transaksi Perlu Tindakan",
      value: transactionQueue.length,
      detail: "Prioritas hari ini untuk verifikasi bukti transfer, pembayaran langsung, dan pemenang lelang.",
      icon: BadgeCheck,
      tone: "from-sky-50 to-white border-sky-200 text-sky-800"
    }
  ];

  const workflowLanes = [
    {
      title: "Perlu Tindak Lanjut Segera",
      description: "Daftar barang yang sebaiknya diproses lebih dulu agar alur kerja unit tetap lancar.",
      items: gadai,
      hrefBuilder: (id: string) => `/admin/barang/${id}`,
      emptyText: "Belum ada barang yang perlu diprioritaskan dari alur gadai."
    },
    {
      title: "Siap Tayang ke Katalog",
      description: "Barang yang tinggal dilengkapi pengaturan penjualannya sebelum dipublikasikan.",
      items: jaminan,
      hrefBuilder: (id: string) => `/admin/barang/${id}/pasarkan`,
      emptyText: "Belum ada barang yang menunggu jadwal tayang."
    },
    {
      title: "Perlu Strategi Ulang",
      description: "Barang yang perlu ditinjau kembali sebelum dipasarkan lagi dengan pendekatan baru.",
      items: gagal,
      hrefBuilder: (id: string) => `/admin/barang/${id}/pasarkan-ulang`,
      emptyText: "Belum ada barang yang perlu dipasarkan ulang."
    }
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="hero-surface section-reveal p-6 sm:p-7 lg:p-8">
        <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr] xl:items-start">
          <div className="max-w-4xl space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="page-heading-eyebrow bg-white/85 shadow-sm">
                Ringkasan Hari Ini
              </span>
              <span className="rounded-full border border-[#cfe2d7] bg-white/70 px-4 py-2 text-xs font-semibold text-[#0a6a49]/80">
                Rekening aktif {summary.activeBank}
              </span>
            </div>
            <div>
              <h2 className="page-heading-title font-headline text-[2.35rem] font-black leading-[0.96] tracking-tight text-[#085a41] sm:text-[3rem] xl:text-[4rem]">
                {summary.unitName}
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-7 text-foreground/72 sm:text-lg">
                Halaman ini membantu tim unit memantau pekerjaan yang paling penting, dari
                pencatatan barang masuk, tindak lanjut jatuh tempo, penayangan ke katalog,
                verifikasi pembayaran, sampai penanganan pelanggaran lelang.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/admin/barang/tambah">
                <Button className="h-12 rounded-2xl px-5 text-sm sm:h-14 sm:text-base">
                  <PackagePlus className="size-4" />
                  Input Barang Gadai
                </Button>
              </Link>
              <Link href="/admin/transaksi">
                <Button className="h-12 rounded-2xl px-5 text-sm sm:h-14 sm:text-base" variant="secondary">
                  <BadgeCheck className="size-4" />
                  Buka pembayaran
                </Button>
              </Link>
            </div>
          </div>

          <div className="interactive-card rounded-[1.75rem] border border-[#d2e4da] bg-white/80 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.22em] text-[#0a6a49]/58">
              Checklist Harian
            </p>
            <div className="mt-4 space-y-4 text-sm leading-7 text-black/70 sm:text-base">
              <p>1. Pastikan barang baru sudah tercatat lengkap, termasuk foto utama dan hasil appraisal.</p>
              <p>2. Dahulukan barang yang mendekati jatuh tempo agar keputusan perpanjangan, tebus, atau pindah ke aset unit tidak tertunda.</p>
              <p>3. Tinjau barang yang siap tayang, lalu pilih skema penjualan yang paling tepat.</p>
              <p>4. Selesaikan antrian transaksi yang masih menunggu pengecekan agar nota bisa segera diterbitkan.</p>
              <p>5. Pantau pemenang yang belum menyelesaikan pembayaran dan catat pelanggaran tepat waktu bila diperlukan.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article
            className={`interactive-card section-reveal rounded-[1.6rem] border bg-gradient-to-br p-5 shadow-[0_14px_34px_rgba(0,0,0,0.035)] sm:p-6 ${card.tone}`}
            key={card.title}
          >
            <div className="flex items-start justify-between gap-4">
              <span className="grid size-11 place-items-center rounded-2xl bg-black/[0.04]">
                <card.icon className="size-5" />
              </span>
              <p className="max-w-[11rem] text-right text-[0.7rem] font-bold uppercase tracking-[0.15em] opacity-70">
                {card.title}
              </p>
            </div>
            <p className="mt-6 font-headline text-[3rem] font-black leading-none">{card.value}</p>
            <p className="mt-3 text-sm leading-6 opacity-75">{card.detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          {workflowLanes.map((lane) => (
            <Card className="section-reveal overflow-hidden border border-black/8 bg-white shadow-[0_14px_34px_rgba(0,0,0,0.03)]" key={lane.title}>
              <CardHeader className="border-b border-black/8">
                <CardTitle>{lane.title}</CardTitle>
                <p className="text-sm leading-6 text-black/60">{lane.description}</p>
              </CardHeader>
              <CardContent className="space-y-4 p-5 sm:p-6">
                {lane.items.length ? (
                  lane.items.map((item) => (
                    <div
                      className="interactive-card rounded-[1.4rem] border border-black/8 bg-[#fbfbf8] p-4"
                      key={item.id}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-black/85">{item.name}</p>
                          <p className="mt-1 text-sm text-black/55">
                            {item.code} · Jatuh tempo {item.dueDate}
                          </p>
                        </div>
                        <AdminStatusBadge status={item.status} />
                      </div>
                      <p className="mt-3 text-sm leading-6 text-black/62">{item.nextAction}</p>
                      <div className="mt-4">
                        <Link
                          className="inline-flex items-center gap-2 text-sm font-semibold text-[#0a6a49] transition hover:text-[#074f39]"
                          href={lane.hrefBuilder(item.id)}
                        >
                          Lanjutkan proses
                          <ArrowRight className="size-4" />
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.4rem] border border-dashed border-black/10 bg-[#fcfcfa] p-5 text-sm text-black/55">
                    {lane.emptyText}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-5">
          <Card className="section-reveal overflow-hidden border border-black/8 bg-white shadow-[0_14px_34px_rgba(0,0,0,0.03)]">
            <CardHeader className="border-b border-black/8">
              <CardTitle>Pembayaran yang Perlu Ditangani</CardTitle>
              <p className="text-sm leading-6 text-black/60">
                Tampilkan transaksi yang memang perlu keputusan Anda hari ini.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 p-5 sm:p-6">
              {transactionQueue.map((transaction) => (
                <div
                  className="interactive-card rounded-[1.4rem] border border-black/8 bg-[#fbfbf8] p-4"
                  key={transaction.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-black/85">{transaction.lot}</p>
                      <p className="mt-1 text-sm text-black/55">{transaction.buyer}</p>
                    </div>
                    <AdminStatusBadge status={transaction.status} />
                  </div>
                  <p className="mt-3 text-sm text-black/62">
                    {transaction.method === "TRANSFER_BANK"
                      ? "Periksa bukti transfer dan pastikan dana masuk sebelum status dilanjutkan."
                      : "Pembayaran dilakukan di unit dan menunggu konfirmasi penerimaan dana."}
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-3 text-sm text-black/55">
                    <span>
                      <AdminLiveCountdown
                        expiredLabel="Batas waktu terlewati"
                        fallbackLabel={transaction.deadline}
                        prefix="Sisa waktu"
                        targetAt={transaction.deadlineAt}
                      />
                    </span>
                    <Link className="font-semibold text-[#0a6a49]" href={`/admin/transaksi/${transaction.id}`}>
                      Proses
                    </Link>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="section-reveal overflow-hidden border border-black/8 bg-white shadow-[0_14px_34px_rgba(0,0,0,0.03)]">
            <CardHeader className="border-b border-black/8">
              <CardTitle>Pengingat Pelanggaran Lelang</CardTitle>
              <p className="text-sm leading-6 text-black/60">
                Gunakan panel ini untuk menjaga disiplin lelang tanpa mengganggu alur fixed price.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 p-5 sm:p-6">
              <div className="rounded-[1.4rem] border border-black/8 bg-[#faf7f3] p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-1 size-5 text-[#9a5e00]" />
                  <div className="space-y-2 text-sm leading-6 text-black/65">
                    <p>
                      Saat ini ada {menungguPembayaranBarang.length} barang yang masih menunggu penyelesaian pembayaran.
                    </p>
                    <p>
                      Jika melewati batas 24 jam, sistem akan menghentikan proses transaksi dan
                      otomatis mencatat pelanggaran pengguna.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-[1.4rem] border border-black/8 bg-[#f6faf7] p-4">
                <div className="flex items-start gap-3">
                  <Clock3 className="mt-1 size-5 text-[#0a6a49]" />
                  <div className="space-y-2 text-sm leading-6 text-black/65">
                    <p>{blacklist.filter((entry) => entry.status === "AKTIF").length} akun sedang dibatasi di unit ini.</p>
                    <p>Mereka masih dapat membeli fixed price, tetapi akses ikut lelang Vickrey tetap ditahan sampai masa blokir berakhir.</p>
                  </div>
                </div>
              </div>
              <Link href="/admin/blacklist">
                <Button className="w-full rounded-2xl" variant="secondary">
                  Tinjau daftar blacklist
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
