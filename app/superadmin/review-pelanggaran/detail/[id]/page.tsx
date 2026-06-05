import { notFound } from "next/navigation";

import { SuperadminBlacklistDetailWorkspace } from "@/components/superadmin/superadmin-blacklist-detail-workspace";
import { getSuperadminBlacklistByUserId } from "@/lib/services/blacklist.service";

export const dynamic = "force-dynamic";

export default async function Page({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const entry = await getSuperadminBlacklistByUserId(id);

    return (
      <SuperadminBlacklistDetailWorkspace
        entry={entry}
        serverNow={new Date().toISOString()}
      />
    );
  } catch {
    notFound();
  }
}
