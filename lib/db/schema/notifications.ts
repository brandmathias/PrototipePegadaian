import { boolean, index, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { users } from "@/lib/db/schema/auth";

export const notifications = pgTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    message: text("message").notNull(),
    type: text("type").notNull(),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    actionHref: text("action_href"),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    readAt: timestamp("read_at", { withTimezone: true }),
    metadata: jsonb("metadata")
  },
  (table) => ({
    userUnreadCreatedIdx: index("notifications_user_unread_created_idx").on(
      table.userId,
      table.isRead,
      table.createdAt
    ),
    userCreatedIdx: index("notifications_user_created_idx").on(table.userId, table.createdAt),
    uniqueEventIdx: uniqueIndex("notifications_unique_event_idx").on(table.userId, table.type, table.entityId)
  })
);
