export type GovernanceCaseInput = {
  bidCount?: number | null;
  hasViolationIncident?: boolean | null;
  marketingMode?: string | null;
  marketingStatus?: string | null;
  transactionStatus?: string | null;
  transactionType?: string | null;
};

export type GovernanceCaseClassification = GovernanceCaseInput & {
  category: "normal" | "perlu_tindak_lanjut" | "pelanggaran_aktif";
};

export type GovernanceSnapshotInput = {
  collateralItems: number;
  marketedItems: number;
  soldItems: number;
  followUpItems: number;
  validatedTransactionValue: number;
};

export type GovernanceSnapshotItem = {
  label: string;
  value: string;
  detail: string;
};

const compactNumberFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 1
});

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

export function formatCompactRupiah(value: number) {
  if (value >= 1_000_000_000) {
    return `Rp ${compactNumberFormatter.format(value / 1_000_000_000)} M`;
  }

  if (value >= 1_000_000) {
    return `Rp ${compactNumberFormatter.format(value / 1_000_000)} jt`;
  }

  if (value >= 1_000) {
    return `Rp ${compactNumberFormatter.format(value / 1_000)} rb`;
  }

  return `Rp ${compactNumberFormatter.format(value)}`;
}

export function classifyGovernanceFollowUp(input: GovernanceCaseInput): GovernanceCaseClassification {
  const transactionStatus = normalize(input.transactionStatus);
  const transactionType = normalize(input.transactionType);
  const marketingStatus = normalize(input.marketingStatus);
  const marketingMode = normalize(input.marketingMode);
  const hasViolationIncident = Boolean(input.hasViolationIncident);

  if (hasViolationIncident && transactionType === "vickrey" && transactionStatus === "gagal") {
    return {
      ...input,
      category: "pelanggaran_aktif"
    };
  }

  if (
    transactionStatus === "ditolak_bukti" ||
    marketingStatus === "gagal" ||
    (marketingMode === "vickrey" && Number(input.bidCount ?? 0) === 0 && marketingStatus !== "aktif")
  ) {
    return {
      ...input,
      category: "perlu_tindak_lanjut"
    };
  }

  return {
    ...input,
    category: "normal"
  };
}

export function isActiveBuyerViolation(input: Pick<GovernanceCaseClassification, "category">) {
  return input.category === "pelanggaran_aktif";
}

export function buildGovernanceSnapshot(input: GovernanceSnapshotInput): GovernanceSnapshotItem[] {
  return [
    {
      label: "Barang Jaminan",
      value: compactNumberFormatter.format(input.collateralItems),
      detail: "Barang unit yang belum jatuh tempo"
    },
    {
      label: "Sedang Dipasarkan",
      value: compactNumberFormatter.format(input.marketedItems),
      detail: "Fixed price dan Lelang Tertutup yang sedang aktif"
    },
    {
      label: "Terjual",
      value: compactNumberFormatter.format(input.soldItems),
      detail: "Barang dengan transaksi sah atau status terjual"
    },
    {
      label: "Perlu Tindak Lanjut",
      value: compactNumberFormatter.format(input.followUpItems),
      detail: "Gagal, tertahan, atau perlu evaluasi tanpa otomatis menjadi pelanggaran"
    },
    {
      label: "Nilai Transaksi Tervalidasi",
      value: formatCompactRupiah(input.validatedTransactionValue),
      detail: "Total transaksi berstatus lunas atau selesai"
    }
  ];
}
