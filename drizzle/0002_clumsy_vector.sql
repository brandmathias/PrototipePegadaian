CREATE TABLE "barang" (
	"id" text PRIMARY KEY NOT NULL,
	"unit_id" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"condition" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"appraisal_value" numeric(15, 2) NOT NULL,
	"loan_value" numeric(15, 2) NOT NULL,
	"owner_name" text NOT NULL,
	"customer_number" text DEFAULT '' NOT NULL,
	"pawned_at" timestamp with time zone NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'gadai' NOT NULL,
	"redeemed_at" timestamp with time zone,
	"redemption_reference" text,
	"created_by_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bids" (
	"id" text PRIMARY KEY NOT NULL,
	"pemasaran_id" text NOT NULL,
	"user_id" text NOT NULL,
	"bid_hash" text NOT NULL,
	"nominal" numeric(15, 2) NOT NULL,
	"salt" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_barang" (
	"id" text PRIMARY KEY NOT NULL,
	"barang_id" text NOT NULL,
	"type" text DEFAULT 'foto' NOT NULL,
	"url" text NOT NULL,
	"file_name" text DEFAULT '' NOT NULL,
	"size_bytes" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pelanggaran_user" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"pemasaran_id" text NOT NULL,
	"transaksi_id" text NOT NULL,
	"unit_id" text NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pemasaran" (
	"id" text PRIMARY KEY NOT NULL,
	"barang_id" text NOT NULL,
	"mode" text NOT NULL,
	"price" numeric(15, 2),
	"base_price" numeric(15, 2),
	"duration_days" integer,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"winner_id" text,
	"final_price" numeric(15, 2),
	"iteration" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'aktif' NOT NULL,
	"created_by_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "riwayat_perpanjangan" (
	"id" text PRIMARY KEY NOT NULL,
	"barang_id" text NOT NULL,
	"old_due_date" timestamp with time zone NOT NULL,
	"new_due_date" timestamp with time zone NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"extended_by_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "riwayat_status_barang" (
	"id" text PRIMARY KEY NOT NULL,
	"barang_id" text NOT NULL,
	"old_status" text,
	"new_status" text NOT NULL,
	"changed_by_user_id" text,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaksi" (
	"id" text PRIMARY KEY NOT NULL,
	"pemasaran_id" text NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"payment_method" text,
	"status" text DEFAULT 'menunggu_pembayaran' NOT NULL,
	"proof_url" text,
	"rejection_reason" text,
	"reference_number" text,
	"payment_deadline" timestamp with time zone,
	"verified_by_user_id" text,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "barang" ADD CONSTRAINT "barang_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "barang" ADD CONSTRAINT "barang_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bids" ADD CONSTRAINT "bids_pemasaran_id_pemasaran_id_fk" FOREIGN KEY ("pemasaran_id") REFERENCES "public"."pemasaran"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bids" ADD CONSTRAINT "bids_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_barang" ADD CONSTRAINT "media_barang_barang_id_barang_id_fk" FOREIGN KEY ("barang_id") REFERENCES "public"."barang"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelanggaran_user" ADD CONSTRAINT "pelanggaran_user_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelanggaran_user" ADD CONSTRAINT "pelanggaran_user_pemasaran_id_pemasaran_id_fk" FOREIGN KEY ("pemasaran_id") REFERENCES "public"."pemasaran"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelanggaran_user" ADD CONSTRAINT "pelanggaran_user_transaksi_id_transaksi_id_fk" FOREIGN KEY ("transaksi_id") REFERENCES "public"."transaksi"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pelanggaran_user" ADD CONSTRAINT "pelanggaran_user_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pemasaran" ADD CONSTRAINT "pemasaran_barang_id_barang_id_fk" FOREIGN KEY ("barang_id") REFERENCES "public"."barang"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pemasaran" ADD CONSTRAINT "pemasaran_winner_id_user_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pemasaran" ADD CONSTRAINT "pemasaran_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "riwayat_perpanjangan" ADD CONSTRAINT "riwayat_perpanjangan_barang_id_barang_id_fk" FOREIGN KEY ("barang_id") REFERENCES "public"."barang"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "riwayat_perpanjangan" ADD CONSTRAINT "riwayat_perpanjangan_extended_by_user_id_user_id_fk" FOREIGN KEY ("extended_by_user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "riwayat_status_barang" ADD CONSTRAINT "riwayat_status_barang_barang_id_barang_id_fk" FOREIGN KEY ("barang_id") REFERENCES "public"."barang"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "riwayat_status_barang" ADD CONSTRAINT "riwayat_status_barang_changed_by_user_id_user_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaksi" ADD CONSTRAINT "transaksi_pemasaran_id_pemasaran_id_fk" FOREIGN KEY ("pemasaran_id") REFERENCES "public"."pemasaran"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaksi" ADD CONSTRAINT "transaksi_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaksi" ADD CONSTRAINT "transaksi_verified_by_user_id_user_id_fk" FOREIGN KEY ("verified_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "barang_unit_id_idx" ON "barang" USING btree ("unit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "barang_code_unique" ON "barang" USING btree ("code");--> statement-breakpoint
CREATE INDEX "barang_status_idx" ON "barang" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "bids_pemasaran_user_unique" ON "bids" USING btree ("pemasaran_id","user_id");--> statement-breakpoint
CREATE INDEX "media_barang_barang_id_idx" ON "media_barang" USING btree ("barang_id");--> statement-breakpoint
CREATE INDEX "pelanggaran_user_unit_id_idx" ON "pelanggaran_user" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "pelanggaran_user_user_id_idx" ON "pelanggaran_user" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "pemasaran_barang_id_idx" ON "pemasaran" USING btree ("barang_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pemasaran_active_per_barang_unique" ON "pemasaran" USING btree ("barang_id") WHERE "pemasaran"."status" = 'aktif';--> statement-breakpoint
CREATE INDEX "riwayat_perpanjangan_barang_id_idx" ON "riwayat_perpanjangan" USING btree ("barang_id");--> statement-breakpoint
CREATE INDEX "riwayat_status_barang_barang_id_idx" ON "riwayat_status_barang" USING btree ("barang_id");--> statement-breakpoint
CREATE INDEX "transaksi_pemasaran_id_idx" ON "transaksi" USING btree ("pemasaran_id");--> statement-breakpoint
CREATE INDEX "transaksi_user_id_idx" ON "transaksi" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "transaksi_status_idx" ON "transaksi" USING btree ("status");