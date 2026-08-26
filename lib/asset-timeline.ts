const MONTH_INDEX: Record<string, number> = {
  januari: 0,
  jan: 0,
  februari: 1,
  feb: 1,
  maret: 2,
  mar: 2,
  april: 3,
  apr: 3,
  mei: 4,
  juni: 5,
  jun: 5,
  juli: 6,
  jul: 6,
  agustus: 7,
  agu: 7,
  ags: 7,
  september: 8,
  sep: 8,
  oktober: 9,
  okt: 9,
  november: 10,
  nov: 10,
  desember: 11,
  des: 11,
};

function parseTimelineTime(value: string | null | undefined) {
  const normalized = String(value ?? "").trim();
  if (!normalized || normalized === "-") return Number.NEGATIVE_INFINITY;

  const match = normalized.match(
    /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})(?:,\s*(\d{1,2})[.:](\d{2})(?::(\d{2}))?)?/,
  );

  if (match) {
    const [, day, monthLabel, year, hour = "0", minute = "0", second = "0"] = match;
    const month = MONTH_INDEX[monthLabel.toLowerCase()];

    if (typeof month === "number") {
      return new Date(
        Number(year),
        month,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second),
      ).getTime();
    }
  }

  const parsed = Date.parse(normalized);
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
}

export function sortAssetTimelineEntries<
  T extends { createdAt?: string | null; createdAtLabel?: string | null },
>(entries: T[]) {
  return entries
    .map((entry, index) => ({
      entry,
      index,
      time: parseTimelineTime(entry.createdAt ?? entry.createdAtLabel),
    }))
    .sort((left, right) => right.time - left.time || left.index - right.index)
    .map(({ entry }) => entry);
}
