import { getBlacklistBlockedUntil } from "@/lib/blacklist/restrictions";

export type BlacklistViolationTraceLike = {
  createdAt?: Date | string | null;
  escalationEligible?: boolean | null;
  occurredAt?: Date | string | null;
};

export type BlacklistEscalationMilestone<T extends BlacklistViolationTraceLike> = {
  blockedUntil: Date;
  level: number;
  occurredAt: Date;
  trace: T;
};

function parseTraceDate(value: Date | string | null | undefined) {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function deriveBlacklistEscalationMilestones<T extends BlacklistViolationTraceLike>(
  traces: T[]
): Array<BlacklistEscalationMilestone<T>> {
  const ordered = traces
    .map((trace, index) => ({
      index,
      occurredAt: parseTraceDate(trace.occurredAt ?? trace.createdAt),
      trace
    }))
    .filter((item): item is { index: number; occurredAt: Date; trace: T } => Boolean(item.occurredAt))
    .filter((item) => item.trace.escalationEligible !== false)
    .sort((left, right) => {
      const timeDiff = left.occurredAt.getTime() - right.occurredAt.getTime();
      return timeDiff === 0 ? left.index - right.index : timeDiff;
    });

  const milestones: Array<BlacklistEscalationMilestone<T>> = [];
  let nextAllowedAt: Date | null = null;

  for (const item of ordered) {
    if (nextAllowedAt && item.occurredAt.getTime() < nextAllowedAt.getTime()) {
      continue;
    }

    const level = Math.min(milestones.length + 1, 3);
    const blockedUntil = getBlacklistBlockedUntil(item.occurredAt, level);

    milestones.push({
      blockedUntil,
      level,
      occurredAt: item.occurredAt,
      trace: item.trace
    });
    nextAllowedAt = blockedUntil;
  }

  return milestones;
}

export function getSequentialBlacklistViolationTotal<T extends BlacklistViolationTraceLike>(traces: T[]) {
  return Math.min(deriveBlacklistEscalationMilestones(traces).length, 3);
}
