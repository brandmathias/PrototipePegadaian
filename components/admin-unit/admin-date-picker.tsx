"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

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
  "Desember"
];

const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const viewportPadding = 12;

type CalendarPosition = {
  left: number;
  placement: "below" | "right";
  top: number;
};

type TimeValue = {
  hours: string;
  minutes: string;
  seconds: string;
};

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseIsoDate(value?: string) {
  if (!value) {
    return new Date();
  }

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return new Date();
  }

  return new Date(year, month - 1, day);
}

function addDays(value: string, days: number) {
  const date = parseIsoDate(value);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

function formatDisplayDate(value: string) {
  const date = parseIsoDate(value);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

export function AdminDatePicker({
  className,
  id,
  label,
  minDate,
  name,
  onChange,
  onTimeChange,
  placeholder,
  required,
  time,
  variant = "default",
  value
}: {
  className?: string;
  id?: string;
  label: string;
  minDate?: string;
  name?: string;
  onChange: (value: string) => void;
  onTimeChange?: (value: TimeValue) => void;
  placeholder?: string;
  required?: boolean;
  time?: TimeValue;
  variant?: "default" | "compact";
  value: string;
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const calendarRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<"day" | "monthYear">("day");
  const [calendarPosition, setCalendarPosition] = useState<CalendarPosition | null>(null);
  const isCompact = variant === "compact";
  const supportsTime = Boolean(time && onTimeChange);
  const selectedDate = parseIsoDate(value);
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );
  const min = minDate ? parseIsoDate(minDate) : null;
  const minTime = min ? new Date(min.getFullYear(), min.getMonth(), min.getDate()).getTime() : null;
  const todayIso = toIsoDate(new Date());
  const visibleYear = visibleMonth.getFullYear();
  const visibleMonthIndex = visibleMonth.getMonth();
  const displayValue = value ? formatDisplayDate(value) : placeholder ?? "Pilih tanggal";

  const calendarDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leadingBlankDays = firstDay.getDay();

    return [
      ...Array.from({ length: leadingBlankDays }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => new Date(year, month, index + 1))
    ];
  }, [visibleMonth]);

  const yearOptions = useMemo(
    () => Array.from({ length: 12 }, (_, index) => visibleYear - 5 + index),
    [visibleYear]
  );

  useEffect(() => {
    const parsed = parseIsoDate(value);
    setVisibleMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
  }, [value]);

  useEffect(() => {
    if (!isOpen) {
      setCalendarPosition(null);
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      const clickedTrigger = wrapperRef.current?.contains(target);
      const clickedCalendar = calendarRef.current?.contains(target);

      if (!clickedTrigger && !clickedCalendar) {
        setIsOpen(false);
        setPickerMode("day");
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setPickerMode("day");
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen || typeof window === "undefined") {
      return;
    }

    function updateCalendarPosition() {
      if (!wrapperRef.current) {
        return;
      }

      const rect = wrapperRef.current.getBoundingClientRect();
      const width = Math.min(isCompact ? 296 : 352, window.innerWidth - viewportPadding * 2);
      const estimatedHeight = (pickerMode === "monthYear" ? (isCompact ? 320 : 360) : (isCompact ? 390 : 430)) + (supportsTime ? 88 : 0);
      const sideGap = isCompact ? 72 : 16;
      const canOpenRight = window.innerWidth >= 768 && rect.right + sideGap + width <= window.innerWidth - viewportPadding;

      if (canOpenRight) {
        const idealTop = rect.top + rect.height / 2;
        const minTop = viewportPadding + estimatedHeight * 0.66;
        const maxTop = window.innerHeight - viewportPadding - estimatedHeight * 0.34;

        setCalendarPosition({
          left: rect.right + sideGap,
          placement: "right",
          top: Math.min(Math.max(idealTop, minTop), maxTop)
        });
        return;
      }

      setCalendarPosition({
        left: Math.min(
          Math.max(viewportPadding, rect.right - width),
          window.innerWidth - width - viewportPadding
        ),
        placement: "below",
        top: Math.min(rect.bottom + 8, window.innerHeight - viewportPadding)
      });
    }

    updateCalendarPosition();
    window.addEventListener("resize", updateCalendarPosition);
    window.addEventListener("scroll", updateCalendarPosition, true);

    return () => {
      window.removeEventListener("resize", updateCalendarPosition);
      window.removeEventListener("scroll", updateCalendarPosition, true);
    };
  }, [isCompact, isOpen, pickerMode, supportsTime]);

  function moveMonth(delta: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  function moveVisiblePeriod(delta: number) {
    if (pickerMode === "monthYear") {
      setVisibleMonth((current) => new Date(current.getFullYear() + delta, current.getMonth(), 1));
      return;
    }

    moveMonth(delta);
  }

  function selectVisibleMonth(monthIndex: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), monthIndex, 1));
    setPickerMode("day");
  }

  function selectVisibleYear(year: number) {
    setVisibleMonth((current) => new Date(year, current.getMonth(), 1));
  }

  function selectDate(date: Date) {
    onChange(toIsoDate(date));
    if (isCompact) {
      setIsOpen(false);
      setPickerMode("day");
    }
  }

  return (
    <div className={cn("relative", className)} ref={wrapperRef}>
      {name ? <input id={id} name={name} readOnly required={required} type="hidden" value={value} /> : null}
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={`${label}: ${displayValue}`}
        className={cn(
          "group flex w-full items-center justify-between gap-3 text-left transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none active:scale-[0.99]",
          isCompact
            ? "min-h-[3.15rem] rounded-xl border border-[#006747]/70 bg-white px-3 py-2.5 shadow-[0_10px_24px_-20px_rgba(0,103,71,0.32)] hover:-translate-y-0.5 hover:border-[#006747] hover:bg-white focus-visible:ring-4 focus-visible:ring-[#006747]/10"
            : "min-h-14 rounded-[1.15rem] border border-[#dfe8df] bg-[#fbfcf9] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_30px_-26px_rgba(0,103,71,0.28)] hover:-translate-y-0.5 hover:border-[#9dc8ad] hover:bg-white focus-visible:ring-4 focus-visible:ring-[#006747]/10"
        )}
        onClick={() => {
          setIsOpen((current) => !current);
          setPickerMode("day");
        }}
        type="button"
      >
        <span className="min-w-0">
          <span
            className={cn(
              "block font-black uppercase tracking-[0.16em]",
              isCompact ? "text-[0.56rem] text-[#006747]" : "text-[0.64rem] text-black/42"
            )}
          >
            {label}
          </span>
          <span
            className={cn(
              "mt-1 block truncate font-black",
              isCompact
                ? value
                  ? "text-[0.8rem] text-slate-800"
                  : "text-[0.8rem] text-slate-400"
                : "text-sm text-[#0a4f3c] sm:text-[0.95rem]"
            )}
          >
            {displayValue}
          </span>
        </span>
        <span
          className={cn(
            "grid shrink-0 place-items-center text-[#006747] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105",
            isCompact
              ? "size-8 rounded-lg bg-[#f4fbf7] group-hover:bg-[#e8f5ed]"
              : "size-10 rounded-full bg-[#eef7f1] group-hover:bg-[#e0f0e8]"
          )}
        >
          <CalendarDays className={cn(isCompact ? "size-3.5" : "size-4")} strokeWidth={1.8} />
        </span>
      </button>

      {isOpen && calendarPosition && typeof document !== "undefined" ? createPortal(
        <div
          aria-label={`Kalender ${label}`}
          data-placement={calendarPosition.placement}
          ref={calendarRef}
          style={{
            left: calendarPosition.left,
            top: calendarPosition.top
          }}
          className={cn(
            "fixed z-[160] w-[min(22rem,calc(100vw-2rem))] rounded-[1.7rem] border border-[#dcebe3] bg-white p-4 shadow-[0_30px_80px_-42px_rgba(0,70,48,0.38),0_8px_26px_-20px_rgba(0,0,0,0.18)] ring-1 ring-white/80 transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:p-5",
            calendarPosition.placement === "right" && "-translate-y-[66%]",
            isCompact && "sm:w-[18.5rem] sm:p-4"
          )}
          role="dialog"
        >
          <div className="flex items-center justify-between gap-4">
            <h3 className={cn("font-black tracking-[-0.01em] text-[#17251f]", isCompact ? "text-[1rem]" : "text-base")}>
              {supportsTime ? "Tanggal & waktu" : "Tanggal"}
            </h3>
            <button
              aria-label="Tutup kalender tanggal"
              className={cn(
                "grid place-items-center rounded-full text-black/72 transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#f3f6f2] hover:text-[#0a6a49] active:scale-95",
                isCompact ? "size-8" : "size-9"
              )}
              onClick={() => {
                setIsOpen(false);
                setPickerMode("day");
              }}
              type="button"
            >
              <X className="size-4.5" strokeWidth={1.8} />
            </button>
          </div>

          <div className={cn("flex items-center justify-between", isCompact ? "mt-4" : "mt-5")}>
            <button
              aria-label={pickerMode === "monthYear" ? "Tahun sebelumnya" : "Bulan sebelumnya"}
              className={cn(
                "grid place-items-center rounded-full text-[#006747] transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#eef7f1] active:scale-95",
                isCompact ? "size-8" : "size-9"
              )}
              onClick={() => moveVisiblePeriod(-1)}
              type="button"
            >
              <ChevronLeft className="size-4.5" strokeWidth={2} />
            </button>
            <button
              aria-label="Pilih bulan dan tahun"
              aria-pressed={pickerMode === "monthYear"}
              className={cn(
                "rounded-full px-4 text-center font-black tracking-[-0.01em] text-black/78 transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#f3f8f4] hover:text-[#006747] active:scale-[0.98]",
                isCompact ? "min-w-0 flex-1 py-1.5 text-[0.95rem]" : "min-w-40 py-2 text-base"
              )}
              onClick={() => setPickerMode((current) => (current === "day" ? "monthYear" : "day"))}
              type="button"
            >
              {monthNames[visibleMonthIndex]} {visibleYear}
            </button>
            <button
              aria-label={pickerMode === "monthYear" ? "Tahun berikutnya" : "Bulan berikutnya"}
              className={cn(
                "grid place-items-center rounded-full text-[#006747] transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#eef7f1] active:scale-95",
                isCompact ? "size-8" : "size-9"
              )}
              onClick={() => moveVisiblePeriod(1)}
              type="button"
            >
              <ChevronRight className="size-4.5" strokeWidth={2} />
            </button>
          </div>

          {pickerMode === "monthYear" ? (
            <div className={cn(isCompact ? "mt-4 space-y-3" : "mt-5 space-y-4")}>
              <div className={cn("grid grid-cols-3", isCompact ? "gap-1.5" : "gap-2")}>
                {monthNames.map((month, monthIndex) => {
                  const active = monthIndex === visibleMonthIndex;

                  return (
                    <button
                      aria-pressed={active}
                      className={cn(
                        "rounded-full text-xs font-black transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-95",
                        isCompact ? "h-9" : "h-10",
                        active
                          ? "bg-[#006747] text-white shadow-[0_14px_28px_-18px_rgba(0,103,71,0.72)]"
                          : "bg-[#f5f8f4] text-black/58 hover:bg-[#e7f2ea] hover:text-[#006747]"
                      )}
                      key={month}
                      onClick={() => selectVisibleMonth(monthIndex)}
                      type="button"
                    >
                      {month}
                    </button>
                  );
                })}
              </div>

              <div className={cn("grid grid-cols-4", isCompact ? "gap-1.5" : "gap-2")}>
                {yearOptions.map((year) => {
                  const active = year === visibleYear;

                  return (
                    <button
                      aria-pressed={active}
                      className={cn(
                        "rounded-full text-xs font-black transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-95",
                        isCompact ? "h-9" : "h-10",
                        active
                          ? "bg-[#d9b85d] text-[#1f2119] shadow-[0_14px_28px_-20px_rgba(145,111,24,0.6)]"
                          : "bg-white text-black/58 ring-1 ring-inset ring-[#e6ede6] hover:bg-[#f3f8f4] hover:text-[#006747]"
                      )}
                      key={year}
                      onClick={() => selectVisibleYear(year)}
                      type="button"
                    >
                      {year}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              <div
                className={cn(
                  "grid grid-cols-7 text-center font-black uppercase tracking-[0.08em] text-black/38",
                  isCompact ? "mt-4 gap-0.5 text-[0.62rem]" : "mt-5 gap-1 text-[0.67rem]"
                )}
              >
                {dayNames.map((day) => (
                  <div className="py-1" key={day}>{day}</div>
                ))}
              </div>

              <div className={cn("grid grid-cols-7", isCompact ? "mt-1.5 gap-0.5" : "mt-2 gap-1")}>
                {calendarDays.map((date, index) => {
                  if (!date) {
                    return <span aria-hidden="true" className="aspect-square" key={`blank-${index}`} />;
                  }

                  const isoDate = toIsoDate(date);
                  const isSelected = isoDate === value;
                  const isToday = isoDate === todayIso;
                  const isDisabled = minTime !== null && date.getTime() < minTime;

                  return (
                    <button
                      aria-pressed={isSelected}
                      className={cn(
                        "rounded-full font-bold transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-95",
                        isCompact ? "h-10 w-10 justify-self-center text-[0.95rem]" : "aspect-square text-sm",
                        isSelected
                          ? "bg-[#006747] text-white shadow-[0_12px_22px_-14px_rgba(0,103,71,0.78)]"
                          : isToday
                            ? "bg-[#eef7f1] text-[#006747] hover:bg-[#e0f0e8]"
                            : "text-black/54 hover:bg-[#eef7f1] hover:text-[#006747]",
                        isDisabled && "cursor-not-allowed bg-transparent text-black/18 hover:bg-transparent hover:text-black/18"
                      )}
                      disabled={isDisabled}
                      key={isoDate}
                      onClick={() => selectDate(date)}
                      type="button"
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {supportsTime && time && onTimeChange ? (
            <div className="mt-5 border-t border-[#e8f0ea] pt-4">
              <p className="text-[0.62rem] font-black uppercase tracking-[0.15em] text-[#527060]">Waktu jatuh tempo</p>
              <div className="mt-2.5 grid grid-cols-3 gap-2">
                {([
                  ["hours", "Jam", 23],
                  ["minutes", "Menit", 59],
                  ["seconds", "Detik", 59]
                ] as const).map(([key, label, max]) => (
                  <label className="block" key={key}>
                    <span className="mb-1 block text-[0.62rem] font-bold text-slate-500">{label}</span>
                    <input
                      aria-label={`${label} jatuh tempo`}
                      className="h-10 w-full rounded-xl border border-[#dcebe3] bg-[#f9fcfa] px-2 text-center text-sm font-bold tabular-nums text-[#164a37] outline-none transition-[border-color,box-shadow] duration-200 ease-out focus:border-[#006747] focus:ring-4 focus:ring-[#006747]/10"
                      inputMode="numeric"
                      max={max}
                      min={0}
                      onChange={(event) => onTimeChange({ ...time, [key]: event.target.value })}
                      type="number"
                      value={time[key]}
                    />
                  </label>
                ))}
              </div>
              <button
                aria-label="Atur 15 menit dari sekarang"
                className="mt-3 text-xs font-bold text-[#006747] underline decoration-[#006747]/30 underline-offset-4 transition hover:decoration-[#006747]"
                onClick={() => {
                  const deadline = new Date(Date.now() + 15 * 60_000);
                  onChange(toIsoDate(deadline));
                  onTimeChange({
                    hours: String(deadline.getHours()),
                    minutes: String(deadline.getMinutes()),
                    seconds: String(deadline.getSeconds())
                  });
                }}
                type="button"
              >
                Atur 15 menit dari sekarang
              </button>
            </div>
          ) : null}

          {isCompact ? null : (
            <button
              className="mt-6 h-12 w-full rounded-[1rem] bg-[#006747] text-sm font-black text-white shadow-[0_18px_38px_-22px_rgba(0,103,71,0.74)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-[#075c42] active:scale-[0.98]"
              onClick={() => {
                setIsOpen(false);
                setPickerMode("day");
              }}
              type="button"
            >
              Gunakan Tanggal
            </button>
          )}
        </div>,
        document.body
      ) : null}
    </div>
  );
}

export function getDateAfter(value: string, days: number) {
  return addDays(value, days);
}
