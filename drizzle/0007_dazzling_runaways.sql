ALTER TABLE "blacklist" ADD COLUMN "national_id" text;--> statement-breakpoint
UPDATE "blacklist"
SET "national_id" = "user"."national_id"
FROM "user"
WHERE "blacklist"."user_id" = "user"."id" AND "blacklist"."national_id" IS NULL;--> statement-breakpoint
CREATE INDEX "blacklist_national_id_idx" ON "blacklist" USING btree ("national_id");--> statement-breakpoint
CREATE UNIQUE INDEX "blacklist_active_national_id_unique" ON "blacklist" USING btree ("national_id") WHERE "blacklist"."is_active" = true and "blacklist"."national_id" is not null;
