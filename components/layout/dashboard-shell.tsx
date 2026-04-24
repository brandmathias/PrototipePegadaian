"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  Ban,
  Building2,
  CircleHelp,
  FileCheck2,
  Gavel,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Search,
  ShieldCheck,
  UserCircle2,
  UserCog,
  WalletCards,
  X
} from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { AlertCenter } from "@/components/ui/alert-center";
import { cn } from "@/lib/utils";
import type { AuthRole } from "@/lib/auth/guards";

type NavIconName =
  | "dashboard"
  | "barang"
  | "lelang"
  | "transaksi"
  | "blacklist"
  | "profil"
  | "unit"
  | "admin"
  | "monitoring"
  | "rekening";

export type NavItem = {
  href: string;
  label: string;
  icon?: NavIconName;
};

type DashboardShellProps = {
  title: string;
  subtitle: string;
  nav: NavItem[];
  currentUser?: {
    name: string;
    role: AuthRole;
  };
  profileHref?: string;
  children: ReactNode;
};

export function DashboardShell({
  title,
  subtitle,
  nav,
  currentUser,
  profileHref,
  children
}: DashboardShellProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const renderNavIcon = (icon?: NavIconName) => {
    switch (icon) {
      case "dashboard":
        return <LayoutDashboard className="size-6" />;
      case "barang":
        return <Package className="size-6" />;
      case "lelang":
        return <Gavel className="size-6" />;
      case "transaksi":
        return <FileCheck2 className="size-6" />;
      case "blacklist":
        return <Ban className="size-6" />;
      case "profil":
        return <UserCog className="size-6" />;
      case "unit":
        return <Building2 className="size-6" />;
      case "admin":
        return <UserCog className="size-6" />;
      case "monitoring":
        return <ShieldCheck className="size-6" />;
      case "rekening":
        return <WalletCards className="size-6" />;
      default:
        return null;
    }
  };

  const navItems = nav.map((item) => {
    const isActive =
      item.href === "/admin"
        ? pathname === item.href
        : pathname === item.href || pathname.startsWith(`${item.href}/`);

    return (
      <Link
        className={cn(
          "group inline-flex items-center gap-3 rounded-[1.15rem] px-4 py-2.5 text-[0.95rem] font-semibold text-white/70 transition duration-200 hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 lg:text-base",
          isActive &&
            "bg-[#1d946c] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_24px_rgba(0,0,0,0.1)]"
        )}
        href={item.href}
        key={item.href}
        onClick={() => setIsMenuOpen(false)}
      >
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition group-hover:border-white/15 group-hover:bg-white/10 group-hover:text-white",
            isActive && "border-white/15 bg-white/[0.12] text-white"
          )}
        >
          {renderNavIcon(item.icon)}
        </span>
        <span className="min-w-0 truncate">{item.label}</span>
      </Link>
    );
  });

  return (
    <div className="min-h-dvh bg-[#efefed] text-foreground lg:pl-[18rem]">
      {isMenuOpen ? (
        <button
          aria-label="Tutup menu"
          className="fixed inset-0 z-40 bg-[#031b13]/58 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[18rem] flex-col overflow-hidden bg-[linear-gradient(180deg,#07563f_0%,#064a35_100%)] px-4 py-4 text-white shadow-[0_24px_60px_rgba(0,0,0,0.28)] transition-transform duration-300 lg:px-4 lg:py-4",
          isMenuOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
      >
        <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.045] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="flex items-center gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-[1.15rem] bg-white text-[#07563f] shadow-sm">
              <ShieldCheck aria-hidden="true" className="size-6" />
            </div>
            <div className="min-w-0">
              <p className="font-headline text-[1.45rem] font-black uppercase leading-[0.92] tracking-[0.08em] text-white">
                Pegadaian
                <br />
                Lelang
              </p>
            </div>
          </div>
          <div className="mt-4 border-t border-white/10 pt-4">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-white/46">
              Unit Aktif
            </p>
            <p className="mt-1 truncate text-[1.15rem] font-semibold text-white/92">
              {title}
            </p>
          </div>
        </div>
        <div className="mt-5 flex min-h-0 flex-1 flex-col">
          <p className="px-2 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-white/42">
            Navigasi
          </p>
          <nav
            className="sidebar-scrollbar mt-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-2 overscroll-contain"
            style={{ scrollbarGutter: "stable" }}
          >
            {navItems}
          </nav>
        </div>
        <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
          <button className="inline-flex w-full items-center gap-3 rounded-[1.15rem] px-4 py-3 text-left text-[0.95rem] font-medium text-white/78 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 lg:text-base">
            <span className="grid size-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/72">
              <CircleHelp aria-hidden="true" className="size-5" />
            </span>
            Bantuan
          </button>
          <LogoutButton className="inline-flex w-full items-center gap-3 rounded-[1.15rem] px-4 py-3 text-left text-[0.95rem] font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 lg:text-base">
            <span className="grid size-9 place-items-center rounded-xl border border-white/10 bg-black/15 text-white">
              <LogOut aria-hidden="true" className="size-5" />
            </span>
            Keluar
          </LogoutButton>
        </div>
      </aside>
      <div className="relative min-h-dvh">
        <header className="sticky top-0 z-30 border-b border-black/5 bg-[#f6f5f2]/92 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-[1460px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex min-w-0 items-start gap-3 sm:items-center lg:gap-5">
                <button
                  aria-label={isMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl border border-black/10 bg-white text-[#085a41] shadow-sm transition hover:bg-[#eef6f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7a57] lg:hidden"
                  onClick={() => setIsMenuOpen((current) => !current)}
                >
                  {isMenuOpen ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
                </button>
                <div className="min-w-0">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#0a6a49]/60">
                    Pegadaian Lelang
                  </p>
                  <div className="mt-1 flex min-w-0 flex-col gap-1 lg:flex-row lg:items-center lg:gap-4">
                    <h1 className="min-w-0 truncate text-balance font-headline text-[1.7rem] font-black tracking-tight text-[#085a41] sm:text-[2rem]">
                      {title}
                    </h1>
                    <div className="hidden h-7 w-px bg-black/10 lg:block" />
                    <p className="text-sm text-foreground/68 sm:text-base">{subtitle}</p>
                  </div>
                </div>
              </div>
              <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center xl:w-auto">
                <div className="relative min-w-0 flex-1 xl:w-[32rem]">
                  <label className="sr-only" htmlFor="admin-search">
                    Cari transaksi atau barang
                  </label>
                  <Search aria-hidden="true" className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-foreground/45" />
                  <input
                    autoComplete="off"
                    className="h-14 w-full rounded-[1.35rem] border border-black/5 bg-[#eceae7] pl-12 pr-4 text-base outline-none transition focus:border-[#0b704f]/30 focus:bg-white focus-visible:ring-2 focus-visible:ring-[#0f7a57]/30"
                    id="admin-search"
                    name="adminSearch"
                    placeholder="Cari transaksi atau barang…"
                    type="search"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <AlertCenter
                    scope={currentUser?.role === "super_admin" ? "superadmin" : "admin-unit"}
                  />
                  {profileHref ? (
                    <Link
                      aria-label="Buka profil admin"
                      className="inline-flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 text-[#085a41] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#eef6f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7a57]"
                      href={profileHref}
                    >
                      <UserCircle2 aria-hidden="true" className="size-6" />
                      {currentUser ? (
                        <span className="hidden text-sm font-semibold md:inline">
                          {currentUser.name}
                        </span>
                      ) : null}
                    </Link>
                  ) : (
                    <button
                      aria-label="Buka profil admin"
                      className="inline-flex size-12 items-center justify-center rounded-2xl border border-black/10 bg-white text-[#085a41] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#eef6f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7a57]"
                    >
                      <UserCircle2 aria-hidden="true" className="size-6" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1460px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
