import Image from "next/image";

import { RoleNotificationsPanel } from "@/components/notifications/role-notifications-panel";
import WelcomeBrushBadge from "@/components/shared/welcome-brush-badge";
import type { PersistedNotification } from "@/components/ui/use-buyer-notifications";

type AdminUnitNotificationsPageProps = {
  adminName?: string | null;
  notifications: PersistedNotification[];
};

const ADMIN_DASHBOARD_HERO_ILLUSTRATION =
  "/assets/hero-admin-unit-illustration.png";

export function AdminUnitNotificationsPage({
  adminName,
  notifications
}: AdminUnitNotificationsPageProps) {
  const operatorLabel = adminName?.trim() || "Admin Unit";

  return (
    <div className="space-y-5 md:space-y-6">
      <section className="admin-hero" aria-label="Hero notifikasi admin unit">
        <div className="admin-hero__content">
          <div className="admin-hero__eyebrow">
            <div className="admin-hero__display-title">Notifikasi</div>
            <div className="admin-hero__display-sub">Admin Unit</div>
          </div>

          <div className="mb-4">
            <WelcomeBrushBadge />
          </div>

          <h1 className="admin-hero__title">Pusat Notifikasi Operasional</h1>
          <p className="admin-hero__description">
            Halo, {operatorLabel}. Pantau bukti pembayaran, bid masuk, hasil
            lelang, dan alert transaksi unit dari satu ruang admin yang ringkas.
          </p>
        </div>
        <div className="admin-hero__visual">
          <Image
            alt="Ilustrasi operasional notifikasi admin unit"
            fetchPriority="high"
            height={400}
            priority
            quality={75}
            sizes="(max-width: 1100px) 80vw, 400px"
            src={ADMIN_DASHBOARD_HERO_ILLUSTRATION}
            style={{ width: "100%", height: "auto" }}
            width={520}
          />
        </div>
      </section>

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
