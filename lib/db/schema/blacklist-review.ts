import { foreignKey, index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { pelanggaranUser } from "@/lib/db/schema/admin";
import { users } from "@/lib/db/schema/auth";

export const blacklistReviewCases = pgTable(
  "blacklist_review_case",
  {
    id: text("id").primaryKey(),
    incidentId: text("incident_id").notNull(),
    buyerUserId: text("buyer_user_id").notNull(),
    submissionChannel: text("submission_channel").notNull().default("buyer-authenticated"),
    status: text("status").notNull().default("TERKIRIM"),
    buyerStatement: text("buyer_statement").notNull().default(""),
    safeSummaryForBuyer: text("safe_summary_for_buyer"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
    lastStatusChangedAt: timestamp("last_status_changed_at", { withTimezone: true }).notNull().defaultNow(),
    adminRecommendation: text("admin_recommendation"),
    adminRecommendationNote: text("admin_recommendation_note"),
    adminRecommendationByUserId: text("admin_recommendation_by_user_id"),
    adminRecommendationAt: timestamp("admin_recommendation_at", { withTimezone: true }),
    superadminDecision: text("superadmin_decision"),
    superadminReasonCode: text("superadmin_reason_code"),
    superadminNote: text("superadmin_note"),
    decidedByUserId: text("decided_by_user_id"),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    incidentFk: foreignKey({
      columns: [table.incidentId],
      foreignColumns: [pelanggaranUser.id],
      name: "brc_incident_fk"
    }).onDelete("cascade"),
    buyerFk: foreignKey({
      columns: [table.buyerUserId],
      foreignColumns: [users.id],
      name: "brc_buyer_user_fk"
    }).onDelete("cascade"),
    adminRecommendationByFk: foreignKey({
      columns: [table.adminRecommendationByUserId],
      foreignColumns: [users.id],
      name: "brc_admin_reco_by_fk"
    }).onDelete("set null"),
    decidedByFk: foreignKey({
      columns: [table.decidedByUserId],
      foreignColumns: [users.id],
      name: "brc_decided_by_fk"
    }).onDelete("set null"),
    incidentUniqueIdx: uniqueIndex("blacklist_review_case_incident_unique").on(table.incidentId),
    buyerIdx: index("blacklist_review_case_buyer_idx").on(table.buyerUserId),
    statusIdx: index("blacklist_review_case_status_idx").on(table.status),
    submittedIdx: index("blacklist_review_case_submitted_idx").on(table.submittedAt)
  })
);

export const blacklistReviewAttachments = pgTable(
  "blacklist_review_attachment",
  {
    id: text("id").primaryKey(),
    caseId: text("case_id").notNull(),
    uploadedByRole: text("uploaded_by_role").notNull().default("buyer"),
    fileUrl: text("file_url").notNull(),
    fileName: text("file_name").notNull().default(""),
    mimeType: text("mime_type").notNull().default("application/octet-stream"),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    caseFk: foreignKey({
      columns: [table.caseId],
      foreignColumns: [blacklistReviewCases.id],
      name: "bra_case_fk"
    }).onDelete("cascade"),
    caseIdx: index("blacklist_review_attachment_case_idx").on(table.caseId)
  })
);
