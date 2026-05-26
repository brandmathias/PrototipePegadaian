"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Gavel, LogOut } from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { BuyerTopNav } from "@/components/layout/buyer-top-nav";
import { buttonVariants } from "@/components/ui/button";
import { CatalogSearchInput } from "@/components/shared/catalog-search-input";
import type { AuthRole } from "@/lib/auth/guards";
import { cn } from "@/lib/utils";

type PublicShellProps = {
  children: ReactNode;
  viewer?: {
    name: string;
    image?: string | null;
    role: AuthRole;
    homeHref: string;
  } | null;
};

const guestNav = [
  {
    href: "/",
    label: "Beranda"
  },
  {
    href: "/katalog",
    label: "Katalog"
  }
];

function getViewerLabel(role: AuthRole) {
  if (role === "super_admin") return "Control Center";
  if (role === "admin_unit") return "Area Admin";
  return "Akun Pembeli";
}

export function PublicShell({ children, viewer = null }: PublicShellProps) {
  const pathname = usePathname();
  const isBuyer = viewer?.role === "buyer";
  const navItems = guestNav;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fbfaf6_0%,#f4f1e8_100%)]">
      {isBuyer && viewer ? (
        <BuyerTopNav image={viewer.image} name={viewer.name} />
      ) : (
        <header className="sticky top-0 z-40 border-b border-black/5 bg-white/90 backdrop-blur">
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
              <nav className="hidden items-center gap-2 rounded-full border border-border/70 bg-surface-low/80 p-1 md:flex">
                {navItems.map((item) => {
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
              <CatalogSearchInput
                inputClassName="hidden w-72 lg:block xl:w-80"
                placeholder="Cari lot atau unit..."
                wrapperClassName="hidden lg:block"
              />
              {viewer ? (
                <>
                  <Link
                    className="hidden rounded-full border border-border/70 bg-white px-4 py-2 text-sm font-semibold text-primary transition hover:border-primary/25 hover:bg-primary/5 md:block"
                    href={viewer.homeHref}
                  >
                    {getViewerLabel(viewer.role)}
                  </Link>
                  <LogoutButton
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
                    redirectTo="/login"
                  >
                    <LogOut className="size-4" />
                    Keluar
                  </LogoutButton>
                </>
              ) : (
                <Link
                  className={cn(buttonVariants({ variant: "default" }), "min-w-[6.25rem]")}
                  href="/login"
                >
                  Masuk
                </Link>
              )}
            </div>
          </div>
        </header>
      )}

      <main>{children}</main>

      <footer className="mt-20 border-t border-black/5 bg-surface-low py-12">
        <div className="container grid gap-10 md:grid-cols-4">
          <div className="space-y-4">
            <h3 className="font-headline text-xl font-bold text-primary">Pegadaian Lelang</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Platform resmi untuk katalog barang jaminan, pembelian fixed price, dan lelang
              tertutup Vickrey lintas unit Pegadaian.
            </p>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p className="font-bold uppercase tracking-[0.2em] text-secondary">Layanan</p>
            <p>Cara ikut lelang</p>
            <p>Simulasi pembayaran</p>
            <p>Status transaksi</p>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p className="font-bold uppercase tracking-[0.2em] text-secondary">Perusahaan</p>
            <p>Tentang sistem</p>
            <p>Unit Pegadaian</p>
            <p>Pusat bantuan</p>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p className="font-bold uppercase tracking-[0.2em] text-secondary">Kontak</p>
            <p>Call Center 1500567</p>
            <p>customer.care@pegadaian.co.id</p>
            <p>Jl. Kramat Raya No.162, Jakarta Pusat</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
