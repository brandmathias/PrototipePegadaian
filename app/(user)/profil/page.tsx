import { ProfilePage } from "@/components/buyer/profile-page";
import { getBuyerSessionUser } from "@/lib/auth/session";
import { getBuyerProfileSummary } from "@/lib/services/buyer.service";

export default async function Page() {
  const buyer = await getBuyerSessionUser("/profil");
  const summary = await getBuyerProfileSummary(buyer.id);

  return <ProfilePage buyer={buyer} summary={summary} />;
}
