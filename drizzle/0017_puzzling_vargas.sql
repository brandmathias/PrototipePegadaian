ALTER TABLE "transaksi" ADD COLUMN "handover_proof_url" text;--> statement-breakpoint
ALTER TABLE "transaksi" ADD COLUMN "handover_proof_uploaded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "transaksi" ADD COLUMN "handover_proof_uploaded_by_user_id" text;--> statement-breakpoint
ALTER TABLE "transaksi" ADD CONSTRAINT "transaksi_handover_proof_uploaded_by_user_id_user_id_fk" FOREIGN KEY ("handover_proof_uploaded_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;