"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Gavel, Grid2X2, Home, ReceiptText } from "lucide-react";

import { BuyerProfileMenu } from "@/components/layout/buyer-profile-menu";
import { CatalogSearchInput } from "@/components/shared/catalog-search-input";
import { AlertCenter } from "@/components/ui/alert-center";
import { Badge } from "@/components/ui/badge";
import type { BuyerSessionUser } from "@/lib/auth/guards";
import { cn } from "@/lib/utils";

type BuyerShellProps = {
  buyer: BuyerSessionUser;
  children: ReactNode;
  title: string;
  description: string;
  summary: {
    memberSince: string;
    image?: string | null;
    blacklist: {
      active: boolean;
      until: string;
      reason?: string;
      violations?: number;
    };
  };
};

const buyerNav = [
  {
    href: "/dashboard",
    icon: Home,
    label: "Beranda"
  },
  {
    href: "/katalog",
    icon: Grid2X2,
    label: "Katalog"
  },
  {
    href: "/transaksi",
    icon: ReceiptText,
    label: "Transaksi"
  }
];

export function BuyerShell({ buyer, children, title, description, summary }: BuyerShellProps) {
  const pathname = usePathname();
  const showIntro = pathname !== "/dashboard" && pathname !== "/profil";

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
                const Icon = item.icon;

                return (
                  <Link
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
                      active
                        ? "bg-white text-primary shadow-sm"
                        : "text-muted-foreground hover:text-primary"
                    )}
                    href={item.href}
                    key={item.href}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <CatalogSearchInput
              inputClassName="hidden w-72 lg:block xl:w-80"
              placeholder="Cari barang, unit, kategori..."
              submitLabel="Telusuri"
              wrapperClassName="hidden lg:block"
            />
            <AlertCenter className="shrink-0" scope="buyer" />
            <BuyerProfileMenu image={summary.image} name={buyer.name} profileHref="/profil" />
          </div>
        </div>
      </header>

      {showIntro ? (
        <section className="border-b border-black/5 bg-[radial-gradient(circle_at_top_left,rgba(14,98,71,0.10),transparent_45%),linear-gradient(180deg,#fff_0%,#f9f7f1_100%)] print:hidden">
          <div className="container flex flex-col gap-6 py-8 lg:gap-8 lg:py-10">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className="bg-primary/10 text-primary" variant="default">
                    Ruang Pembeli
                  </Badge>
                  <Badge variant={summary.blacklist.active ? "danger" : "muted"}>
                    {summary.blacklist.active
                      ? `Blacklist aktif sampai ${summary.blacklist.until}`
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
                  Akun {buyer.email} | Member sejak {summary.memberSince} | Semua aktivitas
                  pembelian dan lelang tersusun rapi di satu tempat
                </p>
              </div>

              <div className="flex flex-col gap-3 xl:max-w-sm xl:items-end">
                <CatalogSearchInput
                  inputClassName="w-full"
                  placeholder="Cari barang, unit, kategori..."
                  submitLabel="Cari"
                  wrapperClassName="w-full lg:hidden"
                />
                <div className="rounded-[1.5rem] border border-border/70 bg-white/85 px-4 py-4 text-sm leading-relaxed text-muted-foreground shadow-[0_18px_40px_-34px_rgba(13,77,59,0.35)] xl:max-w-sm">
                  Mulai dari beranda untuk melihat ringkasan akun, lalu lanjutkan ke katalog atau
                  transaksi sesuai kebutuhan Anda.
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <main className="container py-8 md:py-10 print:py-0">{children}</main>
    </div>
  );
}
