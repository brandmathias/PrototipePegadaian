export const INDONESIA_PROVINCES = [
  "Aceh",
  "Sumatera Utara",
  "Sumatera Barat",
  "Riau",
  "Kepulauan Riau",
  "Jambi",
  "Bengkulu",
  "Sumatera Selatan",
  "Kepulauan Bangka Belitung",
  "Lampung",
  "Banten",
  "DKI Jakarta",
  "Jawa Barat",
  "Jawa Tengah",
  "DI Yogyakarta",
  "Jawa Timur",
  "Bali",
  "Nusa Tenggara Barat",
  "Nusa Tenggara Timur",
  "Kalimantan Barat",
  "Kalimantan Tengah",
  "Kalimantan Selatan",
  "Kalimantan Timur",
  "Kalimantan Utara",
  "Sulawesi Utara",
  "Gorontalo",
  "Sulawesi Tengah",
  "Sulawesi Barat",
  "Sulawesi Selatan",
  "Sulawesi Tenggara",
  "Maluku",
  "Maluku Utara",
  "Papua Barat",
  "Papua Barat Daya",
  "Papua",
  "Papua Selatan",
  "Papua Tengah",
  "Papua Pegunungan",
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
