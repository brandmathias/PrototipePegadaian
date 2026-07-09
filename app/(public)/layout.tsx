import type { ReactNode } from "react";

import { PublicShell } from "@/components/layout/public-shell";
import { getRoleHomePath, isAuthRole } from "@/lib/auth/guards";
import { getServerSession } from "@/lib/auth/session";
import { getBuyerWishlistCount } from "@/lib/services/wishlist.service";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession();
  const role = isAuthRole(session?.user.role) ? session.user.role : null;
  const wishlistCount =
    session?.user && role === "buyer" ? await getBuyerWishlistCount(session.user.id).catch(() => 0) : 0;
  const viewer =
    session?.user && role
      ? {
          name: session.user.name?.trim() || "Pengguna",
          image: "image" in session.user && typeof session.user.image === "string" ? session.user.image : null,
          role,
          homeHref: getRoleHomePath(role),
          wishlistCount
        }
      : null;

  return <PublicShell viewer={viewer}>{children}</PublicShell>;
}
