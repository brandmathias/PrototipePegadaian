import { getCountdownState } from "@/lib/countdown";

type SerializedUnitAccount = {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branch: string;
  status: "AKTIF" | "CADANGAN";
};

export function serializeUnitAccount(account: {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  branchName: string;
  isActive: boolean;
}): SerializedUnitAccount {
  return {
    id: account.id,
    bankName: account.bankName,
    accountNumber: account.accountNumber,
    accountHolder: account.accountHolderName,
    branch: account.branchName,
    status: account.isActive ? "AKTIF" : "CADANGAN"
  };
}

export function serializeUnitListItem(input: {
  id: string;
  code: string;
  name: string;
  address: string;
  isActive: boolean;
  adminCount: number;
  accountCount: number;
  activeAccount: SerializedUnitAccount | null;
}) {
  return {
    id: input.id,
    code: input.code,
    name: input.name,
    address: input.address,
    status: input.isActive ? "Aktif" : "Nonaktif",
    adminCount: input.adminCount,
    accountCount: input.accountCount,
    activeAccount: input.activeAccount
  };
}

export function serializeMonitoringSummary(input: {
  totalUnits: number;
  activeUnits: number;
  totalAdmins: number;
  activeAccounts: number;
  activeBlacklists: number;
}) {
  return {
    headline: "Pantau seluruh unit, admin, rekening, dan blacklist dari satu control center nasional.",
    metrics: [
      {
        label: "Total Unit",
        value: String(input.totalUnits),
        detail: `${input.activeUnits} unit aktif`
      },
      {
        label: "Admin Aktif",
        value: String(input.totalAdmins),
        detail: "Akun admin unit yang tersimpan di sistem"
      },
      {
        label: "Rekening Aktif",
        value: String(input.activeAccounts),
        detail: "Rekening tujuan pembayaran yang sedang dipakai unit"
      },
      {
        label: "Blacklist Aktif",
        value: String(input.activeBlacklists),
        detail: "Akun buyer yang masih diblokir dari lelang"
      }
    ]
  };
}

export function serializeBlacklistEntry(input: {
  id: string;
  userId: string;
  name: string;
  email: string;
  unitName: string | null;
  isActive: boolean;
  totalViolations: number;
  blockedUntil: Date | null;
  revokeReason: string | null;
  now?: Date;
}) {
  const countdown = input.isActive
    ? getCountdownState(input.blockedUntil, {
        now: input.now?.getTime(),
        expiredLabel: "Masa blokir selesai"
      })
    : null;

  return {
    id: input.id,
    userId: input.userId,
    name: input.name,
    email: input.email,
    unit: input.unitName ?? "Lintas unit",
    total: input.totalViolations,
    until: input.blockedUntil
      ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(input.blockedUntil)
      : "Sampai ditinjau ulang",
    reason: input.revokeReason ?? "Pelanggaran pembayaran atau penyelesaian lelang.",
    status: input.isActive ? "Aktif" : "Nonaktif",
    countdownLabel: countdown?.label,
    countdownAt: input.blockedUntil?.toISOString(),
    expiredLabel: countdown ? "Masa blokir selesai" : undefined
  };
}
