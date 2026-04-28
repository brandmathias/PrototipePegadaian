import { ProfilePage } from "@/components/pages/user-pages";
import { getBuyerSessionUser } from "@/lib/auth/session";
import { getBuyerSummary } from "@/lib/services/buyer.service";

export default async function Page() {
  const buyer = await getBuyerSessionUser("/profil");
  const summary = await getBuyerSummary(buyer.id);

  return <ProfilePage buyer={buyer} summary={summary} />;
}
