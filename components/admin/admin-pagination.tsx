"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { AdminSelect } from "@/components/admin/admin-select";
import { cn } from "@/lib/utils";

export const ADMIN_PAGE_SIZE_OPTIONS = [10, 50, 100] as const;

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

export function useAdminPagination<T>(items: T[], resetKey?: string | number) {
  const [pageSize, setPageSize] = useState<number>(ADMIN_PAGE_SIZE_OPTIONS[0]);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    setPageIndex(0);
  }, [items.length, pageSize, resetKey]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(pageIndex, totalPages - 1);
  const visibleItems = useMemo(
    () => items.slice(currentPage * pageSize, currentPage * pageSize + pageSize),
    [currentPage, items, pageSize]
  );

  return {
    currentPage,
    pageIndex: currentPage,
    pageSize,
    setPageIndex,
    setPageSize,
    totalItems: items.length,
    totalPages,
    visibleItems
  };
}

export function AdminPaginationFooter({
  className,
  itemLabel = "data",
  pageIndex,
  pageSize,
  totalItems,
  onPageIndexChange,
  onPageSizeChange
}: {
  className?: string;
  itemLabel?: string;
  pageIndex: number;
  pageSize: number;
  totalItems: number;
  onPageIndexChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(pageIndex, totalPages - 1);
  const pageStart = totalItems === 0 ? 0 : currentPage * pageSize + 1;
  const pageEnd = Math.min(totalItems, (currentPage + 1) * pageSize);
  const paginationItems = getPaginationItems(currentPage, totalPages);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t border-black/8 bg-[#fbfbf8] px-4 py-3 text-[0.72rem] text-black/50 dark:border-white/8 dark:bg-white/[0.03] dark:text-slate-400 lg:flex-row lg:items-center lg:justify-between",
        className
      )}
    >
      <p>
        Menampilkan <span className="font-semibold text-black/72 dark:text-slate-200">{pageStart}</span> sampai{" "}
        <span className="font-semibold text-black/72 dark:text-slate-200">{pageEnd}</span> dari{" "}
        <span className="font-semibold text-black/72 dark:text-slate-200">{totalItems}</span> {itemLabel}
      </p>

      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
        <label className="font-medium text-black/52 dark:text-slate-400" htmlFor={`pagination-size-${itemLabel}`}>
          Baris per halaman:
        </label>
        <AdminSelect
          ariaLabel={`Baris per halaman ${itemLabel}`}
          className="min-w-[6.9rem]"
          id={`pagination-size-${itemLabel}`}
          options={ADMIN_PAGE_SIZE_OPTIONS.map((size) => ({ value: size, label: String(size) }))}
          placement="top"
          size="compact"
          value={pageSize}
          onValueChange={(nextValue) => onPageSizeChange(Number(nextValue))}
        />

        <div className="ml-0 flex items-center gap-1 lg:ml-3">
          <button
            aria-label="Halaman sebelumnya"
            className="grid size-8 place-items-center rounded-xl text-black/42 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white hover:text-[#0a6a49] disabled:cursor-not-allowed disabled:opacity-35 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-emerald-200"
            disabled={currentPage === 0}
            type="button"
            onClick={() => onPageIndexChange(Math.max(0, currentPage - 1))}
          >
            <ChevronLeft className="size-4" />
          </button>

          {paginationItems.map((page) =>
            typeof page === "number" ? (
              <button
                aria-current={page === currentPage ? "page" : undefined}
                className={cn(
                  "grid size-8 place-items-center rounded-xl text-[0.72rem] font-semibold transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  page === currentPage
                    ? "border border-[#0a6a49]/15 bg-white text-[#0a6a49] shadow-[0_16px_30px_-26px_rgba(10,106,73,0.46),inset_0_1px_0_rgba(255,255,255,0.9)] dark:border-emerald-300/18 dark:bg-emerald-300/[0.08] dark:text-emerald-200 dark:shadow-[0_16px_30px_-24px_rgba(0,0,0,0.46)]"
                    : "text-black/52 hover:bg-white hover:text-[#0a6a49] dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-emerald-200"
                )}
                key={page}
                type="button"
                onClick={() => onPageIndexChange(page)}
              >
                {page + 1}
              </button>
            ) : (
              <span className="grid size-8 place-items-center text-black/32 dark:text-slate-500" key={page}>
                ...
              </span>
            )
          )}

          <button
            aria-label="Halaman berikutnya"
            className="grid size-8 place-items-center rounded-xl text-black/42 transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white hover:text-[#0a6a49] disabled:cursor-not-allowed disabled:opacity-35 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-emerald-200"
            disabled={currentPage >= totalPages - 1}
            type="button"
            onClick={() => onPageIndexChange(Math.min(totalPages - 1, currentPage + 1))}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
