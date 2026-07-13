import { SuperAdminNotificationsPage } from "@/components/superadmin/superadmin-notifications-page";
import { getSuperAdminSessionUser } from "@/lib/auth/session";
import { listAllUserNotifications } from "@/lib/services/notification.service";

export default async function SuperAdminNotificationsRoute() {
  const currentUser = await getSuperAdminSessionUser("/superadmin/notifikasi");
  const notifications = await listAllUserNotifications(currentUser.id);

  return (
    <SuperAdminNotificationsPage
      notifications={notifications}
      superAdminName={currentUser.name}
    />
  );
}
