import { describe, expect, it } from "vitest";

import { serializeBlacklistHistoryEntry } from "@/lib/blacklist/history";

describe("blacklist history serializer", () => {
  it("marks automatic blacklist entries as system actions", () => {
    expect(
      serializeBlacklistHistoryEntry({
        action: "blokir_otomatis",
        createdAt: new Date("2026-04-29T08:00:00.000Z"),
        note: "Buyer tidak membayar hasil lelang dalam 24 jam.",
        performedByName: null,
        performedByType: "system"
      })
    ).toEqual({
      action: "blokir_otomatis",
      actionLabel: "Blokir otomatis",
      actorLabel: "Sistem otomatis",
      actorType: "system",
      date: "2026-04-29",
      note: "Buyer tidak membayar hasil lelang dalam 24 jam."
    });
  });

  it("keeps manual actions attributed to their operator", () => {
    expect(
      serializeBlacklistHistoryEntry({
        action: "cabut_manual",
        createdAt: new Date("2026-04-30T10:15:00.000Z"),
        note: "Pembatasan dicabut setelah verifikasi.",
        performedByName: "Rika Supervisor",
        performedByType: "manual"
      })
    ).toEqual({
      action: "cabut_manual",
      actionLabel: "Pencabutan manual",
      actorLabel: "Rika Supervisor",
      actorType: "manual",
      date: "2026-04-30",
      note: "Pembatasan dicabut setelah verifikasi."
    });
  });
});
