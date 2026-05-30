ALTER TABLE "blacklist_review_attachment" DROP CONSTRAINT "blacklist_review_attachment_case_id_blacklist_review_case_id_fk";
--> statement-breakpoint
ALTER TABLE "blacklist_review_case" DROP CONSTRAINT "blacklist_review_case_incident_id_pelanggaran_user_id_fk";
--> statement-breakpoint
ALTER TABLE "blacklist_review_case" DROP CONSTRAINT "blacklist_review_case_buyer_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "blacklist_review_case" DROP CONSTRAINT "blacklist_review_case_admin_recommendation_by_user_id_user_id_f";
--> statement-breakpoint
ALTER TABLE "blacklist_review_case" DROP CONSTRAINT "blacklist_review_case_decided_by_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "blacklist_review_attachment" ADD CONSTRAINT "bra_case_fk" FOREIGN KEY ("case_id") REFERENCES "public"."blacklist_review_case"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blacklist_review_case" ADD CONSTRAINT "brc_incident_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."pelanggaran_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blacklist_review_case" ADD CONSTRAINT "brc_buyer_user_fk" FOREIGN KEY ("buyer_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blacklist_review_case" ADD CONSTRAINT "brc_admin_reco_by_fk" FOREIGN KEY ("admin_recommendation_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blacklist_review_case" ADD CONSTRAINT "brc_decided_by_fk" FOREIGN KEY ("decided_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
