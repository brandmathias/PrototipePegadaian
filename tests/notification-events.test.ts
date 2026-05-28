import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createNotificationOnce: vi.fn()
}));

vi.mock("@/lib/services/notification.service", () => ({
  createNotificationOnce: mocks.createNotificationOnce
}));

import {
  notifyBlacklistActivated,
  notifyPaymentDeadlineSoon,
  notifyPaymentRejected,
  notifyPaymentVerified,
  notifyVickreyLoss,
  notifyVickreyWinner
} from "@/lib/services/notification-events";

describe("notification event helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createNotificationOnce.mockResolvedValue({ id: "notif-1" });
  });

  it("creates a Vickrey winner notification with direct-payment guidance", async () => {
    await notifyVickreyWinner({
      userId: "buyer-1",
      transactionId: "trx-vickrey-1",
      lotName: "Motor Racing",
      finalPrice: "160000000.00",
      unitName: "UPC Ranotana"
    });

    expect(mocks.createNotificationOnce).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "buyer-1",
        type: "vickrey_win",
        entityType: "transaction",
        entityId: "trx-vickrey-1",
        actionHref: "/transaksi/trx-vickrey-1/pemenang",
        title: "Anda memenangkan lelang Motor Racing",
        message: expect.stringMatching(/bayar langsung di UPC Ranotana/i)
      })
    );
  });

  it("creates a non-winner Vickrey notification that links to the result page", async () => {
    await notifyVickreyLoss({
      userId: "buyer-2",
      pemasaranId: "pmr-77",
      lotName: "Laptop Gaming"
    });

    expect(mocks.createNotificationOnce).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "buyer-2",
        type: "vickrey_loss",
        entityType: "pemasaran",
        entityId: "pmr-77",
        actionHref: "/riwayat-bid/pmr-77/bukan-pemenang",
        title: "Hasil lelang Laptop Gaming sudah tersedia",
        message: expect.stringMatching(/belum memenangkan sesi ini/i)
      })
    );
  });

  it("creates payment verified and rejected notifications", async () => {
    await notifyPaymentVerified({
      userId: "buyer-1",
      transactionId: "trx-1",
      lotName: "Kalung Emas"
    });
    await notifyPaymentRejected({
      userId: "buyer-1",
      transactionId: "trx-1",
      lotName: "Kalung Emas",
      reason: "Nominal belum sesuai."
    });

    expect(mocks.createNotificationOnce).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "payment_verified",
        title: "Pembayaran Kalung Emas terverifikasi",
        actionHref: "/transaksi/trx-1"
      })
    );
    expect(mocks.createNotificationOnce).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "payment_rejected",
        message: expect.stringMatching(/Nominal belum sesuai/i)
      })
    );
  });

  it("creates deadline and blacklist notifications", async () => {
    await notifyPaymentDeadlineSoon({
      userId: "buyer-1",
      transactionId: "trx-1",
      lotName: "Motor Racing"
    });
    await notifyBlacklistActivated({
      userId: "buyer-1",
      transactionId: "trx-1",
      totalViolations: 2,
      blockedUntilLabel: "21 Juni 2026"
    });

    expect(mocks.createNotificationOnce).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "payment_deadline",
        title: "Batas pembayaran Motor Racing hampir habis"
      })
    );
    expect(mocks.createNotificationOnce).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "blacklist_active",
        title: "Akun Anda dikenakan pembatasan",
        message: expect.stringMatching(/Pelanggaran saat ini: 2x/i)
      })
    );
  });

  it("routes blacklist notifications without transaction to the buyer transactions hub", async () => {
    await notifyBlacklistActivated({
      userId: "buyer-1",
      totalViolations: 1,
      blockedUntilLabel: "2 Juni 2026"
    });

    expect(mocks.createNotificationOnce).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "blacklist_active",
        actionHref: "/transaksi?tab=bids"
      })
    );
  });
});
