import { desc, eq } from "drizzle-orm";

import { AdminProfilePage } from "@/components/pages/admin-pages";
import { getAppPathFromRequestHeaders, getSuperAdminSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { accounts, sessions, users } from "@/lib/db/schema";
import { formatAppDateTime, formatAppLongDate } from "@/lib/timezone";

function getDeviceLabel(userAgent: string | null | undefined) {
  const agent = userAgent?.toLowerCase() ?? "";

  if (agent.includes("android")) return "Mobile App - Android";
  if (agent.includes("iphone") || agent.includes("ipad")) return "Mobile Safari - iOS";
  if (agent.includes("windows")) return "Chrome - Windows";
  if (agent.includes("mac")) return "Safari - macOS";
  if (agent.includes("linux")) return "Browser - Linux";

  return "Perangkat superadmin";
}

export default async function Page() {
  const currentPath = await getAppPathFromRequestHeaders();
  const currentUser = await getSuperAdminSessionUser(currentPath);
  const [userRows, accountRows, sessionRows] = await Promise.all([
    db.select().from(users).where(eq(users.id, currentUser.id)).limit(1),
    db.select().from(accounts).where(eq(accounts.userId, currentUser.id)).orderBy(desc(accounts.updatedAt)).limit(1),
    db.select().from(sessions).where(eq(sessions.userId, currentUser.id)).orderBy(desc(sessions.updatedAt)).limit(8)
  ]);
  const user = userRows[0];
  const account = accountRows[0];
  const now = new Date();
  const activeSessionCount = sessionRows.filter((session) => session.expiresAt > now).length || sessionRows.length;

  return (
    <AdminProfilePage
      profile={{
        accessHistoryDescription: "Lihat riwayat akses superadmin",
        accessHistoryLabel: "Akses superadmin",
        activeSessionCount,
        email: user?.email ?? currentUser.email,
        image: user?.image ?? currentUser.image,
        joinedAt: formatAppLongDate(user?.createdAt),
        name: user?.name || currentUser.name || "Super Admin",
        pageDescription: "Kelola informasi akun, akses keamanan, dan area kerja nasional Anda.",
        pageTitle: "Profil Superadmin",
        passwordUpdatedAt: formatAppLongDate(account?.updatedAt),
        phone: user?.phoneNumber ?? currentUser.phoneNumber ?? "",
        profileEditHeading: "Perbarui informasi superadmin",
        profileEndpoint: "/api/superadmin/profil",
        profileSaveFeedback: "Profil superadmin sudah diperbarui di database.",
        roleLabel: "Super Admin",
        sessionHistory: sessionRows.map((session) => `${getDeviceLabel(session.userAgent)} - ${formatAppDateTime(session.updatedAt)}`),
        unitAddress: "Kontrol nasional lintas unit Pegadaian Lelang.",
        unitCode: "SUPERADMIN",
        unitName: "Superadmin Nasional",
        updatedAt: formatAppLongDate(user?.updatedAt),
        workspaceAddressLabel: "Cakupan",
        workspaceCodeLabel: "Kode Akses",
        workspaceFieldLabel: "Area kerja",
        workspaceLabel: "Area Kerja",
        workspacePhoneLabel: "Kontak",
        workspaceSectionTitle: "Informasi Superadmin"
      }}
    />
  );
}
