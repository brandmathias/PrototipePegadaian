import { NextResponse } from "next/server";

import { requireBuyerApiSession } from "@/lib/auth/session";
import { getUnreadNotificationCount } from "@/lib/services/notification.service";

export async function GET() {
  const access = await requireBuyerApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  const count = await getUnreadNotificationCount(access.userId);

  return NextResponse.json({ data: { count } });
}
