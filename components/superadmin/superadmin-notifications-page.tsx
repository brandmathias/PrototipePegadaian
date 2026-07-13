import { Bell } from "lucide-react";

import { AdminPageHero } from "@/components/admin/admin-page-hero";
import { RoleNotificationsPanel } from "@/components/notifications/role-notifications-panel";
import type { PersistedNotification } from "@/components/ui/use-buyer-notifications";

type SuperAdminNotificationsPageProps = {
  notifications: PersistedNotification[];
  superAdminName?: string | null;
};

export function SuperAdminNotificationsPage({
  notifications,
  superAdminName
}: SuperAdminNotificationsPageProps) {
  return (
    <div className="space-y-5 md:space-y-6">
      <AdminPageHero
        description={`Halo, ${superAdminName?.trim() || "Superadmin Nasional"}. Pantau risiko operasional lintas unit seperti pembatasan buyer, pelanggaran pembayaran, dan transaksi yang membutuhkan perhatian read-only dari pusat.`}
        eyebrow="Superadmin / Notifikasi"
        icon={Bell}
        title="Alert Kebijakan Nasional"
      />

      <RoleNotificationsPanel
        copy={{
          allTitle: "Semua Alert Nasional",
          unreadTitle: "Alert Nasional Belum Dibaca",
          emptyAllTitle: "Belum ada alert nasional",
          emptyUnreadTitle: "Semua alert nasional sudah dibaca",
          emptyDescription:
            "Alert akan muncul saat ada pembatasan buyer, pelanggaran pembayaran, atau kejadian transaksi penting lintas unit."
        }}
        initialNotifications={notifications}
        scope="superadmin"
      />
    </div>
  );
}
