CREATE TABLE "buyer_wishlist" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"pemasaran_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "buyer_wishlist" ADD CONSTRAINT "buyer_wishlist_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_wishlist" ADD CONSTRAINT "buyer_wishlist_pemasaran_id_pemasaran_id_fk" FOREIGN KEY ("pemasaran_id") REFERENCES "public"."pemasaran"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "buyer_wishlist_user_id_idx" ON "buyer_wishlist" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "buyer_wishlist_pemasaran_id_idx" ON "buyer_wishlist" USING btree ("pemasaran_id");--> statement-breakpoint
CREATE UNIQUE INDEX "buyer_wishlist_user_pemasaran_unique" ON "buyer_wishlist" USING btree ("user_id","pemasaran_id");