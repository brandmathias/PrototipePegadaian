import Link from "next/link";
import { ArrowRight, CheckCircle2, Search, ShieldCheck, ShoppingBag } from "lucide-react";

import { LotCard } from "@/components/shared/lot-card";
import { SectionHeading } from "@/components/shared/section-heading";
import { StatCard } from "@/components/shared/stat-card";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { landingStats, publicLots } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function HomePage() {
  return (
    <div className="space-y-20 pb-10">
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#01492a_0%,#025833_40%,#0a3323_100%)] py-24 text-white">
        <div className="editorial-grid absolute inset-0 opacity-20" />
        <div className="container relative grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/70">
                Katalog Resmi Pegadaian Lelang
              </p>
              <h1 className="max-w-3xl font-headline text-5xl font-black tracking-tight md:text-7xl">
                Jelajahi barang jaminan, beli langsung, atau ikut lelang dengan alur yang jelas.
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-white/75">
                Mulai dari katalog untuk melihat lot yang tersedia. Setelah masuk, Anda bisa
                melanjutkan pembelian fixed price, ikut lelang Vickrey, dan memantau transaksi
                dari akun pembeli.
              </p>
            </div>
            <div className="glass-panel flex max-w-2xl items-center gap-3 rounded-[1.5rem] p-3 shadow-lift">
              <Search className="ml-2 size-5 text-muted-foreground" />
              <Input
                className="h-12 border-none bg-transparent text-base text-foreground focus-visible:ring-0"
                placeholder="Cari emas, kendaraan, elektronik, atau unit..."
              />
              <Link
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "rounded-[1.1rem] px-8"
                )}
                href="/katalog"
              >
                Cari
              </Link>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link className={buttonVariants({ variant: "default", size: "lg" })} href="/katalog">
                Lihat Katalog
              </Link>
              <Link
                className={buttonVariants({ variant: "secondary", size: "lg" })}
                href="/login"
              >
                Masuk untuk Bertransaksi
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {landingStats.map((stat) => (
                <div
                  className="rounded-[1.25rem] border border-white/10 bg-white/8 p-4 backdrop-blur"
                  key={stat.label}
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                    {stat.label}
                  </p>
                  <p className="mt-2 font-headline text-3xl font-extrabold">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -left-8 top-10 hidden h-48 w-48 rounded-full bg-white/10 blur-3xl lg:block" />
            <div className="space-y-4 rounded-[2rem] border border-white/10 bg-white/10 p-6 backdrop-blur">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/8 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">
                  Kenapa aman untuk dijelajahi?
                </p>
                <div className="mt-4 grid gap-4">
                  {[
                    {
                      icon: ShieldCheck,
                      title: "Unit dan barang ditampilkan dengan konteks yang jelas",
                      detail: "Lokasi unit, kondisi barang, dan mode transaksi sudah terlihat sejak awal."
                    },
                    {
                      icon: ShoppingBag,
                      title: "Beli langsung dan ikut lelang memakai alur yang berbeda",
                      detail: "Guest bisa mempelajari alurnya lebih dulu sebelum memutuskan untuk masuk."
                    },
                    {
                      icon: CheckCircle2,
                      title: "Setelah masuk, transaksi dipantau dari satu akun",
                      detail: "Pembayaran, verifikasi, hingga nota transaksi tersusun rapi di area pembeli."
                    }
                  ].map((item) => {
                    const Icon = item.icon;

                    return (
                      <div className="flex items-start gap-4 rounded-[1.25rem] bg-white/8 p-4" key={item.title}>
                        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/14 text-white">
                          <Icon className="size-4" />
                        </span>
                        <div className="space-y-1.5">
                          <p className="font-semibold text-white">{item.title}</p>
                          <p className="text-sm leading-relaxed text-white/70">{item.detail}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container space-y-8">
        <SectionHeading
          eyebrow="Cara Menggunakan"
          title="Mulai dari guest, lanjutkan ke akun saat siap bertransaksi"
          description="Alur awal dibuat sederhana agar pengguna baru bisa memahami apa yang tersedia, lalu masuk ke akun hanya ketika memang ingin melakukan aksi."
        />
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              title: "1. Jelajahi katalog",
              detail:
                "Lihat kategori, harga, mode transaksi, dan unit Pegadaian tanpa harus masuk lebih dulu."
            },
            {
              title: "2. Pilih beli langsung atau ikut lelang",
              detail:
                "Setiap lot sudah menjelaskan apakah barang bisa dibeli fixed price atau diikuti lewat bid tertutup."
            },
            {
              title: "3. Masuk untuk melanjutkan transaksi",
              detail:
                "Setelah login, Anda bisa memantau pembayaran, verifikasi, dan nota dari satu area akun."
            }
          ].map((item) => (
            <div className="surface-panel p-6" key={item.title}>
              <p className="text-lg font-bold text-foreground">{item.title}</p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container space-y-8">
        <SectionHeading
          eyebrow="Lot Pilihan"
          title="Cuplikan barang yang bisa langsung Anda jelajahi"
          description="Berikut beberapa contoh lot aktif dari berbagai unit untuk membantu pengguna baru memahami isi katalog."
          action={
            <Link
              className={cn(buttonVariants({ variant: "secondary" }), "inline-flex items-center gap-2")}
              href="/katalog"
            >
              Jelajahi Katalog
              <ArrowRight className="size-4" />
            </Link>
          }
        />
        <div className="grid gap-6 lg:grid-cols-3">
          {publicLots.slice(0, 3).map((lot) => (
            <LotCard key={lot.id} lot={lot} />
          ))}
        </div>
      </section>

      <section className="container space-y-8">
        <SectionHeading
          eyebrow="Kepercayaan Pengguna"
          title="Informasi penting sudah terlihat sebelum Anda masuk"
          description="Halaman publik membantu calon pembeli memahami konteks barang dan alur, sehingga keputusan untuk masuk terasa lebih yakin dan tidak membingungkan."
        />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Detail barang"
            value="Harga, kondisi, unit"
            detail="Setiap lot menampilkan konteks dasar sebelum pengguna memutuskan masuk."
          />
          <StatCard
            label="Mode transaksi"
            value="Fixed Price & Vickrey"
            detail="Guest bisa langsung memahami perbedaan alur beli langsung dan ikut lelang."
            accent="secondary"
          />
          <StatCard
            label="Akses setelah masuk"
            value="Transaksi & nota"
            detail="Login membawa pengguna ke area pembeli untuk memantau pembayaran dan dokumen."
            accent="neutral"
          />
          <StatCard
            label="Kepercayaan"
            value="Unit Pegadaian aktif"
            detail="Identitas unit, lokasi, dan status lot dibuat jelas sejak tahap eksplorasi."
            accent="danger"
          />
        </div>
      </section>
    </div>
  );
}
