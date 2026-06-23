import { describe, expect, it } from "vitest";

import {
  deriveBlacklistEscalationMilestones,
  getSequentialBlacklistViolationTotal
} from "@/lib/blacklist/escalation";
import {
  deriveEffectiveBlacklistState,
  isBlacklistRestrictionActive
} from "@/lib/blacklist/effective-state";

describe("blacklist escalation sequence", () => {
  it("only escalates after the previous punishment window has finished", () => {
    const traces = [
      {
        id: "next-valid-incident",
        occurredAt: "2026-06-12T12:33:00.000Z"
      },
      {
        id: "first-valid-incident",
        occurredAt: "2026-05-29T21:36:00.000Z"
      },
      {
        id: "third-row-same-active-window",
        occurredAt: "2026-05-29T21:36:00.000Z"
      }
    ];

    const milestones = deriveBlacklistEscalationMilestones(traces);

    expect(milestones).toEqual([
      expect.objectContaining({
        level: 1,
        trace: expect.objectContaining({ id: "first-valid-incident" })
      }),
      expect.objectContaining({
        level: 2,
        trace: expect.objectContaining({ id: "next-valid-incident" })
      })
    ]);
    expect(getSequentialBlacklistViolationTotal(traces)).toBe(2);
  });

  it("uses sequential milestones over stale stored totals for effective display state", () => {
    const storedBlockedUntil = new Date("2027-05-24T16:42:23.866Z");
    const traces = [
      {
        id: "level-1",
        occurredAt: "2026-05-04T16:42:23.866Z"
      },
      {
        id: "level-2",
        occurredAt: "2026-05-14T16:42:23.866Z"
      },
      {
        id: "same-level-2-window",
        occurredAt: "2026-05-24T16:42:23.866Z"
      }
    ];

    const effectiveState = deriveEffectiveBlacklistState({
      storedBlockedUntil,
      storedTotalViolations: 3,
      traces
    });

    expect(effectiveState.totalViolations).toBe(2);
    expect(effectiveState.blockedUntil?.toISOString()).toBe("2026-06-13T16:42:23.866Z");
    expect(effectiveState.milestones.map((milestone) => milestone.trace.id)).toEqual([
      "level-1",
      "level-2"
    ]);
  });

  it("does not show stale stored totals when no counted violation milestone exists", () => {
    const effectiveState = deriveEffectiveBlacklistState({
      storedBlockedUntil: new Date("2026-06-30T00:00:00.000Z"),
      storedTotalViolations: 1,
      traces: []
    });

    expect(effectiveState).toEqual({
      blockedUntil: null,
      milestones: [],
      totalViolations: 0
    });
    expect(
      isBlacklistRestrictionActive({
        blockedUntil: effectiveState.blockedUntil,
        isActive: true,
        now: new Date("2026-06-24T00:00:00.000Z"),
        totalViolations: effectiveState.totalViolations
      })
    ).toBe(false);
  });

  it("uses the same effective deadline rule for dashboard and blacklist ledger", () => {
    const now = new Date("2026-06-20T10:00:00.000Z");

    expect(
      isBlacklistRestrictionActive({
        blockedUntil: new Date("2026-06-19T10:00:00.000Z"),
        isActive: true,
        now,
        totalViolations: 2
      })
    ).toBe(false);

    expect(
      isBlacklistRestrictionActive({
        blockedUntil: new Date("2026-06-21T10:00:00.000Z"),
        isActive: true,
        now,
        totalViolations: 2
      })
    ).toBe(true);

    expect(
      isBlacklistRestrictionActive({
        blockedUntil: new Date("2026-06-19T10:00:00.000Z"),
        isActive: true,
        now,
        totalViolations: 3
      })
    ).toBe(true);
  });
});
