CREATE TABLE "superadmin_account_audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_user_id" text,
	"target_user_id" text,
	"action" text NOT NULL,
	"note" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "super_admin_level" text;--> statement-breakpoint
ALTER TABLE "superadmin_account_audit_log" ADD CONSTRAINT "superadmin_account_audit_log_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "superadmin_account_audit_log" ADD CONSTRAINT "superadmin_account_audit_log_target_user_id_user_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "superadmin_account_audit_actor_user_idx" ON "superadmin_account_audit_log" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "superadmin_account_audit_target_user_idx" ON "superadmin_account_audit_log" USING btree ("target_user_id");--> statement-breakpoint
CREATE INDEX "superadmin_account_audit_action_created_idx" ON "superadmin_account_audit_log" USING btree ("action","created_at");