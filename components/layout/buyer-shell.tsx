"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Gavel, LogOut, Search } from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { AlertCenter } from "@/components/ui/alert-center";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { BuyerSessionUser } from "@/lib/auth/guards";
import { userSummary } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type BuyerShellProps = {
  buyer: BuyerSessionUser;
  children: ReactNode;
  title: string;
  description: string;
};

const buyerNav = [
  {
    href: "/dashboard",
    label: "Beranda"
  },
  {
    href: "/katalog",
    label: "Katalog"
  },
  {
    href: "/transaksi",
    label: "Transaksi"
  }
];

export function BuyerShell({ buyer, children, title, description }: BuyerShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fbfaf6_0%,#f4f1e8_100%)]">
      <header className="sticky top-0 z-40 border-b border-black/5 bg-white/90 backdrop-blur print:hidden">
        <div className="container flex min-h-16 items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-6">
            <Link
              className="flex items-center gap-3 font-headline text-xl font-black tracking-tight text-primary"
              href="/"
            >
              <span className="rounded-2xl bg-primary p-2 text-white">
                <Gavel className="size-4" />
              </span>
              Pegadaian Lelang
            </Link>
            <nav className="hidden items-center gap-2 rounded-full border border-border/70 bg-surface-low/80 p-1 lg:flex">
              {buyerNav.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));

                return (
                  <Link
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-medium transition",
                      active
                        ? "bg-white text-primary shadow-sm"
                        : "text-muted-foreground hover:text-primary"
                    )}
                    href={item.href}
                    key={item.href}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden w-72 lg:block xl:w-80">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Cari barang jaminan"
                autoComplete="off"
                className="border-border/70 bg-white pl-10"
                name="buyerSearchDesktop"
                placeholder="Cari barang jaminan\u2026"
              />
            </div>
            <AlertCenter className="shrink-0" scope="buyer" />
            <Link
              className="hidden rounded-full border border-border/70 bg-white px-4 py-2 text-sm font-semibold text-primary transition hover:border-primary/25 hover:bg-primary/5 md:block"
              href="/profil"
            >
              {buyer.name}
            </Link>
            <LogoutButton
              className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white px-4 py-2 text-sm font-semibold text-primary transition hover:border-primary/25 hover:bg-primary/5"
              redirectTo="/login"
            >
              <LogOut className="size-4" />
              Keluar
            </LogoutButton>
          </div>
        </div>
      </header>

      <section className="border-b border-black/5 bg-[radial-gradient(circle_at_top_left,rgba(14,98,71,0.10),transparent_45%),linear-gradient(180deg,#fff_0%,#f9f7f1_100%)] print:hidden">
        <div className="container flex flex-col gap-6 py-8 lg:gap-8 lg:py-10">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="bg-primary/10 text-primary" variant="default">
                  Ruang Pembeli
                </Badge>
                <Badge variant={userSummary.blacklist.active ? "danger" : "muted"}>
                  {userSummary.blacklist.active
                    ? `Blacklist aktif sampai ${userSummary.blacklist.until}`
                    : "Akun terverifikasi"}
                </Badge>
              </div>
              <div className="space-y-2">
                <h1 className="font-headline text-3xl font-extrabold tracking-tight text-foreground md:text-4xl xl:text-5xl">
                  {title}
                </h1>
                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                  {description}
                </p>
              </div>
              <p className="text-sm font-medium text-primary/80">
                Akun {buyer.email} | Member sejak {userSummary.memberSince} | Semua aktivitas
                pembelian dan lelang tersusun rapi di satu tempat
              </p>
            </div>

            <div className="flex flex-col gap-3 xl:max-w-sm xl:items-end">
              <div className="relative w-full lg:hidden">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-label="Cari barang jaminan"
                  autoComplete="off"
                  className="border-border/70 bg-white pl-10"
                  name="buyerSearchMobile"
                  placeholder="Cari barang jaminan\u2026"
                />
              </div>
              <div className="rounded-[1.5rem] border border-border/70 bg-white/85 px-4 py-4 text-sm leading-relaxed text-muted-foreground shadow-[0_18px_40px_-34px_rgba(13,77,59,0.35)] xl:max-w-sm">
                Mulai dari beranda untuk melihat ringkasan akun, lalu lanjutkan ke katalog atau
                transaksi sesuai kebutuhan Anda.
              </div>
            </div>
          </div>

        </div>
      </section>

      <main className="container py-8 md:py-10 print:py-0">{children}</main>
    </div>
  );
}
