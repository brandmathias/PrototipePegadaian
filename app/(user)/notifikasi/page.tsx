import { BuyerNotificationsPage } from "@/components/buyer/notifications-page";
import { getBuyerSessionUser } from "@/lib/auth/session";
import { ensureVickreyLossNotifications, syncBuyerRestrictionNotifications } from "@/lib/services/notification-events";
import { listAllUserNotifications } from "@/lib/services/notification.service";

export default async function Page() {
  const buyer = await getBuyerSessionUser("/notifikasi");

  await ensureVickreyLossNotifications(buyer.id);
  await syncBuyerRestrictionNotifications(buyer.id);
  const notifications = await listAllUserNotifications(buyer.id);

  return <BuyerNotificationsPage initialNotifications={notifications} />;
}
