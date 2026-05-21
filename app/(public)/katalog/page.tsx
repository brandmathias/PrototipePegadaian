import { CatalogPage } from "@/components/pages/catalog-page";
import { listPublicLots } from "@/lib/services/public-catalog.service";

export default async function Page({
  searchParams
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const lots = await listPublicLots();
  const query = searchParams ? await searchParams : undefined;
  return <CatalogPage initialQuery={query?.q ?? ""} lots={lots} serverNow={new Date().toISOString()} />;
}
