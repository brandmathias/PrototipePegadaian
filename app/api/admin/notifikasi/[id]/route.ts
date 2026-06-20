import { NextResponse } from "next/server";

import { requireAdminApiSession } from "@/lib/auth/session";
import { markNotificationRead } from "@/lib/services/notification.service";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireAdminApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  const { id } = await params;
  const data = await markNotificationRead(access.session.user.id, id);

  return NextResponse.json({ data });
}
