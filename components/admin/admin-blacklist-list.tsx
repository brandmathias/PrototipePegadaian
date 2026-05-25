"use client";

import Link from "next/link";

import { AdminPaginationFooter, useAdminPagination } from "@/components/admin/admin-pagination";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AdminBlacklistItem = Record<string, any>;

export function AdminBlacklistList({ entries }: { entries: AdminBlacklistItem[] }) {
  const pagination = useAdminPagination(entries, entries.map((entry) => entry.userId).join("|"));

  if (!entries.length) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-black/10 bg-white p-6 text-sm leading-7 text-black/55">
        Belum ada akun yang dibatasi di unit ini.
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-black/8 bg-white/55 shadow-[0_22px_70px_-60px_rgba(8,69,50,0.42)]">
      <div className="grid gap-5 p-4 lg:grid-cols-2 xl:grid-cols-3">
        {pagination.visibleItems.map((entry) => (
          <Card className="rounded-2xl border border-black/10" key={entry.userId}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-xl sm:text-[1.35rem]">{entry.name}</CardTitle>
                  <CardDescription className="mt-2 text-sm sm:text-base">
                    {entry.violations} pelanggaran - Unit {entry.unit}
                  </CardDescription>
                </div>
                <AdminStatusBadge status={entry.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-black/70 sm:text-base">
              <p>
                <span className="font-semibold text-black/80">Masa blokir:</span> {entry.until}
              </p>
              <p>{entry.activeAuctionRestriction}</p>
              <div className="flex flex-wrap gap-3">
                <Link href={`/admin/blacklist/${entry.userId}`}>
                  <Button className="rounded-2xl" variant="secondary">
                    Lihat detail
                  </Button>
                </Link>
                <Link href={`/admin/blacklist/${entry.userId}/perpanjang`}>
                  <Button className="rounded-2xl">Perpanjang masa blokir</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <AdminPaginationFooter
        itemLabel="akun"
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
        totalItems={pagination.totalItems}
        onPageIndexChange={pagination.setPageIndex}
        onPageSizeChange={pagination.setPageSize}
      />
    </section>
  );
}
