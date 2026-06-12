import { redirect } from "next/navigation";

import { getAuthenticatedLoginRedirectPath } from "@/lib/auth/guards";
import { getServerSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getServerSession();
  const redirectPath = getAuthenticatedLoginRedirectPath(session?.user);

  redirect(redirectPath ?? "/katalog");
}
