import { AdminUnitNotificationsPage } from "@/components/admin/admin-notifications-page";
import { getAdminSessionUser } from "@/lib/auth/session";
import { listAllUserNotifications } from "@/lib/services/notification.service";

export default async function AdminNotificationsRoute() {
  const currentUser = await getAdminSessionUser("/admin/notifikasi");
  const notifications = await listAllUserNotifications(currentUser.id);

  return (
    <AdminUnitNotificationsPage
      adminName={currentUser.name}
      notifications={notifications}
    />
  );
}
