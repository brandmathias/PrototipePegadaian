import { PageLoadingSkeleton } from "@/components/ui/page-loading-skeleton";

export default function Loading() {
  return (
    <main className="container py-8 md:py-10">
      <PageLoadingSkeleton variant="public" />
    </main>
  );
}
