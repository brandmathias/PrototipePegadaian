"use client";

import { AlertCircle, CheckCircle2, Info } from "lucide-react";

import { cn } from "@/lib/utils";

type InlineFeedbackProps = {
  title: string;
  description?: string | null;
  variant?: "success" | "error" | "info";
  className?: string;
};

function variantClasses(variant: NonNullable<InlineFeedbackProps["variant"]>) {
  if (variant === "success") {
    return {
      wrapper: "border-primary/15 bg-primary/[0.06]",
      icon: "bg-primary/12 text-primary"
    };
  }

  if (variant === "error") {
    return {
      wrapper: "border-destructive/15 bg-destructive/[0.05]",
      icon: "bg-destructive/12 text-destructive"
    };
  }

  return {
    wrapper: "border-accent/25 bg-accent/10",
    icon: "bg-accent/20 text-accent-foreground"
  };
}

export function InlineFeedback({
  title,
  description,
  variant = "info",
  className
}: InlineFeedbackProps) {
  const styles = variantClasses(variant);
  const Icon = variant === "success" ? CheckCircle2 : variant === "error" ? AlertCircle : Info;

  return (
    <div
      className={cn(
        "rounded-[1.15rem] border px-4 py-3.5 transition-all duration-300",
        styles.wrapper,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl", styles.icon)}>
          <Icon className="size-4" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {description ? <p className="text-sm leading-relaxed text-muted-foreground">{description}</p> : null}
        </div>
      </div>
    </div>
  );
}
