import Link from "next/link";
import { Grid2X2, Headphones, Heart, Home, ReceiptText, ShieldAlert } from "lucide-react";

import { BuyerProfileMenu } from "@/components/layout/buyer-profile-menu";
import { BRAND_NAME, BrandLockup } from "@/components/shared/brand";
import { CatalogSearchInput } from "@/components/shared/catalog-search-input";
import { AlertCenter } from "@/components/ui/alert-center";
import { cn } from "@/lib/utils";

type BuyerTopNavProps = {
  currentPath?: string;
  image?: string | null;
  name: string;
  variant?: "light" | "luxury";
  wishlistCount?: number;
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
  },
  {
    href: "/pelanggaran",
    icon: ShieldAlert,
    label: "Pelanggaran"
  },
  {
    href: "/bantuan",
    icon: Headphones,
    label: "Pusat Bantuan"
  }
];

function getCatalogSearchValue(pathname: string) {
  if (!pathname.startsWith("/katalog")) {
    return "";
  }

  const [, query = ""] = pathname.split("?", 2);
  return new URLSearchParams(query).get("q") ?? "";
}

export function BuyerTopNav({ currentPath = "", image, name, variant = "light", wishlistCount = 0 }: BuyerTopNavProps) {
  const pathname = currentPath;
  const isLuxury = variant === "luxury";
  const catalogSearchValue = getCatalogSearchValue(pathname);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b pt-[env(safe-area-inset-top)] backdrop-blur print:hidden",
        isLuxury
          ? "border-[#eadfcb] bg-white/[0.88] text-[#183f32] shadow-[0_18px_48px_rgba(74,54,24,0.06)]"
          : "border-black/5 bg-white/[0.92]"
      )}
    >
      <div className="container flex min-h-16 items-center justify-between gap-2 py-2.5 sm:gap-4 sm:py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4 lg:flex-none xl:gap-6">
          <Link
            aria-label={BRAND_NAME}
            className={cn(
              "group flex min-w-0 flex-1 items-center transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:flex-none",
              isLuxury ? "text-[#174e3b] hover:text-[#9b6f22]" : "text-primary hover:text-[#075f42]"
            )}
            href="/dashboard"
          >
            <BrandLockup
              markClassName={cn(
                "size-9 transition duration-500 group-hover:-translate-y-0.5 sm:size-10",
                isLuxury && "drop-shadow-[0_12px_24px_rgba(184,129,16,0.16)]"
              )}
              nameClassName="max-w-[10rem] text-[1.05rem] min-[390px]:max-w-[11.25rem] sm:max-w-none sm:text-[1.42rem]"
              tone={isLuxury ? "gold" : "default"}
            />
          </Link>
          <nav
            className={cn(
              "hidden items-center gap-1 rounded-full border p-1 lg:flex",
              isLuxury ? "border-[#eadfcb] bg-[#f7f1e6]" : "border-black/10 bg-[#f4f3ef]"
            )}
          >
            {buyerNav.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] xl:px-4",
                    isLuxury
                      ? active
                        ? "bg-white text-[#9b6f22] shadow-[0_16px_34px_-28px_rgba(74,54,24,0.42)]"
                        : "text-[#6e665b] hover:bg-white/72 hover:text-[#174e3b]"
                      : active
                        ? "bg-white text-primary shadow-[0_16px_34px_-28px_rgba(8,69,50,0.52)]"
                        : "text-black/58 hover:bg-white/72 hover:text-primary"
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
        <div className="flex min-w-0 shrink-0 items-center justify-end gap-1.5 sm:gap-3">
          <CatalogSearchInput
            defaultValue={catalogSearchValue}
            inputClassName={cn(
              "hidden w-72 lg:block xl:w-80",
              isLuxury &&
                "border-[#eadfcb] bg-white/[0.92] text-[#183f32] ring-[#eadfcb]/60 placeholder:text-[#8a8172]/72 focus-visible:border-[#d4af37]/35 focus-visible:ring-[#d4af37]/20"
            )}
            placeholder="Cari barang, unit, kategori..."
            submitLabel="Telusuri"
            wrapperClassName="hidden lg:block"
          />
          <AlertCenter className="shrink-0" scope="buyer" />
          <Link
            aria-label={
              wishlistCount > 0 ? `Wishlist, ${wishlistCount} barang disukai` : "Wishlist"
            }
            className={cn(
              "interactive-tap relative inline-flex size-10 shrink-0 items-center justify-center rounded-[1.15rem] border border-black/10 bg-white text-[#085a41] shadow-sm transition-[transform,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-[#eef6f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f7a57] sm:size-12 sm:rounded-2xl",
              isLuxury &&
                "border-[#eadfcb] bg-white/[0.82] text-[#8a661e] shadow-[0_14px_32px_rgba(74,54,24,0.08)] hover:bg-[#fff8ec] hover:text-[#17633f] focus-visible:ring-[#d4af37]/35",
              pathname === "/wishlist" &&
                (isLuxury
                  ? "bg-[#fff8ec] text-[#17633f] ring-1 ring-[#d4af37]/24"
                  : "bg-[#eef6f1] text-[#075f42] ring-1 ring-[#0f7a57]/16")
            )}
            href="/wishlist"
          >
            <Heart aria-hidden="true" className="size-5" />
            {wishlistCount > 0 ? (
              <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-[#d99900] px-1 text-[0.62rem] font-black leading-5 text-white shadow-[0_10px_22px_-14px_rgba(217,153,0,0.85)]">
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            ) : null}
          </Link>
          <BuyerProfileMenu className="max-w-[3.25rem] min-[390px]:max-w-[3.75rem] sm:max-w-none" image={image} name={name} profileHref="/profil" />
        </div>
      </div>
      <div className="container grid gap-3 pb-3 lg:hidden">
        <CatalogSearchInput
          defaultValue={catalogSearchValue}
          inputClassName={cn(
            "h-11 w-full text-sm",
            isLuxury &&
              "border-[#eadfcb] bg-white/[0.92] text-[#183f32] ring-[#eadfcb]/60 placeholder:text-[#8a8172]/72 focus-visible:border-[#d4af37]/35 focus-visible:ring-[#d4af37]/20"
          )}
          placeholder="Cari barang, unit, kategori..."
          submitLabel="Telusuri"
          wrapperClassName="w-full"
        />
        <nav
          aria-label="Navigasi mobile pembeli"
          className={cn(
            "grid grid-cols-2 gap-2 rounded-2xl border p-1 min-[520px]:grid-cols-5",
            isLuxury ? "border-[#eadfcb] bg-[#f7f1e6]" : "border-black/10 bg-[#f4f3ef]"
          )}
        >
          {buyerNav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                aria-label={`Buka ${item.label}`}
                className={cn(
                  "interactive-tap inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-2 text-xs font-black transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  isLuxury
                    ? active
                      ? "bg-white text-[#9b6f22] shadow-[0_12px_24px_-20px_rgba(74,54,24,0.34)]"
                      : "text-[#6e665b] hover:bg-white/72 hover:text-[#174e3b]"
                    : active
                      ? "bg-white text-primary shadow-[0_12px_24px_-20px_rgba(8,69,50,0.42)]"
                      : "text-black/58 hover:bg-white/72 hover:text-primary"
                )}
                href={item.href}
                key={item.href}
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
