import {
  deriveBlacklistEscalationMilestones,
  getSequentialBlacklistViolationTotal,
  type BlacklistEscalationMilestone,
  type BlacklistViolationTraceLike
} from "@/lib/blacklist/escalation";

export type EffectiveBlacklistState<T extends BlacklistViolationTraceLike> = {
  blockedUntil: Date | null;
  milestones: Array<BlacklistEscalationMilestone<T>>;
  totalViolations: number;
};

function normalizeStoredTotal(value: number | null | undefined) {
  return Math.max(0, Math.floor(Number(value ?? 0)));
}

export function deriveEffectiveBlacklistState<T extends BlacklistViolationTraceLike>({
  storedBlockedUntil,
  storedTotalViolations,
  traces
}: {
  storedBlockedUntil?: Date | null;
  storedTotalViolations?: number | null;
  traces: T[];
}): EffectiveBlacklistState<T> {
  const milestones = deriveBlacklistEscalationMilestones(traces);

  if (milestones.length === 0) {
    return {
      blockedUntil: storedBlockedUntil ?? null,
      milestones,
      totalViolations: normalizeStoredTotal(storedTotalViolations)
    };
  }

  return {
    blockedUntil: milestones[milestones.length - 1]?.blockedUntil ?? storedBlockedUntil ?? null,
    milestones,
    totalViolations: getSequentialBlacklistViolationTotal(traces)
  };
}
