import { NextResponse } from "next/server";

import { requireSuperAdminApiSession } from "@/lib/auth/session";
import { updateAccountProfile } from "@/lib/services/account-profile.service";

export async function PUT(request: Request) {
  const access = await requireSuperAdminApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  try {
    const data = await updateAccountProfile(access.session.user.id, "super_admin", await request.json());
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Profil superadmin belum berhasil diperbarui.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
