-- Jalankan hanya setelah semua sesi Vickrey aktif telah selesai/dibatalkan
-- dan backup PostgreSQL tervalidasi. Migration ini tidak dapat membangun
-- kembali payload escrow lama; rollback dilakukan dengan restore backup.
ALTER TABLE "pemasaran" DROP COLUMN IF EXISTS "reveal_ends_at";
--> statement-breakpoint
ALTER TABLE "bids" DROP COLUMN IF EXISTS "encrypted_bid_payload";
--> statement-breakpoint
ALTER TABLE "bids" DROP COLUMN IF EXISTS "bid_hash";
--> statement-breakpoint
ALTER TABLE "bids" DROP COLUMN IF EXISTS "salt";
--> statement-breakpoint
ALTER TABLE "bids" DROP COLUMN IF EXISTS "revealed_at";
--> statement-breakpoint
ALTER TABLE "bids" ALTER COLUMN "nominal" SET NOT NULL;
