CREATE TABLE "blacklist_action_log" (
	"id" text PRIMARY KEY NOT NULL,
	"blacklist_id" text NOT NULL,
	"target_user_id" text NOT NULL,
	"action" text NOT NULL,
	"performed_by_user_id" text NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blacklist" (
	"id" text PRIMARY KEY NOT NULL,
	"unit_id" text,
	"user_id" text NOT NULL,
	"total_violations" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"blocked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"blocked_until" timestamp with time zone,
	"revoked_by_user_id" text,
	"revoke_reason" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rekening_unit" (
	"id" text PRIMARY KEY NOT NULL,
	"unit_id" text NOT NULL,
	"bank_name" text NOT NULL,
	"account_number" text NOT NULL,
	"account_holder_name" text NOT NULL,
	"branch_name" text DEFAULT '' NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "unit_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "blacklist_action_log" ADD CONSTRAINT "blacklist_action_log_blacklist_id_blacklist_id_fk" FOREIGN KEY ("blacklist_id") REFERENCES "public"."blacklist"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blacklist_action_log" ADD CONSTRAINT "blacklist_action_log_target_user_id_user_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blacklist_action_log" ADD CONSTRAINT "blacklist_action_log_performed_by_user_id_user_id_fk" FOREIGN KEY ("performed_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blacklist" ADD CONSTRAINT "blacklist_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blacklist" ADD CONSTRAINT "blacklist_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blacklist" ADD CONSTRAINT "blacklist_revoked_by_user_id_user_id_fk" FOREIGN KEY ("revoked_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rekening_unit" ADD CONSTRAINT "rekening_unit_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blacklist_action_log_blacklist_id_idx" ON "blacklist_action_log" USING btree ("blacklist_id");--> statement-breakpoint
CREATE INDEX "blacklist_action_log_target_user_id_idx" ON "blacklist_action_log" USING btree ("target_user_id");--> statement-breakpoint
CREATE INDEX "blacklist_unit_id_idx" ON "blacklist" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "blacklist_user_id_idx" ON "blacklist" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "blacklist_active_user_unique" ON "blacklist" USING btree ("user_id") WHERE "blacklist"."is_active" = true;--> statement-breakpoint
CREATE INDEX "rekening_unit_unit_id_idx" ON "rekening_unit" USING btree ("unit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "rekening_unit_active_per_unit_unique" ON "rekening_unit" USING btree ("unit_id") WHERE "rekening_unit"."is_active" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "units_code_unique" ON "units" USING btree ("code");--> statement-breakpoint
CREATE INDEX "user_unit_id_idx" ON "user" USING btree ("unit_id");