ALTER TABLE "transaksi" ADD COLUMN "handover_complaint_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "transaksi" ADD COLUMN "handover_complaint_note" text;--> statement-breakpoint
ALTER TABLE "transaksi" ADD COLUMN "completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "transaksi" ADD COLUMN "completion_source" text;