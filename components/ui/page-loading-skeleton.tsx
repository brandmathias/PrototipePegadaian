import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type PageLoadingSkeletonProps = {
  className?: string;
  variant?: "auth" | "dashboard" | "public";
};

export function PageLoadingSkeleton({
  className,
  variant = "dashboard"
}: PageLoadingSkeletonProps) {
  if (variant === "auth") {
    return (
      <div className={cn("grid min-h-[100dvh] place-items-center bg-[#04150d] p-6", className)}>
        <div className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-2 shadow-[0_34px_100px_rgba(0,0,0,0.28)] lg:grid-cols-[1.15fr_0.85fr]">
          <div className="hidden min-h-[520px] rounded-[1.6rem] bg-white/10 p-8 lg:block">
            <Skeleton className="h-full w-full bg-white/15" />
          </div>
          <div className="space-y-5 rounded-[1.6rem] bg-white/8 p-8">
            <Skeleton className="h-14 w-14 rounded-2xl bg-white/15" />
            <Skeleton className="h-10 w-72 bg-white/15" />
            <Skeleton className="h-5 w-full max-w-md bg-white/15" />
            <Skeleton className="h-12 w-full bg-white/15" />
            <Skeleton className="h-12 w-full bg-white/15" />
            <Skeleton className="h-12 w-full rounded-full bg-white/15" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6 md:space-y-7", className)}>
      <div className="relative min-h-[260px] overflow-hidden rounded-[2rem] border border-primary/10 bg-white p-6 shadow-[0_24px_70px_-50px_rgba(8,69,50,0.45)] md:p-8">
        <div className="max-w-2xl space-y-5">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-14 w-full max-w-xl" />
          <Skeleton className="h-5 w-full max-w-lg" />
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-11 w-44 rounded-2xl" />
            <Skeleton className="h-11 w-36 rounded-2xl" />
          </div>
        </div>
      </div>

      <Skeleton className="h-28 w-full rounded-[1.75rem]" />

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="space-y-4 rounded-[1.75rem] border border-border/70 bg-white p-5">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-44 w-full rounded-[1.5rem]" />
        </div>
        <div className="space-y-4 rounded-[1.75rem] border border-border/70 bg-white p-5">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-44 w-full rounded-[1.5rem]" />
        </div>
      </div>

      <div className="grid gap-4 rounded-[1.75rem] border border-border/70 bg-white p-5 lg:grid-cols-3">
        <Skeleton className="h-32 w-full rounded-[1.45rem]" />
        <Skeleton className="h-32 w-full rounded-[1.45rem]" />
        <Skeleton className="h-32 w-full rounded-[1.45rem]" />
      </div>

      {variant === "public" ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-48 w-full rounded-[1.5rem]" />
          <Skeleton className="h-48 w-full rounded-[1.5rem]" />
          <Skeleton className="h-48 w-full rounded-[1.5rem]" />
        </div>
      ) : null}
    </div>
  );
}
