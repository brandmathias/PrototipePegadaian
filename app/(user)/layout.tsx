import type { ReactNode } from "react";

import { BuyerShell } from "@/components/layout/buyer-shell";
import { getAppPathFromRequestHeaders, requireBuyerSession } from "@/lib/auth/session";

export default async function UserLayout({ children }: { children: ReactNode }) {
  const currentPath = await getAppPathFromRequestHeaders();
  const session = await requireBuyerSession(currentPath);

  return (
    <BuyerShell
      buyer={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        phoneNumber:
          "phoneNumber" in session.user && typeof session.user.phoneNumber === "string"
            ? session.user.phoneNumber
            : null
      }}
      description="Pantau pengajuan fixed price, hasil lelang Vickrey, status pembayaran, dan nota transaksi dalam satu area akun."
      title="Akun Pembeli"
    >
      {children}
    </BuyerShell>
  );
}
