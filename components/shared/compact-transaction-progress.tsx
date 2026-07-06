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
  steps,
  title
}: {
  steps: CompactTransactionProgressStep[];
  title: string;
}) {
  const failed = steps.some((step) => step.tone === "failed");

  return (
    <section className="rounded-xl border border-[#dfe7e2] bg-white px-4 py-4 shadow-[0_20px_46px_-40px_rgba(8,69,50,0.32)]">
      <p className="text-[0.78rem] font-black uppercase tracking-[0.04em] text-[#006747]">
        {title}
      </p>
      <div className="relative mt-5 grid grid-cols-3 items-start px-1 text-center">
        <span
          className={cn(
            "transaction-progress-line absolute left-[15%] right-[15%] top-6 h-px border-t border-dashed",
            failed ? "border-[#fca5a5]" : "border-[#80cbae]"
          )}
        />
        {steps.map((step, index) => {
          const Icon = step.icon;

          return (
            <div className="relative z-[1] grid min-w-0 justify-items-center gap-2 px-1" key={`${step.label}-${index}`}>
              <span
                aria-label={`${step.label}: ${step.status}`}
                className={cn(
                  "transaction-progress-node grid size-12 place-items-center rounded-full border bg-white shadow-[0_14px_28px_-24px_rgba(8,69,50,0.35)]",
                  step.tone === "done" && "transaction-progress-node-done border-[#006747] bg-[#006747] text-white",
                  step.tone === "current" && "transaction-progress-node-current border-[#d7ad2f] text-[#006747]",
                  step.tone === "failed" && "transaction-progress-node-failed border-[#b91c1c] bg-[#b91c1c] text-white",
                  step.tone === "pending" && "border-[#dfe6e2] text-[#40558b]"
                )}
                role="img"
              >
                <Icon className="size-5" />
              </span>
              <span
                className={cn(
                  "grid size-4 place-items-center rounded-full text-[0.58rem] font-black",
                  step.tone === "done" && "bg-[#006747] text-white",
                  step.tone === "current" && "bg-[#d7ad2f] text-[#3f3002]",
                  step.tone === "failed" && "bg-[#b91c1c] text-white",
                  step.tone === "pending" && "bg-[#eef2f0] text-[#40558b]"
                )}
              >
                {index + 1}
              </span>
              <div className="min-w-0 max-w-[8.5rem]">
                <p
                  className={cn(
                    "text-[0.66rem] font-black leading-4",
                    step.tone === "failed" ? "text-[#991b1b]" : "text-[#006747]"
                  )}
                >
                  {step.label}
                </p>
                <p className="mt-1 text-[0.58rem] font-bold leading-3 text-[#6b7b73]">
                  {step.status}
                </p>
                <p className="mt-1 min-h-6 font-mono text-[0.55rem] font-semibold leading-3 text-[#40558b]">
                  {step.occurredAt || "Belum terjadi"}
                </p>
                {step.actor && step.occurredAt ? (
                  <p className="mt-1 truncate text-[0.54rem] font-black uppercase tracking-[0.08em] text-[#6b7b73]">
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
