import { getAdminSessionUser, getAppPathFromRequestHeaders } from "@/lib/auth/session";

export async function getAdminUnitPageContext() {
  const currentPath = await getAppPathFromRequestHeaders();
  const user = await getAdminSessionUser(currentPath);

  if (!user.unitId) {
    throw new Error("Akun admin belum terhubung ke unit.");
  }

  return {
    user,
    unitId: user.unitId
  };
}
