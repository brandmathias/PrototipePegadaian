ALTER TABLE "transaksi"
  ADD COLUMN IF NOT EXISTS "payment_provider" text,
  ADD COLUMN IF NOT EXISTS "payment_order_id" text,
  ADD COLUMN IF NOT EXISTS "payment_token" text,
  ADD COLUMN IF NOT EXISTS "payment_redirect_url" text,
  ADD COLUMN IF NOT EXISTS "gateway_status" text,
  ADD COLUMN IF NOT EXISTS "gateway_payment_type" text,
  ADD COLUMN IF NOT EXISTS "gateway_transaction_id" text,
  ADD COLUMN IF NOT EXISTS "gateway_payload" jsonb,
  ADD COLUMN IF NOT EXISTS "paid_at" timestamp with time zone;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "transaksi_payment_order_id_unique"
  ON "transaksi" USING btree ("payment_order_id")
  WHERE "payment_order_id" IS NOT NULL;
--> statement-breakpoint
DROP INDEX IF EXISTS "transaksi_fixed_price_claim_unique";
--> statement-breakpoint
CREATE UNIQUE INDEX "transaksi_fixed_price_claim_unique"
  ON "transaksi" USING btree ("pemasaran_id")
  WHERE "type" = 'fixed_price'
    AND (
      "status" IN ('bukti_diunggah', 'lunas', 'selesai')
      OR ("payment_method" = 'midtrans' AND "status" = 'menunggu_pembayaran')
    );
