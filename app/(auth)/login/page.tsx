import { redirect } from "next/navigation";

import { LoginPage } from "@/components/pages/public-auth-pages";
import { getAuthenticatedLoginRedirectPath } from "@/lib/auth/guards";
import { getServerSession } from "@/lib/auth/session";

export default async function Page({
  searchParams
}: {
  searchParams?: Promise<{ next?: string | string[] }>;
}) {
  const [session, params] = await Promise.all([getServerSession(), searchParams]);
  const rawNext = Array.isArray(params?.next) ? params?.next[0] : params?.next;
  const redirectPath = getAuthenticatedLoginRedirectPath(session?.user, rawNext);

  if (redirectPath) {
    redirect(redirectPath);
  }

  return <LoginPage />;
}
