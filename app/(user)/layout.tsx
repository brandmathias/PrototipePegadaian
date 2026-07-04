import type { ReactNode } from "react";
import { unstable_cache } from "next/cache";

import { BuyerShell } from "@/components/layout/buyer-shell";
import { getAppPathFromRequestHeaders, requireBuyerSession } from "@/lib/auth/session";
import { getBuyerShellSummary } from "@/lib/services/buyer.service";

export const dynamic = "force-dynamic";

const getCachedBuyerShellSummary = unstable_cache(
  async (userId: string) => getBuyerShellSummary(userId),
  ["buyer-shell-summary"],
  {
    revalidate: 5,
    tags: ["buyer-shell"]
  }
);

function isBuyerReceiptRoute(path: string) {
  const pathname = path.split(/[?#]/, 1)[0] || path;

  return /^\/transaksi\/[^/]+\/nota\/?$/.test(pathname);
}

export default async function UserLayout({ children }: { children: ReactNode }) {
  const currentPath = await getAppPathFromRequestHeaders();
  const session = await requireBuyerSession(currentPath);

  if (isBuyerReceiptRoute(currentPath)) {
    return <>{children}</>;
  }

  const summary = await getCachedBuyerShellSummary(session.user.id);

  return (
    <BuyerShell
      buyer={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: "buyer",
        phoneNumber:
          "phoneNumber" in session.user && typeof session.user.phoneNumber === "string"
            ? session.user.phoneNumber
            : null
      }}
      currentPath={currentPath}
      description="Pantau pengajuan harga tetap, hasil Lelang Tertutup, status pembayaran, dan nota transaksi dalam satu area akun."
      summary={{
        image: summary.image,
        memberSince: summary.memberSince,
        wishlistCount: summary.wishlistCount,
        blacklist: {
          active: summary.blacklist.active,
          until: summary.blacklist.until
        }
      }}
      title="Akun Pembeli"
    >
      {children}
    </BuyerShell>
  );
}
