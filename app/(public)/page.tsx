import { HomePage } from "@/components/pages/home-page";
import { getPublicHomeData } from "@/lib/services/public-home.service";

export const dynamic = "force-dynamic";

export default async function Page() {
  const data = await getPublicHomeData();
  return <HomePage featuredLots={data.featuredLots} serverNow={new Date().toISOString()} stats={data.stats} />;
}
