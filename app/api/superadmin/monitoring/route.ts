import { NextResponse } from "next/server";

import { requireSuperAdminApiSession } from "@/lib/auth/session";
import { getSuperAdminMonitoring } from "@/lib/services/monitoring.service";

export async function GET() {
  const access = await requireSuperAdminApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  const data = await getSuperAdminMonitoring();
  return NextResponse.json({ data });
}
