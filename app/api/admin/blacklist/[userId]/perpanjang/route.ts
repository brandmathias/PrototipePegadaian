import { NextResponse } from "next/server";

import { requireAdminApiSession } from "@/lib/auth/session";
import { extendAdminBlacklist } from "@/lib/services/admin-blacklist.service";

type Context = { params: Promise<{ userId: string }> };

export async function POST(request: Request, context: Context) {
  const access = await requireAdminApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  try {
    const { userId } = await context.params;
    const data = await extendAdminBlacklist(access.unitId, access.session.user.id, userId, await request.json());
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Perpanjangan blacklist gagal.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
