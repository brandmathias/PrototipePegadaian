import { NextResponse } from "next/server";

import { requireAdminApiSession } from "@/lib/auth/session";
import { getAdminBlacklistByUserId } from "@/lib/services/admin-blacklist.service";

type Context = { params: Promise<{ userId: string }> };

export async function GET(_request: Request, context: Context) {
  const access = await requireAdminApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  try {
    const { userId } = await context.params;
    const data = await getAdminBlacklistByUserId(access.unitId, userId);
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Blacklist gagal dibuka.";
    return NextResponse.json({ message }, { status: 404 });
  }
}
