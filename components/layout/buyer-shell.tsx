import type { ReactNode } from "react";

import { BuyerTopNav } from "@/components/layout/buyer-top-nav";
import type { BuyerSessionUser } from "@/lib/auth/guards";
import { cn } from "@/lib/utils";
import { PageTransition } from "@/components/shared/page-transition";

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
  const isFocusedResultPage =
    typeof currentPath === "string" &&
    (/\/transaksi\/[^/]+\/pemenang\/?$/.test(currentPath) ||
      /\/riwayat-bid\/[^/]+\/bukan-pemenang\/?$/.test(currentPath));

  return (
    <div
      className={cn(
        "app-responsive-shell buyer-experience-root min-h-dvh bg-white"
      )}
    >
      <BuyerTopNav
        currentPath={currentPath}
        image={summary.image}
        name={buyer.name}
        wishlistCount={summary.wishlistCount}
      />

      <main
        className={cn(
          "buyer-motion-main",
          isFocusedResultPage ? "container py-0 print:py-0" : "container py-8 md:py-10 print:py-0"
        )}
      >
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
