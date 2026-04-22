export type AuthRole = "buyer" | "admin_unit" | "super_admin";

export type AppSessionUser = {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
  phoneNumber?: string | null;
};

export type BuyerSessionUser = AppSessionUser & {
  role: "buyer";
};

const ROLE_HOME_PATHS: Record<AuthRole, string> = {
  buyer: "/dashboard",
  admin_unit: "/admin",
  super_admin: "/superadmin"
};

const ROLE_ALLOWED_PREFIXES: Record<AuthRole, string[]> = {
  buyer: ["/dashboard", "/transaksi", "/profil", "/riwayat-bid"],
  admin_unit: ["/admin"],
  super_admin: ["/superadmin"]
};

export const FALLBACK_BUYER_PATH = ROLE_HOME_PATHS.buyer;

export function isAuthRole(role?: string | null): role is AuthRole {
  return role === "buyer" || role === "admin_unit" || role === "super_admin";
}

export function getRoleHomePath(role: AuthRole) {
  return ROLE_HOME_PATHS[role];
}

export function getSafeRoleNextPath(role: AuthRole, next?: string | null) {
  if (!next) {
    return getRoleHomePath(role);
  }

  const normalized = next.trim();

  if (!normalized.startsWith("/") || normalized.startsWith("//")) {
    return getRoleHomePath(role);
  }

  if (
    !ROLE_ALLOWED_PREFIXES[role].some(
      (path) => normalized === path || normalized.startsWith(`${path}/`)
    )
  ) {
    return getRoleHomePath(role);
  }

  return normalized;
}

export function getSafeBuyerNextPath(next?: string | null) {
  return getSafeRoleNextPath("buyer", next);
}

export function getSafeAdminNextPath(next?: string | null) {
  return getSafeRoleNextPath("admin_unit", next);
}

export function getSafeSuperAdminNextPath(next?: string | null) {
  return getSafeRoleNextPath("super_admin", next);
}
