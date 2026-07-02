export const INDONESIA_PROVINCES = [
  "Aceh",
  "Bali",
  "Banten",
  "Bengkulu",
  "DI Yogyakarta",
  "DKI Jakarta",
  "Gorontalo",
  "Jambi",
  "Jawa Barat",
  "Jawa Tengah",
  "Jawa Timur",
  "Kalimantan Barat",
  "Kalimantan Selatan",
  "Kalimantan Tengah",
  "Kalimantan Timur",
  "Kalimantan Utara",
  "Kepulauan Bangka Belitung",
  "Kepulauan Riau",
  "Lampung",
  "Maluku",
  "Maluku Utara",
  "Nusa Tenggara Barat",
  "Nusa Tenggara Timur",
  "Papua",
  "Papua Barat",
  "Papua Barat Daya",
  "Papua Pegunungan",
  "Papua Selatan",
  "Papua Tengah",
  "Riau",
  "Sulawesi Barat",
  "Sulawesi Selatan",
  "Sulawesi Tengah",
  "Sulawesi Tenggara",
  "Sulawesi Utara",
  "Sumatera Barat",
  "Sumatera Selatan",
  "Sumatera Utara",
] as const;

export type IndonesiaProvince = (typeof INDONESIA_PROVINCES)[number];

export const PROVINCE_REGION_CODES: Record<IndonesiaProvince, string> = {
  Aceh: "BNA",
  Bali: "DPS",
  Banten: "SER",
  Bengkulu: "BKL",
  "DI Yogyakarta": "YGY",
  "DKI Jakarta": "JKT",
  Gorontalo: "GTO",
  Jambi: "JBI",
  "Jawa Barat": "BDG",
  "Jawa Tengah": "SMG",
  "Jawa Timur": "SBY",
  "Kalimantan Barat": "PTK",
  "Kalimantan Selatan": "BJB",
  "Kalimantan Tengah": "PLK",
  "Kalimantan Timur": "SMD",
  "Kalimantan Utara": "TJS",
  "Kepulauan Bangka Belitung": "PKP",
  "Kepulauan Riau": "TPI",
  Lampung: "BDL",
  Maluku: "AMQ",
  "Maluku Utara": "TTE",
  "Nusa Tenggara Barat": "MTR",
  "Nusa Tenggara Timur": "KPG",
  Papua: "JYP",
  "Papua Barat": "MNN",
  "Papua Barat Daya": "SOQ",
  "Papua Pegunungan": "WMN",
  "Papua Selatan": "MKQ",
  "Papua Tengah": "NBX",
  Riau: "PKU",
  "Sulawesi Barat": "MJU",
  "Sulawesi Selatan": "MKS",
  "Sulawesi Tengah": "PLU",
  "Sulawesi Tenggara": "KDI",
  "Sulawesi Utara": "MND",
  "Sumatera Barat": "PDG",
  "Sumatera Selatan": "PLB",
  "Sumatera Utara": "MDN",
};

const provinceByNormalizedName = new Map(
  INDONESIA_PROVINCES.map((province) => [normalizeProvinceName(province), province]),
);

provinceByNormalizedName.set("nanggroe aceh darussalam", "Aceh");
provinceByNormalizedName.set("daerah istimewa yogyakarta", "DI Yogyakarta");
provinceByNormalizedName.set("di yogyakarta", "DI Yogyakarta");
provinceByNormalizedName.set("yogyakarta", "DI Yogyakarta");
provinceByNormalizedName.set("bangka belitung", "Kepulauan Bangka Belitung");

export function normalizeProvinceName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function normalizeIndonesiaProvince(value: unknown): IndonesiaProvince | null {
  const normalized = normalizeProvinceName(String(value ?? ""));

  return (provinceByNormalizedName.get(normalized) ?? null) as IndonesiaProvince | null;
}

export function getProvinceRegionCode(value: unknown) {
  const province = normalizeIndonesiaProvince(value);

  return province ? PROVINCE_REGION_CODES[province] : null;
}

export function formatUnitCode(province: unknown, unitNumber: unknown) {
  const regionCode = getProvinceRegionCode(province);
  const normalizedUnitNumber = String(unitNumber ?? "").trim();

  if (!regionCode || !/^\d{5}$/.test(normalizedUnitNumber)) {
    return null;
  }

  return `CP-${regionCode}-${normalizedUnitNumber}`;
}

export function extractUnitNumber(code: unknown) {
  return String(code ?? "")
    .trim()
    .toUpperCase()
    .match(/^CP-[A-Z]{3}-(\d{5})$/)?.[1] ?? null;
}
