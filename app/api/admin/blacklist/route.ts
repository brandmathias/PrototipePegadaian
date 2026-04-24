import { NextResponse } from "next/server";

import { requireAdminApiSession } from "@/lib/auth/session";
import { listAdminBlacklist } from "@/lib/services/admin-blacklist.service";

export async function GET() {
  const access = await requireAdminApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  const data = await listAdminBlacklist(access.unitId);
  return NextResponse.json({ data });
}
