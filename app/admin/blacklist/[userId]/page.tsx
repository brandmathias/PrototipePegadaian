import { AdminBlacklistDetailPage } from "@/components/pages/admin-pages";

export default async function Page({
  params
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  return <AdminBlacklistDetailPage userId={userId} />;
}
