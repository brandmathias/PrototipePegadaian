import { and, desc, eq } from "drizzle-orm";

import { deriveEffectiveBlacklistState } from "@/lib/blacklist/effective-state";
import { getBlacklistRestrictionPolicy } from "@/lib/blacklist/restrictions";
import {
  getBuyerLoserAnnouncementHref,
  getBuyerWinnerAnnouncementHref,
} from "@/lib/buyer/transaction-links";
import { db } from "@/lib/db/client";
import { blacklists, notifications, pelanggaranUser, transaksi } from "@/lib/db/schema";
import { createNotificationOnce, createOrRefreshNotification } from "@/lib/services/notification.service";
import { formatAppDateTime } from "@/lib/timezone";

type TransactionEventInput = {
  userId: string;
  transactionId: string;
  lotName: string;
};

const BUYER_RESTRICTION_NOTIFICATION_HREF = "/pelanggaran";
function buyerBlacklistEntityId(userId: string) {
  return `blacklist-${userId}`;
}

async function getBuyerRestrictionSnapshot(userId: string) {
  const [blacklist] = await db
    .select()
    .from(blacklists)
    .where(and(eq(blacklists.userId, userId), eq(blacklists.isActive, true)))
    .limit(1);

  if (!blacklist) {
    return {
      active: false,
      blockedUntil: null,
      totalViolations: 0
    };
  }

  const rows = await db
    .select({
      createdAt: pelanggaranUser.createdAt,
      escalationEligible: pelanggaranUser.escalationEligible,
      id: pelanggaranUser.id,
      paymentDeadline: transaksi.paymentDeadline,
      transactionId: transaksi.id
    })
    .from(pelanggaranUser)
    .leftJoin(transaksi, eq(transaksi.id, pelanggaranUser.transaksiId))
    .where(eq(pelanggaranUser.userId, userId))
    .orderBy(desc(pelanggaranUser.createdAt));

  const effectiveState = deriveEffectiveBlacklistState({
    storedBlockedUntil: blacklist.blockedUntil,
    storedTotalViolations: blacklist.totalViolations,
    traces: rows.map((row) => ({
      createdAt: row.paymentDeadline ?? row.createdAt,
      escalationEligible: row.escalationEligible,
      id: row.id,
      occurredAt: (row.paymentDeadline ?? row.createdAt).toISOString(),
      transactionId: row.transactionId
    }))
  });
  const latestMilestone = effectiveState.milestones.at(-1);
  const policy = getBlacklistRestrictionPolicy(effectiveState.totalViolations);
  const activeByDate =
    !effectiveState.blockedUntil ||
    effectiveState.blockedUntil.getTime() > new Date().getTime();

  return {
    active: policy.level > 0 && activeByDate,
    blockedUntil: effectiveState.blockedUntil,
    occurredAt: latestMilestone?.occurredAt ?? rows[0]?.paymentDeadline ?? rows[0]?.createdAt ?? null,
    sourceTransactionId: latestMilestone?.trace.transactionId ?? rows[0]?.transactionId ?? null,
    totalViolations: effectiveState.totalViolations
  };
}

function uniqueIds(userIds: string[]) {
  return Array.from(new Set(userIds.filter(Boolean)));
}

function getSuperAdminIterationHref(unitId: string, barangId: string, pemasaranId: string) {
  return `/superadmin/unit/${encodeURIComponent(unitId)}/barang/${encodeURIComponent(barangId)}?iteration=${encodeURIComponent(pemasaranId)}#marketing-audit`;
}

async function createForUsers(
  userIds: string[],
  input: Omit<Parameters<typeof createNotificationOnce>[0], "userId">
) {
  return Promise.all(
    uniqueIds(userIds).map((userId) =>
      createNotificationOnce({
        ...input,
        userId
      })
    )
  );
}

export async function listActiveAdminUnitNotificationRecipientIds(unitId: string) {
  const [{ and, eq }, { db }, { users }] = await Promise.all([
    import("drizzle-orm"),
    import("@/lib/db/client"),
    import("@/lib/db/schema")
  ]);
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.role, "admin_unit"), eq(users.unitId, unitId), eq(users.isActive, true)));

  return rows.map((row) => row.id);
}

export async function listActiveSuperAdminNotificationRecipientIds() {
  const [{ and, eq }, { db }, { users }] = await Promise.all([
    import("drizzle-orm"),
    import("@/lib/db/client"),
    import("@/lib/db/schema")
  ]);
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.role, "super_admin"), eq(users.isActive, true)));

  return rows.map((row) => row.id);
}

export async function notifyVickreyWinner(
  input: TransactionEventInput & {
    finalPrice: string | number;
    unitName: string;
  }
) {
  return createNotificationOnce({
    userId: input.userId,
    title: `Anda memenangkan lelang ${input.lotName}`,
    message: `Hasil Lelang Tertutup sudah dibuka. Silakan bayar langsung di ${input.unitName} maksimal 24 jam agar transaksi dapat diverifikasi.`,
    type: "vickrey_win",
    entityType: "transaction",
    entityId: input.transactionId,
    actionHref: getBuyerWinnerAnnouncementHref(input.transactionId),
    metadata: {
      finalPrice: input.finalPrice,
      paymentMethod: "langsung"
    }
  });
}

export async function notifyVickreyLoss(
  input: {
    userId: string;
    pemasaranId: string;
    lotName: string;
  }
) {
  return createNotificationOnce({
    userId: input.userId,
    title: `Hasil lelang ${input.lotName} sudah tersedia`,
    message: "Anda belum memenangkan sesi ini. Buka hasil lelang untuk melihat ringkasan akhir dan rekomendasi unit lain.",
    type: "vickrey_loss",
    entityType: "pemasaran",
    entityId: input.pemasaranId,
    actionHref: getBuyerLoserAnnouncementHref(input.pemasaranId)
  });
}

export async function ensureVickreyLossNotifications(userId: string) {
  const [{ and, eq, isNotNull, ne, or }, { db }, { barang, bids, pemasaran }] = await Promise.all([
    import("drizzle-orm"),
    import("@/lib/db/client"),
    import("@/lib/db/schema")
  ]);
  const rows = await db
    .select({
      pemasaranId: pemasaran.id,
      lotName: barang.name
    })
    .from(bids)
    .innerJoin(pemasaran, eq(pemasaran.id, bids.pemasaranId))
    .innerJoin(barang, eq(barang.id, pemasaran.barangId))
    .where(
      and(
        eq(bids.userId, userId),
        isNotNull(pemasaran.winnerId),
        ne(pemasaran.winnerId, userId),
        or(eq(pemasaran.status, "selesai"), eq(pemasaran.status, "gagal"))
      )
    );

  await Promise.all(
    rows.map((row) =>
      notifyVickreyLoss({
        userId,
        pemasaranId: row.pemasaranId,
        lotName: row.lotName
      })
    )
  );
}

export async function notifyPaymentVerified(
  input: TransactionEventInput & {
    transactionType?: string;
    unitName?: string;
    unitAddress?: string;
  }
) {
  const message =
    input.transactionType === "fixed_price" && input.unitName && input.unitAddress
      ? `Pembayaran Anda telah diverifikasi. Segera lakukan pengambilan barang di ${input.unitName}, ${input.unitAddress}. Buka detail transaksi untuk melihat informasi lengkap.`
      : "Admin unit sudah memverifikasi pembayaran Anda. Silakan buka detail transaksi untuk melanjutkan atau melihat nota.";

  return createNotificationOnce({
    userId: input.userId,
    title: `Pembayaran ${input.lotName} terverifikasi`,
    message,
    type: "payment_verified",
    entityType: "transaction",
    entityId: input.transactionId,
    actionHref: `/transaksi/${input.transactionId}`
  });
}

export async function notifyPaymentRejected(
  input: TransactionEventInput & {
    reason?: string | null;
  }
) {
  const reason = input.reason ? ` Catatan admin: ${input.reason}` : "";

  return createNotificationOnce({
    userId: input.userId,
    title: `Bukti pembayaran ${input.lotName} perlu diperbaiki`,
    message: `Admin unit menolak bukti pembayaran yang Anda unggah.${reason}`,
    type: "payment_rejected",
    entityType: "transaction",
    entityId: input.transactionId,
    actionHref: `/transaksi/${input.transactionId}`
  });
}

export async function notifyPaymentDeadlineSoon(input: TransactionEventInput) {
  return createNotificationOnce({
    userId: input.userId,
    title: `Batas pembayaran ${input.lotName} hampir habis`,
    message: "Segera selesaikan pembayaran agar transaksi tidak gagal dan akun tidak terkena pembatasan.",
    type: "payment_deadline",
    entityType: "transaction",
    entityId: input.transactionId,
    actionHref: `/transaksi/${input.transactionId}`
  });
}

export async function notifyBlacklistActivated(
  input: {
    userId: string;
    transactionId?: string | null;
    totalViolations: number;
    blockedUntilLabel: string;
    occurredAt?: Date | null;
  }
) {
  return createOrRefreshNotification({
    userId: input.userId,
    title: "Akun Anda dikenakan pembatasan",
    message: `Pelanggaran saat ini: ${input.totalViolations}x. Pembatasan aktif sampai ${input.blockedUntilLabel}. Hubungi unit terkait jika membutuhkan bantuan.`,
    type: "blacklist_active",
    entityType: "blacklist",
    entityId: buyerBlacklistEntityId(input.userId),
    actionHref: BUYER_RESTRICTION_NOTIFICATION_HREF,
    ...(input.occurredAt ? { createdAt: input.occurredAt } : {}),
    metadata: {
      sourceTransactionId: input.transactionId ?? null,
      totalViolations: input.totalViolations,
      blockedUntilLabel: input.blockedUntilLabel,
      occurredAt: input.occurredAt?.toISOString() ?? null
    }
  });
}

export async function syncBuyerRestrictionNotifications(userId: string) {
  const readAt = new Date();
  const snapshot = await getBuyerRestrictionSnapshot(userId);
  const entityId = buyerBlacklistEntityId(userId);

  if (!snapshot.active || snapshot.totalViolations <= 0) {
    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt
      })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.type, "blacklist_active"),
          eq(notifications.entityId, entityId),
          eq(notifications.isRead, false)
        )
      );
    return;
  }

  const blockedUntilLabel = snapshot.blockedUntil
    ? formatAppDateTime(snapshot.blockedUntil)
    : "batas waktu belum tersedia";

  await createOrRefreshNotification(
    {
      userId,
      title: "Akun Anda dikenakan pembatasan",
      message: `Pelanggaran saat ini: ${snapshot.totalViolations}x. Pembatasan aktif sampai ${blockedUntilLabel}. Hubungi unit terkait jika membutuhkan bantuan.`,
      type: "blacklist_active",
      entityType: "blacklist",
      entityId,
      actionHref: BUYER_RESTRICTION_NOTIFICATION_HREF,
      ...(snapshot.occurredAt ? { createdAt: snapshot.occurredAt } : {}),
      metadata: {
        blockedUntilLabel,
        occurredAt: snapshot.occurredAt?.toISOString() ?? null,
        sourceTransactionId: snapshot.sourceTransactionId,
        totalViolations: snapshot.totalViolations
      }
    },
    { markUnread: false }
  );
}

export async function notifyAdminUnitPaymentProofUploaded(input: {
  adminUserIds: string[];
  superAdminUserIds: string[];
  unitId: string;
  barangId: string;
  pemasaranId: string;
  transactionId: string;
  lotName: string;
}) {
  const title = `Pembayaran Masuk: ${input.lotName}`;
  const adminMessage = "Pembeli telah mengunggah bukti pembayaran. Silakan lakukan verifikasi.";
  const superAdminMessage =
    "Pembeli telah mengunggah bukti pembayaran. Buka iterasi terkait untuk memantau; verifikasi tetap dilakukan admin unit.";

  return Promise.all([
    createForUsers(input.adminUserIds, {
      title,
      message: adminMessage,
      type: "admin_payment_proof_uploaded",
      entityType: "transaction",
      entityId: input.transactionId,
      actionHref: `/admin/pemasaran/fixed-price/${input.pemasaranId}`
    }),
    createForUsers(input.superAdminUserIds, {
      title,
      message: superAdminMessage,
      type: "admin_payment_proof_uploaded",
      entityType: "transaction",
      entityId: input.transactionId,
      actionHref: getSuperAdminIterationHref(input.unitId, input.barangId, input.pemasaranId)
    })
  ]);
}

export async function notifySuperAdminPaymentRejected(input: {
  superAdminUserIds: string[];
  unitId: string;
  barangId: string;
  pemasaranId: string;
  transactionId: string;
  lotName: string;
  reason?: string | null;
}) {
  const reason = input.reason ? ` Alasan: ${input.reason}.` : "";

  return createForUsers(input.superAdminUserIds, {
    title: `Bukti Pembayaran Ditolak: ${input.lotName}`,
    message: `Admin unit menolak bukti pembayaran.${reason} Buka iterasi terkait untuk memantau.`,
    type: "payment_rejected",
    entityType: "transaction",
    entityId: input.transactionId,
    actionHref: getSuperAdminIterationHref(input.unitId, input.barangId, input.pemasaranId)
  });
}

export async function notifyAdminUnitBidSubmitted(input: {
  adminUserIds: string[];
  pemasaranId: string;
  lotName: string;
}) {
  return createForUsers(input.adminUserIds, {
    title: `Penawaran Baru: ${input.lotName}`,
    message: "Terdapat penawaran masuk untuk barang lelang ini. Lelang masih berlangsung.",
    type: "admin_bid_submitted",
    entityType: "pemasaran",
    entityId: input.pemasaranId,
    actionHref: `/admin/pemasaran/vickrey-auction/${input.pemasaranId}`
  });
}

export async function notifyAdminUnitVickreyResult(input: {
  adminUserIds: string[];
  superAdminUserIds: string[];
  unitId: string;
  barangId: string;
  pemasaranId: string;
  lotName: string;
  result: "winner_selected" | "no_winner" | "payment_overdue";
  occurredAt?: Date | null;
}) {
  const message =
    input.result === "winner_selected"
      ? "Sesi lelang telah berakhir dan pemenang sudah ditentukan. Silakan tinjau transaksi untuk tindak lanjut."
      : input.result === "payment_overdue"
        ? "Batas waktu pembayaran pemenang lelang telah lewat. Transaksi dibatalkan secara otomatis."
        : "Sesi lelang telah berakhir tanpa pemenang. Silakan tinjau untuk menentukan langkah selanjutnya.";

  const type = input.result === "payment_overdue" ? "admin_payment_overdue" : "admin_vickrey_result";
  const metadata = {
    result: input.result,
    occurredAt: input.occurredAt?.toISOString() ?? null
  };

  return Promise.all([
    createForUsers(input.adminUserIds, {
      title: `Lelang Berakhir: ${input.lotName}`,
      message,
      type,
      entityType: "pemasaran",
      entityId: input.pemasaranId,
      actionHref: `/admin/pemasaran/vickrey-auction/${input.pemasaranId}`,
      ...(input.occurredAt ? { createdAt: input.occurredAt } : {}),
      metadata
    }),
    createForUsers(input.superAdminUserIds, {
      title: `Lelang Berakhir: ${input.lotName}`,
      message,
      type,
      entityType: "pemasaran",
      entityId: input.pemasaranId,
      actionHref: getSuperAdminIterationHref(input.unitId, input.barangId, input.pemasaranId),
      ...(input.occurredAt ? { createdAt: input.occurredAt } : {}),
      metadata
    })
  ]);
}

export async function notifySuperAdminPolicyAlert(input: {
  superAdminUserIds: string[];
  buyerId: string;
  transactionId?: string | null;
  lotName: string;
  totalViolations: number;
  blockedUntilLabel: string;
  occurredAt?: Date | null;
}) {
  const entityId = input.transactionId ?? `blacklist-${input.buyerId}`;

  return createForUsers(input.superAdminUserIds, {
    title: "Pembatasan buyer aktif",
    message: `Sistem mencatat pelanggaran pembayaran pada ${input.lotName}. Total pelanggaran: ${input.totalViolations}x, pembatasan aktif sampai ${input.blockedUntilLabel}.`,
    type: "superadmin_policy_alert",
    entityType: "blacklist",
    entityId,
    actionHref: `/superadmin/blacklist/detail/${input.buyerId}`,
    ...(input.occurredAt ? { createdAt: input.occurredAt } : {}),
    metadata: {
      buyerId: input.buyerId,
      totalViolations: input.totalViolations,
      blockedUntilLabel: input.blockedUntilLabel,
      occurredAt: input.occurredAt?.toISOString() ?? null
    }
  });
}
