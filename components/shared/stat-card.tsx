import { ArrowUpRight } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  detail?: string;
  accent?: "primary" | "secondary" | "danger" | "neutral";
};

const accentStyles = {
  primary: "border-b-4 border-primary",
  secondary: "border-b-4 border-accent",
  danger: "border-b-4 border-tertiary-container",
  neutral: "border-b-4 border-surface-highest"
};

export function StatCard({
  label,
  value,
  detail,
  accent = "primary"
}: StatCardProps) {
  return (
    <Card className={cn("p-6", accentStyles[accent])}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="font-headline text-3xl font-extrabold tracking-tight text-foreground">
            {value}
          </p>
        </div>
        <div className="rounded-full bg-surface-low p-2 text-primary">
          <ArrowUpRight className="size-4" />
        </div>
      </div>
      {detail ? <p className="mt-4 text-xs text-muted-foreground">{detail}</p> : null}
    </Card>
  );
}
