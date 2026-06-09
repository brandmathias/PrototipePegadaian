import { NextResponse } from "next/server";

import { requireSuperAdminApiSession } from "@/lib/auth/session";
import {
  SuperAdminAccountError,
  updateSuperAdminAccount
} from "@/lib/services/superadmin-account.service";

type Context = { params: Promise<{ id: string }> };

function toErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Permintaan akun superadmin gagal diproses.";
  const status = error instanceof SuperAdminAccountError ? error.status : 400;

  return NextResponse.json({ message }, { status });
}

export async function PATCH(request: Request, context: Context) {
  const access = await requireSuperAdminApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const data = await updateSuperAdminAccount(access.session.user.id, id, body);
    return NextResponse.json({ data });
  } catch (error) {
    return toErrorResponse(error);
  }
}
