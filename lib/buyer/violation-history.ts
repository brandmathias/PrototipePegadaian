import { deriveBlacklistEscalationMilestones } from "@/lib/blacklist/escalation";

type BuyerViolationHistoryLike = {
  escalationEligible?: boolean | null;
  id: string;
  occurredAt?: Date | string | null;
  createdAt?: Date | string | null;
  violationLevel?: number;
};

export function filterCountedBuyerViolationHistory<T extends BuyerViolationHistoryLike>(items: T[]): T[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  const milestones = deriveBlacklistEscalationMilestones(items)
    .sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime());

  return milestones.map(({ level, trace }) => ({
    ...byId.get(trace.id)!,
    violationLevel: level
  })) as T[];
}
