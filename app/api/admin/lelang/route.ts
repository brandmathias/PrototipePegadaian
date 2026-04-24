import { NextResponse } from "next/server";

import { requireAdminApiSession } from "@/lib/auth/session";
import { listAdminPemasaran } from "@/lib/services/admin-pemasaran.service";

export async function GET() {
  const access = await requireAdminApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  const data = await listAdminPemasaran(access.unitId);
  return NextResponse.json({ data });
}
