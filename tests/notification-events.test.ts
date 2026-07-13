import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createNotificationOnce: vi.fn(),
  createOrRefreshNotification: vi.fn()
}));

vi.mock("@/lib/services/notification.service", () => ({
  createNotificationOnce: mocks.createNotificationOnce,
  createOrRefreshNotification: mocks.createOrRefreshNotification
}));

vi.mock("@/lib/db/client", () => ({
  db: {}
}));

vi.mock("@/lib/db/schema", () => ({
  blacklists: {},
  notifications: {},
  pelanggaranUser: {},
  transaksi: {}
}));

import {
  notifyAdminUnitPaymentProofUploaded,
  notifyAdminUnitVickreyResult,
  notifyBlacklistActivated,
  notifyPaymentDeadlineSoon,
  notifyPaymentRejected,
  notifyPaymentVerified,
  notifyHandoverProofUploaded,
  notifySuperAdminHandoverProofUploaded,
  notifySuperAdminPaymentVerified,
  notifySuperAdminPaymentRejected,
  notifySuperAdminPolicyAlert,
  notifyVickreyLoss,
  notifyVickreyWinner
} from "@/lib/services/notification-events";

describe("notification event helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createNotificationOnce.mockResolvedValue({ id: "notif-1" });
    mocks.createOrRefreshNotification.mockResolvedValue({ id: "notif-1" });
  });

  it("creates a Lelang Tertutup winner notification with direct-payment guidance", async () => {
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

  it("creates a non-winner Lelang Tertutup notification that links to the result page", async () => {
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
      lotName: "Kalung Emas",
      transactionType: "fixed_price",
      unitName: "UPC Ranotana",
      unitAddress: "Jl. Sam Ratulangi"
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
        message:
          "Pembayaran Anda telah diverifikasi. Segera lakukan pengambilan barang di UPC Ranotana, Jl. Sam Ratulangi. Buka detail transaksi untuk melihat informasi lengkap.",
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

  it("creates a buyer notification when admin uploads handover proof", async () => {
    await notifyHandoverProofUploaded({
      userId: "buyer-1",
      transactionId: "trx-1",
      lotName: "Kalung Emas"
    });

    expect(mocks.createNotificationOnce).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "buyer-1",
        type: "handover_proof_uploaded",
        entityType: "transaction",
        entityId: "trx-1",
        actionHref: "/transaksi/trx-1",
        title: "Bukti serah-terima Kalung Emas sudah tersedia",
        message: expect.stringMatching(/Pembelian Selesai/i)
      })
    );
  });

  it("creates read-only superadmin notifications for payment approval and handover proof", async () => {
    await notifySuperAdminPaymentVerified({
      superAdminUserIds: ["owner-1"],
      unitId: "unit-1",
      barangId: "barang-1",
      pemasaranId: "pm-fixed-1",
      transactionId: "trx-1",
      lotName: "Kalung Emas"
    });
    await notifySuperAdminHandoverProofUploaded({
      superAdminUserIds: ["owner-1"],
      unitId: "unit-1",
      barangId: "barang-1",
      pemasaranId: "pm-fixed-1",
      transactionId: "trx-1",
      lotName: "Kalung Emas"
    });

    expect(mocks.createNotificationOnce).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "owner-1",
        type: "payment_verified",
        entityId: "trx-1",
        title: "Pembayaran Disetujui: Kalung Emas",
        actionHref:
          "/superadmin/unit/unit-1/barang/barang-1?iteration=pm-fixed-1#marketing-audit"
      })
    );
    expect(mocks.createNotificationOnce).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "owner-1",
        type: "handover_proof_uploaded",
        entityId: "trx-1",
        title: "Bukti Serah Terima Diunggah: Kalung Emas",
        actionHref:
          "/superadmin/unit/unit-1/barang/barang-1?iteration=pm-fixed-1#marketing-audit"
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
    expect(mocks.createOrRefreshNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "blacklist_active",
        title: "Akun Anda dikenakan pembatasan",
        entityType: "blacklist",
        entityId: "blacklist-buyer-1",
        actionHref: "/pelanggaran",
        message: expect.stringMatching(/Pelanggaran saat ini: 2x/i)
      })
    );
  });

  it("routes blacklist notifications to the buyer violation page as one canonical status", async () => {
    const occurredAt = new Date("2026-06-18T20:03:00.000Z");

    await notifyBlacklistActivated({
      userId: "buyer-1",
      totalViolations: 1,
      blockedUntilLabel: "2 Juni 2026",
      occurredAt
    } as any);

    expect(mocks.createOrRefreshNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "blacklist_active",
        entityType: "blacklist",
        entityId: "blacklist-buyer-1",
        actionHref: "/pelanggaran",
        createdAt: occurredAt,
        metadata: expect.objectContaining({
          occurredAt: occurredAt.toISOString()
        })
      })
    );
  });

  it("creates admin unit operational notifications for payment proof and auction results", async () => {
    await notifyAdminUnitPaymentProofUploaded({
      adminUserIds: ["admin-1", "admin-2"],
      superAdminUserIds: ["owner-1"],
      unitId: "unit-1",
      barangId: "barang-fixed-1",
      pemasaranId: "pm-fixed-1",
      transactionId: "trx-fixed-1",
      lotName: "Kalung Emas"
    });
    await notifyAdminUnitVickreyResult({
      adminUserIds: ["admin-1"],
      superAdminUserIds: ["owner-1"],
      unitId: "unit-1",
      barangId: "barang-vickrey-1",
      pemasaranId: "pm-vickrey-1",
      lotName: "Motor Racing",
      result: "winner_selected"
    });

    expect(mocks.createNotificationOnce).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "admin-1",
        type: "admin_payment_proof_uploaded",
        entityType: "transaction",
        entityId: "trx-fixed-1",
        actionHref: "/admin/pemasaran/fixed-price/pm-fixed-1",
        title: "Pembayaran Masuk: Kalung Emas",
        message: "Pembeli telah mengunggah bukti pembayaran. Silakan lakukan verifikasi."
      })
    );
    expect(mocks.createNotificationOnce).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "admin-2",
        type: "admin_payment_proof_uploaded"
      })
    );
    expect(mocks.createNotificationOnce).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "admin-1",
        type: "admin_vickrey_result",
        entityType: "pemasaran",
        entityId: "pm-vickrey-1",
        actionHref: "/admin/pemasaran/vickrey-auction/pm-vickrey-1",
        title: "Lelang Berakhir: Motor Racing"
      })
    );
    expect(mocks.createNotificationOnce).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "owner-1",
        type: "admin_payment_proof_uploaded",
        entityId: "trx-fixed-1",
        message:
          "Pembeli telah mengunggah bukti pembayaran. Buka iterasi terkait untuk memantau; verifikasi tetap dilakukan admin unit.",
        actionHref:
          "/superadmin/unit/unit-1/barang/barang-fixed-1?iteration=pm-fixed-1#marketing-audit"
      })
    );
    expect(mocks.createNotificationOnce).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "owner-1",
        type: "admin_vickrey_result",
        entityId: "pm-vickrey-1",
        actionHref:
          "/superadmin/unit/unit-1/barang/barang-vickrey-1?iteration=pm-vickrey-1#marketing-audit"
      })
    );
  });

  it("creates a read-only superadmin notification when payment proof is rejected", async () => {
    await notifySuperAdminPaymentRejected({
      superAdminUserIds: ["owner-1"],
      unitId: "unit-1",
      barangId: "barang-1",
      pemasaranId: "pm-fixed-1",
      transactionId: "trx-1",
      lotName: "Kalung Emas",
      reason: "Nominal belum sesuai"
    });

    expect(mocks.createNotificationOnce).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "owner-1",
        type: "payment_rejected",
        entityId: "trx-1",
        title: "Bukti Pembayaran Ditolak: Kalung Emas",
        message: expect.stringMatching(/Nominal belum sesuai/i),
        actionHref:
          "/superadmin/unit/unit-1/barang/barang-1?iteration=pm-fixed-1#marketing-audit"
      })
    );
  });

  it("creates superadmin policy alerts for operational risk, not account CRUD", async () => {
    await notifySuperAdminPolicyAlert({
      superAdminUserIds: ["owner-1"],
      buyerId: "buyer-1",
      transactionId: "trx-1",
      lotName: "Motor Racing",
      totalViolations: 3,
      blockedUntilLabel: "20 Juni 2027"
    });

    expect(mocks.createNotificationOnce).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "owner-1",
        type: "superadmin_policy_alert",
        entityType: "blacklist",
        entityId: "trx-1",
        actionHref: "/superadmin/blacklist/detail/buyer-1",
        title: "Pembatasan buyer aktif",
        message: expect.stringMatching(/Motor Racing/i)
      })
    );
  });

});
