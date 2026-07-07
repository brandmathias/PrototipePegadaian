import { Check, X, Circle, type LucideIcon } from "lucide-react";

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
        "rounded-xl border border-[#dfe7e2] bg-white shadow-[0_20px_46px_-40px_rgba(8,69,50,0.32)] flex flex-col justify-between h-full",
        tight ? "px-4 py-3" : "px-5 py-5",
      )}
    >
      <p className={cn("font-black uppercase tracking-[0.04em] text-[#006747] shrink-0", tight ? "text-[0.72rem]" : "text-[0.82rem]")}>
        {title}
      </p>
      <div className={cn("relative flex-1 flex items-center justify-center w-full", tight ? "mt-3.5" : "mt-5")}>
        <div className="relative grid grid-cols-3 items-start px-1 text-center w-full">
          <span
            className={cn(
              "transaction-progress-line absolute left-[15%] right-[15%] h-px border-t-2 border-dashed",
              tight ? "top-[1.375rem]" : "top-[1.75rem]",
              failed ? "border-red-400" : "border-[#80cbae]"
            )}
          />
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div
                className={cn("relative z-[1] grid min-w-0 justify-items-center px-1", tight ? "gap-1.5" : "gap-2.5")}
                key={`${step.label}-${index}`}
              >
                <span
                  aria-label={`${step.label}: ${step.status}`}
                  className={cn(
                    "transaction-progress-node grid place-items-center rounded-full border bg-white shadow-[0_14px_28px_-24px_rgba(8,69,50,0.35)]",
                    tight ? "size-11" : "size-14",
                    step.tone === "done" && "transaction-progress-node-done border-[#006747] bg-[#006747] text-white",
                    step.tone === "current" && "transaction-progress-node-current border-[#d7ad2f] text-[#006747]",
                    step.tone === "failed" && "transaction-progress-node-failed border-[#b91c1c] bg-[#b91c1c] text-white",
                    step.tone === "pending" && "border-[#dfe6e2] text-[#40558b]"
                  )}
                  role="img"
                >
                  <Icon className={tight ? "size-5" : "size-6"} />
                </span>
                <span
                  className={cn(
                    "grid place-items-center rounded-full",
                    step.tone === "done" && "text-[#006747]",
                    step.tone === "current" && "text-[#d7ad2f]",
                    step.tone === "failed" && "text-[#b91c1c]",
                    step.tone === "pending" && "text-[#b0c2b8]"
                  )}
                >
                  {step.tone === "done" && <Check className="size-4" strokeWidth={3.5} />}
                  {step.tone === "failed" && <X className="size-4" strokeWidth={3.5} />}
                  {step.tone === "pending" && <Circle className="size-2.5 fill-current" />}
                  {step.tone === "current" && <Circle className="size-2.5 fill-current" />}
                </span>
                <div className={cn("min-w-0", tight ? "max-w-[8rem]" : "max-w-[9.5rem]")}>
                  <p
                    className={cn(
                      "font-black",
                      tight ? "text-[0.72rem] leading-3.5" : "text-[0.78rem] leading-4",
                      step.tone === "failed" ? "text-[#991b1b]" : "text-[#006747]"
                    )}
                  >
                    {step.label}
                  </p>
                  <p className={cn("font-bold text-[#6b7b73]", tight ? "mt-0.5 text-[0.66rem] leading-3.5" : "mt-1 text-[0.72rem] leading-4")}>
                    {step.status}
                  </p>
                  <p className={cn("font-mono font-semibold leading-3.5 text-[#40558b]", tight ? "mt-0.5 min-h-3.5 text-[0.6rem]" : "mt-1 min-h-6 text-[0.66rem]")}>
                    {step.occurredAt || "Belum terjadi"}
                  </p>
                  {step.actor && step.occurredAt ? (
                    <p className={cn("truncate font-black uppercase tracking-[0.08em] text-[#6b7b73]", tight ? "mt-0.5 text-[0.58rem]" : "mt-1 text-[0.62rem]")}>
                      {step.actor}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
