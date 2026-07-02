type SerializeBlacklistHistoryEntryInput = {
  action: string;
  createdAt: Date;
  note: string;
};

function toActionLabel(action: string) {
  switch (action) {
    case "blokir_otomatis":
      return "Blokir otomatis";
    case "selesai_otomatis":
      return "Selesai otomatis";
    default:
      return action;
  }
}

export function serializeBlacklistHistoryEntry(input: SerializeBlacklistHistoryEntryInput) {
  return {
    date: input.createdAt.toISOString().slice(0, 10),
    action: input.action,
    actionLabel: toActionLabel(input.action),
    note: input.note,
    actorType: "system" as const,
    actorLabel: "Sistem otomatis"
  };
}
