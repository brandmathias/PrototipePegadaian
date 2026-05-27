export type BarangSpecificationRecord = Record<string, string>;

export type BarangSpecificationField = {
  key: string;
  label: string;
  placeholder: string;
};

const specificationFields: Record<string, BarangSpecificationField[]> = {
  emas: [
    { key: "jenisEmas", label: "Jenis Emas", placeholder: "Contoh: Cincin, gelang, emas batangan" },
    { key: "kadarEmas", label: "Kadar Emas", placeholder: "Contoh: 24K atau 99,9%" },
    { key: "berat", label: "Berat", placeholder: "Contoh: 3,20 gram" },
    { key: "bentuk", label: "Bentuk", placeholder: "Contoh: Perhiasan atau batangan" },
    { key: "sertifikat", label: "Sertifikat", placeholder: "Contoh: Ada, Antam, UBS" }
  ],
  perhiasan: [
    { key: "jenisPerhiasan", label: "Jenis Perhiasan", placeholder: "Contoh: Cincin" },
    { key: "material", label: "Material", placeholder: "Contoh: Emas Kuning 24K" },
    { key: "kadarEmas", label: "Kadar Emas", placeholder: "Contoh: 99,9%" },
    { key: "berat", label: "Berat", placeholder: "Contoh: 3,20 gram" },
    { key: "batuUtama", label: "Batu Utama", placeholder: "Contoh: Berlian" },
    { key: "karatBatuUtama", label: "Karat Batu Utama", placeholder: "Contoh: 0,30 ct" },
    { key: "jumlahBatu", label: "Jumlah Batu", placeholder: "Contoh: 12 pcs" },
    { key: "finishing", label: "Finishing", placeholder: "Contoh: Polish Premium" }
  ],
  logam_mulia: [
    { key: "jenisLogam", label: "Jenis Logam", placeholder: "Contoh: Emas batangan" },
    { key: "brand", label: "Brand", placeholder: "Contoh: Antam" },
    { key: "kadar", label: "Kadar", placeholder: "Contoh: 999,9" },
    { key: "berat", label: "Berat", placeholder: "Contoh: 10 gram" },
    { key: "nomorSertifikat", label: "Nomor Sertifikat", placeholder: "Contoh: LM-2026-001" }
  ],
  elektronik: [
    { key: "merek", label: "Merek", placeholder: "Contoh: ASUS" },
    { key: "model", label: "Model", placeholder: "Contoh: VivoBook 14" },
    { key: "spesifikasi", label: "Spesifikasi", placeholder: "Contoh: i5, RAM 8GB, SSD 512GB" },
    { key: "kapasitas", label: "Kapasitas", placeholder: "Contoh: 512GB" },
    { key: "kelengkapan", label: "Kelengkapan", placeholder: "Contoh: Charger, dus, nota" },
    { key: "garansi", label: "Garansi", placeholder: "Contoh: Tidak ada atau resmi" }
  ],
  kendaraan: [
    { key: "merek", label: "Merek", placeholder: "Contoh: Honda" },
    { key: "tipe", label: "Tipe", placeholder: "Contoh: Vario 160" },
    { key: "tahun", label: "Tahun", placeholder: "Contoh: 2022" },
    { key: "nomorPolisi", label: "Nomor Polisi", placeholder: "Contoh: DB 1234 XX" },
    { key: "kilometer", label: "Kilometer", placeholder: "Contoh: 12.450 km" },
    { key: "dokumen", label: "Dokumen", placeholder: "Contoh: BPKB dan STNK" }
  ],
  lainnya: [
    { key: "jenisBarang", label: "Jenis Barang", placeholder: "Contoh: Jam tangan" },
    { key: "material", label: "Material", placeholder: "Contoh: Stainless steel" },
    { key: "ukuran", label: "Ukuran", placeholder: "Contoh: 42 mm" },
    { key: "kelengkapan", label: "Kelengkapan", placeholder: "Contoh: Box dan kartu" },
    { key: "catatanKhusus", label: "Catatan Khusus", placeholder: "Contoh: Ada gores halus" }
  ]
};

export function normalizeSpecificationCategory(category: string) {
  const normalized = String(category ?? "").trim().toLowerCase();
  return specificationFields[normalized] ? normalized : "lainnya";
}

export function getBarangSpecificationFields(category: string) {
  return specificationFields[normalizeSpecificationCategory(category)];
}

export function normalizeBarangSpecifications(category: string, input: unknown): BarangSpecificationRecord {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }

  const source = input as Record<string, unknown>;

  return getBarangSpecificationFields(category).reduce<BarangSpecificationRecord>((result, field) => {
    const value = String(source[field.key] ?? "").trim();
    if (value) {
      result[field.key] = value;
    }
    return result;
  }, {});
}

export function getBarangSpecificationRows(category: string, specifications: unknown) {
  const normalized = normalizeBarangSpecifications(category, specifications);

  return getBarangSpecificationFields(category)
    .map((field) => ({
      label: field.label,
      value: normalized[field.key] ?? ""
    }))
    .filter((item) => item.value.length > 0);
}
