ALTER TABLE "transaksi" ADD COLUMN IF NOT EXISTS "handover_complaint_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "transaksi" ADD COLUMN IF NOT EXISTS "handover_complaint_note" text;--> statement-breakpoint
ALTER TABLE "transaksi" ADD COLUMN IF NOT EXISTS "completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "transaksi" ADD COLUMN IF NOT EXISTS "completion_source" text;
