import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type CompactTransactionProgressStep = {
  label: string;
  status: string;
  actor?: string | null;
  occurredAt?: string | null;
  icon: LucideIcon;
  tone: "done" | "current" | "failed" | "pending";
};

export function CompactTransactionProgress({
  density = "default",
  steps,
  title
}: {
  density?: "default" | "tight";
  steps: CompactTransactionProgressStep[];
  title: string;
}) {
  const failed = steps.some((step) => step.tone === "failed");
  const tight = density === "tight";

  return (
    <section
      className={cn(
        "rounded-xl border border-[#dfe7e2] bg-white shadow-[0_20px_46px_-40px_rgba(8,69,50,0.32)]",
        tight ? "px-3 py-2.5" : "px-4 py-4",
      )}
    >
      <p className={cn("font-black uppercase tracking-[0.04em] text-[#006747]", tight ? "text-[0.66rem]" : "text-[0.78rem]")}>
        {title}
      </p>
      <div className={cn("relative grid grid-cols-3 items-start px-1 text-center", tight ? "mt-3" : "mt-5")}>
        <span
          className={cn(
            "transaction-progress-line absolute left-[15%] right-[15%] h-px border-t border-dashed",
            tight ? "top-[1.15rem]" : "top-6",
            failed ? "border-[#fca5a5]" : "border-[#80cbae]"
          )}
        />
        {steps.map((step, index) => {
          const Icon = step.icon;

          return (
            <div
              className={cn("relative z-[1] grid min-w-0 justify-items-center px-1", tight ? "gap-1" : "gap-2")}
              key={`${step.label}-${index}`}
            >
              <span
                aria-label={`${step.label}: ${step.status}`}
                className={cn(
                  "transaction-progress-node grid place-items-center rounded-full border bg-white shadow-[0_14px_28px_-24px_rgba(8,69,50,0.35)]",
                  tight ? "size-9" : "size-12",
                  step.tone === "done" && "transaction-progress-node-done border-[#006747] bg-[#006747] text-white",
                  step.tone === "current" && "transaction-progress-node-current border-[#d7ad2f] text-[#006747]",
                  step.tone === "failed" && "transaction-progress-node-failed border-[#b91c1c] bg-[#b91c1c] text-white",
                  step.tone === "pending" && "border-[#dfe6e2] text-[#40558b]"
                )}
                role="img"
              >
                <Icon className={tight ? "size-4" : "size-5"} />
              </span>
              <span
                className={cn(
                  "grid place-items-center rounded-full font-black",
                  tight ? "size-3.5 text-[0.52rem]" : "size-4 text-[0.58rem]",
                  step.tone === "done" && "bg-[#006747] text-white",
                  step.tone === "current" && "bg-[#d7ad2f] text-[#3f3002]",
                  step.tone === "failed" && "bg-[#b91c1c] text-white",
                  step.tone === "pending" && "bg-[#eef2f0] text-[#40558b]"
                )}
              >
                {index + 1}
              </span>
              <div className={cn("min-w-0", tight ? "max-w-[7rem]" : "max-w-[8.5rem]")}>
                <p
                  className={cn(
                    "font-black",
                    tight ? "text-[0.58rem] leading-3" : "text-[0.66rem] leading-4",
                    step.tone === "failed" ? "text-[#991b1b]" : "text-[#006747]"
                  )}
                >
                  {step.label}
                </p>
                <p className={cn("font-bold text-[#6b7b73]", tight ? "mt-0.5 text-[0.54rem] leading-3" : "mt-1 text-[0.58rem] leading-3")}>
                  {step.status}
                </p>
                <p className={cn("font-mono font-semibold leading-3 text-[#40558b]", tight ? "mt-0.5 min-h-3 text-[0.5rem]" : "mt-1 min-h-6 text-[0.55rem]")}>
                  {step.occurredAt || "Belum terjadi"}
                </p>
                {step.actor && step.occurredAt ? (
                  <p className={cn("truncate font-black uppercase tracking-[0.08em] text-[#6b7b73]", tight ? "mt-0.5 text-[0.48rem]" : "mt-1 text-[0.54rem]")}>
                    {step.actor}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
