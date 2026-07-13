import Image from "next/image";

import { RoleNotificationsPanel } from "@/components/notifications/role-notifications-panel";
import WelcomeBrushBadge from "@/components/shared/welcome-brush-badge";
import type { PersistedNotification } from "@/components/ui/use-buyer-notifications";

type SuperAdminNotificationsPageProps = {
  notifications: PersistedNotification[];
  superAdminName?: string | null;
};

const SUPERADMIN_DASHBOARD_HERO_IMAGE = "/uploads/superadmin-dashboard/hero.png";

export function SuperAdminNotificationsPage({
  notifications,
  superAdminName
}: SuperAdminNotificationsPageProps) {
  return (
    <div className="space-y-5 md:space-y-6">
      <section className="-mx-4 -mt-5 overflow-visible border-b border-[#eef3f0] bg-white sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8">
        <div className="relative min-h-[19.5rem] overflow-hidden bg-[#f8fbfc] pb-12 sm:min-h-[21rem] sm:pb-16 lg:min-h-[22.5rem] lg:pb-20">
          <Image
            alt="Gedung kantor untuk notifikasi Superadmin Nasional"
            className="pointer-events-none object-cover object-center"
            fetchPriority="high"
            fill
            priority
            sizes="(min-width: 1024px) calc(100vw - 16rem), 100vw"
            src={SUPERADMIN_DASHBOARD_HERO_IMAGE}
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,#ffffff_0%,rgba(255,255,255,0.96)_24%,rgba(255,255,255,0.58)_49%,rgba(255,255,255,0.05)_100%)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.94)_86%,#ffffff_100%)]" />
          <div className="relative z-[1] px-4 pt-6 sm:px-6 sm:pt-7 lg:px-8 lg:pt-8">
            <div className="max-w-[45rem]">
              <div className="admin-hero__eyebrow">
                <div className="admin-hero__display-title">Superadmin / Notifikasi</div>
                <div className="admin-hero__display-sub">Nasional</div>
              </div>

              <div className="mb-4">
                <WelcomeBrushBadge />
              </div>

              <h1 className="mt-2 font-sans text-[2.25rem] font-black leading-[0.98] tracking-tight text-[#07593f] sm:text-[3.05rem] lg:text-[3.55rem]">
                Alert kebijakan nasional
              </h1>
              <p className="mt-4 max-w-[39rem] font-sans text-[0.98rem] font-semibold leading-7 text-[#647067] sm:text-[1.05rem]">
                Halo, {superAdminName?.trim() || "Superadmin Nasional"}.
                Pantau risiko operasional lintas unit seperti pembatasan buyer,
                pelanggaran pembayaran, dan transaksi yang membutuhkan perhatian
                read-only dari pusat.
              </p>
            </div>
          </div>
        </div>
      </section>

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
