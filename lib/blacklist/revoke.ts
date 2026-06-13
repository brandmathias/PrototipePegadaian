export const DIRECT_REVOKE_REASON_OPTIONS = [
  {
    code: "PAYMENT_PROOF_VALID",
    label: "Bukti pembayaran valid"
  },
  {
    code: "SYSTEM_OR_DATA_ERROR",
    label: "Kesalahan sistem atau data"
  },
  {
    code: "ADMINISTRATIVE_CORRECTION",
    label: "Koreksi administratif"
  }
] as const;
