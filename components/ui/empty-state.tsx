"use client";

import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-[1.6rem] border border-dashed border-border/80 bg-surface-low/55 p-8 text-center",
        className
      )}
    >
      <div className="mx-auto flex size-14 items-center justify-center rounded-[1.35rem] bg-primary/[0.08] text-primary">
        <Icon className="size-6" />
      </div>
      <div className="mx-auto mt-4 max-w-md space-y-2">
        <p className="text-base font-semibold text-foreground">{title}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
