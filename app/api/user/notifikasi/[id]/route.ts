import { NextResponse } from "next/server";

import { requireBuyerApiSession } from "@/lib/auth/session";
import { markNotificationRead } from "@/lib/services/notification.service";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(_request: Request, context: Context) {
  const access = await requireBuyerApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  try {
    const { id } = await context.params;
    const data = await markNotificationRead(access.userId, id);
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Notifikasi tidak ditemukan.";
    return NextResponse.json({ message }, { status: 404 });
  }
}
