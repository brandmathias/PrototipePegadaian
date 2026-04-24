import { NextResponse } from "next/server";

import { requireAdminApiSession } from "@/lib/auth/session";
import { deleteAdminBarangMedia } from "@/lib/services/admin-barang.service";

type Context = { params: Promise<{ id: string; mediaId: string }> };

export async function DELETE(_request: Request, context: Context) {
  const access = await requireAdminApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  try {
    const { id, mediaId } = await context.params;
    const data = await deleteAdminBarangMedia(access.unitId, id, mediaId);
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Media gagal dihapus.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
