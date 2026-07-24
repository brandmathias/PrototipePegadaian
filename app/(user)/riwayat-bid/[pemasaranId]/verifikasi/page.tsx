import { redirect } from "next/navigation";

export default async function Page({
  params
}: {
  params: Promise<{ pemasaranId: string }>;
}) {
  const { pemasaranId } = await params;
  redirect(`/riwayat-bid?lotId=${encodeURIComponent(pemasaranId)}`);
}
