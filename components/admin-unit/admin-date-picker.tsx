"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";

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
  required,
  value
}: {
  className?: string;
  id?: string;
  label: string;
  minDate?: string;
  name?: string;
  onChange: (value: string) => void;
  required?: boolean;
  value: string;
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<"day" | "monthYear">("day");
  const selectedDate = parseIsoDate(value);
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );
  const min = minDate ? parseIsoDate(minDate) : null;
  const minTime = min ? new Date(min.getFullYear(), min.getMonth(), min.getDate()).getTime() : null;
  const todayIso = toIsoDate(new Date());
  const visibleYear = visibleMonth.getFullYear();
  const visibleMonthIndex = visibleMonth.getMonth();

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
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
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
  }

  return (
    <div className={cn("relative", className)} ref={wrapperRef}>
      {name ? <input id={id} name={name} readOnly required={required} type="hidden" value={value} /> : null}
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={`${label}: ${formatDisplayDate(value)}`}
        className="group flex min-h-14 w-full items-center justify-between gap-3 rounded-[1.15rem] border border-[#dfe8df] bg-[#fbfcf9] px-4 py-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_30px_-26px_rgba(0,103,71,0.28)] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-[#9dc8ad] hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#006747]/10 active:scale-[0.99]"
        onClick={() => {
          setIsOpen((current) => !current);
          setPickerMode("day");
        }}
        type="button"
      >
        <span className="min-w-0">
          <span className="block text-[0.64rem] font-black uppercase tracking-[0.16em] text-black/42">
            {label}
          </span>
          <span className="mt-1 block truncate text-sm font-black text-[#0a4f3c] sm:text-[0.95rem]">
            {formatDisplayDate(value)}
          </span>
        </span>
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#eef7f1] text-[#006747] transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105 group-hover:bg-[#e0f0e8]">
          <CalendarDays className="size-4" strokeWidth={1.8} />
        </span>
      </button>

      {isOpen ? (
        <div
          aria-label={`Kalender ${label}`}
          className="absolute left-0 top-[calc(100%+0.7rem)] z-30 w-[min(22rem,calc(100vw-2rem))] rounded-[1.7rem] border border-[#dcebe3] bg-white p-4 shadow-[0_30px_80px_-42px_rgba(0,70,48,0.38),0_8px_26px_-20px_rgba(0,0,0,0.18)] ring-1 ring-white/80 transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:p-5"
          role="dialog"
        >
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-base font-black tracking-[-0.01em] text-[#17251f]">Tanggal</h3>
            <button
              aria-label="Tutup kalender tanggal"
              className="grid size-9 place-items-center rounded-full text-black/72 transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#f3f6f2] hover:text-[#0a6a49] active:scale-95"
              onClick={() => {
                setIsOpen(false);
                setPickerMode("day");
              }}
              type="button"
            >
              <X className="size-4.5" strokeWidth={1.8} />
            </button>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <button
              aria-label={pickerMode === "monthYear" ? "Tahun sebelumnya" : "Bulan sebelumnya"}
              className="grid size-9 place-items-center rounded-full text-[#006747] transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#eef7f1] active:scale-95"
              onClick={() => moveVisiblePeriod(-1)}
              type="button"
            >
              <ChevronLeft className="size-4.5" strokeWidth={2} />
            </button>
            <button
              aria-label="Pilih bulan dan tahun"
              aria-pressed={pickerMode === "monthYear"}
              className="min-w-40 rounded-full px-4 py-2 text-center text-base font-black tracking-[-0.01em] text-black/78 transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#f3f8f4] hover:text-[#006747] active:scale-[0.98]"
              onClick={() => setPickerMode((current) => (current === "day" ? "monthYear" : "day"))}
              type="button"
            >
              {monthNames[visibleMonthIndex]} {visibleYear}
            </button>
            <button
              aria-label={pickerMode === "monthYear" ? "Tahun berikutnya" : "Bulan berikutnya"}
              className="grid size-9 place-items-center rounded-full text-[#006747] transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#eef7f1] active:scale-95"
              onClick={() => moveVisiblePeriod(1)}
              type="button"
            >
              <ChevronRight className="size-4.5" strokeWidth={2} />
            </button>
          </div>

          {pickerMode === "monthYear" ? (
            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {monthNames.map((month, monthIndex) => {
                  const active = monthIndex === visibleMonthIndex;

                  return (
                    <button
                      aria-pressed={active}
                      className={cn(
                        "h-10 rounded-full text-xs font-black transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-95",
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

              <div className="grid grid-cols-4 gap-2">
                {yearOptions.map((year) => {
                  const active = year === visibleYear;

                  return (
                    <button
                      aria-pressed={active}
                      className={cn(
                        "h-10 rounded-full text-xs font-black transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-95",
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
              <div className="mt-5 grid grid-cols-7 gap-1 text-center text-[0.67rem] font-black uppercase tracking-[0.08em] text-black/38">
                {dayNames.map((day) => (
                  <div className="py-1" key={day}>{day}</div>
                ))}
              </div>

              <div className="mt-2 grid grid-cols-7 gap-1">
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
                        "aspect-square rounded-full text-sm font-bold transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-95",
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
        </div>
      ) : null}
    </div>
  );
}

export function getDateAfter(value: string, days: number) {
  return addDays(value, days);
}
