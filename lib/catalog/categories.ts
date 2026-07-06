export const ADMIN_UNIT_CATEGORY_OPTIONS = [
  { value: "perhiasan", label: "Perhiasan", iconKey: "perhiasan" },
  { value: "logam_mulia", label: "Logam Mulia", iconKey: "logam_mulia" },
  { value: "elektronik", label: "Elektronik", iconKey: "elektronik" },
  { value: "kendaraan", label: "Kendaraan", iconKey: "kendaraan" },
  { value: "lainnya", label: "Lainnya", iconKey: "lainnya" }
] as const;

export function compareCategoryFilterLabels(left: string, right: string) {
  if (left === right) return 0;
  if (left === "Lainnya") return 1;
  if (right === "Lainnya") return -1;
  return left.localeCompare(right, "id-ID");
}

export const ADMIN_UNIT_CATEGORY_FILTER_OPTIONS = [...ADMIN_UNIT_CATEGORY_OPTIONS].sort((left, right) =>
  compareCategoryFilterLabels(left.label, right.label)
);

export type AdminUnitCategory = (typeof ADMIN_UNIT_CATEGORY_OPTIONS)[number]["value"];
export type AdminUnitCategoryIconKey = (typeof ADMIN_UNIT_CATEGORY_OPTIONS)[number]["iconKey"];

type CategoryResolutionInput = {
  category?: string | null;
  itemName?: string | null;
  specifications?: unknown;
};

const CATEGORY_LABEL_BY_VALUE: Record<AdminUnitCategory, string> = ADMIN_UNIT_CATEGORY_OPTIONS.reduce(
  (result, option) => {
    result[option.value] = option.label;
    return result;
  },
  {} as Record<AdminUnitCategory, string>
);

const LOGAM_MULIA_KEYWORDS = [
  "antam",
  "ubs",
  "batangan",
  "emas batangan",
  "logam mulia",
  "fine gold",
  "gold bar"
];

const PERHIASAN_KEYWORDS = [
  "cincin",
  "gelang",
  "kalung",
  "liontin",
  "anting",
  "bros",
  "perhiasan"
];

const ELEKTRONIK_KEYWORDS = [
  "elektronik",
  "laptop",
  "notebook",
  "komputer",
  "monitor",
  "televisi",
  "tv",
  "smartphone",
  "handphone",
  "hp",
  "iphone",
  "android",
  "kamera",
  "gadget"
];

const KENDARAAN_KEYWORDS = [
  "kendaraan",
  "mobil",
  "motor",
  "sepeda motor",
  "truck",
  "truk",
  "pickup"
];

function normalize(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

function flattenSpecificationValues(specifications: unknown): string[] {
  if (!specifications || typeof specifications !== "object" || Array.isArray(specifications)) {
    return [];
  }

  return Object.entries(specifications as Record<string, unknown>).flatMap(([key, value]) => {
    if (value == null) {
      return [];
    }

    return [key, String(value)];
  });
}

function buildCategoryHaystack(input: CategoryResolutionInput) {
  return [
    normalize(input.category),
    normalize(input.itemName),
    ...flattenSpecificationValues(input.specifications).map((value) => normalize(value))
  ]
    .filter(Boolean)
    .join(" ");
}

function hasAnyKeyword(haystack: string, keywords: string[]) {
  return keywords.some((keyword) => haystack.includes(keyword));
}

export function resolveAdminUnitCategory(input: CategoryResolutionInput): AdminUnitCategory {
  const rawCategory = normalize(input.category);
  const haystack = buildCategoryHaystack(input);

  if (rawCategory === "perhiasan" || hasAnyKeyword(haystack, PERHIASAN_KEYWORDS)) {
    if (rawCategory !== "emas") {
      return "perhiasan";
    }
  }

  if (rawCategory === "logam_mulia" || rawCategory.includes("logam") || hasAnyKeyword(haystack, LOGAM_MULIA_KEYWORDS)) {
    return "logam_mulia";
  }

  if (rawCategory === "elektronik" || hasAnyKeyword(haystack, ELEKTRONIK_KEYWORDS)) {
    return "elektronik";
  }

  if (rawCategory === "kendaraan" || hasAnyKeyword(haystack, KENDARAAN_KEYWORDS)) {
    return "kendaraan";
  }

  if (rawCategory === "lainnya" || rawCategory.includes("lain")) {
    return "lainnya";
  }

  if (rawCategory === "emas" || rawCategory.includes("emas")) {
    return hasAnyKeyword(haystack, LOGAM_MULIA_KEYWORDS) ? "logam_mulia" : "perhiasan";
  }

  if (hasAnyKeyword(haystack, PERHIASAN_KEYWORDS)) {
    return "perhiasan";
  }

  return "lainnya";
}

export function getAdminUnitCategoryLabel(category: AdminUnitCategory) {
  return CATEGORY_LABEL_BY_VALUE[category];
}

export function resolveAdminUnitCategoryLabel(input: CategoryResolutionInput) {
  return getAdminUnitCategoryLabel(resolveAdminUnitCategory(input));
}

export function resolveAdminUnitCategoryIconKey(input: CategoryResolutionInput): AdminUnitCategoryIconKey {
  return resolveAdminUnitCategory(input);
}
