ALTER TABLE "bids" ALTER COLUMN "nominal" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "bids" ALTER COLUMN "salt" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "bids" ADD COLUMN "revealed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pemasaran" ADD COLUMN "reveal_ends_at" timestamp with time zone;--> statement-breakpoint
UPDATE "bids" SET "revealed_at" = "created_at" WHERE "nominal" IS NOT NULL AND "salt" IS NOT NULL AND "revealed_at" IS NULL;--> statement-breakpoint
UPDATE "pemasaran" SET "reveal_ends_at" = "ends_at" + interval '10 minutes' WHERE "mode" = 'vickrey' AND "ends_at" IS NOT NULL AND "reveal_ends_at" IS NULL;
