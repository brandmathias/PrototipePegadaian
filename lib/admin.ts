export type AppRole = "guest" | "user" | "admin_unit" | "super_admin";

export type AdminInventoryStatus =
  | "GADAI"
  | "DITEBUS"
  | "JAMINAN"
  | "DIPASARKAN"
  | "MENUNGGU_PEMBAYARAN"
  | "TERJUAL"
  | "GAGAL";
export type AdminTransactionStatus =
  | "MENUNGGU_PEMBAYARAN"
  | "BUKTI_DIUNGGAH"
  | "MENUNGGU_KONFIRMASI_LANGSUNG"
  | "DITOLAK_BUKTI"
  | "LUNAS";
export type AdminAuctionStatus = "AKTIF" | "SELESAI" | "GAGAL";
export type AdminBlacklistStatus = "AKTIF" | "TIDAK_AKTIF";

export type AdminStatus =
  | AdminInventoryStatus
  | AdminTransactionStatus
  | AdminAuctionStatus
  | AdminBlacklistStatus;

export type AdminStatusMeta = {
  label: string;
  className: string;
};

const statusMeta: Record<AdminStatus, AdminStatusMeta> = {
  GADAI: {
    label: "GADAI",
    className: "bg-slate-100 text-slate-700"
  },
  DITEBUS: {
    label: "DITEBUS",
    className: "bg-zinc-200 text-zinc-800"
  },
  JAMINAN: {
    label: "JAMINAN",
    className: "bg-amber-100 text-amber-900"
  },
  DIPASARKAN: {
    label: "DIPASARKAN",
    className: "bg-emerald-100 text-emerald-800"
  },
  MENUNGGU_PEMBAYARAN: {
    label: "MENUNGGU_PEMBAYARAN",
    className: "bg-orange-100 text-orange-800"
  },
  TERJUAL: {
    label: "TERJUAL",
    className: "bg-sky-100 text-sky-700"
  },
  GAGAL: {
    label: "GAGAL",
    className: "bg-rose-100 text-rose-700"
  },
  BUKTI_DIUNGGAH: {
    label: "BUKTI_DIUNGGAH",
    className: "bg-sky-100 text-sky-700"
  },
  MENUNGGU_KONFIRMASI_LANGSUNG: {
    label: "MENUNGGU_KONFIRMASI_LANGSUNG",
    className: "bg-violet-100 text-violet-700"
  },
  DITOLAK_BUKTI: {
    label: "DITOLAK_BUKTI",
    className: "bg-rose-100 text-rose-700"
  },
  LUNAS: {
    label: "LUNAS",
    className: "bg-emerald-100 text-emerald-700"
  },
  AKTIF: {
    label: "AKTIF",
    className: "bg-emerald-100 text-emerald-800"
  },
  SELESAI: {
    label: "SELESAI",
    className: "bg-sky-100 text-sky-700"
  },
  TIDAK_AKTIF: {
    label: "TIDAK_AKTIF",
    className: "bg-zinc-200 text-zinc-700"
  }
};

export function getAdminStatusMeta(status: AdminStatus): AdminStatusMeta {
  return statusMeta[status];
}

export function getRoleLabel(role: AppRole) {
  switch (role) {
    case "admin_unit":
      return "Admin Unit";
    case "super_admin":
      return "Super Admin";
    case "user":
      return "User";
    default:
      return "Guest";
  }
}
