import type { BuyerBid, BuyerTransaction } from "@/lib/contracts/buyer";

export function isBuyerWinnerAnnouncementTransaction(
  transaction: Pick<BuyerTransaction, "kind" | "status">
) {
  return (
    transaction.kind === "VICKREY_WIN" &&
    [
      "MENUNGGU_PEMBAYARAN",
      "MENUNGGU_KONFIRMASI_LANGSUNG",
      "LUNAS",
      "SELESAI",
      "GAGAL",
    ].includes(transaction.status)
  );
}

export function getBuyerWinnerAnnouncementHref(transactionId: string) {
  return `/transaksi/${transactionId}/pemenang`;
}

export function getBuyerLoserAnnouncementHref(lotId: string) {
  return `/riwayat-bid/${lotId}/bukan-pemenang`;
}

export function getBuyerTransactionsHref(options?: {
  tab?: "transactions" | "bids";
  lotId?: string;
}) {
  const params = new URLSearchParams();

  if (options?.tab === "bids") {
    params.set("tab", "bids");
  }

  if (options?.lotId) {
    params.set("lot", options.lotId);
  }

  const query = params.toString();
  return query ? `/transaksi?${query}` : "/transaksi";
}

export function getBuyerTransactionHref(
  transaction: Pick<BuyerTransaction, "id" | "kind" | "status">
) {
  if (isBuyerWinnerAnnouncementTransaction(transaction)) {
    return getBuyerWinnerAnnouncementHref(transaction.id);
  }

  return `/transaksi/${transaction.id}`;
}

export function getBuyerBidTransactionHref(
  bid: Pick<BuyerBid, "linkedTransactionId" | "status" | "transactionStatus">
) {
  if (!bid.linkedTransactionId) {
    return null;
  }

  if (bid.status === "MENANG" && bid.transactionStatus) {
    const shouldOpenWinnerAnnouncement = isBuyerWinnerAnnouncementTransaction({
      kind: "VICKREY_WIN",
      status: bid.transactionStatus,
    });

    if (shouldOpenWinnerAnnouncement) {
      return getBuyerWinnerAnnouncementHref(bid.linkedTransactionId);
    }
  }

  return `/transaksi/${bid.linkedTransactionId}`;
}

export function getBuyerBidMonitoringHref(
  bid: Pick<BuyerBid, "lotId">
) {
  return getBuyerTransactionsHref({
    tab: "bids",
    lotId: bid.lotId,
  });
}
