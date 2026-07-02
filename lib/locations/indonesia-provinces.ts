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
