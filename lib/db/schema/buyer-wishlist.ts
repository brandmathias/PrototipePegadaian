import { index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { pemasaran } from "@/lib/db/schema/admin";
import { users } from "@/lib/db/schema/auth";

export const buyerWishlist = pgTable(
  "buyer_wishlist",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    pemasaranId: text("pemasaran_id")
      .notNull()
      .references(() => pemasaran.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    userIdx: index("buyer_wishlist_user_id_idx").on(table.userId),
    pemasaranIdx: index("buyer_wishlist_pemasaran_id_idx").on(table.pemasaranId),
    userPemasaranIdx: uniqueIndex("buyer_wishlist_user_pemasaran_unique").on(table.userId, table.pemasaranId)
  })
);
