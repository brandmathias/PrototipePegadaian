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
        : null,
    unitId: "unitId" in session.user && typeof session.user.unitId === "string" ? session.user.unitId : null,
    isActive: "isActive" in session.user && typeof session.user.isActive === "boolean" ? session.user.isActive : true
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

  if ("isActive" in session.user && session.user.isActive === false) {
    redirect("/login");
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

export async function requireSuperAdminApiSession() {
  const session = await getServerSession();

  if (!session?.user) {
    return {
      ok: false as const,
      status: 401,
      message: "Silakan masuk terlebih dahulu."
    };
  }

  if (!isAuthRole(session.user.role) || session.user.role !== "super_admin") {
    return {
      ok: false as const,
      status: 403,
      message: "Akses superadmin ditolak."
    };
  }

  if ("isActive" in session.user && session.user.isActive === false) {
    return {
      ok: false as const,
      status: 403,
      message: "Akun Anda sedang nonaktif."
    };
  }

  return {
    ok: true as const,
    session
  };
}

export async function requireAdminApiSession() {
  const session = await getServerSession();

  if (!session?.user) {
    return {
      ok: false as const,
      status: 401,
      message: "Silakan masuk terlebih dahulu."
    };
  }

  if (!isAuthRole(session.user.role) || session.user.role !== "admin_unit") {
    return {
      ok: false as const,
      status: 403,
      message: "Akses admin unit ditolak."
    };
  }

  if ("isActive" in session.user && session.user.isActive === false) {
    return {
      ok: false as const,
      status: 403,
      message: "Akun Anda sedang nonaktif."
    };
  }

  if (!("unitId" in session.user) || typeof session.user.unitId !== "string" || !session.user.unitId) {
    return {
      ok: false as const,
      status: 403,
      message: "Akun admin belum terhubung ke unit."
    };
  }

  return {
    ok: true as const,
    session,
    unitId: session.user.unitId
  };
}

export async function requireBuyerApiSession() {
  const session = await getServerSession();

  if (!session?.user) {
    return {
      ok: false as const,
      status: 401,
      message: "Silakan masuk sebagai pembeli terlebih dahulu."
    };
  }

  if (!isAuthRole(session.user.role) || session.user.role !== "buyer") {
    return {
      ok: false as const,
      status: 403,
      message: "Akses pembeli ditolak."
    };
  }

  if ("isActive" in session.user && session.user.isActive === false) {
    return {
      ok: false as const,
      status: 403,
      message: "Akun Anda sedang nonaktif."
    };
  }

  return {
    ok: true as const,
    session,
    userId: session.user.id
  };
}
