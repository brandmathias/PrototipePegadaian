import { NextResponse } from "next/server";

import { requireBuyerApiSession } from "@/lib/auth/session";
import { markAllNotificationsRead } from "@/lib/services/notification.service";

export async function POST() {
  const access = await requireBuyerApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  const updated = await markAllNotificationsRead(access.userId);

  return NextResponse.json({ data: { updated } });
}
