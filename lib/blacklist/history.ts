export type BlacklistHistoryActorType = "manual" | "system";

type SerializeBlacklistHistoryEntryInput = {
  action: string;
  createdAt: Date;
  note: string;
  performedByType: string | null | undefined;
  performedByName: string | null;
};

function toActionLabel(action: string) {
  switch (action) {
    case "blokir_otomatis":
      return "Blokir otomatis";
    case "perpanjang_manual":
      return "Perpanjangan manual";
    case "cabut_manual":
      return "Pencabutan manual";
    default:
      return action;
  }
}

export function serializeBlacklistHistoryEntry(input: SerializeBlacklistHistoryEntryInput) {
  const actorType = input.performedByType === "system" ? "system" : "manual";

  return {
    date: input.createdAt.toISOString().slice(0, 10),
    action: input.action,
    actionLabel: toActionLabel(input.action),
    note: input.note,
    actorType,
    actorLabel: actorType === "system" ? "Sistem otomatis" : input.performedByName ?? "Admin internal"
  };
}
