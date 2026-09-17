UPDATE "transaksi"
SET
  "gateway_status" = 'expire',
  "status" = 'gagal',
  "updated_at" = now()
WHERE "type" = 'fixed_price'
  AND "payment_method" = 'midtrans'
  AND "status" = 'menunggu_pembayaran'
  AND "payment_deadline" IS NOT NULL
  AND "payment_deadline" <= now();
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "transaksi"
    WHERE "type" = 'fixed_price'
      AND "payment_method" = 'midtrans'
      AND "status" = 'menunggu_pembayaran'
    GROUP BY "user_id"
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Tidak dapat memasang pengunci invoice aktif Harga Tetap karena terdapat lebih dari satu invoice aktif pada pembeli yang sama. Periksa data transaksi terlebih dahulu.';
  END IF;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "transaksi_fixed_price_buyer_active_unique"
  ON "transaksi" USING btree ("user_id")
  WHERE "type" = 'fixed_price'
    AND "payment_method" = 'midtrans'
    AND "status" = 'menunggu_pembayaran'
    AND "payment_deadline" IS NOT NULL;
