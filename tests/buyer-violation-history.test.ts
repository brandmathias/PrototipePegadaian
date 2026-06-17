import { filterCountedBuyerViolationHistory } from "@/lib/buyer/violation-history";

describe("buyer violation history tracking", () => {
  it("keeps only escalation milestones when raw violations happen during the same active restriction", () => {
    const rows = [
      {
        id: "level-2",
        escalationEligible: true,
        occurredAt: "2026-06-12T05:33:00.000Z",
        itemName: "Kalung Emas 2",
        violationLevel: 0
      },
      {
        id: "same-window-extra",
        escalationEligible: true,
        occurredAt: "2026-05-29T14:36:04.465Z",
        itemName: "Iphone",
        violationLevel: 0
      },
      {
        id: "level-1",
        escalationEligible: true,
        occurredAt: "2026-05-29T14:36:04.422Z",
        itemName: "Mobil",
        violationLevel: 0
      }
    ];

    const counted = filterCountedBuyerViolationHistory(rows);

    expect(counted.map((item) => item.id)).toEqual(["level-2", "level-1"]);
    expect(counted.map((item) => item.violationLevel)).toEqual([2, 1]);
  });
});
