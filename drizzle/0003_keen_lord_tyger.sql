ALTER TABLE "blacklist_action_log" DROP CONSTRAINT "blacklist_action_log_performed_by_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "blacklist_action_log" ALTER COLUMN "performed_by_user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "blacklist_action_log" ADD COLUMN "performed_by_type" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
UPDATE "blacklist_action_log"
SET
  "performed_by_type" = 'system',
  "performed_by_user_id" = NULL
WHERE "action" = 'blokir_otomatis';--> statement-breakpoint
ALTER TABLE "blacklist_action_log" ADD CONSTRAINT "blacklist_action_log_performed_by_user_id_user_id_fk" FOREIGN KEY ("performed_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
