ALTER TABLE "units" ADD COLUMN "domicile" text;--> statement-breakpoint
UPDATE "units"
SET "domicile" = CASE
  WHEN "address" ILIKE '%Aceh%' OR "address" ILIKE '%Nanggroe Aceh Darussalam%' THEN 'Aceh'
  WHEN "address" ILIKE '%Sumatera Utara%' OR "address" ILIKE '%Medan%' THEN 'Sumatera Utara'
  WHEN "address" ILIKE '%Sumatera Barat%' OR "address" ILIKE '%Padang%' THEN 'Sumatera Barat'
  WHEN "address" ILIKE '%Kepulauan Riau%' THEN 'Kepulauan Riau'
  WHEN "address" ILIKE '%Riau%' THEN 'Riau'
  WHEN "address" ILIKE '%Jambi%' THEN 'Jambi'
  WHEN "address" ILIKE '%Bengkulu%' THEN 'Bengkulu'
  WHEN "address" ILIKE '%Sumatera Selatan%' OR "address" ILIKE '%Palembang%' THEN 'Sumatera Selatan'
  WHEN "address" ILIKE '%Bangka Belitung%' THEN 'Kepulauan Bangka Belitung'
  WHEN "address" ILIKE '%Lampung%' THEN 'Lampung'
  WHEN "address" ILIKE '%Banten%' THEN 'Banten'
  WHEN "address" ILIKE '%DKI Jakarta%' OR "address" ILIKE '%Jakarta%' THEN 'DKI Jakarta'
  WHEN "address" ILIKE '%Jawa Barat%' OR "address" ILIKE '%Bandung%' THEN 'Jawa Barat'
  WHEN "address" ILIKE '%Jawa Tengah%' OR "address" ILIKE '%Semarang%' THEN 'Jawa Tengah'
  WHEN "address" ILIKE '%DI Yogyakarta%' OR "address" ILIKE '%Daerah Istimewa Yogyakarta%' OR "address" ILIKE '%Yogyakarta%' THEN 'DI Yogyakarta'
  WHEN "address" ILIKE '%Jawa Timur%' OR "address" ILIKE '%Surabaya%' THEN 'Jawa Timur'
  WHEN "address" ILIKE '%Bali%' OR "address" ILIKE '%Denpasar%' THEN 'Bali'
  WHEN "address" ILIKE '%Nusa Tenggara Barat%' OR "address" ILIKE '%Mataram%' THEN 'Nusa Tenggara Barat'
  WHEN "address" ILIKE '%Nusa Tenggara Timur%' OR "address" ILIKE '%Kupang%' THEN 'Nusa Tenggara Timur'
  WHEN "address" ILIKE '%Kalimantan Barat%' OR "address" ILIKE '%Pontianak%' THEN 'Kalimantan Barat'
  WHEN "address" ILIKE '%Kalimantan Tengah%' OR "address" ILIKE '%Palangkaraya%' THEN 'Kalimantan Tengah'
  WHEN "address" ILIKE '%Kalimantan Selatan%' OR "address" ILIKE '%Banjarbaru%' THEN 'Kalimantan Selatan'
  WHEN "address" ILIKE '%Kalimantan Timur%' OR "address" ILIKE '%Samarinda%' THEN 'Kalimantan Timur'
  WHEN "address" ILIKE '%Kalimantan Utara%' OR "address" ILIKE '%Tanjung Selor%' THEN 'Kalimantan Utara'
  WHEN "address" ILIKE '%Sulawesi Utara%' OR "address" ILIKE '%Manado%' OR "code" ILIKE '%MND%' THEN 'Sulawesi Utara'
  WHEN "address" ILIKE '%Gorontalo%' THEN 'Gorontalo'
  WHEN "address" ILIKE '%Sulawesi Tengah%' OR "address" ILIKE '%Palu%' THEN 'Sulawesi Tengah'
  WHEN "address" ILIKE '%Sulawesi Barat%' OR "address" ILIKE '%Mamuju%' THEN 'Sulawesi Barat'
  WHEN "address" ILIKE '%Sulawesi Selatan%' OR "address" ILIKE '%Makassar%' THEN 'Sulawesi Selatan'
  WHEN "address" ILIKE '%Sulawesi Tenggara%' OR "address" ILIKE '%Kendari%' THEN 'Sulawesi Tenggara'
  WHEN "address" ILIKE '%Maluku Utara%' OR "address" ILIKE '%Sofifi%' THEN 'Maluku Utara'
  WHEN "address" ILIKE '%Maluku%' OR "address" ILIKE '%Ambon%' THEN 'Maluku'
  WHEN "address" ILIKE '%Papua Barat Daya%' OR "address" ILIKE '%Sorong%' THEN 'Papua Barat Daya'
  WHEN "address" ILIKE '%Papua Barat%' OR "address" ILIKE '%Manokwari%' THEN 'Papua Barat'
  WHEN "address" ILIKE '%Papua Selatan%' OR "address" ILIKE '%Merauke%' THEN 'Papua Selatan'
  WHEN "address" ILIKE '%Papua Tengah%' OR "address" ILIKE '%Nabire%' THEN 'Papua Tengah'
  WHEN "address" ILIKE '%Papua Pegunungan%' OR "address" ILIKE '%Jayawijaya%' THEN 'Papua Pegunungan'
  WHEN "address" ILIKE '%Papua%' OR "address" ILIKE '%Jayapura%' THEN 'Papua'
  ELSE 'Sulawesi Utara'
END
WHERE "domicile" IS NULL OR btrim("domicile") = '';--> statement-breakpoint
ALTER TABLE "units" ALTER COLUMN "domicile" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_domicile_valid_check" CHECK ("domicile" IN (
  'Aceh',
  'Sumatera Utara',
  'Sumatera Barat',
  'Riau',
  'Kepulauan Riau',
  'Jambi',
  'Bengkulu',
  'Sumatera Selatan',
  'Kepulauan Bangka Belitung',
  'Lampung',
  'Banten',
  'DKI Jakarta',
  'Jawa Barat',
  'Jawa Tengah',
  'DI Yogyakarta',
  'Jawa Timur',
  'Bali',
  'Nusa Tenggara Barat',
  'Nusa Tenggara Timur',
  'Kalimantan Barat',
  'Kalimantan Tengah',
  'Kalimantan Selatan',
  'Kalimantan Timur',
  'Kalimantan Utara',
  'Sulawesi Utara',
  'Gorontalo',
  'Sulawesi Tengah',
  'Sulawesi Barat',
  'Sulawesi Selatan',
  'Sulawesi Tenggara',
  'Maluku',
  'Maluku Utara',
  'Papua Barat',
  'Papua Barat Daya',
  'Papua',
  'Papua Selatan',
  'Papua Tengah',
  'Papua Pegunungan'
));
