import { UserDashboardPage } from "@/components/pages/user-pages";
import { getBuyerSessionUser } from "@/lib/auth/session";
import { getBuyerDashboardData } from "@/lib/services/buyer.service";

export default async function Page() {
  const buyer = await getBuyerSessionUser("/dashboard");
  const data = await getBuyerDashboardData(buyer.id);

  return <UserDashboardPage buyer={buyer} data={data} />;
}
