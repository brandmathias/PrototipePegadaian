import type { ReactNode } from "react";

import { BuyerTopNav } from "@/components/layout/buyer-top-nav";
import type { BuyerSessionUser } from "@/lib/auth/guards";

type BuyerShellProps = {
  buyer: BuyerSessionUser;
  children: ReactNode;
  currentPath?: string;
  title: string;
  description: string;
  summary: {
    memberSince: string;
    image?: string | null;
    wishlistCount?: number;
    blacklist: {
      active: boolean;
      until: string;
      reason?: string;
      violations?: number;
    };
  };
};

export function BuyerShell({
  buyer,
  children,
  currentPath,
  summary,
}: BuyerShellProps) {
  const isAuctionWinnerPage =
    typeof currentPath === "string" && /\/transaksi\/[^/]+\/pemenang\/?$/.test(currentPath);

  return (
    <div
      className={
        isAuctionWinnerPage
          ? "min-h-screen bg-white"
          : "min-h-screen bg-[linear-gradient(180deg,#fbfaf6_0%,#f4f1e8_100%)]"
      }
    >
      <BuyerTopNav image={summary.image} name={buyer.name} wishlistCount={summary.wishlistCount} />

      <main
        className={
          isAuctionWinnerPage
            ? "container py-0 print:py-0"
            : "container py-8 md:py-10 print:py-0"
        }
      >
        {children}
      </main>
    </div>
  );
}
