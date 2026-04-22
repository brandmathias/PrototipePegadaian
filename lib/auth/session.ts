import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import {
  FALLBACK_BUYER_PATH,
  getRoleHomePath,
  getSafeBuyerNextPath,
  getSafeRoleNextPath,
  isAuthRole,
  type AppSessionUser,
  type AuthRole,
  type BuyerSessionUser
} from "@/lib/auth/guards";

export async function getServerSession() {
  return auth.api.getSession({
    headers: await headers()
  });
}

export async function getAppPathFromRequestHeaders() {
  const requestHeaders = await headers();
  const currentPath = requestHeaders.get("x-app-path");

  if (!currentPath || !currentPath.startsWith("/") || currentPath.startsWith("//")) {
    return FALLBACK_BUYER_PATH;
  }

  return currentPath;
}

function toSessionUser(session: NonNullable<Awaited<ReturnType<typeof getServerSession>>>) {
  const role = isAuthRole(session.user.role) ? session.user.role : "buyer";

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role,
    phoneNumber:
      "phoneNumber" in session.user && typeof session.user.phoneNumber === "string"
        ? session.user.phoneNumber
        : null
  } satisfies AppSessionUser;
}

export async function requireRoleSession(role: AuthRole, nextPath?: string) {
  const session = await getServerSession();
  const safeNextPath = getSafeRoleNextPath(role, nextPath);

  if (!session?.user) {
    redirect(`/login?next=${encodeURIComponent(safeNextPath)}`);
  }

  if (!isAuthRole(session.user.role)) {
    redirect("/login");
  }

  if (session.user.role !== role) {
    redirect(getRoleHomePath(session.user.role));
  }

  return session;
}

export async function requireBuyerSession(nextPath?: string) {
  return requireRoleSession("buyer", getSafeBuyerNextPath(nextPath));
}

export async function requireAdminSession(nextPath?: string) {
  return requireRoleSession("admin_unit", nextPath);
}

export async function requireSuperAdminSession(nextPath?: string) {
  return requireRoleSession("super_admin", nextPath);
}

export async function getBuyerSessionUser(nextPath?: string): Promise<BuyerSessionUser> {
  const session = await requireBuyerSession(nextPath);
  return toSessionUser(session) as BuyerSessionUser;
}

export async function getAdminSessionUser(nextPath?: string) {
  const session = await requireAdminSession(nextPath);
  return toSessionUser(session);
}

export async function getSuperAdminSessionUser(nextPath?: string) {
  const session = await requireSuperAdminSession(nextPath);
  return toSessionUser(session);
}
