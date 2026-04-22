import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "@/lib/db/schema/auth";

export const buyerProfiles = pgTable(
  "buyer_profile",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    phoneNumber: text("phone_number").notNull(),
    nationalId: text("national_id").notNull(),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    userIdIdx: uniqueIndex("buyer_profile_user_id_unique").on(table.userId),
    emailIdx: uniqueIndex("buyer_profile_email_unique").on(table.email),
    nationalIdIdx: uniqueIndex("buyer_profile_national_id_unique").on(table.nationalId)
  })
);

export const buyerProfile = buyerProfiles;
