import { HomePage } from "@/components/pages/home-page";
import { getPublicHomeData } from "@/lib/services/public-home.service";

export default async function Page() {
  const data = await getPublicHomeData();
  return <HomePage featuredLots={data.featuredLots} stats={data.stats} />;
}
