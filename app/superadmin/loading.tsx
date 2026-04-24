import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8 md:space-y-10">
      <Card className="overflow-hidden border border-border/70 bg-white">
        <CardContent className="grid gap-8 p-6 md:p-8 xl:grid-cols-[1.06fr_0.94fr]">
          <div className="space-y-5">
            <div className="flex flex-wrap gap-3">
              <Skeleton className="h-9 w-40" />
              <Skeleton className="h-9 w-48" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-14 w-full max-w-xl" />
              <Skeleton className="h-5 w-full max-w-2xl" />
              <Skeleton className="h-5 w-full max-w-xl" />
            </div>
            <div className="flex flex-wrap gap-3">
              <Skeleton className="h-11 w-40" />
              <Skeleton className="h-11 w-44" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
        <Card className="border border-border/70 bg-white">
          <CardHeader className="space-y-3">
            <Skeleton className="h-7 w-60" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-white">
          <CardHeader className="space-y-3">
            <Skeleton className="h-7 w-52" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
