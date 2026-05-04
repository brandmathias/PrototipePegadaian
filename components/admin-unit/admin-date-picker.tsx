"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
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
  label,
  minDate,
  onChange,
  value
}: {
  label: string;
  minDate?: string;
  onChange: (value: string) => void;
  value: string;
}) {
  const selectedDate = parseIsoDate(value);
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );
  const min = minDate ? parseIsoDate(minDate) : null;
  const minTime = min ? new Date(min.getFullYear(), min.getMonth(), min.getDate()).getTime() : null;

  const calendarDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const start = new Date(year, month, 1 - firstDay.getDay());

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [visibleMonth]);

  function moveMonth(delta: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  function selectDate(date: Date) {
    onChange(toIsoDate(date));
  }

  function selectPreset(days: number) {
    const baseDate = minDate ?? toIsoDate(new Date());
    const nextDate = addDays(baseDate, days);
    onChange(nextDate);
    const parsed = parseIsoDate(nextDate);
    setVisibleMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
  }

  return (
    <div className="rounded-[1.25rem] border border-[#c7dbcf] bg-[#fbfdf9] p-4 shadow-[0_18px_50px_rgba(10,106,73,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-black/50 sm:text-xs">
            {label}
          </p>
          <div className="mt-2 flex items-center gap-2 text-base font-bold text-[#0a6a49]">
            <CalendarDays className="size-4" />
            {formatDisplayDate(value)}
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white p-1">
          <Button
            aria-label="Bulan sebelumnya"
            className="size-8 rounded-full"
            onClick={() => moveMonth(-1)}
            size="icon"
            type="button"
            variant="ghost"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-32 text-center text-sm font-semibold text-black/70">
            {monthNames[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
          </span>
          <Button
            aria-label="Bulan berikutnya"
            className="size-8 rounded-full"
            onClick={() => moveMonth(1)}
            size="icon"
            type="button"
            variant="ghost"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[0.68rem] font-bold uppercase tracking-[0.12em] text-black/45">
        {dayNames.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1">
        {calendarDays.map((date) => {
          const isoDate = toIsoDate(date);
          const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
          const isSelected = isoDate === value;
          const isDisabled = minTime !== null && date.getTime() < minTime;

          return (
            <button
              className={cn(
                "aspect-square rounded-xl text-sm font-semibold transition duration-150",
                isCurrentMonth ? "text-black/72" : "text-black/28",
                isSelected
                  ? "bg-[#0a6a49] text-white shadow-[0_8px_18px_rgba(10,106,73,0.24)]"
                  : "hover:bg-[#e7f4ec] hover:text-[#0a6a49]",
                isDisabled && "cursor-not-allowed text-black/20 hover:bg-transparent hover:text-black/20"
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

      <div className="mt-4 flex flex-wrap gap-2">
        {[14, 30, 60, 90].map((days) => (
          <Button
            className="h-9 rounded-full px-3 text-xs"
            key={days}
            onClick={() => selectPreset(days)}
            type="button"
            variant="secondary"
          >
            +{days} hari
          </Button>
        ))}
      </div>
    </div>
  );
}

export function getDateAfter(value: string, days: number) {
  return addDays(value, days);
}
