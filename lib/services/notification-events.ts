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

function uniqueIds(userIds: string[]) {
  return Array.from(new Set(userIds.filter(Boolean)));
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
    message: `Pelanggaran saat ini: ${input.totalViolations}x. Pembatasan aktif sampai ${input.blockedUntilLabel}. Hubungi unit terkait jika membutuhkan bantuan.`,
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

export async function notifyAdminUnitPaymentProofUploaded(input: {
  adminUserIds: string[];
  transactionId: string;
  lotName: string;
}) {
  return createForUsers(input.adminUserIds, {
    title: `Bukti pembayaran ${input.lotName} masuk`,
    message: "Buyer sudah mengirim bukti pembayaran harga tetap dan menunggu verifikasi unit.",
    type: "admin_payment_proof_uploaded",
    entityType: "transaction",
    entityId: input.transactionId,
    actionHref: `/admin/transaksi/${input.transactionId}`
  });
}

export async function notifyAdminUnitVickreyResult(input: {
  adminUserIds: string[];
  pemasaranId: string;
  lotName: string;
  result: "winner_selected" | "no_winner" | "payment_overdue";
}) {
  const message =
    input.result === "winner_selected"
      ? "Sesi lelang tertutup sudah berakhir dan sistem telah menentukan pemenang. Tinjau transaksi pemenang untuk tindak lanjut pembayaran."
      : input.result === "payment_overdue"
        ? "Batas pembayaran pemenang sudah terlewati. Sistem menandai transaksi gagal dan mencatat pelanggaran."
        : "Sesi lelang tertutup berakhir tanpa pemenang. Tinjau sesi untuk menentukan langkah pemasaran berikutnya.";

  return createForUsers(input.adminUserIds, {
    title: `Lelang ${input.lotName} berakhir`,
    message,
    type: input.result === "payment_overdue" ? "admin_payment_overdue" : "admin_vickrey_result",
    entityType: "pemasaran",
    entityId: input.pemasaranId,
    actionHref: `/admin/pemasaran/vickrey-auction/${input.pemasaranId}`,
    metadata: {
      result: input.result
    }
  });
}

export async function notifySuperAdminPolicyAlert(input: {
  superAdminUserIds: string[];
  buyerId: string;
  transactionId?: string | null;
  lotName: string;
  totalViolations: number;
  blockedUntilLabel: string;
}) {
  const entityId = input.transactionId ?? `blacklist-${input.buyerId}`;

  return createForUsers(input.superAdminUserIds, {
    title: "Pembatasan buyer aktif",
    message: `Sistem mencatat pelanggaran pembayaran pada ${input.lotName}. Total pelanggaran: ${input.totalViolations}x, pembatasan aktif sampai ${input.blockedUntilLabel}.`,
    type: "superadmin_policy_alert",
    entityType: "blacklist",
    entityId,
    actionHref: `/superadmin/blacklist/detail/${input.buyerId}`,
    metadata: {
      buyerId: input.buyerId,
      totalViolations: input.totalViolations,
      blockedUntilLabel: input.blockedUntilLabel
    }
  });
}
