"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";

import { cn } from "@/lib/utils";

export type ReportRangeOption<TValue extends string = string> = {
  value: TValue;
  label: string;
  helper?: string;
};

export type ReportCustomRange = {
  startDate: string;
  endDate: string;
};

const monthNames = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function formatShortDate(value: string) {
  return parseIsoDate(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function buildCalendarDays(month: Date) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const leadingBlankDays = new Date(year, monthIndex, 1).getDay();

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(year, monthIndex, index + 1 - leadingBlankDays);

    return {
      date,
      isCurrentMonth: date.getMonth() === monthIndex,
    };
  });
}

function normalizeRange(startDate: string, endDate: string): ReportCustomRange {
  return startDate <= endDate
    ? { startDate, endDate }
    : { startDate: endDate, endDate: startDate };
}

export function ReportRangeDropdown<TValue extends string>({
  align = "right",
  ariaLabel = "Filter rentang waktu",
  buttonClassName,
  customRange,
  onApplyCustomRange,
  onChange,
  options,
  value,
}: {
  align?: "left" | "right";
  ariaLabel?: string;
  buttonClassName?: string;
  customRange?: ReportCustomRange | null;
  onApplyCustomRange?: (range: ReportCustomRange) => void;
  onChange: (value: TValue) => void;
  options: Array<ReportRangeOption<TValue>>;
  value: TValue | "custom";
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const todayIso = toIsoDate(new Date());
  const activeOption = options.find((option) => option.value === value);
  const displayLabel =
    value === "custom" && customRange
      ? `${formatShortDate(customRange.startDate)} - ${formatShortDate(customRange.endDate)}`
      : activeOption?.label ?? "Bulan Berlangsung";
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const source = customRange?.startDate ? parseIsoDate(customRange.startDate) : new Date();
    return new Date(source.getFullYear(), source.getMonth(), 1);
  });
  const [draftStart, setDraftStart] = useState(customRange?.startDate ?? todayIso);
  const [draftEnd, setDraftEnd] = useState(customRange?.endDate ?? todayIso);
  const visibleMonths = useMemo(
    () => [visibleMonth, new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1)],
    [visibleMonth],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function selectCustomDate(date: Date) {
    const nextDate = toIsoDate(date);
    if (!draftStart || (draftStart && draftEnd && draftStart !== draftEnd)) {
      setDraftStart(nextDate);
      setDraftEnd(nextDate);
      return;
    }

    const normalized = normalizeRange(draftStart, nextDate);
    setDraftStart(normalized.startDate);
    setDraftEnd(normalized.endDate);
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={`${ariaLabel}: ${displayLabel}`}
        className={cn(
          "inline-flex h-11 items-center justify-between gap-2 rounded-[1rem] border border-[#dce9df] bg-white px-3.5 text-left text-[0.78rem] font-black text-[#13211c] shadow-[0_14px_30px_-28px_rgba(8,69,50,0.32)] outline-none transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[#0a6a49]/30 hover:text-[#006747] focus-visible:border-[#0a6a49]/55 focus-visible:ring-4 focus-visible:ring-[#0a6a49]/14 active:scale-[0.98]",
          isOpen && "border-[#0a6a49]/60 bg-[#f3fbf6] text-[#06472e] ring-4 ring-[#0a6a49]/10",
          buttonClassName,
        )}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className="flex min-w-0 items-center gap-2">
          <CalendarDays className="size-4 shrink-0 text-[#0a6a49]" strokeWidth={1.8} />
          <span className="truncate">{displayLabel}</span>
        </span>
        <ChevronDown className={cn("size-4 shrink-0 transition duration-500", isOpen && "rotate-180")} />
      </button>

      {isOpen ? (
        <div
          aria-label={ariaLabel}
          className={cn(
            "absolute top-[calc(100%+0.6rem)] z-[95] grid w-[min(45rem,calc(100vw-2rem))] overflow-hidden rounded-[1.55rem] border border-[#dcebe3] bg-white shadow-[0_30px_80px_-42px_rgba(0,70,48,0.38),0_8px_26px_-20px_rgba(0,0,0,0.18)] ring-1 ring-white/80 transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:grid-cols-[13.25rem_minmax(0,1fr)]",
            align === "right" ? "right-0" : "left-0",
          )}
          role="dialog"
        >
          <div className="space-y-1 border-b border-[#edf2ef] bg-[#f8fbf8] p-3 sm:border-b-0 sm:border-r">
            <div className="flex items-center justify-between gap-2 px-1.5 py-1">
              <p className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-[#52655d]">
                Periode
              </p>
              <button
                aria-label="Tutup filter periode"
                className="grid size-7 place-items-center rounded-full text-[#53645d] transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white hover:text-[#006747] active:scale-95"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X className="size-3.5" strokeWidth={1.8} />
              </button>
            </div>
            {options.map((option) => {
              const active = value === option.value;

              return (
                <button
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-[0.76rem] font-bold outline-none transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:ring-2 focus-visible:ring-[#0a6a49]/14 active:scale-[0.99]",
                    active ? "bg-[#ecf8f1] text-[#006747]" : "text-[#334155] hover:bg-white",
                  )}
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  type="button"
                >
                  <span className="min-w-0">
                    <span className="block truncate">{option.label}</span>
                    {option.helper ? (
                      <span className="mt-0.5 block truncate text-[0.64rem] font-semibold text-[#718077]">
                        {option.helper}
                      </span>
                    ) : null}
                  </span>
                  {active ? <Check className="size-4 shrink-0" /> : null}
                </button>
              );
            })}
          </div>

          <div className="flex min-h-full flex-col p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3 border-b border-[#edf2ef] pb-3">
              <button
                aria-label="Bulan sebelumnya"
                className="grid size-9 place-items-center rounded-full text-[#006747] outline-none transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#eef7f1] active:scale-95"
                onClick={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
                type="button"
              >
                <ChevronLeft className="size-4.5" strokeWidth={2} />
              </button>
              <p className="font-black tracking-[-0.01em] text-[#17251f]">
                Rentang Kustom
              </p>
              <button
                aria-label="Bulan berikutnya"
                className="grid size-9 place-items-center rounded-full text-[#006747] outline-none transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#eef7f1] active:scale-95"
                onClick={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
                type="button"
              >
                <ChevronRight className="size-4.5" strokeWidth={2} />
              </button>
            </div>

            <div className="mt-5 grid flex-1 gap-7 md:grid-cols-2">
              {visibleMonths.map((month) => {
                const days = buildCalendarDays(month);

                return (
                  <div className="flex min-h-[18.25rem] flex-col" key={month.toISOString()}>
                    <p className="rounded-full px-3 py-1.5 text-center text-[0.86rem] font-black text-black/78">
                      {monthNames[month.getMonth()]} {month.getFullYear()}
                    </p>
                    <div className="mt-3 grid grid-cols-7 gap-x-1 text-center text-[0.62rem] font-black uppercase tracking-[0.08em] text-black/46">
                      {dayNames.map((day) => (
                        <span className="grid h-6 place-items-center" key={day}>{day}</span>
                      ))}
                    </div>
                    <div className="mt-1.5 grid flex-1 grid-cols-7 content-between gap-x-1 gap-y-1.5">
                      {days.map(({ date, isCurrentMonth }, index) => {
                        const isoDate = toIsoDate(date);
                        const inRange = isoDate >= draftStart && isoDate <= draftEnd;
                        const isEdge = isoDate === draftStart || isoDate === draftEnd;
                        const isToday = isoDate === todayIso;

                        if (!isCurrentMonth) {
                          return (
                            <span
                              aria-hidden="true"
                              className="mx-auto grid size-8 place-items-center rounded-full text-[0.8rem] font-bold text-black/16"
                              key={`${isoDate}-outside-${index}`}
                            >
                              {date.getDate()}
                            </span>
                          );
                        }

                        return (
                          <button
                            aria-pressed={inRange}
                            className={cn(
                              "mx-auto grid size-8 place-items-center rounded-full text-[0.8rem] font-bold transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#eef7f1] hover:text-[#006747] active:scale-95",
                              inRange && "bg-[#ecf8f1] text-[#006747]",
                              isToday && !inRange && "bg-[#f4fbf7] text-[#006747]",
                              isEdge && "bg-[#006747] text-white shadow-[0_12px_22px_-14px_rgba(0,103,71,0.78)] hover:bg-[#006747] hover:text-white",
                            )}
                            key={isoDate}
                            onClick={() => selectCustomDate(date)}
                            type="button"
                          >
                            {date.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-auto flex flex-col gap-3 border-t border-[#edf2ef] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[0.72rem] font-bold text-[#52655d]">
                Range: <span className="font-black text-[#13211c]">{formatShortDate(draftStart)} - {formatShortDate(draftEnd)}</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  className="h-10 rounded-[0.85rem] border border-[#dce9df] bg-white px-4 text-[0.75rem] font-black text-[#52655d] transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#f8fbf8] active:scale-[0.98]"
                  onClick={() => setIsOpen(false)}
                  type="button"
                >
                  Batal
                </button>
                <button
                  className="h-10 rounded-[0.85rem] bg-[#006747] px-4 text-[0.75rem] font-black text-white shadow-[0_16px_32px_-20px_rgba(0,103,71,0.72)] transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#075c42] active:scale-[0.98]"
                  onClick={() => {
                    onApplyCustomRange?.(normalizeRange(draftStart, draftEnd));
                    setIsOpen(false);
                  }}
                  type="button"
                >
                  Terapkan
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
