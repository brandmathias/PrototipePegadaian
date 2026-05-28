import { NextResponse } from "next/server";

import { requireBuyerApiSession } from "@/lib/auth/session";
import { ensureVickreyLossNotifications } from "@/lib/services/notification-events";
import { listUserNotifications } from "@/lib/services/notification.service";

export async function GET(request: Request) {
  const access = await requireBuyerApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  const url = new URL(request.url);
  const unreadOnly = url.searchParams.get("unread") === "true";
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;
  await ensureVickreyLossNotifications(access.userId);
  const data = await listUserNotifications(access.userId, { unreadOnly, limit });

  return NextResponse.json({ data });
}
