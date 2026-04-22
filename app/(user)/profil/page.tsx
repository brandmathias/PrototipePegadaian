import { ProfilePage } from "@/components/pages/user-pages";
import { getBuyerSessionUser } from "@/lib/auth/session";

export default async function Page() {
  const buyer = await getBuyerSessionUser("/profil");

  return <ProfilePage buyer={buyer} />;
}
