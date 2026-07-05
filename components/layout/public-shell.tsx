"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { LogOut } from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { readBuyerViewerCache, clearBuyerViewerCache } from "@/components/layout/buyer-viewer-cache";
import { BuyerTopNav } from "@/components/layout/buyer-top-nav";
import { BRAND_NAME, BrandLockup } from "@/components/shared/brand";
import { buttonVariants } from "@/components/ui/button";
import { CatalogSearchInput } from "@/components/shared/catalog-search-input";
import { getRoleHomePath, isAuthRole, type AuthRole } from "@/lib/auth/guards";
import { cn } from "@/lib/utils";
import { PageTransition } from "@/components/shared/page-transition";

type PublicViewer = {
  name: string;
  image?: string | null;
  role: AuthRole;
  homeHref: string;
  wishlistCount?: number;
};

type PublicShellProps = {
  children: ReactNode;
  viewer?: PublicViewer | null;
};

type AuthMeResponse = {
  user?: {
    image?: string | null;
    name?: string | null;
    role?: string | null;
    wishlistCount?: number | null;
  } | null;
};

const guestNav = [
  {
    href: "/katalog",
    label: "Katalog"
  },
  {
    href: "/bantuan",
    label: "Pusat Bantuan"
  }
];

function isPublicBuyerSurface(pathname: string) {
  return pathname.startsWith("/katalog") || pathname.startsWith("/bantuan");
}

function getViewerLabel(role: AuthRole) {
  if (role === "super_admin") return "Control Center";
  if (role === "admin_unit") return "Area Admin";
  return "Akun Pembeli";
}

function toPublicViewer(user: AuthMeResponse["user"]): PublicViewer | null {
  if (!user || !isAuthRole(user.role)) {
    return null;
  }

  return {
    name: user.name?.trim() || "Pengguna",
    image: typeof user.image === "string" && user.image ? user.image : null,
    role: user.role,
    homeHref: getRoleHomePath(user.role),
    wishlistCount: typeof user.wishlistCount === "number" ? user.wishlistCount : 0
  };
}

export function PublicShell({ children, viewer = null }: PublicShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const shouldCheckViewer = !viewer && isPublicBuyerSurface(pathname) && typeof fetch === "function";
  const [clientViewer, setClientViewer] = useState<PublicViewer | null>(() =>
    viewer ?? (isPublicBuyerSurface(pathname) ? readBuyerViewerCache() : null)
  );
  const [isCheckingViewer, setIsCheckingViewer] = useState(shouldCheckViewer);
  const activeViewer = viewer ?? clientViewer;
  const isBuyer = activeViewer?.role === "buyer";
  const isBuyerCatalogSurface = isBuyer || pathname.startsWith("/katalog");
  const shouldPrioritizeBrand = pathname.startsWith("/katalog");
  const navItems = guestNav;
  const brandHref = activeViewer?.homeHref ?? "/katalog";
  const search = searchParams.toString();
  const currentPath = search ? `${pathname}?${search}` : pathname;
  const catalogSearchValue = pathname.startsWith("/katalog") ? searchParams.get("q") ?? "" : "";
  const showFooter = !pathname.startsWith("/katalog") && !pathname.startsWith("/bantuan");

  useEffect(() => {
    if (viewer) {
      setClientViewer(viewer);
      setIsCheckingViewer(false);
    }
  }, [viewer]);

  useEffect(() => {
    if (viewer || !isPublicBuyerSurface(pathname) || typeof fetch !== "function") {
      setIsCheckingViewer(false);
      return;
    }

    let cancelled = false;

    setIsCheckingViewer(true);
    void fetch("/api/auth/me", {
      cache: "no-store",
      credentials: "same-origin"
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: AuthMeResponse | null) => {
        if (!cancelled) {
          const nextViewer = toPublicViewer(payload?.user ?? null);

          if (!nextViewer) {
            clearBuyerViewerCache();
          }

          setClientViewer(nextViewer);
        }
      })
      .catch(() => {
        if (!cancelled) {
          clearBuyerViewerCache();
          setClientViewer(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsCheckingViewer(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pathname, viewer]);

  const showAuthCheckShell = !activeViewer && isCheckingViewer && isPublicBuyerSurface(pathname);

  return (
    <div
      className={cn(
        "app-responsive-shell min-h-dvh bg-white",
        isBuyerCatalogSurface && "buyer-experience-root"
      )}
    >
      {isBuyer && activeViewer ? (
        <BuyerTopNav
          currentPath={currentPath}
          image={activeViewer.image}
          name={activeViewer.name}
          variant="light"
          wishlistCount={activeViewer.wishlistCount}
        />
      ) : showAuthCheckShell ? (
        <header
          aria-busy="true"
          className="sticky top-0 z-40 border-b border-black/5 bg-white/90 pt-[env(safe-area-inset-top)] backdrop-blur"
        >
          <div className="container flex min-h-16 items-center justify-between gap-3 py-3 sm:gap-4">
            <Link
              aria-label={BRAND_NAME}
              className="flex min-w-0 items-center text-primary"
              href="/katalog"
            >
              <BrandLockup
                markClassName="size-9 sm:size-10"
                nameClassName="max-w-[9rem] text-[1.05rem] sm:max-w-none sm:text-[1.45rem]"
                priority={shouldPrioritizeBrand}
              />
            </Link>
            <div
              aria-hidden="true"
              className="hidden h-10 w-72 rounded-full bg-surface-low/80 lg:block xl:w-80"
            />
          </div>
        </header>
      ) : (
        <header
          className="sticky top-0 z-40 border-b border-black/5 bg-white/90 pt-[env(safe-area-inset-top)] backdrop-blur"
        >
          <div className="container flex min-h-16 items-center justify-between gap-3 py-3 sm:gap-4">
            <div className="flex min-w-0 items-center gap-3 lg:gap-6">
              <Link
                aria-label={BRAND_NAME}
                className="flex min-w-0 items-center text-primary transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-[#075f42]"
                href={brandHref}
              >
                <BrandLockup
                  markClassName="size-9 sm:size-10"
                  nameClassName="max-w-[9rem] text-[1.05rem] sm:max-w-none sm:text-[1.45rem]"
                  priority={shouldPrioritizeBrand}
                />
              </Link>
              <nav
                className="hidden items-center gap-2 rounded-full border border-border/70 bg-surface-low/80 p-1 md:flex"
              >
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

            <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3">
              <CatalogSearchInput
                defaultValue={catalogSearchValue}
                inputClassName="hidden w-72 lg:block xl:w-80"
                placeholder="Cari lot atau unit..."
                wrapperClassName="hidden lg:block"
              />
              {activeViewer ? (
                <>
                  <Link
                    className="hidden rounded-full border border-border/70 bg-white px-4 py-2 text-sm font-semibold text-primary transition hover:border-primary/25 hover:bg-primary/5 md:block"
                    href={activeViewer.homeHref}
                  >
                    {getViewerLabel(activeViewer.role)}
                  </Link>
                  <LogoutButton
                    className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
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
          <nav
            aria-label="Navigasi publik mobile"
            className={cn(
              "container grid gap-2 pb-3 md:hidden",
              navItems.length > 1 ? "grid-cols-2" : "grid-cols-1"
            )}
          >
            {navItems.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  className={cn(
                    "inline-flex min-h-10 items-center justify-center rounded-full border px-3 text-sm font-bold transition",
                    active
                      ? "border-primary/15 bg-primary text-white shadow-[0_12px_28px_-22px_rgba(0,74,35,0.52)]"
                      : "border-border/70 bg-white text-muted-foreground hover:text-primary"
                  )}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>
      )}

      <main className={cn("min-w-0", isBuyerCatalogSurface && "buyer-motion-main")}>
        <PageTransition>{children}</PageTransition>
      </main>

      {showFooter ? (
        <footer
          className="mt-20 border-t border-black/5 bg-white py-12"
        >
          <div className="container grid gap-10 sm:grid-cols-2 md:grid-cols-4">
            <div className="space-y-4">
              <h3 className="font-headline text-xl font-bold text-primary">
                {BRAND_NAME}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Prototipe katalog barang agunan untuk pembelian harga tetap, wishlist, dan
                simulasi penawaran tertutup dalam satu alur web.
              </p>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="font-bold uppercase tracking-[0.2em] text-secondary">Layanan</p>
              <p>Cara ikut lelang</p>
              <p>Simulasi pembayaran</p>
              <p>Status transaksi</p>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="font-bold uppercase tracking-[0.2em] text-secondary">Platform</p>
              <p>Tentang sistem</p>
              <p>Unit terkait</p>
              <p>Pusat bantuan</p>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="font-bold uppercase tracking-[0.2em] text-secondary">Kontak</p>
              <p>Pusat Bantuan Prototipe</p>
              <p>support@tugasprototype.cloud</p>
              <p>Lingkungan pengujian akademik</p>
            </div>
          </div>
        </footer>
      ) : null}
    </div>
  );
}
