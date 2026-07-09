import { NextResponse } from "next/server";

import { requireAdminApiSession } from "@/lib/auth/session";
import { getAdminBarangById } from "@/lib/services/admin-barang.service";

type Context = {
  params: Promise<{ id: string }>;
};

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Permintaan barang gagal diproses.";
  const status = message.includes("tidak ditemukan") ? 404 : 400;
  return NextResponse.json({ message }, { status });
}

export async function GET(_request: Request, context: Context) {
  const access = await requireAdminApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  try {
    const { id } = await context.params;
    const data = await getAdminBarangById(access.unitId, id);
    return NextResponse.json({ data });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT() {
  const access = await requireAdminApiSession();
  if (!access.ok) {
    return NextResponse.json({ message: access.message }, { status: access.status });
  }

  return NextResponse.json(
    { message: "Data barang tidak dapat diubah setelah masuk ke kelola barang." },
    { status: 405 }
  );
}
