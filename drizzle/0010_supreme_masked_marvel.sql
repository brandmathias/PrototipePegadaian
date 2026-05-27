CREATE TABLE "pemasaran_views" (
	"id" text PRIMARY KEY NOT NULL,
	"pemasaran_id" text NOT NULL,
	"viewer_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pemasaran_views" ADD CONSTRAINT "pemasaran_views_pemasaran_id_pemasaran_id_fk" FOREIGN KEY ("pemasaran_id") REFERENCES "public"."pemasaran"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pemasaran_views_pemasaran_id_idx" ON "pemasaran_views" USING btree ("pemasaran_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pemasaran_views_pemasaran_viewer_unique" ON "pemasaran_views" USING btree ("pemasaran_id","viewer_key");