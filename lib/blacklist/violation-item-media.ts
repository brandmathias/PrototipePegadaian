const VIOLATION_ITEM_IMAGE_BY_NAME = new Map<string, string>([
  [
    "kalung emas rantai singapura 22k",
    "/media/violation-items/kalung-emas-rantai-singapura-22k.webp",
  ],
  [
    "cincin emas solitaire 22k",
    "/media/violation-items/cincin-emas-solitaire-22k.webp",
  ],
  [
    "gelang emas bangle polos 22k",
    "/media/violation-items/gelang-emas-bangle-polos-22k.webp",
  ],
]);

function normalizeViolationItemName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("id-ID");
}

export function resolveViolationItemImageUrl({
  databaseUrl,
  itemName,
}: {
  databaseUrl?: string | null;
  itemName: string;
}) {
  if (databaseUrl?.trim()) {
    return databaseUrl;
  }

  return (
    VIOLATION_ITEM_IMAGE_BY_NAME.get(normalizeViolationItemName(itemName)) ??
    null
  );
}
