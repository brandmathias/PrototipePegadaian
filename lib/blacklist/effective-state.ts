import {
  deriveBlacklistEscalationMilestones,
  getSequentialBlacklistViolationTotal,
  type BlacklistEscalationMilestone,
  type BlacklistViolationTraceLike
} from "@/lib/blacklist/escalation";
import { getBlacklistRestrictionPolicy } from "@/lib/blacklist/restrictions";

export type EffectiveBlacklistState<T extends BlacklistViolationTraceLike> = {
  blockedUntil: Date | null;
  milestones: Array<BlacklistEscalationMilestone<T>>;
  totalViolations: number;
};

export function isBlacklistRestrictionActive({
  blockedUntil,
  isActive,
  now = new Date(),
  totalViolations
}: {
  blockedUntil?: Date | null;
  isActive: boolean;
  now?: Date;
  totalViolations: number | null | undefined;
}) {
  if (!isActive) {
    return false;
  }

  const policy = getBlacklistRestrictionPolicy(totalViolations);
  if (policy.level === 0) {
    return false;
  }

  if (policy.requiresManualReview) {
    return true;
  }

  return !blockedUntil || blockedUntil.getTime() > now.getTime();
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
      blockedUntil: null,
      milestones,
      totalViolations: 0
    };
  }

  return {
    blockedUntil: milestones[milestones.length - 1]?.blockedUntil ?? storedBlockedUntil ?? null,
    milestones,
    totalViolations: getSequentialBlacklistViolationTotal(traces)
  };
}
