"use client";

import Link from "next/link";
import { Clock3, LockKeyhole, Megaphone } from "lucide-react";
import { useState } from "react";

import { AdminLiveCountdown } from "@/components/admin/admin-live-countdown";
import { Button } from "@/components/ui/button";

function hasDeadlineElapsed(dueAt?: string | null) {
  if (!dueAt) {
    return true;
  }

  const deadline = new Date(dueAt).getTime();
  return !Number.isNaN(deadline) && deadline <= Date.now();
}

export function AdminMarketingAvailabilityAction({ dueAt, href }: { dueAt?: string | null; href: string }) {
  const [isAvailable, setIsAvailable] = useState(() => hasDeadlineElapsed(dueAt));

  if (isAvailable) {
    return (
      <Link href={href}>
        <Button className="h-[3.35rem] min-w-[10.75rem] rounded-[1.05rem] bg-[#006747] px-4 text-[0.92rem] font-semibold text-white shadow-none hover:bg-[#005238] sm:min-w-[11.5rem]" variant="default">
          <Megaphone className="size-4.5" />
          Pasarkan Barang
        </Button>
      </Link>
    );
  }

  return (
    <div aria-label="Menunggu jatuh tempo" className="flex min-h-[3.35rem] min-w-[10.75rem] items-center gap-2.5 rounded-[1.05rem] border border-amber-200/80 bg-amber-50 px-3.5 text-amber-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] sm:min-w-[14rem]">
      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
        <LockKeyhole aria-hidden="true" className="size-4" strokeWidth={1.9} />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1 text-[0.77rem] font-bold leading-4">
          <Clock3 aria-hidden="true" className="size-3.5" strokeWidth={1.9} />
          Menunggu jatuh tempo
        </span>
        <AdminLiveCountdown
          className="mt-0.5 block truncate text-[0.68rem] font-semibold tabular-nums text-amber-800/80"
          expiredLabel="Siap dipasarkan"
          fallbackLabel="Menunggu jatuh tempo"
          onExpired={() => setIsAvailable(true)}
          targetAt={dueAt}
        />
      </span>
    </div>
  );
}
