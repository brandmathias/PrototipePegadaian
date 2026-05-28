import { createNotificationOnce } from "@/lib/services/notification.service";
import {
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
