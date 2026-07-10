import { getAuthenticatedLoginRedirectPath } from "@/lib/auth/guards";
import { getServerSession } from "@/lib/auth/session";

export async function GET(request: Request) {
  const session = await getServerSession();
  const redirectPath = getAuthenticatedLoginRedirectPath(session?.user) ?? "/katalog";

  return Response.redirect(new URL(redirectPath, request.url), 307);
}
