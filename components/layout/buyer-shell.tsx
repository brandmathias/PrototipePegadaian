"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { BuyerTopNav } from "@/components/layout/buyer-top-nav";
import { CatalogSearchInput } from "@/components/shared/catalog-search-input";
import { Badge } from "@/components/ui/badge";
import type { BuyerSessionUser } from "@/lib/auth/guards";

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

export function BuyerShell({ buyer, children, title, description, summary }: BuyerShellProps) {
  const pathname = usePathname();
  const showIntro = pathname !== "/dashboard" && pathname !== "/profil";

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fbfaf6_0%,#f4f1e8_100%)]">
      <BuyerTopNav image={summary.image} name={buyer.name} />

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
