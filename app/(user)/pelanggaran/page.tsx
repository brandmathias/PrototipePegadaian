import { BuyerViolationPage } from "@/components/buyer/buyer-violation-page";
import { getBuyerSessionUser } from "@/lib/auth/session";
import { getBuyerViolationPageData } from "@/lib/services/buyer.service";

export default async function Page() {
  const buyer = await getBuyerSessionUser("/pelanggaran");
  const data = await getBuyerViolationPageData(buyer.id);

  return <BuyerViolationPage data={data} serverNow={new Date().toISOString()} />;
}
