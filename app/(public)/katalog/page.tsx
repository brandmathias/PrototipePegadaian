import { CatalogPage } from "@/components/pages/catalog-page";
import { listPublicLots } from "@/lib/services/public-catalog.service";

export default async function Page() {
  const lots = await listPublicLots();
  return <CatalogPage lots={lots} />;
}
