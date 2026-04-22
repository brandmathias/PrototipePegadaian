import { SuperAdminUnitDetailPage } from "@/components/pages/superadmin-pages";

export default async function Page({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SuperAdminUnitDetailPage unitId={id} />;
}
