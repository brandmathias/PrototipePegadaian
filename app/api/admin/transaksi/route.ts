import { NextResponse } from "next/server";

import { requireAdminApiSession } from "@/lib/auth/session";
import { listAdminTransactions } from "@/lib/services/admin-transaction.service";

export async function GET() {
  const access = await requireAdminApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  const data = await listAdminTransactions(access.unitId);
  return NextResponse.json({ data });
}
