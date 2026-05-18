import { BidVerificationPage } from "@/components/pages/user-pages";
import { getBuyerSessionUser } from "@/lib/auth/session";
import { getBuyerBidVerification } from "@/lib/services/buyer.service";

export default async function Page({
  params
}: {
  params: Promise<{ pemasaranId: string }>;
}) {
  const { pemasaranId } = await params;
  const buyer = await getBuyerSessionUser(`/riwayat-bid/${pemasaranId}/verifikasi`);
  const verification = await getBuyerBidVerification(buyer.id, pemasaranId);

  return <BidVerificationPage buyer={buyer} verification={verification} />;
}
