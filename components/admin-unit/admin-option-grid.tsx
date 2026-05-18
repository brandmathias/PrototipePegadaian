"use client";

import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type AdminOptionGridProps = {
  label: string;
  name: string;
  onChange: (value: string) => void;
  options: Array<{
    value: string;
    label: string;
    description: string;
    icon: LucideIcon;
  }>;
  value: string;
};

export function AdminOptionGrid({
  label,
  name,
  onChange,
  options,
  value
}: AdminOptionGridProps) {
  return (
    <div className="space-y-3">
      <div className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-black/50 sm:text-xs">
        {label}
      </div>
      <input name={name} type="hidden" value={value} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" role="radiogroup" aria-label={label}>
        {options.map((option) => {
          const Icon = option.icon;
          const active = option.value === value;

          return (
            <button
              aria-checked={active}
              aria-label={option.label}
              className={cn(
                "group rounded-[1.35rem] border px-4 py-4 text-left transition duration-200",
                active
                  ? "border-[#0d6b4c]/30 bg-[linear-gradient(135deg,#eaf7f1_0%,#fffaf0_100%)] shadow-[0_14px_34px_-24px_rgba(13,107,76,0.28)]"
                  : "border-black/8 bg-[#fbfaf6] hover:border-[#d4b65f]/55 hover:bg-[#fffaf0]"
              )}
              key={option.value}
              onClick={() => onChange(option.value)}
              role="radio"
              type="button"
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-2xl border transition",
                    active
                      ? "border-[#0d6b4c]/20 bg-[#0d6b4c] text-white"
                      : "border-black/8 bg-white text-[#0d6b4c] group-hover:border-[#d4b65f]/55"
                  )}
                >
                  <Icon className="size-4.5" />
                </span>
                <div className="min-w-0">
                  <p className={cn("font-semibold", active ? "text-[#103b2d]" : "text-black/80")}>
                    {option.label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-black/55">{option.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
