import { randomUUID } from "node:crypto";

import { and, desc, eq, gt, isNull, or } from "drizzle-orm";

import {
  BLACKLIST_REVIEW_APPROVAL_REASONS,
  BLACKLIST_REVIEW_REJECTION_REASONS,
  isBlacklistReviewTerminalStatus,
  serializeBuyerSafeReviewCase,
  validateAdminBlacklistRecommendationPayload,
  validateBlacklistReviewCasePayload,
  validateBlacklistReviewDecisionPayload,
  validatePublicBlacklistHelpLookupPayload,
  type BlacklistReviewDecision
} from "@/lib/blacklist/review";
import { shouldSuspendLoginForBlacklist } from "@/lib/blacklist/restrictions";
import { db } from "@/lib/db/client";
import {
  barang,
  blacklistActionLogs,
  blacklistReviewAttachments,
  blacklistReviewCases,
  blacklists,
  mediaBarang,
  pelanggaranUser,
  pemasaran,
  transaksi,
  units,
  users
} from "@/lib/db/schema";
import {
  notifyBlacklistReviewApproved,
  notifyBlacklistReviewRejected,
  notifyBlacklistReviewSubmitted
} from "@/lib/services/notification-events";

type DbExecutor = Pick<typeof db, "insert" | "select" | "update">;
type BlacklistRow = typeof blacklists.$inferSelect;
type ReviewCaseRow = typeof blacklistReviewCases.$inferSelect;

const ACTIVE_BLACKLIST_MESSAGE = "Blacklist aktif untuk insiden ini tidak ditemukan.";

function getDecisionReasonLabel(decision: BlacklistReviewDecision, reasonCode: string) {
  const reasons = decision === "DISETUJUI" ? BLACKLIST_REVIEW_APPROVAL_REASONS : BLACKLIST_REVIEW_REJECTION_REASONS;
  return reasons.find((item) => item.code === reasonCode)?.label ?? reasonCode;
}

function buildSafeDecisionSummary(decision: BlacklistReviewDecision, reasonCode: string) {
  const reasonLabel = getDecisionReasonLabel(decision, reasonCode).toLowerCase();

  if (decision === "DISETUJUI") {
    return `Review disetujui. Pembatasan untuk insiden ini dicabut karena ${reasonLabel}.`;
  }

  return `Review ditolak. Blacklist tetap berlaku karena ${reasonLabel}.`;
}

function getActiveBlacklistWhere(userId: string) {
  return and(
    eq(blacklists.userId, userId),
    eq(blacklists.isActive, true),
    or(isNull(blacklists.blockedUntil), gt(blacklists.blockedUntil, new Date()))
  );
}

async function getActiveBlacklistForUser(executor: DbExecutor, userId: string) {
  const [activeBlacklist] = await executor
    .select()
    .from(blacklists)
    .where(getActiveBlacklistWhere(userId))
    .limit(1);

  return activeBlacklist ?? null;
}

async function getIncidentForBuyer(incidentId: string, buyerUserId: string) {
  const [row] = await db
    .select({
      incident: pelanggaranUser,
      activeBlacklist: blacklists,
      buyer: users,
      transaction: transaksi,
      auction: pemasaran,
      item: barang,
      unit: units
    })
    .from(pelanggaranUser)
    .innerJoin(users, eq(users.id, pelanggaranUser.userId))
    .innerJoin(transaksi, eq(transaksi.id, pelanggaranUser.transaksiId))
    .innerJoin(pemasaran, eq(pemasaran.id, pelanggaranUser.pemasaranId))
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .innerJoin(units, eq(units.id, pelanggaranUser.unitId))
    .leftJoin(blacklists, and(eq(blacklists.userId, pelanggaranUser.userId), eq(blacklists.isActive, true)))
    .where(and(eq(pelanggaranUser.id, incidentId), eq(pelanggaranUser.userId, buyerUserId)))
    .limit(1);

  return row ?? null;
}

async function getCaseByIncident(incidentId: string) {
  const [row] = await db
    .select()
    .from(blacklistReviewCases)
    .where(eq(blacklistReviewCases.incidentId, incidentId))
    .limit(1);

  return row ?? null;
}

async function getAttachments(caseId: string) {
  return db
    .select()
    .from(blacklistReviewAttachments)
    .where(eq(blacklistReviewAttachments.caseId, caseId))
    .orderBy(desc(blacklistReviewAttachments.uploadedAt));
}

function toNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

async function serializeCaseWithAttachments(row: ReviewCaseRow) {
  const attachments = await getAttachments(row.id);

  return {
    ...serializeBuyerSafeReviewCase({
      id: row.id,
      incidentId: row.incidentId,
      status: row.status as any,
      submittedAt: row.submittedAt,
      safeSummaryForBuyer: row.safeSummaryForBuyer
    }),
    attachments: attachments.map((item) => ({
      id: item.id,
      fileUrl: item.fileUrl,
      fileName: item.fileName,
      mimeType: item.mimeType,
      uploadedAt: item.uploadedAt.toISOString()
    }))
  };
}

export async function listBuyerBlacklistReviewCases(userId: string) {
  const rows = await db
    .select()
    .from(blacklistReviewCases)
    .where(eq(blacklistReviewCases.buyerUserId, userId))
    .orderBy(desc(blacklistReviewCases.submittedAt));

  return Promise.all(rows.map(serializeCaseWithAttachments));
}

export async function createBuyerBlacklistReviewCase(
  userId: string,
  input: {
    incidentId?: unknown;
    buyerStatement?: unknown;
    evidence?: unknown;
  },
  submissionChannel: "buyer-authenticated" | "public" = "buyer-authenticated"
) {
  const payload = validateBlacklistReviewCasePayload(input);
  const context = await getIncidentForBuyer(payload.incidentId, userId);

  if (!context) {
    throw new Error("Insiden blacklist tidak ditemukan.");
  }

  if (!context.incident.escalationEligible) {
    throw new Error("Insiden ini sudah tidak masuk eskalasi blacklist.");
  }

  const activeBlacklist = await getActiveBlacklistForUser(db, userId);
  if (!activeBlacklist) {
    throw new Error(ACTIVE_BLACKLIST_MESSAGE);
  }

  const existingCase = await getCaseByIncident(payload.incidentId);
  if (existingCase) {
    return serializeCaseWithAttachments(existingCase);
  }

  const now = new Date();
  const created = await db.transaction(async (tx) => {
    const [caseRow] = await tx
      .insert(blacklistReviewCases)
      .values({
        id: randomUUID(),
        incidentId: payload.incidentId,
        buyerUserId: userId,
        submissionChannel,
        status: "TERKIRIM",
        buyerStatement: payload.buyerStatement,
        safeSummaryForBuyer: "Pengajuan review insiden sudah terkirim dan menunggu peninjauan.",
        submittedAt: now,
        lastStatusChangedAt: now,
        createdAt: now,
        updatedAt: now
      })
      .returning();

    if (!caseRow) {
      throw new Error("Bantuan blacklist gagal dibuat.");
    }

    await tx.insert(blacklistReviewAttachments).values(
      payload.evidence.map((item) => ({
        id: randomUUID(),
        caseId: caseRow.id,
        uploadedByRole: "buyer",
        fileUrl: item.fileUrl,
        fileName: item.fileName,
        mimeType: item.mimeType,
        uploadedAt: now
      }))
    );

    await tx.insert(blacklistActionLogs).values({
      id: randomUUID(),
      blacklistId: activeBlacklist.id,
      targetUserId: userId,
      action: "review_diajukan",
      performedByType: "buyer",
      performedByUserId: userId,
      note: "Buyer mengajukan review insiden pelanggaran dengan bukti awal."
    });

    return caseRow;
  });

  await notifyBlacklistReviewSubmitted({
    userId,
    caseId: created.id,
    incidentId: created.incidentId
  });

  return serializeCaseWithAttachments(created);
}

export async function lookupPublicBlacklistHelp(input: { nationalId?: unknown; contact?: unknown }) {
  const payload = validatePublicBlacklistHelpLookupPayload(input);
  const [row] = await db
    .select({
      incident: pelanggaranUser,
      buyer: users,
      activeBlacklist: blacklists,
      caseRow: blacklistReviewCases
    })
    .from(users)
    .innerJoin(
      blacklists,
      and(
        eq(blacklists.userId, users.id),
        eq(blacklists.isActive, true),
        or(isNull(blacklists.blockedUntil), gt(blacklists.blockedUntil, new Date()))
      )
    )
    .innerJoin(pelanggaranUser, eq(pelanggaranUser.userId, users.id))
    .leftJoin(blacklistReviewCases, eq(blacklistReviewCases.incidentId, pelanggaranUser.id))
    .where(
      and(
        or(eq(users.nationalId, payload.nationalId), eq(blacklists.nationalId, payload.nationalId)),
        or(eq(users.email, payload.contact), eq(users.phoneNumber, payload.contact)),
        eq(pelanggaranUser.escalationEligible, true)
      )
    )
    .orderBy(desc(pelanggaranUser.createdAt))
    .limit(1);

  if (!row) {
    throw new Error("Data blacklist aktif tidak ditemukan untuk identitas tersebut.");
  }

  return {
    incidentId: row.incident.id,
    buyerUserId: row.buyer.id,
    blacklistStatus: row.activeBlacklist.isActive ? "AKTIF" : "TIDAK_AKTIF",
    existingCase: row.caseRow ? await serializeCaseWithAttachments(row.caseRow) : null
  };
}

export async function createPublicBlacklistReviewCase(input: {
  nationalId?: unknown;
  contact?: unknown;
  incidentId?: unknown;
  buyerStatement?: unknown;
  evidence?: unknown;
}) {
  const lookup = await lookupPublicBlacklistHelp(input);
  return createBuyerBlacklistReviewCase(
    lookup.buyerUserId,
    {
      incidentId: input.incidentId ?? lookup.incidentId,
      buyerStatement: input.buyerStatement,
      evidence: input.evidence
    },
    "public"
  );
}

export async function submitAdminBlacklistReviewRecommendation(
  unitId: string,
  adminUserId: string,
  caseId: string,
  input: { recommendation?: unknown; note?: unknown }
) {
  const payload = validateAdminBlacklistRecommendationPayload(input);
  const [row] = await db
    .select({
      caseRow: blacklistReviewCases,
      incident: pelanggaranUser
    })
    .from(blacklistReviewCases)
    .innerJoin(pelanggaranUser, eq(pelanggaranUser.id, blacklistReviewCases.incidentId))
    .where(and(eq(blacklistReviewCases.id, caseId), eq(pelanggaranUser.unitId, unitId)))
    .limit(1);

  if (!row) {
    throw new Error("Case review blacklist tidak ditemukan di unit ini.");
  }

  if (isBlacklistReviewTerminalStatus(row.caseRow.status)) {
    throw new Error("Case review sudah final dan tidak bisa diberi rekomendasi baru.");
  }

  const now = new Date();
  const [updated] = await db
    .update(blacklistReviewCases)
    .set({
      status: row.caseRow.status === "TERKIRIM" ? "DITINJAU_ADMIN_UNIT" : row.caseRow.status,
      adminRecommendation: payload.recommendation,
      adminRecommendationNote: payload.note,
      adminRecommendationByUserId: adminUserId,
      adminRecommendationAt: now,
      lastStatusChangedAt: row.caseRow.status === "TERKIRIM" ? now : row.caseRow.lastStatusChangedAt,
      updatedAt: now
    })
    .where(eq(blacklistReviewCases.id, caseId))
    .returning();

  if (!updated) {
    throw new Error("Rekomendasi review gagal disimpan.");
  }

  return serializeCaseWithAttachments(updated);
}

export async function applyApprovedBlacklistGovernanceEffect(
  executor: DbExecutor,
  input: {
    incidentId?: string | null;
    userId: string;
    actorUserId: string;
    reasonCode: string;
    note: string;
    action: "review_disetujui" | "cabut_manual";
    activeBlacklist?: BlacklistRow | null;
  }
) {
  const now = new Date();
  const activeBlacklist = input.activeBlacklist ?? (await getActiveBlacklistForUser(executor, input.userId));

  if (input.incidentId) {
    await executor
      .update(pelanggaranUser)
      .set({
        escalationEligible: false,
        resolutionType: input.action,
        resolutionReasonCode: input.reasonCode,
        resolutionNote: input.note,
        resolvedByUserId: input.actorUserId,
        resolvedAt: now,
        updatedAt: now
      })
      .where(eq(pelanggaranUser.id, input.incidentId));
  }

  if (!activeBlacklist) {
    return;
  }

  await executor
    .update(blacklists)
    .set({
      isActive: false,
      revokedByUserId: input.actorUserId,
      revokeReason: input.note || input.reasonCode,
      updatedAt: now
    })
    .where(eq(blacklists.id, activeBlacklist.id));

  if (shouldSuspendLoginForBlacklist(activeBlacklist.totalViolations)) {
    await executor
      .update(users)
      .set({
        isActive: true,
        updatedAt: now
      })
      .where(eq(users.id, input.userId));
  }

  await executor.insert(blacklistActionLogs).values({
    id: randomUUID(),
    blacklistId: activeBlacklist.id,
    targetUserId: input.userId,
    action: input.action,
    performedByType: "manual",
    performedByUserId: input.actorUserId,
    note: input.note || input.reasonCode
  });
}

export async function decideSuperadminBlacklistReviewCase(
  caseId: string,
  actorUserId: string,
  input: { decision?: unknown; reasonCode?: unknown; note?: unknown }
) {
  const payload = validateBlacklistReviewDecisionPayload(input);
  const [row] = await db
    .select({
      caseRow: blacklistReviewCases,
      incident: pelanggaranUser,
      activeBlacklist: blacklists
    })
    .from(blacklistReviewCases)
    .innerJoin(pelanggaranUser, eq(pelanggaranUser.id, blacklistReviewCases.incidentId))
    .leftJoin(blacklists, and(eq(blacklists.userId, blacklistReviewCases.buyerUserId), eq(blacklists.isActive, true)))
    .where(eq(blacklistReviewCases.id, caseId))
    .limit(1);

  if (!row) {
    throw new Error("Case review blacklist tidak ditemukan.");
  }

  if (isBlacklistReviewTerminalStatus(row.caseRow.status)) {
    throw new Error("Case review sudah final.");
  }

  const now = new Date();
  const safeSummary = buildSafeDecisionSummary(payload.decision, payload.reasonCode);
  const updated = await db.transaction(async (tx) => {
    const [caseRow] = await tx
      .update(blacklistReviewCases)
      .set({
        status: payload.decision,
        superadminDecision: payload.decision,
        superadminReasonCode: payload.reasonCode,
        superadminNote: payload.note,
        safeSummaryForBuyer: safeSummary,
        decidedByUserId: actorUserId,
        decidedAt: now,
        lastStatusChangedAt: now,
        updatedAt: now
      })
      .where(eq(blacklistReviewCases.id, caseId))
      .returning();

    if (!caseRow) {
      throw new Error("Keputusan review gagal disimpan.");
    }

    if (payload.decision === "DISETUJUI") {
      await applyApprovedBlacklistGovernanceEffect(tx, {
        incidentId: row.incident.id,
        userId: row.caseRow.buyerUserId,
        actorUserId,
        reasonCode: payload.reasonCode,
        note: payload.note || safeSummary,
        action: "review_disetujui",
        activeBlacklist: row.activeBlacklist
      });
    } else if (row.activeBlacklist) {
      await tx.insert(blacklistActionLogs).values({
        id: randomUUID(),
        blacklistId: row.activeBlacklist.id,
        targetUserId: row.caseRow.buyerUserId,
        action: "review_ditolak",
        performedByType: "manual",
        performedByUserId: actorUserId,
        note: payload.note || safeSummary
      });
    }

    return caseRow;
  });

  if (payload.decision === "DISETUJUI") {
    await notifyBlacklistReviewApproved({
      userId: updated.buyerUserId,
      caseId: updated.id,
      incidentId: updated.incidentId
    });
  } else {
    await notifyBlacklistReviewRejected({
      userId: updated.buyerUserId,
      caseId: updated.id,
      incidentId: updated.incidentId
    });
  }

  return serializeCaseWithAttachments(updated);
}

export async function listAdminBlacklistReviewCases(unitId: string) {
  const rows = await db
    .select({
      caseRow: blacklistReviewCases,
      incident: pelanggaranUser,
      buyer: users,
      transaction: transaksi,
      auction: pemasaran,
      item: barang,
      media: mediaBarang,
      unit: units
    })
    .from(blacklistReviewCases)
    .innerJoin(pelanggaranUser, eq(pelanggaranUser.id, blacklistReviewCases.incidentId))
    .innerJoin(users, eq(users.id, blacklistReviewCases.buyerUserId))
    .innerJoin(transaksi, eq(transaksi.id, pelanggaranUser.transaksiId))
    .innerJoin(pemasaran, eq(pemasaran.id, pelanggaranUser.pemasaranId))
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .leftJoin(mediaBarang, and(eq(mediaBarang.barangId, barang.id), eq(mediaBarang.sortOrder, 0)))
    .innerJoin(units, eq(units.id, pelanggaranUser.unitId))
    .where(eq(pelanggaranUser.unitId, unitId))
    .orderBy(desc(blacklistReviewCases.submittedAt));

  return Promise.all(
    rows.map(async (row) => {
      const attachments = await getAttachments(row.caseRow.id);

      return {
        id: row.caseRow.id,
        incidentId: row.caseRow.incidentId,
        buyerName: row.buyer.name,
        buyerEmail: row.buyer.email,
        itemName: row.item.name,
        unitName: row.unit.name,
        status: row.caseRow.status,
        submittedAt: row.caseRow.submittedAt.toISOString(),
        buyerStatement: row.caseRow.buyerStatement,
        adminRecommendation: row.caseRow.adminRecommendation,
        adminRecommendationNote: row.caseRow.adminRecommendationNote,
        hasRecommendation: Boolean(row.caseRow.adminRecommendation),
        crossUnitSignal: "Riwayat lintas unit tersedia untuk superadmin",
        incident: {
          id: row.incident.id,
          note: row.incident.note,
          occurredAt: row.incident.createdAt.toISOString(),
          auctionMode: row.auction.mode,
          transactionStatus: row.transaction.status,
          amount: toNullableNumber(row.transaction.amount),
          paymentDeadline: row.transaction.paymentDeadline?.toISOString() ?? null,
          itemCode: row.item.code,
          itemCategory: row.item.category,
          itemCondition: row.item.condition,
          itemImageUrl: row.media?.url ?? null,
          itemImageAlt: row.media?.fileName ? `Foto barang ${row.item.name}` : null
        },
        attachments: attachments.map((item) => ({
          id: item.id,
          fileUrl: item.fileUrl,
          fileName: item.fileName,
          mimeType: item.mimeType
        }))
      };
    })
  );
}

export async function listSuperadminBlacklistReviewCases() {
  const rows = await db
    .select({
      caseRow: blacklistReviewCases,
      incident: pelanggaranUser,
      buyer: users,
      item: barang,
      unit: units,
      activeBlacklist: blacklists
    })
    .from(blacklistReviewCases)
    .innerJoin(pelanggaranUser, eq(pelanggaranUser.id, blacklistReviewCases.incidentId))
    .innerJoin(users, eq(users.id, blacklistReviewCases.buyerUserId))
    .innerJoin(pemasaran, eq(pemasaran.id, pelanggaranUser.pemasaranId))
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .innerJoin(units, eq(units.id, pelanggaranUser.unitId))
    .leftJoin(blacklists, and(eq(blacklists.userId, blacklistReviewCases.buyerUserId), eq(blacklists.isActive, true)))
    .orderBy(desc(blacklistReviewCases.submittedAt));

  const cases = await Promise.all(
    rows.map(async (row) => {
      const attachments = await getAttachments(row.caseRow.id);
      const priorityScore =
        (row.buyer.isActive === false || Number(row.activeBlacklist?.totalViolations ?? 0) >= 3 ? 100 : 0) +
        (row.caseRow.adminRecommendation ? 5 : 0);

      return {
        id: row.caseRow.id,
        incidentId: row.caseRow.incidentId,
        buyerName: row.buyer.name,
        buyerEmail: row.buyer.email,
        itemName: row.item.name,
        unitName: row.unit.name,
        status: row.caseRow.status,
        submittedAt: row.caseRow.submittedAt.toISOString(),
        buyerStatement: row.caseRow.buyerStatement,
        adminRecommendation: row.caseRow.adminRecommendation,
        adminRecommendationNote: row.caseRow.adminRecommendationNote,
        level: row.activeBlacklist?.totalViolations ?? 0,
        lockedAccount: row.buyer.isActive === false,
        hasAdminRecommendation: Boolean(row.caseRow.adminRecommendation),
        priorityScore,
        attachments: attachments.map((item) => ({
          id: item.id,
          fileUrl: item.fileUrl,
          fileName: item.fileName,
          mimeType: item.mimeType
        }))
      };
    })
  );

  return cases.sort((a, b) => b.priorityScore - a.priorityScore || Date.parse(b.submittedAt) - Date.parse(a.submittedAt));
}
