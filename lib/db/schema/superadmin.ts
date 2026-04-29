import { boolean, index, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { users } from "@/lib/db/schema/auth";

export const units = pgTable(
  "units",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    address: text("address").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    codeIdx: uniqueIndex("units_code_unique").on(table.code)
  })
);

export const unitAccounts = pgTable(
  "rekening_unit",
  {
    id: text("id").primaryKey(),
    unitId: text("unit_id")
      .notNull()
      .references(() => units.id, { onDelete: "cascade" }),
    bankName: text("bank_name").notNull(),
    accountNumber: text("account_number").notNull(),
    accountHolderName: text("account_holder_name").notNull(),
    branchName: text("branch_name").notNull().default(""),
    isActive: boolean("is_active").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    unitIdIdx: index("rekening_unit_unit_id_idx").on(table.unitId),
    activePerUnitIdx: uniqueIndex("rekening_unit_active_per_unit_unique")
      .on(table.unitId)
      .where(sql`${table.isActive} = true`)
  })
);

export const blacklists = pgTable(
  "blacklist",
  {
    id: text("id").primaryKey(),
    unitId: text("unit_id").references(() => units.id, { onDelete: "set null" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    totalViolations: integer("total_violations").notNull().default(1),
    isActive: boolean("is_active").notNull().default(true),
    blockedAt: timestamp("blocked_at", { withTimezone: true }).notNull().defaultNow(),
    blockedUntil: timestamp("blocked_until", { withTimezone: true }),
    revokedByUserId: text("revoked_by_user_id").references(() => users.id, { onDelete: "set null" }),
    revokeReason: text("revoke_reason"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    unitIdIdx: index("blacklist_unit_id_idx").on(table.unitId),
    userIdIdx: index("blacklist_user_id_idx").on(table.userId),
    activeUserIdx: uniqueIndex("blacklist_active_user_unique")
      .on(table.userId)
      .where(sql`${table.isActive} = true`)
  })
);

export const blacklistActionLogs = pgTable(
  "blacklist_action_log",
  {
    id: text("id").primaryKey(),
    blacklistId: text("blacklist_id")
      .notNull()
      .references(() => blacklists.id, { onDelete: "cascade" }),
    targetUserId: text("target_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    performedByType: text("performed_by_type").notNull().default("manual"),
    performedByUserId: text("performed_by_user_id").references(() => users.id, { onDelete: "set null" }),
    note: text("note").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    blacklistIdIdx: index("blacklist_action_log_blacklist_id_idx").on(table.blacklistId),
    targetUserIdx: index("blacklist_action_log_target_user_id_idx").on(table.targetUserId)
  })
);
