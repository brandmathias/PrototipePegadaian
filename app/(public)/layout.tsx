import type { ReactNode } from "react";

import { PublicShell } from "@/components/layout/public-shell";
import { getRoleHomePath, isAuthRole } from "@/lib/auth/guards";
import { getServerSession } from "@/lib/auth/session";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession();
  const role = isAuthRole(session?.user.role) ? session.user.role : null;
  const viewer =
    session?.user && role
      ? {
          name: session.user.name,
          role,
          homeHref: getRoleHomePath(role)
        }
      : null;

  return <PublicShell viewer={viewer}>{children}</PublicShell>;
}
