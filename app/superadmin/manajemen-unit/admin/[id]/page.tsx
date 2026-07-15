import { notFound } from "next/navigation";

import { SuperAdminManagementAdminDetailPage } from "@/components/pages/superadmin-pages.lazy";
import { listAdminUnits } from "@/lib/services/admin-unit.service";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admins = await listAdminUnits();
  const admin = admins.find((item) => item.id === id);

  if (!admin) {
    notFound();
  }

  return <SuperAdminManagementAdminDetailPage admin={admin} />;
}
