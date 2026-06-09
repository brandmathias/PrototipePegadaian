import { NextResponse } from "next/server";

import { requireSuperAdminApiSession } from "@/lib/auth/session";
import { markAllNotificationsRead } from "@/lib/services/notification.service";

export async function POST() {
  const access = await requireSuperAdminApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  const updated = await markAllNotificationsRead(access.session.user.id);

  return NextResponse.json({ data: { updated } });
}
