import type { ReactNode } from "react";

import { BuyerShell } from "@/components/layout/buyer-shell";
import { getAppPathFromRequestHeaders, requireBuyerSession } from "@/lib/auth/session";
import { getBuyerSummary } from "@/lib/services/buyer.service";

export default async function UserLayout({ children }: { children: ReactNode }) {
  const currentPath = await getAppPathFromRequestHeaders();
  const session = await requireBuyerSession(currentPath);
  const summary = await getBuyerSummary(session.user.id);

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
      description="Pantau pengajuan fixed price, hasil lelang Vickrey, status pembayaran, dan nota transaksi dalam satu area akun."
      summary={{
        memberSince: summary.memberSince,
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
