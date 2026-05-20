export type BlacklistRestrictionLevel = 0 | 1 | 2 | 3;

export type BlacklistRestrictionPolicy = {
  level: BlacklistRestrictionLevel;
  durationDays: 0 | 7 | 30 | 365;
  blocksVickrey: boolean;
  blocksFixedPrice: boolean;
  requiresManualReview: boolean;
  label: string;
};

export function getBlacklistRestrictionPolicy(totalViolations: number | null | undefined): BlacklistRestrictionPolicy {
  const violations = Math.max(0, Math.floor(Number(totalViolations ?? 0)));

  if (violations <= 0) {
    return {
      level: 0,
      durationDays: 0,
      blocksVickrey: false,
      blocksFixedPrice: false,
      requiresManualReview: false,
      label: "Tidak ada pembatasan"
    };
  }

  if (violations === 1) {
    return {
      level: 1,
      durationDays: 7,
      blocksVickrey: true,
      blocksFixedPrice: false,
      requiresManualReview: false,
      label: "Level 1: Vickrey dibatasi"
    };
  }

  if (violations === 2) {
    return {
      level: 2,
      durationDays: 30,
      blocksVickrey: true,
      blocksFixedPrice: true,
      requiresManualReview: false,
      label: "Level 2: Transaksi baru dibatasi"
    };
  }

  return {
    level: 3,
    durationDays: 365,
    blocksVickrey: true,
    blocksFixedPrice: true,
    requiresManualReview: true,
    label: "Level 3: Review manual"
  };
}

export function getBlacklistDurationDays(totalViolations: number) {
  return getBlacklistRestrictionPolicy(totalViolations).durationDays;
}
