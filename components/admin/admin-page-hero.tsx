import type { ComponentType, ReactNode } from "react";

type AdminPageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  rightRail?: ReactNode;
};

export function AdminPageHero({
  eyebrow,
  title,
  description,
  icon: Icon,
  rightRail
}: AdminPageHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-[2.35rem] bg-[radial-gradient(circle_at_top_left,rgba(193,255,226,0.95),transparent_28%),linear-gradient(135deg,#fffdfa_0%,#f6f4ee_42%,#ffffff_100%)] px-6 py-6 shadow-[0_28px_90px_-72px_rgba(8,69,50,0.42)] sm:px-7 lg:px-8">
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[28rem] bg-[radial-gradient(circle_at_center,rgba(9,111,78,0.12),transparent_62%)] lg:block" />
      <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-4 md:items-center">
          <span className="grid size-16 shrink-0 place-items-center rounded-[1.35rem] bg-[linear-gradient(180deg,#fdfcf8,#edf7ef)] text-[#0a6a49] shadow-[0_20px_45px_-28px_rgba(10,106,73,0.38),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-[#6cb6ff]/55">
            <Icon className="size-7" />
          </span>
          <div className="min-w-0">
            <p className="page-heading-eyebrow">{eyebrow}</p>
            <h2 className="mt-2 font-headline text-3xl font-black tracking-[-0.04em] text-[#13211c] sm:text-4xl lg:text-[2.85rem]">
              {title}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-black/60 sm:text-base">
              {description}
            </p>
          </div>
        </div>
        {rightRail ? (
          <div className="flex flex-col items-start gap-3 md:items-end">{rightRail}</div>
        ) : null}
      </div>
    </section>
  );
}
