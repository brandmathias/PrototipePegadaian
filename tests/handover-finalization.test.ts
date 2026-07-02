import { describe, expect, it } from "vitest";

import {
  getHandoverAutoCompleteDeadline,
  isHandoverAutoCompleteDue
} from "@/lib/transactions/handover-finalization";

describe("handover auto-finalization", () => {
  it("sets a three day auto-complete deadline from handover proof upload time", () => {
    expect(getHandoverAutoCompleteDeadline("2026-06-24T02:15:00.000Z")?.toISOString()).toBe(
      "2026-06-27T02:15:00.000Z",
    );
  });

  it("only auto-completes verified transactions after the grace period", () => {
    const uploadedAt = "2026-06-24T02:15:00.000Z";

    expect(isHandoverAutoCompleteDue({ status: "lunas", handoverProofUploadedAt: uploadedAt }, new Date("2026-06-27T02:15:00.000Z"))).toBe(true);
    expect(isHandoverAutoCompleteDue({ status: "lunas", handoverProofUploadedAt: uploadedAt }, new Date("2026-06-27T02:14:59.999Z"))).toBe(false);
    expect(isHandoverAutoCompleteDue({ status: "selesai", handoverProofUploadedAt: uploadedAt }, new Date("2026-06-28T00:00:00.000Z"))).toBe(false);
  });
});
