import { index, integer, numeric, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { users } from "@/lib/db/schema/auth";
import { units } from "@/lib/db/schema/superadmin";

export const barang = pgTable(
  "barang",
  {
    id: text("id").primaryKey(),
    unitId: text("unit_id")
      .notNull()
      .references(() => units.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    condition: text("condition").notNull(),
    description: text("description").notNull().default(""),
    appraisalValue: numeric("appraisal_value", { precision: 15, scale: 2 }).notNull(),
    loanValue: numeric("loan_value", { precision: 15, scale: 2 }).notNull(),
    ownerName: text("owner_name").notNull(),
    customerNumber: text("customer_number").notNull().default(""),
    pawnedAt: timestamp("pawned_at", { withTimezone: true }).notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
    status: text("status").notNull().default("gadai"),
    redeemedAt: timestamp("redeemed_at", { withTimezone: true }),
    redemptionReference: text("redemption_reference"),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    unitIdx: index("barang_unit_id_idx").on(table.unitId),
    codeIdx: uniqueIndex("barang_code_unique").on(table.code),
    statusIdx: index("barang_status_idx").on(table.status)
  })
);

export const mediaBarang = pgTable(
  "media_barang",
  {
    id: text("id").primaryKey(),
    barangId: text("barang_id")
      .notNull()
      .references(() => barang.id, { onDelete: "cascade" }),
    type: text("type").notNull().default("foto"),
    url: text("url").notNull(),
    fileName: text("file_name").notNull().default(""),
    sizeBytes: integer("size_bytes").notNull().default(0),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    barangIdx: index("media_barang_barang_id_idx").on(table.barangId)
  })
);

export const riwayatPerpanjangan = pgTable(
  "riwayat_perpanjangan",
  {
    id: text("id").primaryKey(),
    barangId: text("barang_id")
      .notNull()
      .references(() => barang.id, { onDelete: "cascade" }),
    oldDueDate: timestamp("old_due_date", { withTimezone: true }).notNull(),
    newDueDate: timestamp("new_due_date", { withTimezone: true }).notNull(),
    note: text("note").notNull().default(""),
    extendedByUserId: text("extended_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    barangIdx: index("riwayat_perpanjangan_barang_id_idx").on(table.barangId)
  })
);

export const pemasaran = pgTable(
  "pemasaran",
  {
    id: text("id").primaryKey(),
    barangId: text("barang_id")
      .notNull()
      .references(() => barang.id, { onDelete: "cascade" }),
    mode: text("mode").notNull(),
    price: numeric("price", { precision: 15, scale: 2 }),
    basePrice: numeric("base_price", { precision: 15, scale: 2 }),
    durationDays: integer("duration_days"),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    winnerId: text("winner_id").references(() => users.id, { onDelete: "set null" }),
    finalPrice: numeric("final_price", { precision: 15, scale: 2 }),
    iteration: integer("iteration").notNull().default(1),
    status: text("status").notNull().default("aktif"),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    barangIdx: index("pemasaran_barang_id_idx").on(table.barangId),
    activePerBarangIdx: uniqueIndex("pemasaran_active_per_barang_unique")
      .on(table.barangId)
      .where(sql`${table.status} = 'aktif'`)
  })
);

export const bids = pgTable(
  "bids",
  {
    id: text("id").primaryKey(),
    pemasaranId: text("pemasaran_id")
      .notNull()
      .references(() => pemasaran.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bidHash: text("bid_hash").notNull(),
    nominal: numeric("nominal", { precision: 15, scale: 2 }).notNull(),
    salt: text("salt").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    pemasaranUserIdx: uniqueIndex("bids_pemasaran_user_unique").on(table.pemasaranId, table.userId)
  })
);

export const transaksi = pgTable(
  "transaksi",
  {
    id: text("id").primaryKey(),
    pemasaranId: text("pemasaran_id")
      .notNull()
      .references(() => pemasaran.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
    paymentMethod: text("payment_method"),
    status: text("status").notNull().default("menunggu_pembayaran"),
    proofUrl: text("proof_url"),
    rejectionReason: text("rejection_reason"),
    referenceNumber: text("reference_number"),
    paymentDeadline: timestamp("payment_deadline", { withTimezone: true }),
    verifiedByUserId: text("verified_by_user_id").references(() => users.id, { onDelete: "set null" }),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    pemasaranIdx: index("transaksi_pemasaran_id_idx").on(table.pemasaranId),
    userIdx: index("transaksi_user_id_idx").on(table.userId),
    statusIdx: index("transaksi_status_idx").on(table.status)
  })
);

export const pelanggaranUser = pgTable(
  "pelanggaran_user",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    pemasaranId: text("pemasaran_id")
      .notNull()
      .references(() => pemasaran.id, { onDelete: "cascade" }),
    transaksiId: text("transaksi_id")
      .notNull()
      .references(() => transaksi.id, { onDelete: "cascade" }),
    unitId: text("unit_id")
      .notNull()
      .references(() => units.id, { onDelete: "cascade" }),
    note: text("note").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    unitIdx: index("pelanggaran_user_unit_id_idx").on(table.unitId),
    userIdx: index("pelanggaran_user_user_id_idx").on(table.userId)
  })
);

export const riwayatStatusBarang = pgTable(
  "riwayat_status_barang",
  {
    id: text("id").primaryKey(),
    barangId: text("barang_id")
      .notNull()
      .references(() => barang.id, { onDelete: "cascade" }),
    oldStatus: text("old_status"),
    newStatus: text("new_status").notNull(),
    changedByUserId: text("changed_by_user_id").references(() => users.id, { onDelete: "set null" }),
    note: text("note").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    barangIdx: index("riwayat_status_barang_barang_id_idx").on(table.barangId)
  })
);
