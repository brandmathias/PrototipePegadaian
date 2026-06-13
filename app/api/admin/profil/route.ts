import { NextResponse } from "next/server";

import { requireAdminApiSession } from "@/lib/auth/session";
import { updateAccountProfile } from "@/lib/services/account-profile.service";

export async function PUT(request: Request) {
  const access = await requireAdminApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  try {
    const data = await updateAccountProfile(access.session.user.id, "admin_unit", await request.json());
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Profil admin unit belum berhasil diperbarui.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
