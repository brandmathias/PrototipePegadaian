"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft, Gavel } from "lucide-react";

import { cn } from "@/lib/utils";

type AuthShellProps = {
  children: ReactNode;
};

const authLinks = [
  { href: "/login", label: "Masuk" },
  { href: "/register", label: "Daftar" }
];

export function AuthShell({ children }: AuthShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(0,92,52,0.12),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(191,146,0,0.14),transparent_28%),linear-gradient(180deg,#fbfaf6_0%,#f3efe4_100%)]">
      <div className="container flex min-h-screen flex-col py-6 md:py-8">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              className="flex items-center gap-3 font-headline text-xl font-black tracking-tight text-primary"
              href="/"
            >
              <span className="rounded-2xl bg-primary p-2 text-white">
                <Gavel className="size-4" />
              </span>
              Pegadaian Lelang
            </Link>
            <span className="hidden text-sm text-muted-foreground md:block">
              Akses aman untuk pembeli
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              className="hidden items-center gap-2 rounded-full border border-border/70 bg-white px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-primary/20 hover:text-primary md:inline-flex"
              href="/"
            >
              <ArrowLeft className="size-4" />
              Kembali ke beranda
            </Link>
            <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-white/85 p-1 sm:flex">
              {authLinks.map((item) => {
                const active = pathname === item.href;

                return (
                  <Link
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-semibold transition",
                      active
                        ? "bg-primary text-white shadow-sm"
                        : "text-muted-foreground hover:text-primary"
                    )}
                    href={item.href}
                    key={item.href}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </header>

        <main className="flex flex-1 items-center py-8 md:py-12">
          <div className="grid w-full gap-8 xl:grid-cols-[0.88fr_1.12fr] xl:items-center">
            <section className="hidden rounded-[2rem] border border-primary/10 bg-[linear-gradient(145deg,rgba(0,92,52,0.96),rgba(1,55,32,0.98))] p-8 text-white shadow-[0_34px_100px_rgba(0,50,28,0.22)] xl:block">
              <div className="space-y-8">
                <div className="space-y-4">
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/65">
                    Tahap autentikasi
                  </p>
                  <h1 className="font-headline text-4xl font-black tracking-tight">
                    Lanjutkan ke area pembeli dengan akses yang lebih fokus.
                  </h1>
                  <p className="max-w-xl text-base leading-8 text-white/76">
                    Setelah masuk, Anda bisa memantau transaksi aktif, melihat hasil lelang,
                    dan mengunduh nota tanpa distraksi dari halaman publik.
                  </p>
                </div>

                <div className="grid gap-4">
                  {[
                    "Jelajahi lot fixed price dan sesi lelang dari berbagai unit Pegadaian.",
                    "Pantau pembayaran, status verifikasi, dan dokumen transaksi di satu akun.",
                    "Pindah antara masuk dan daftar dengan alur yang lebih jelas dan ringan."
                  ].map((item) => (
                    <div
                      className="rounded-[1.5rem] border border-white/10 bg-white/10 p-5 text-sm leading-7 text-white/78"
                      key={item}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="mx-auto w-full max-w-xl">{children}</section>
          </div>
        </main>
      </div>
    </div>
  );
}
