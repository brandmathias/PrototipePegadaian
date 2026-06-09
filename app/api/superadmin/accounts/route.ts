import { NextResponse } from "next/server";

import { requireSuperAdminApiSession } from "@/lib/auth/session";
import {
  createSuperAdminAccount,
  listSuperAdminAccounts,
  SuperAdminAccountError
} from "@/lib/services/superadmin-account.service";

function toErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Permintaan akun superadmin gagal diproses.";
  const status = error instanceof SuperAdminAccountError ? error.status : 400;

  return NextResponse.json({ message }, { status });
}

export async function GET() {
  const access = await requireSuperAdminApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  const data = await listSuperAdminAccounts(access.session.user.id);
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const access = await requireSuperAdminApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  try {
    const body = await request.json();
    const data = await createSuperAdminAccount(access.session.user.id, body);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
