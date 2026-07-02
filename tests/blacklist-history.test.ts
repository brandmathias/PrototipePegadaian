import { describe, expect, it } from "vitest";

import { serializeBlacklistHistoryEntry } from "@/lib/blacklist/history";

describe("blacklist history serializer", () => {
  it("marks automatic blacklist entries as system actions", () => {
    expect(
      serializeBlacklistHistoryEntry({
        action: "blokir_otomatis",
        createdAt: new Date("2026-04-29T08:00:00.000Z"),
        note: "Buyer tidak membayar hasil lelang dalam 24 jam."
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

  it("keeps automatic expiry actions attributed to the system", () => {
    expect(
      serializeBlacklistHistoryEntry({
        action: "selesai_otomatis",
        createdAt: new Date("2026-04-30T10:15:00.000Z"),
        note: "Masa pembatasan berakhir otomatis."
      })
    ).toEqual({
      action: "selesai_otomatis",
      actionLabel: "Selesai otomatis",
      actorLabel: "Sistem otomatis",
      actorType: "system",
      date: "2026-04-30",
      note: "Masa pembatasan berakhir otomatis."
    });
  });
});
