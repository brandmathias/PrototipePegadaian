import { NextResponse } from "next/server";

import { requireSuperAdminApiSession } from "@/lib/auth/session";
import { listBlacklists } from "@/lib/services/blacklist.service";

export async function GET() {
  const access = await requireSuperAdminApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  const data = await listBlacklists();
  return NextResponse.json({ data });
}
