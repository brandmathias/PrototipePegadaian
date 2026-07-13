import { Bell } from "lucide-react";

import { AdminPageHero } from "@/components/admin/admin-page-hero";
import { RoleNotificationsPanel } from "@/components/notifications/role-notifications-panel";
import type { PersistedNotification } from "@/components/ui/use-buyer-notifications";

type AdminUnitNotificationsPageProps = {
  adminName?: string | null;
  notifications: PersistedNotification[];
};

export function AdminUnitNotificationsPage({
  adminName,
  notifications
}: AdminUnitNotificationsPageProps) {
  const operatorLabel = adminName?.trim() || "Admin Unit";

  return (
    <div className="space-y-5 md:space-y-6">
      <AdminPageHero
        description={`Halo, ${operatorLabel}. Pantau bukti pembayaran, bid masuk, hasil lelang, dan alert transaksi unit dari satu ruang admin yang ringkas.`}
        eyebrow="Admin Unit / Notifikasi"
        icon={Bell}
        title="Pusat Notifikasi Unit"
      />

      <RoleNotificationsPanel
        copy={{
          allTitle: "Semua Notifikasi Operasional",
          unreadTitle: "Notifikasi Operasional Belum Dibaca",
          emptyAllTitle: "Belum ada notifikasi operasional",
          emptyUnreadTitle: "Semua notifikasi operasional sudah dibaca",
          emptyDescription:
            "Notifikasi akan muncul saat ada bukti pembayaran, bid masuk, hasil lelang, atau transaksi yang membutuhkan verifikasi."
        }}
        initialNotifications={notifications}
        scope="admin-unit"
      />
    </div>
  );
}
