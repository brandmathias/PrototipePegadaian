import { index, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { users } from "@/lib/db/schema/auth";
import { notifications } from "@/lib/db/schema/notifications";

export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    endpointUniqueIdx: uniqueIndex("push_subscriptions_endpoint_unique_idx").on(table.endpoint),
    userIdx: index("push_subscriptions_user_idx").on(table.userId)
  })
);

export const pushDeliveries = pgTable(
  "push_deliveries",
  {
    id: text("id").primaryKey(),
    notificationId: text("notification_id")
      .notNull()
      .references(() => notifications.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    lastError: text("last_error"),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    notificationUniqueIdx: uniqueIndex("push_deliveries_notification_unique_idx").on(table.notificationId),
    pendingIdx: index("push_deliveries_pending_idx").on(table.status, table.createdAt),
    userIdx: index("push_deliveries_user_idx").on(table.userId)
  })
);
