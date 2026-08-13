DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "transaksi"
    WHERE "type" = 'fixed_price'
      AND "status" IN ('bukti_diunggah', 'lunas', 'selesai')
    GROUP BY "pemasaran_id"
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Tidak dapat memasang pengunci klaim Harga Tetap karena terdapat lebih dari satu transaksi aktif pada sesi yang sama. Perbaiki data konflik terlebih dahulu.';
  END IF;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "transaksi_fixed_price_claim_unique"
  ON "transaksi" USING btree ("pemasaran_id")
  WHERE "type" = 'fixed_price'
    AND "status" IN ('bukti_diunggah', 'lunas', 'selesai');
