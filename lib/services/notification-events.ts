import { createNotificationOnce } from "@/lib/services/notification.service";
import {
  getBuyerLoserAnnouncementHref,
  getBuyerTransactionsHref,
  getBuyerWinnerAnnouncementHref,
} from "@/lib/buyer/transaction-links";

type TransactionEventInput = {
  userId: string;
  transactionId: string;
  lotName: string;
};

export async function notifyVickreyWinner(
  input: TransactionEventInput & {
    finalPrice: string | number;
    unitName: string;
  }
) {
  return createNotificationOnce({
    userId: input.userId,
    title: `Anda memenangkan lelang ${input.lotName}`,
    message: `Hasil Vickrey sudah dibuka. Silakan bayar langsung di ${input.unitName} maksimal 24 jam agar transaksi dapat diverifikasi.`,
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

export async function notifyPaymentVerified(input: TransactionEventInput) {
  return createNotificationOnce({
    userId: input.userId,
    title: `Pembayaran ${input.lotName} terverifikasi`,
    message: "Admin unit sudah memverifikasi pembayaran Anda. Silakan buka detail transaksi untuk melanjutkan atau melihat nota.",
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
  }
) {
  return createNotificationOnce({
    userId: input.userId,
    title: "Akun Anda dikenakan pembatasan",
    message: `Pelanggaran saat ini: ${input.totalViolations}x. Pembatasan aktif sampai ${input.blockedUntilLabel}. Hubungi unit Pegadaian jika membutuhkan bantuan.`,
    type: "blacklist_active",
    entityType: input.transactionId ? "transaction" : "blacklist",
    entityId: input.transactionId ?? `blacklist-${input.userId}`,
    actionHref: input.transactionId
      ? `/transaksi/${input.transactionId}`
      : getBuyerTransactionsHref({ tab: "bids" }),
    metadata: {
      totalViolations: input.totalViolations,
      blockedUntilLabel: input.blockedUntilLabel
    }
  });
}

export async function notifyBlacklistReviewSubmitted(input: {
  userId: string;
  caseId: string;
  incidentId: string;
}) {
  return createNotificationOnce({
    userId: input.userId,
    title: "Pengajuan review insiden terkirim",
    message: "Permohonan Anda sudah masuk antrean review. Keputusan final akan diberitahukan melalui notifikasi akun.",
    type: "blacklist_review_submitted",
    entityType: "blacklist_review",
    entityId: input.caseId,
    actionHref: `/bantuan/blacklist/${input.incidentId}`
  });
}

export async function notifyBlacklistReviewApproved(input: {
  userId: string;
  caseId: string;
  incidentId: string;
}) {
  return createNotificationOnce({
    userId: input.userId,
    title: "Review insiden disetujui",
    message: "Superadmin menyetujui review insiden Anda. Pembatasan untuk insiden ini sudah dicabut sesuai keputusan review.",
    type: "blacklist_review_approved",
    entityType: "blacklist_review",
    entityId: input.caseId,
    actionHref: `/bantuan/blacklist/${input.incidentId}`
  });
}

export async function notifyBlacklistReviewRejected(input: {
  userId: string;
  caseId: string;
  incidentId: string;
}) {
  return createNotificationOnce({
    userId: input.userId,
    title: "Review insiden belum disetujui",
    message: "Superadmin menolak pencabutan untuk insiden ini. Pembatasan tetap berlaku sesuai alasan keputusan yang tercatat.",
    type: "blacklist_review_rejected",
    entityType: "blacklist_review",
    entityId: input.caseId,
    actionHref: `/bantuan/blacklist/${input.incidentId}`
  });
}
