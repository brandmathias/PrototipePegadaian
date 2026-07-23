"use client";

import Link from "next/link";
import { Megaphone } from "lucide-react";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    if (isAvailable || !dueAt) {
      return;
    }

    const deadline = new Date(dueAt).getTime();
    if (Number.isNaN(deadline)) {
      return;
    }

    let timer: ReturnType<typeof setTimeout>;
    const activateWhenDue = () => {
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        setIsAvailable(true);
        return;
      }

      timer = setTimeout(activateWhenDue, Math.min(remaining, 2_147_483_647));
    };

    activateWhenDue();
    return () => clearTimeout(timer);
  }, [dueAt, isAvailable]);

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
    <Button
      className="h-[3.35rem] min-w-[10.75rem] rounded-[1.05rem] border border-[#d7ded5] bg-[#eef3ed] px-4 text-[0.92rem] font-semibold text-[#718077] shadow-none disabled:cursor-not-allowed disabled:opacity-100 sm:min-w-[11.5rem]"
      disabled
      title="Barang dapat dipasarkan setelah jatuh tempo"
      type="button"
      variant="default"
    >
      <Megaphone className="size-4.5" />
      Pasarkan Barang
    </Button>
  );
}
