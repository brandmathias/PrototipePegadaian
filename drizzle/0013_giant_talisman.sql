CREATE TABLE "blacklist_review_attachment" (
	"id" text PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"uploaded_by_role" text DEFAULT 'buyer' NOT NULL,
	"file_url" text NOT NULL,
	"file_name" text DEFAULT '' NOT NULL,
	"mime_type" text DEFAULT 'application/octet-stream' NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blacklist_review_case" (
	"id" text PRIMARY KEY NOT NULL,
	"incident_id" text NOT NULL,
	"buyer_user_id" text NOT NULL,
	"submission_channel" text DEFAULT 'buyer-authenticated' NOT NULL,
	"status" text DEFAULT 'TERKIRIM' NOT NULL,
	"buyer_statement" text DEFAULT '' NOT NULL,
	"safe_summary_for_buyer" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_status_changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"admin_recommendation" text,
	"admin_recommendation_note" text,
	"admin_recommendation_by_user_id" text,
	"admin_recommendation_at" timestamp with time zone,
	"superadmin_decision" text,
	"superadmin_reason_code" text,
	"superadmin_note" text,
	"decided_by_user_id" text,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pelanggaran_user" ADD COLUMN "escalation_eligible" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "pelanggaran_user" ADD COLUMN "resolution_type" text;--> statement-breakpoint
ALTER TABLE "pelanggaran_user" ADD COLUMN "resolution_reason_code" text;--> statement-breakpoint
ALTER TABLE "pelanggaran_user" ADD COLUMN "resolution_note" text;--> statement-breakpoint
ALTER TABLE "pelanggaran_user" ADD COLUMN "resolved_by_user_id" text;--> statement-breakpoint
ALTER TABLE "pelanggaran_user" ADD COLUMN "resolved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pelanggaran_user" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "blacklist_review_attachment" ADD CONSTRAINT "blacklist_review_attachment_case_id_blacklist_review_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."blacklist_review_case"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blacklist_review_case" ADD CONSTRAINT "blacklist_review_case_incident_id_pelanggaran_user_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."pelanggaran_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blacklist_review_case" ADD CONSTRAINT "blacklist_review_case_buyer_user_id_user_id_fk" FOREIGN KEY ("buyer_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blacklist_review_case" ADD CONSTRAINT "blacklist_review_case_admin_recommendation_by_user_id_user_id_fk" FOREIGN KEY ("admin_recommendation_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blacklist_review_case" ADD CONSTRAINT "blacklist_review_case_decided_by_user_id_user_id_fk" FOREIGN KEY ("decided_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blacklist_review_attachment_case_idx" ON "blacklist_review_attachment" USING btree ("case_id");--> statement-breakpoint
CREATE UNIQUE INDEX "blacklist_review_case_incident_unique" ON "blacklist_review_case" USING btree ("incident_id");--> statement-breakpoint
CREATE INDEX "blacklist_review_case_buyer_idx" ON "blacklist_review_case" USING btree ("buyer_user_id");--> statement-breakpoint
CREATE INDEX "blacklist_review_case_status_idx" ON "blacklist_review_case" USING btree ("status");--> statement-breakpoint
CREATE INDEX "blacklist_review_case_submitted_idx" ON "blacklist_review_case" USING btree ("submitted_at");--> statement-breakpoint
ALTER TABLE "pelanggaran_user" ADD CONSTRAINT "pelanggaran_user_resolved_by_user_id_user_id_fk" FOREIGN KEY ("resolved_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;