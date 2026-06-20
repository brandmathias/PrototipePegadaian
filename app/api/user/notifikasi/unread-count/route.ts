import { NextResponse } from "next/server";

import { requireBuyerApiSession } from "@/lib/auth/session";
import { syncBuyerRestrictionNotifications } from "@/lib/services/notification-events";
import { getUnreadNotificationCount } from "@/lib/services/notification.service";

export async function GET() {
  const access = await requireBuyerApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  await syncBuyerRestrictionNotifications(access.userId);
  const count = await getUnreadNotificationCount(access.userId);

  return NextResponse.json({ data: { count } });
}
