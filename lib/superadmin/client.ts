export async function fetchSuperAdminJson<T>(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  const payload = (await response.json().catch(() => ({ message: "Permintaan superadmin gagal." }))) as {
    data?: T;
    message?: string;
  };

  if (!response.ok) {
    throw new Error(payload.message ?? "Permintaan superadmin gagal.");
  }

  if (typeof payload.data === "undefined") {
    throw new Error("Response superadmin tidak memuat data.");
  }

  return payload.data;
}
