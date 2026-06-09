import { redirect } from "next/navigation";

import { getBuyerSessionUser } from "@/lib/auth/session";

export default async function Page({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await getBuyerSessionUser(`/katalog/${id}`);
  redirect(`/katalog/${id}`);
}
