export type BlacklistRestrictionLevel = 0 | 1 | 2 | 3;

export type BlacklistRestrictionPolicy = {
  level: BlacklistRestrictionLevel;
  durationDays: 0 | 7 | 30 | 365;
  blocksVickrey: boolean;
  blocksFixedPrice: boolean;
  blocksTransactionSettlement: boolean;
  requiresManualReview: boolean;
  label: string;
};

export type BlacklistDurationUnit = "days" | "hours";

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

export function getBlacklistRestrictionPolicy(totalViolations: number | null | undefined): BlacklistRestrictionPolicy {
  const violations = Math.max(0, Math.floor(Number(totalViolations ?? 0)));

  if (violations <= 0) {
    return {
      level: 0,
      durationDays: 0,
      blocksVickrey: false,
      blocksFixedPrice: false,
      blocksTransactionSettlement: false,
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
      blocksTransactionSettlement: true,
      requiresManualReview: false,
      label: "Level 1: Lelang Tertutup dibatasi"
    };
  }

  if (violations === 2) {
    return {
      level: 2,
      durationDays: 30,
      blocksVickrey: true,
      blocksFixedPrice: true,
      blocksTransactionSettlement: true,
      requiresManualReview: false,
      label: "Level 2: Transaksi baru dibatasi"
    };
  }

  return {
    level: 3,
    durationDays: 365,
    blocksVickrey: true,
    blocksFixedPrice: true,
    blocksTransactionSettlement: true,
    requiresManualReview: true,
    label: "Level 3: Evaluasi manual"
  };
}

export function getBlacklistDurationDays(totalViolations: number) {
  return getBlacklistRestrictionPolicy(totalViolations).durationDays;
}

export function shouldSuspendLoginForBlacklist(totalViolations: number | null | undefined) {
  return getBlacklistRestrictionPolicy(totalViolations).requiresManualReview;
}

export function getBlacklistDurationUnit(value = process.env.BLACKLIST_DURATION_UNIT): BlacklistDurationUnit {
  return value === "hours" || value === "jam" || value === "demo" ? "hours" : "days";
}

export function getBlacklistDurationLabel(
  totalViolations: number,
  unit: BlacklistDurationUnit = getBlacklistDurationUnit()
) {
  const duration = getBlacklistDurationDays(totalViolations);
  return unit === "hours" ? `${duration} jam` : `${duration} hari`;
}

export function getBlacklistBlockedUntil(
  base: Date,
  totalViolations: number,
  unit: BlacklistDurationUnit = getBlacklistDurationUnit()
) {
  const duration = getBlacklistDurationDays(totalViolations);
  return new Date(base.getTime() + duration * (unit === "hours" ? HOUR_MS : DAY_MS));
}
