"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  Ban,
  Building2,
  FileCheck2,
  Gavel,
  LayoutDashboard,
  Megaphone,
  Menu,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  UserCog,
  UsersRound,
  WalletCards,
  X
} from "lucide-react";

import { AdminProfileMenu } from "@/components/layout/admin-profile-menu";
import { BRAND_NAME, BrandLockup } from "@/components/shared/brand";
import { AlertCenter } from "@/components/ui/alert-center";
import type { AuthRole } from "@/lib/auth/guards";
import { cn } from "@/lib/utils";

type NavIconName =
  | "dashboard"
  | "barang"
  | "lelang"
  | "marketing"
  | "shopping"
  | "transaksi"
  | "blacklist"
  | "profil"
  | "unit"
  | "admin"
  | "superadmin"
  | "monitoring"
  | "rekening";

export type NavItem = {
  href: string;
  label: string;
  icon?: NavIconName;
  badge?: number | string;
  badgeTone?: "default" | "warning" | "danger";
  activePrefixes?: string[];
  children?: NavItem[];
};

type SidebarMetric = {
  label: string;
  value: string | number;
  tone?: "default" | "warning" | "danger";
};

type DashboardShellProps = {
  title: string;
  subtitle: string;
  headerLead?: string;
  headerTitle?: string;
  headerSubtitle?: string;
  hideHeaderIdentity?: boolean;
  headerBrandLabel?: string | null;
  searchPlaceholder?: string;
  searchShortcutHint?: string;
  nav: NavItem[];
  sidebarMetrics?: SidebarMetric[];
  sidebarUpdatedAt?: string;
  showHeaderSearch?: boolean;
  forceWhiteShell?: boolean;
  currentUser?: {
    name: string;
    role: AuthRole;
    image?: string | null;
  };
  profileHref?: string;
  children: ReactNode;
};

function clearGlobalThemeSideEffects() {
  document.documentElement.classList.remove("dark");
  document.documentElement.style.removeProperty("color-scheme");
}

export function DashboardShell({
  title,
  subtitle,
  headerLead,
  headerTitle,
  headerSubtitle,
  hideHeaderIdentity = false,
  headerBrandLabel = BRAND_NAME,
  searchPlaceholder = "Cari transaksi atau barang...",
  searchShortcutHint,
  nav,
  sidebarMetrics,
  sidebarUpdatedAt,
  showHeaderSearch = true,
  forceWhiteShell = false,
  currentUser,
  profileHref,
  children
}: DashboardShellProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const profileRoleLabel = currentUser?.role === "super_admin" ? "Super Admin" : "Admin Unit";

  useEffect(() => {
    clearGlobalThemeSideEffects();

    return () => {
      clearGlobalThemeSideEffects();
    };
  }, []);

  const renderNavIcon = (icon?: NavIconName) => {
    switch (icon) {
      case "dashboard":
        return <LayoutDashboard className="size-5" />;
      case "barang":
        return <Package className="size-5" />;
      case "lelang":
        return <Gavel className="size-5" />;
      case "marketing":
        return <Megaphone className="size-5" />;
      case "shopping":
        return <ShoppingBag className="size-5" />;
      case "transaksi":
        return <FileCheck2 className="size-5" />;
      case "blacklist":
        return <Ban className="size-5" />;
      case "profil":
        return <UserCog className="size-5" />;
      case "unit":
        return <Building2 className="size-5" />;
      case "admin":
        return <UserCog className="size-5" />;
      case "superadmin":
        return <UsersRound className="size-5" />;
      case "monitoring":
        return <ShieldCheck className="size-5" />;
      case "rekening":
        return <WalletCards className="size-5" />;
      default:
        return null;
    }
  };

  const isPathMatch = (href: string): boolean =>
    pathname === href || pathname.startsWith(`${href}/`);

  const isHrefActive = (item: Pick<NavItem, "href" | "activePrefixes">): boolean => {
    const isDashboardRoot = item.href === "/admin" || item.href === "/superadmin" || item.href === "/dashboard";

    return (
      (isDashboardRoot ? pathname === item.href : isPathMatch(item.href)) ||
      Boolean(item.activePrefixes?.some((prefix) => isPathMatch(prefix)))
    );
  };

  const hasMoreSpecificTopLevelMatch = (item: NavItem): boolean =>
    nav.some(
      (otherItem) =>
        otherItem.href !== item.href &&
        otherItem.href.startsWith(`${item.href}/`) &&
        isHrefActive(otherItem)
    );

  const isNavItemActive = (item: NavItem): boolean => {
    if (hasMoreSpecificTopLevelMatch(item)) {
      return false;
    }

    if (item.children?.length) {
      return (
        pathname === item.href ||
        pathname.startsWith(`${item.href}/`) ||
        item.children.some((child) => isNavItemActive(child))
      );
    }

    return isHrefActive(item);
  };

  const renderBadge = (item: Pick<NavItem, "badge" | "badgeTone">) => {
    if (item.badge === undefined || item.badge === null || item.badge === "" || item.badge === 0) {
      return null;
    }

    return (
      <span
        className={cn(
          "ml-auto inline-flex min-w-8 shrink-0 items-center justify-center gap-1 rounded-full border px-2 py-1 text-[0.64rem] font-black tabular-nums tracking-[0.12em] shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_12px_24px_-20px_rgba(0,0,0,0.5)] transition duration-300 group-hover:scale-[1.03]",
          item.badgeTone === "danger"
            ? "border-rose-200/28 bg-[linear-gradient(180deg,rgba(251,113,133,0.34),rgba(251,113,133,0.18))] text-rose-50"
            : item.badgeTone === "warning"
              ? "border-amber-200/28 bg-[linear-gradient(180deg,rgba(251,191,36,0.3),rgba(245,158,11,0.16))] text-amber-50"
              : "border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.08))] text-white"
        )}
      >
        <span
          className={cn(
            "size-1.5 rounded-full",
            item.badgeTone === "danger"
              ? "bg-rose-200"
              : item.badgeTone === "warning"
                ? "bg-amber-200"
                : "bg-emerald-200"
          )}
        />
        {item.badge}
      </span>
    );
  };

  const renderNavItem = (item: NavItem) => {
    const isActive = isNavItemActive(item);

    if (item.children?.length) {
      const isGroupOpen = openGroups[item.href] ?? isActive;
      const setGroupOpen = (open: boolean, element?: HTMLElement | null) => {
        setOpenGroups((current) => ({
          ...current,
          [item.href]: open
        }));

        if (open && element?.scrollIntoView) {
          window.setTimeout(() => {
            element.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }, 160);
        }
      };

      return (
        <div
          className="space-y-1.5"
          key={item.href}
          onFocus={(event) => setGroupOpen(true, event.currentTarget)}
          onMouseEnter={(event) => setGroupOpen(true, event.currentTarget)}
          onMouseLeave={() => {
            if (!isActive) {
              setGroupOpen(false);
            }
          }}
        >
          <div
            className={cn(
              "group flex w-full items-center gap-2 rounded-[1rem] px-1.5 py-1 text-left text-[0.9rem] font-semibold text-white/70 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/[0.07] hover:text-white lg:text-[0.94rem]",
              isActive &&
                "bg-[linear-gradient(135deg,rgba(29,148,108,0.92),rgba(11,101,72,0.94))] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_18px_32px_-24px_rgba(0,0,0,0.58)]"
            )}
          >
            <Link
              className="flex min-w-0 flex-1 items-center gap-3 rounded-[0.9rem] px-2.5 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              href={item.href}
              onClick={() => setIsMenuOpen(false)}
            >
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-[0.95rem] border border-white/10 bg-white/[0.06] text-white/76 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-0.5 group-hover:border-white/16 group-hover:bg-white/[0.12] group-hover:text-white",
                  isActive && "border-white/16 bg-white/[0.14] text-white"
                )}
              >
                {renderNavIcon(item.icon)}
              </span>
              <span className="min-w-0 truncate">{item.label}</span>
              {renderBadge(item)}
            </Link>
          </div>

          <div
            aria-hidden={!isGroupOpen}
            className={cn(
              "grid overflow-hidden pl-3.5 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
              isGroupOpen ? "max-h-44 translate-y-0 opacity-100" : "max-h-0 -translate-y-1.5 opacity-0"
            )}
          >
            <div className="space-y-1">
              {item.children.map((child) => (
                <Link
                  className={cn(
                    "group inline-flex w-full items-center gap-3 rounded-[0.95rem] px-3.5 py-1.5 text-[0.82rem] font-medium text-white/62 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 lg:text-[0.86rem]",
                    isNavItemActive(child) &&
                      "bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                  )}
                  href={child.href}
                  key={child.href}
                  onClick={() => setIsMenuOpen(false)}
                  tabIndex={isGroupOpen ? undefined : -1}
                >
                  <span
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-[0.85rem] border border-white/10 bg-white/[0.05] text-white/68 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-0.5 group-hover:border-white/15 group-hover:bg-white/10 group-hover:text-white",
                      isNavItemActive(child) && "border-white/15 bg-white/[0.12] text-white"
                    )}
                  >
                    {renderNavIcon(child.icon)}
                  </span>
                  <span className="min-w-0 truncate">{child.label}</span>
                  {renderBadge(child)}
                </Link>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <Link
        className={cn(
          "group inline-flex items-center gap-3 rounded-[1rem] px-3.5 py-2 text-[0.9rem] font-semibold text-white/70 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 lg:text-[0.94rem]",
          isActive &&
            "bg-[linear-gradient(135deg,rgba(29,148,108,0.92),rgba(11,101,72,0.94))] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_18px_32px_-24px_rgba(0,0,0,0.58)]"
        )}
        href={item.href}
        key={item.href}
        onClick={() => setIsMenuOpen(false)}
      >
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-[0.95rem] border border-white/10 bg-white/[0.06] text-white/76 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-0.5 group-hover:border-white/16 group-hover:bg-white/[0.12] group-hover:text-white",
            isActive && "border-white/16 bg-white/[0.14] text-white"
          )}
        >
          {renderNavIcon(item.icon)}
        </span>
        <span className="min-w-0 truncate">{item.label}</span>
        {renderBadge(item)}
      </Link>
    );
  };

  return (
    <div
      className={cn(
        "app-responsive-shell min-h-dvh bg-white text-foreground transition-colors duration-300 dark:bg-[#07110d] dark:text-[#e8f5ec] print:bg-white lg:pl-[17rem] print:lg:pl-0",
        forceWhiteShell && "bg-white dark:bg-white"
      )}
      data-admin-shell="true"
      data-admin-theme="light"
      style={{ colorScheme: "light" }}
    >
      {isMenuOpen ? (
        <button
          aria-label="Tutup menu"
          className="fixed inset-0 z-40 bg-[#031b13]/58 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[17rem] max-w-[calc(100vw-1rem)] flex-col overflow-hidden bg-[radial-gradient(circle_at_top,rgba(28,132,99,0.26),transparent_28%),linear-gradient(180deg,#07563f_0%,#053c2b_100%)] px-3 py-3 text-white shadow-[0_24px_60px_rgba(0,0,0,0.28)] transition-transform duration-300 dark:bg-[radial-gradient(circle_at_top,rgba(36,189,129,0.18),transparent_30%),linear-gradient(180deg,#052d23_0%,#031912_100%)] dark:shadow-[0_24px_70px_rgba(0,0,0,0.46)] print:hidden",
          isMenuOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
      >
        <div className="shrink-0 rounded-[1.55rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.035))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_18px_40px_-34px_rgba(0,0,0,0.7)]">
          <div className="relative isolate">
            <div className="pointer-events-none absolute -left-2 top-1/2 h-14 w-14 -translate-y-1/2 rounded-full bg-[#f0d287]/18 blur-xl" />
            <div className="pointer-events-none absolute inset-y-1 left-10 right-2 rounded-full bg-[linear-gradient(90deg,rgba(247,241,227,0.16),rgba(247,241,227,0.08),transparent_80%)] blur-lg" />
            <BrandLockup
              className="relative z-[1] max-w-full drop-shadow-[0_10px_18px_rgba(0,0,0,0.24)]"
              markClassName="size-10"
              nameClassName="h-7 max-w-[9.25rem]"
            />
            <div className="mt-3 h-px w-full bg-[linear-gradient(90deg,rgba(240,210,135,0.62),rgba(255,255,255,0.22),transparent_72%)]" />
          </div>

          <div className="group relative mt-4 min-h-[6.05rem] overflow-hidden rounded-[1.25rem] border border-white/12 bg-[linear-gradient(150deg,rgba(255,255,255,0.075),rgba(255,255,255,0.028)_58%,rgba(96,226,164,0.1))] px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_20px_45px_-36px_rgba(0,0,0,0.85)] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]">
            <div className="pointer-events-none absolute inset-y-0 right-0 w-36 bg-[radial-gradient(circle_at_bottom_right,rgba(137,255,207,0.22),transparent_62%)]" />
            <div className="pointer-events-none absolute -bottom-7 right-2 h-14 w-36 rounded-full bg-emerald-200/18 blur-xl" />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-1 right-0 top-1 w-36 opacity-[0.74] brightness-[0.84] contrast-[1.14] saturate-[1.02] drop-shadow-[0_16px_18px_rgba(65,255,177,0.1)] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-[1px] group-hover:-translate-y-[1px] group-hover:scale-[1.02]"
              style={{
                backgroundImage: "url('/uploads/Sidebar%20Kantor.svg')",
                backgroundPosition: "right bottom",
                backgroundRepeat: "no-repeat",
                backgroundSize: "contain"
              }}
            />
            <div className="pointer-events-none absolute inset-x-4 bottom-3 h-px bg-gradient-to-r from-transparent via-emerald-100/22 to-transparent" />
            <p className="relative text-[0.68rem] font-bold uppercase tracking-[0.2em] text-white/46">Unit Aktif</p>
            <p className="relative mt-1 max-w-[10rem] text-[1.02rem] font-semibold leading-tight text-white/92">{title}</p>
            <span className="relative mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-200/20 bg-emerald-300/12 px-2.5 py-1 text-[0.68rem] font-black uppercase tracking-[0.12em] text-emerald-50 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:bg-emerald-300/14">
              <span className="size-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,255,180,0.3)]" />
              Aktif
            </span>
          </div>
        </div>

        <div className="mt-4 flex min-h-0 flex-1 flex-col">
          <p className="px-2 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-white/42">Navigasi</p>
          <nav className="sidebar-scrollbar mt-2 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pb-2 pr-1">
            {nav.map((item) => renderNavItem(item))}
          </nav>
        </div>

        {sidebarMetrics?.length ? (
          <div className="mt-2.5 shrink-0 rounded-[1.2rem] border border-white/10 bg-white/[0.045] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-white/46">Ringkasan Unit</p>
            <div className="mt-2 space-y-1.5">
              {sidebarMetrics.map((metric) => (
                <div className="flex items-center justify-between gap-3 text-[0.78rem]" key={metric.label}>
                  <span
                    className={cn(
                      "truncate text-white/70",
                      metric.tone === "warning" && "text-amber-100",
                      metric.tone === "danger" && "text-rose-100"
                    )}
                  >
                    {metric.label}
                  </span>
                  <span
                    className={cn(
                      "font-black tabular-nums text-white",
                      metric.tone === "warning" && "text-amber-200",
                      metric.tone === "danger" && "text-rose-200"
                    )}
                  >
                    {metric.value}
                  </span>
                </div>
              ))}
            </div>
            {sidebarUpdatedAt ? (
              <p className="mt-2.5 border-t border-white/10 pt-2 text-[0.68rem] leading-5 text-white/42">
                Data per {sidebarUpdatedAt}
              </p>
            ) : null}
          </div>
        ) : null}
      </aside>

      <div className={cn("relative min-h-dvh", forceWhiteShell && "bg-white")}>
        <header className="sticky top-0 z-30 border-b border-black/5 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur-xl transition-colors duration-300 dark:border-white/8 dark:bg-[#07110d]/88 print:hidden">
          <div className="mx-auto flex w-full max-w-[1460px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex min-w-0 items-start gap-3 sm:items-center lg:gap-5">
                <button
                  aria-label={isMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl border border-black/10 bg-white text-[#085a41] shadow-sm transition hover:bg-[#eef6f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7a57] dark:border-white/10 dark:bg-white/8 dark:text-emerald-100 dark:hover:bg-white/12 lg:hidden"
                  onClick={() => setIsMenuOpen((current) => !current)}
                >
                  {isMenuOpen ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
                </button>
                {!hideHeaderIdentity ? (
                  <div className="min-w-0">
                    {headerBrandLabel ? (
                      <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#0a6a49]/60 dark:text-emerald-200/62">
                        {headerBrandLabel}
                      </p>
                    ) : null}
                    {headerLead ? (
                      <p
                        className={cn(
                          "inline-flex w-fit items-center rounded-full bg-[#eef4ef] px-3 py-1 text-[0.58rem] font-black uppercase tracking-[0.28em] text-[#0a6a49]/68 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] dark:bg-white/8 dark:text-emerald-100/68",
                          headerBrandLabel ? "mt-1.5" : "mt-0.5"
                        )}
                      >
                        {headerLead}
                      </p>
                    ) : null}
                    <div
                      className={cn(
                        "min-w-0 flex flex-col gap-2",
                        headerBrandLabel || headerLead ? "mt-1.5" : "",
                        !headerLead && "lg:flex-row lg:items-center lg:gap-6"
                      )}
                    >
                      <h1 className="min-w-0 truncate text-balance font-headline text-[1.75rem] font-black tracking-[-0.04em] text-[#085a41] dark:text-emerald-100 sm:text-[2.08rem]">
                        {headerTitle ?? title}
                      </h1>
                      {headerLead ? null : <div className="hidden h-9 w-px bg-[linear-gradient(180deg,rgba(8,90,65,0.06),rgba(8,90,65,0.2),rgba(8,90,65,0.06))] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.16),rgba(255,255,255,0.04))] lg:block" />}
                      {(headerSubtitle ?? subtitle) ? (
                        headerLead ? (
                          <p className="min-w-0 text-pretty font-headline text-[0.9rem] font-bold uppercase leading-[1.15] tracking-[0.16em] text-[#355346] dark:text-slate-100/76 sm:text-[0.98rem]">
                            {headerSubtitle ?? subtitle}
                          </p>
                        ) : (
                          <p className="min-w-0 max-w-[26rem] text-pretty font-headline text-[1rem] font-semibold leading-[1.25] tracking-[-0.018em] text-[#31453a] dark:text-slate-100/78 sm:text-[1.08rem]">
                            {headerSubtitle ?? subtitle}
                          </p>
                        )
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center xl:w-auto">
                {showHeaderSearch ? (
                  <div className="relative min-w-0 flex-1 xl:w-[32rem]">
                    <label className="sr-only" htmlFor="admin-search">
                      Cari transaksi atau barang
                    </label>
                    <Search aria-hidden="true" className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-foreground/45" />
                    <input
                      autoComplete="off"
                      className={cn(
                        "h-14 w-full rounded-[1.35rem] border border-black/5 bg-[#eceae7] pl-12 text-base outline-none transition focus:border-[#0b704f]/30 focus:bg-white focus-visible:ring-2 focus-visible:ring-[#0f7a57]/30 dark:border-white/8 dark:bg-white/8 dark:text-slate-100 dark:placeholder:text-slate-300/45 dark:focus:border-emerald-300/28 dark:focus:bg-white/10",
                        searchShortcutHint ? "pr-20" : "pr-4"
                      )}
                      id="admin-search"
                      name="adminSearch"
                      placeholder={searchPlaceholder}
                      type="search"
                    />
                    {searchShortcutHint ? (
                      <span className="pointer-events-none absolute right-4 top-1/2 inline-flex h-8 -translate-y-1/2 items-center rounded-[0.8rem] border border-black/8 bg-white px-2.5 text-[0.7rem] font-bold tracking-[0.1em] text-[#475569] shadow-[0_8px_18px_-16px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
                        {searchShortcutHint}
                      </span>
                    ) : null}
                  </div>
                ) : null}

                <div className="flex min-w-0 items-center justify-end gap-2">
                  <AlertCenter scope={currentUser?.role === "super_admin" ? "superadmin" : "admin-unit"} />
                  {profileHref && currentUser ? (
                    <AdminProfileMenu
                      helpHref={`${profileHref}#panduan`}
                      image={currentUser.image}
                      name={currentUser.name}
                      profileHref={profileHref}
                      roleLabel={profileRoleLabel}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1460px] px-4 py-5 print:max-w-none print:px-0 print:py-0 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
