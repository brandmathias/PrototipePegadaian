"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export const VICKREY_BID_PAGE_SIZE = 5;

function getPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index);
  }

  const items: Array<number | "ellipsis-start" | "ellipsis-end"> = [0];
  const nearStart = currentPage <= 3;
  const nearEnd = currentPage >= totalPages - 4;
  const start = nearStart ? 1 : nearEnd ? totalPages - 5 : currentPage - 1;
  const end = nearStart ? 4 : nearEnd ? totalPages - 2 : currentPage + 1;

  if (start > 1) {
    items.push("ellipsis-start");
  }

  for (let page = start; page <= end; page += 1) {
    items.push(page);
  }

  if (end < totalPages - 2) {
    items.push("ellipsis-end");
  }

  items.push(totalPages - 1);
  return items;
}

export function useVickreyBidPagination<T>(items: T[], resetKey?: string | number) {
  const [pageIndex, setPageIndex] = useState(0);
  const totalPages = Math.max(1, Math.ceil(items.length / VICKREY_BID_PAGE_SIZE));
  const currentPage = Math.min(pageIndex, totalPages - 1);

  useEffect(() => {
    setPageIndex(0);
  }, [items.length, resetKey]);

  const visibleItems = useMemo(
    () =>
      items.slice(
        currentPage * VICKREY_BID_PAGE_SIZE,
        currentPage * VICKREY_BID_PAGE_SIZE + VICKREY_BID_PAGE_SIZE,
      ),
    [currentPage, items],
  );

  return {
    currentPage,
    pageIndex: currentPage,
    setPageIndex,
    totalItems: items.length,
    totalPages,
    visibleItems,
  };
}

export function VickreyBidPaginationFooter({
  className,
  pageIndex,
  totalItems,
  onPageIndexChange,
}: {
  className?: string;
  pageIndex: number;
  totalItems: number;
  onPageIndexChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / VICKREY_BID_PAGE_SIZE));
  const currentPage = Math.min(pageIndex, totalPages - 1);
  const pageStart = totalItems === 0 ? 0 : currentPage * VICKREY_BID_PAGE_SIZE + 1;
  const pageEnd = Math.min(totalItems, (currentPage + 1) * VICKREY_BID_PAGE_SIZE);
  const paginationItems = getPaginationItems(currentPage, totalPages);

  return (
    <div
      className={cn(
        "flex flex-col gap-2 border-t border-[#edf2ee] bg-[#fbfcfa] px-4 py-2.5 text-[0.68rem] font-semibold text-[#64756e] sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
      data-testid="vickrey-bid-pagination"
    >
      <p>
        Menampilkan {pageStart} sampai {pageEnd} dari {totalItems} penawaran
      </p>

      {totalPages > 1 ? (
        <div className="flex items-center gap-1 self-end sm:self-auto">
          <button
            aria-label="Halaman penawaran sebelumnya"
            className="grid size-7 place-items-center rounded-lg text-[#64756e] transition-colors hover:bg-white hover:text-[#007a53] disabled:cursor-not-allowed disabled:opacity-35"
            disabled={currentPage === 0}
            onClick={() => onPageIndexChange(Math.max(0, currentPage - 1))}
            type="button"
          >
            <ChevronLeft className="size-3.5" />
          </button>

          {paginationItems.map((page) =>
            typeof page === "number" ? (
              <button
                aria-current={page === currentPage ? "page" : undefined}
                className={cn(
                  "grid size-7 place-items-center rounded-lg text-[0.68rem] font-black tabular-nums transition-colors",
                  page === currentPage
                    ? "bg-[#007a53] text-white shadow-[0_10px_20px_-14px_rgba(0,122,83,0.7)]"
                    : "text-[#64756e] hover:bg-white hover:text-[#007a53]",
                )}
                key={page}
                onClick={() => onPageIndexChange(page)}
                type="button"
              >
                {page + 1}
              </button>
            ) : (
              <span
                className="grid size-7 place-items-center text-[#9aa8a1]"
                key={page}
              >
                …
              </span>
            ),
          )}

          <button
            aria-label="Halaman penawaran berikutnya"
            className="grid size-7 place-items-center rounded-lg text-[#64756e] transition-colors hover:bg-white hover:text-[#007a53] disabled:cursor-not-allowed disabled:opacity-35"
            disabled={currentPage >= totalPages - 1}
            onClick={() =>
              onPageIndexChange(Math.min(totalPages - 1, currentPage + 1))
            }
            type="button"
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
