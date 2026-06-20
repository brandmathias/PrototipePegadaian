import { NextResponse } from "next/server";

import { requireAdminApiSession } from "@/lib/auth/session";
import { listUserNotifications } from "@/lib/services/notification.service";

export async function GET(request: Request) {
  const access = await requireAdminApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  const url = new URL(request.url);
  const unreadOnly = url.searchParams.get("unread") === "true";
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;
  const data = await listUserNotifications(access.session.user.id, { unreadOnly, limit });

  return NextResponse.json({ data });
}
