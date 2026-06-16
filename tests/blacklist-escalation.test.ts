import { describe, expect, it } from "vitest";

import {
  deriveBlacklistEscalationMilestones,
  getSequentialBlacklistViolationTotal
} from "@/lib/blacklist/escalation";

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
});
