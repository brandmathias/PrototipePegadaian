import { Bell } from "lucide-react";

import { AdminPageHero } from "@/components/admin/admin-page-hero";
import { RoleNotificationsPanel } from "@/components/notifications/role-notifications-panel";
import type { PersistedNotification } from "@/components/ui/use-buyer-notifications";

type SuperAdminNotificationsPageProps = {
  notifications: PersistedNotification[];
  superAdminName?: string | null;
};

export function SuperAdminNotificationsPage({
  notifications
}: SuperAdminNotificationsPageProps) {
  return (
    <div className="space-y-5 md:space-y-6">
      <AdminPageHero
        description="Ringkasan notifikasi lintas unit untuk memantau risiko, pelanggaran, dan perkembangan transaksi secara read-only dari pusat."
        eyebrow="Superadmin / Notifikasi"
        icon={Bell}
        title="Pusat Notifikasi Operasional"
      />

      <RoleNotificationsPanel
        copy={{
          allTitle: "Semua Notifikasi Nasional",
          unreadTitle: "Notifikasi Nasional Belum Dibaca",
          emptyAllTitle: "Belum ada notifikasi nasional",
          emptyUnreadTitle: "Semua notifikasi nasional sudah dibaca",
          emptyDescription:
            "Notifikasi akan muncul saat ada pembatasan buyer, pelanggaran pembayaran, atau kejadian transaksi penting lintas unit."
        }}
        initialNotifications={notifications}
        scope="superadmin"
      />
    </div>
  );
}
