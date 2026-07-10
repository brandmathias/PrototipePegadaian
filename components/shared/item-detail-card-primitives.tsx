import type { ComponentType, ReactNode } from "react";

import { cn } from "@/lib/utils";

export function ItemDetailSectionHeading({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-5">
      <h3 className="shrink-0 font-headline text-[0.98rem] font-black uppercase tracking-[0.04em] text-[#111827]">
        {children}
      </h3>
      <span className="h-px flex-1 bg-[#16854d]/70" />
    </div>
  );
}

export function ItemDetailInfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-[0.95rem] border border-[#e7ece8] bg-white px-4 py-4 shadow-[0_18px_36px_-34px_rgba(8,69,50,0.24)]">
      <div className="flex items-center gap-4">
        <span className="grid size-9 shrink-0 place-items-center text-[#057a35]">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[0.76rem] font-semibold leading-4 text-[#667085]">
            {label}
          </p>
          <p className="mt-1.5 break-words text-[0.94rem] font-medium leading-5 text-[#111827]">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ItemDetailPriceFrame({
  label,
  testId,
  value,
}: {
  label: string;
  testId?: string;
  value: ReactNode;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-[0.72rem] border border-[#15965d] bg-white px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]"
      data-testid={testId}
    >
      <span className="pointer-events-none absolute left-2 top-2 size-6 border-l-2 border-t-2 border-[#057a35]" />
      <span className="pointer-events-none absolute right-2 top-2 size-6 border-r-2 border-t-2 border-[#057a35]" />
      <span className="pointer-events-none absolute bottom-2 left-2 size-6 border-b-2 border-l-2 border-[#057a35]" />
      <span className="pointer-events-none absolute bottom-2 right-2 size-6 border-b-2 border-r-2 border-[#057a35]" />
      <div className="relative flex min-h-[8.75rem] flex-col items-center justify-center">
        <div className="flex items-center justify-center gap-3 text-[0.82rem] font-black uppercase leading-none tracking-[0.2em] text-[#057a35]">
          <span className="h-px w-14 bg-[#16854d]/70" />
          <span className="whitespace-nowrap">{label}</span>
          <span className="h-px w-14 bg-[#16854d]/70" />
        </div>
        <p
          className={cn(
            "mt-5 text-center font-headline text-[2.85rem] font-black leading-none tracking-normal text-[#057a35]",
            "sm:text-[3.7rem] xl:text-[4.25rem]",
          )}
        >
          {value}
        </p>
        <span className="mt-4 flex items-center gap-2">
          <span className="h-px w-24 bg-[#16854d]/70" />
          <span className="size-2 rotate-45 border border-[#057a35]" />
          <span className="h-px w-24 bg-[#16854d]/70" />
        </span>
      </div>
    </div>
  );
}
