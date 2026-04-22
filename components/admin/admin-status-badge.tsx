"use client";

import { Badge } from "@/components/ui/badge";
import { type AdminStatus, getAdminStatusMeta } from "@/lib/admin";
import { cn } from "@/lib/utils";

export function AdminStatusBadge({
  status,
  className
}: {
  status: AdminStatus;
  className?: string;
}) {
  const meta = getAdminStatusMeta(status);

  return (
    <Badge
      className={cn(
        "rounded-full px-3 py-1 text-[11px] font-bold tracking-[0.12em]",
        meta.className,
        className
      )}
    >
      {meta.label}
    </Badge>
  );
}
