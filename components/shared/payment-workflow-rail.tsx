import type { ComponentType } from "react";
import { CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

export type PaymentWorkflowStep = {
  id: string;
  label: string;
  headline?: string;
  detail: string;
  meta?: string;
  icon: ComponentType<{ className?: string }>;
  tone?: "default" | "danger";
};

type PaymentWorkflowRailProps = {
  steps: PaymentWorkflowStep[];
  currentStep: number;
  completed?: boolean;
  title?: string;
  description?: string;
  className?: string;
  compact?: boolean;
  tone?: "buyer" | "admin";
};

export function PaymentWorkflowRail({
  steps,
  currentStep,
  completed = false,
  title = "Alur Pembayaran",
  description,
  className,
  compact = false,
  tone = "buyer"
}: PaymentWorkflowRailProps) {
  const boundedStep = Math.min(Math.max(currentStep, 0), Math.max(steps.length - 1, 0));
  const activeStep = steps[boundedStep];
  const progress =
    steps.length <= 1 ? 100 : completed ? 100 : (boundedStep / (steps.length - 1)) * 100;
  const accentClass = tone === "admin" ? "text-[#0a6a49]" : "text-primary";
  const hasDangerActiveStep = activeStep?.tone === "danger" && !completed;
  const activeBadge = completed ? "Workflow selesai" : "Posisi sekarang";
  const progressWidth = steps.length <= 1 ? "100%" : `${progress}%`;

  return (
    <section
      className={cn(
        "payment-flow-shell relative overflow-hidden rounded-[1.75rem] border border-[#d8ded5] bg-white shadow-[0_18px_48px_-38px_rgba(10,74,51,0.38)]",
        compact ? "px-4 py-5" : "px-5 py-6 md:px-7 md:py-7",
        className
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-1",
          hasDangerActiveStep
            ? "bg-[linear-gradient(90deg,#0a6a49_0%,#dc2626_58%,#f59e0b_100%)]"
            : "bg-[linear-gradient(90deg,#0a6a49_0%,#20b96b_58%,#d7ad2f_100%)]"
        )}
      />

      <div className="relative space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className={cn("text-[0.68rem] font-black uppercase tracking-[0.22em]", accentClass)}>
              {title}
            </p>
            <h3 className={cn("mt-2 font-headline font-black tracking-tight text-black/88", compact ? "text-xl" : "text-2xl")}>
              {activeStep?.headline ?? activeStep?.label ?? title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-black/60">
              {activeStep?.detail ?? description}
            </p>
          </div>
          <div className="rounded-full border border-[#d8ded5] bg-[#f8faf7] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-black/58">
            {activeBadge} | Tahap {completed ? steps.length : boundedStep + 1} dari {steps.length}
          </div>
        </div>

        <div className="relative">
          <div className="absolute left-[calc(100%/6)] right-[calc(100%/6)] top-[2.95rem] hidden h-1.5 overflow-hidden rounded-full bg-[#e3e8df] md:block">
            <div
              className={cn(
                "payment-flow-progress h-full rounded-full transition-[width] duration-700 ease-out",
                hasDangerActiveStep
                  ? "bg-[linear-gradient(90deg,#22b95f_0%,#dc2626_76%,#f59e0b_100%)]"
                  : "bg-[linear-gradient(90deg,#22b95f_0%,#20b96b_58%,#d7ad2f_100%)]"
              )}
              style={{ width: progressWidth }}
            />
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {steps.map((step, index) => (
              <WorkflowNode
                compact={compact}
                completed={completed || index < boundedStep}
                active={!completed && index === boundedStep}
                key={step.id}
                step={step}
              />
            ))}
          </div>
        </div>

        {description ? (
          <div className="rounded-[1.25rem] border border-[#e6ddbc] bg-[#fffaf0] px-4 py-3 text-xs font-semibold leading-5 text-[#735a0f]">
            {description}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function WorkflowNode({
  step,
  active,
  completed,
  compact
}: {
  step: PaymentWorkflowStep;
  active: boolean;
  completed: boolean;
  compact?: boolean;
}) {
  const Icon = step.icon;
  const danger = step.tone === "danger";
  const detailClassName = cn(
    "mt-3 rounded-[1rem] border px-3 py-2.5 text-xs font-medium leading-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.76)]",
    completed && "border-[#c9e6d3] bg-[#f0faf4] text-[#174633]",
    active && !danger && "border-[#e5cf78] bg-[#fff8df] text-[#56410b]",
    active && danger && "border-[#fecaca] bg-[#fff1f2] text-[#7f1d1d]",
    !active && !completed && "border-[#e0e5dc] bg-[#f8faf7] text-black/58"
  );

  return (
    <div aria-current={active ? "step" : undefined} className="relative text-center">
      <div className="relative mx-auto grid size-24 place-items-center md:size-[6.25rem]">
        {active ? (
          <>
            <span className={cn("status-pulse absolute inset-3 rounded-full", danger ? "bg-[#dc2626]/18" : "bg-[#d7ad2f]/30")} />
            <span className={cn("absolute inset-1 rounded-full border", danger ? "border-[#dc2626]/35" : "border-[#d7ad2f]/45")} />
          </>
        ) : null}
        <span
          className={cn(
            "relative z-10 grid size-[4.6rem] place-items-center rounded-full border-[5px] bg-white transition duration-500 md:size-20",
            completed && "border-[#22b95f] text-[#0a6a49] shadow-[0_16px_34px_-24px_rgba(10,106,73,0.65)]",
            active && !danger && "border-[#d7ad2f] text-[#0a6a49] shadow-[0_18px_38px_-22px_rgba(215,173,47,0.78)]",
            active && danger && "border-[#dc2626] text-[#b91c1c] shadow-[0_18px_38px_-22px_rgba(220,38,38,0.46)]",
            !active && !completed && "border-[#cfd8cf] text-black/34"
          )}
        >
          <Icon className="size-8" />
        </span>
        {completed ? (
          <span className="absolute right-3 top-3 z-20 grid size-7 place-items-center rounded-full border-2 border-white bg-[#22b95f] text-white shadow-[0_10px_18px_-10px_rgba(10,106,73,0.72)]">
            <CheckCircle2 className="size-4" />
          </span>
        ) : null}
        {active ? (
          <span
            className={cn(
              "absolute -bottom-1 z-20 rounded-full px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.14em] shadow-[0_10px_20px_-14px_rgba(85,60,0,0.8)]",
              danger ? "bg-[#dc2626] text-white" : "bg-[#ffd45a] text-[#3f3002]"
            )}
          >
            {danger ? "Gagal" : "Berjalan"}
          </span>
        ) : null}
      </div>

      <div className={cn("mx-auto mt-4", compact ? "max-w-[13rem]" : "max-w-[15rem]")}>
        <p
          className={cn(
            "text-base font-semibold leading-6 text-black/86 md:text-lg",
            active && !danger && "text-[#0a6a49]",
            active && danger && "text-[#b91c1c]",
            completed && "text-[#0a6a49]"
          )}
        >
          {step.label}
        </p>
        {step.meta ? (
          <p className={cn("mt-1 text-xs font-semibold uppercase tracking-[0.14em]", active && danger ? "text-[#b91c1c]/72" : "text-[#0a6a49]/70")}>
            {step.meta}
          </p>
        ) : null}
        <p className={detailClassName}>{step.detail}</p>
      </div>

      <div className="mx-auto mt-5 h-8 w-1 rounded-full bg-[#e3e8df] md:hidden">
        <div
          className={cn(
            "mx-auto w-1 rounded-full transition-all duration-700",
            completed ? "h-8 bg-[#22b95f]" : active ? (danger ? "h-4 bg-[#dc2626]" : "h-4 bg-[#d7ad2f]") : "h-0"
          )}
        />
      </div>
    </div>
  );
}
