"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gavel, Grid2X2, Home, ReceiptText } from "lucide-react";

import { BuyerProfileMenu } from "@/components/layout/buyer-profile-menu";
import { CatalogSearchInput } from "@/components/shared/catalog-search-input";
import { AlertCenter } from "@/components/ui/alert-center";
import { cn } from "@/lib/utils";

type BuyerTopNavProps = {
  image?: string | null;
  name: string;
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

export function BuyerTopNav({ image, name }: BuyerTopNavProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/92 backdrop-blur print:hidden">
      <div className="container flex min-h-16 items-center justify-between gap-4 py-3">
        <div className="flex items-center gap-6">
          <Link
            className="group flex items-center gap-3 font-headline text-xl font-black tracking-tight text-primary transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-[#075f42]"
            href="/dashboard"
          >
            <span className="grid size-9 place-items-center rounded-full bg-primary text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition duration-500 group-hover:-translate-y-0.5 group-hover:bg-[#075f42]">
              <Gavel className="size-4" />
            </span>
            Pegadaian Lelang
          </Link>
          <nav className="hidden items-center gap-1 rounded-full border border-black/10 bg-[#f4f3ef] p-1 lg:flex">
            {buyerNav.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    active
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
        <div className="flex items-center gap-3">
          <CatalogSearchInput
            inputClassName="hidden w-72 lg:block xl:w-80"
            placeholder="Cari barang, unit, kategori..."
            submitLabel="Telusuri"
            wrapperClassName="hidden lg:block"
          />
          <AlertCenter className="shrink-0" scope="buyer" />
          <BuyerProfileMenu image={image} name={name} profileHref="/profil" />
        </div>
      </div>
    </header>
  );
}
