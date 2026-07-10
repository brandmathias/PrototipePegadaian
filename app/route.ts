import { getAuthenticatedLoginRedirectPath } from "@/lib/auth/guards";
import { getServerSession } from "@/lib/auth/session";

export async function GET(_request: Request) {
  const session = await getServerSession();
  const redirectPath = getAuthenticatedLoginRedirectPath(session?.user) ?? "/katalog";

  return new Response(null, {
    status: 307,
    headers: { Location: redirectPath }
  });
}
