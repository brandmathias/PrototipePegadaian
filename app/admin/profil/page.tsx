import { desc, eq } from "drizzle-orm";

import { AdminProfilePage } from "@/components/pages/admin-pages.lazy";
import { getAdminSessionUser, getAppPathFromRequestHeaders } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { accounts, sessions, units, users } from "@/lib/db/schema";
import { formatAppDateTime, formatAppLongDate } from "@/lib/timezone";

function getDeviceLabel(userAgent: string | null | undefined) {
  const agent = userAgent?.toLowerCase() ?? "";

  if (agent.includes("android")) return "Mobile App - Android";
  if (agent.includes("iphone") || agent.includes("ipad")) return "Mobile Safari - iOS";
  if (agent.includes("windows")) return "Chrome - Windows";
  if (agent.includes("mac")) return "Safari - macOS";
  if (agent.includes("linux")) return "Browser - Linux";

  return "Perangkat admin";
}

export default async function Page() {
  const currentPath = await getAppPathFromRequestHeaders();
  const currentUser = await getAdminSessionUser(currentPath);
  const [unitRows, userRows, accountRows, sessionRows] = await Promise.all([
    currentUser.unitId ? db.select().from(units).where(eq(units.id, currentUser.unitId)).limit(1) : Promise.resolve([]),
    db.select().from(users).where(eq(users.id, currentUser.id)).limit(1),
    db.select().from(accounts).where(eq(accounts.userId, currentUser.id)).orderBy(desc(accounts.updatedAt)).limit(1),
    db.select().from(sessions).where(eq(sessions.userId, currentUser.id)).orderBy(desc(sessions.updatedAt)).limit(8)
  ]);
  const unit = unitRows[0];
  const user = userRows[0];
  const account = accountRows[0];
  const now = new Date();
  const activeSessionCount = sessionRows.filter((session) => session.expiresAt > now).length || sessionRows.length;

  return (
    <AdminProfilePage
      profile={{
        activeSessionCount,
        email: user?.email ?? currentUser.email,
        image: user?.image ?? currentUser.image,
        joinedAt: formatAppLongDate(user?.createdAt),
        name: user?.name || currentUser.name || "Admin Unit",
        passwordUpdatedAt: formatAppLongDate(account?.updatedAt),
        phone: user?.phoneNumber ?? currentUser.phoneNumber ?? "",
        roleLabel: "Administrator",
        sessionHistory: sessionRows.map((session) => `${getDeviceLabel(session.userAgent)} - ${formatAppDateTime(session.updatedAt)}`),
        unitAddress: unit?.address ?? "-",
        unitCode: unit?.code ?? currentUser.unitId ?? "-",
        unitName: unit?.name ?? "Unit Pegadaian",
        updatedAt: formatAppLongDate(user?.updatedAt)
      }}
    />
  );
}
