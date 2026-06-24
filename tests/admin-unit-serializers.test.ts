import { describe, expect, it } from "vitest";

import {
  serializeAdminBarang,
  serializeAdminPemasaran,
  serializeAdminTransaction
} from "@/lib/admin-unit/serializers";

describe("admin unit serializers", () => {
  it("serializes barang row for the admin UI", () => {
    const item = serializeAdminBarang({
      id: "barang-1",
      code: "BRG-001",
      name: "Cincin Emas",
      category: "emas",
      status: "gadai",
      condition: "baik",
      description: "Lengkap",
      specifications: {
        berat: "3 gram"
      },
      appraisalValue: "8500000",
      loanValue: "6500000",
      ownerName: "Raras",
      customerNumber: "CST-001",
      pawnedAt: new Date("2026-04-01T00:00:00Z"),
      dueDate: new Date("2026-05-01T00:00:00Z"),
      redeemedAt: null,
      redemptionReference: null,
      createdAt: new Date("2026-04-01T00:00:00Z"),
      updatedAt: new Date("2026-04-01T00:00:00Z"),
      unitId: "unit-1",
      createdByUserId: "admin-1"
    });

    expect(item.status).toBe("JAMINAN");
    expect(item.ownerName).toBe("Raras");
    expect(item.appraisalValue).toBe(8500000);
    expect(item.specifications).toEqual({ berat: "3 gram" });
  });

  it("returns harga tetap marketing data without auction-only fields", () => {
    const row: any = {
      id: "pm-fixed",
      barangId: "barang-1",
      mode: "fixed_price",
      price: "12500000",
      basePrice: null,
      durationDays: null,
      durationSeconds: null,
      startsAt: new Date("2026-05-01T00:00:00Z"),
      endsAt: null,
      revealEndsAt: null,
      winnerId: null,
      finalPrice: null,
      iteration: 1,
      status: "aktif",
      createdByUserId: "admin-1",
      createdAt: new Date("2026-05-01T00:00:00Z"),
      updatedAt: new Date("2026-05-01T00:00:00Z")
    };

    const fixedPrice = serializeAdminPemasaran(row, {
      lotName: "Kalung Emas",
      media: [
        { id: "media-1", type: "foto", url: "/uploads/kalung.jpg", fileName: "kalung.jpg" },
        { id: "media-2", type: "video", url: "/uploads/kalung.mp4", fileName: "kalung.mp4" }
      ],
      transaction: {
        buyerName: "Raras",
        paymentMethod: "transfer",
        status: "bukti_diunggah",
        proofUrl: "/uploads/bukti.jpg",
        reference: "TRX-001",
        paymentDeadline: new Date("2026-05-03T00:00:00Z")
      }
    });

    expect(fixedPrice.mode).toBe("FIXED_PRICE");
    expect(fixedPrice.lot).toBe("Kalung Emas");
    expect(fixedPrice.media).toHaveLength(2);
    expect(fixedPrice.primaryMedia?.url).toBe("/uploads/kalung.jpg");
    expect(fixedPrice.price).toBe(12500000);
    expect(fixedPrice.updatedAt).toBe("2026-05-01T00:00:00.000Z");
    expect(fixedPrice.transactionStatus).toBe("BUKTI_DIUNGGAH");
    expect(fixedPrice.bids).toBeUndefined();
    expect(fixedPrice.visibility).toBeUndefined();
  });

  it("hides bid nominal while vickrey result is locked", () => {
    const auction = serializeAdminPemasaran(
      {
        id: "pm-1",
        barangId: "barang-1",
        mode: "vickrey",
        price: null,
        basePrice: "10000000",
        durationDays: 7,
        durationSeconds: 604800,
        startsAt: new Date("2026-04-01T00:00:00Z"),
        endsAt: new Date("2099-04-08T00:00:00Z"),
        revealEndsAt: new Date("2099-04-08T00:10:00Z"),
        winnerId: null,
        finalPrice: null,
        iteration: 1,
        status: "aktif",
        createdByUserId: "admin-1",
        createdAt: new Date("2026-04-01T00:00:00Z"),
        updatedAt: new Date("2026-04-01T00:00:00Z")
      },
      {
        lotName: "Cincin",
        lotCategory: "perhiasan",
        lotCondition: "baik",
        lotAppraisalValue: "11000000",
        lotSpecifications: {
          jenisEmas: "Cincin",
          kadarEmas: "24K",
          berat: "3,20 gram"
        },
        bidCount: 2,
        participantPreviews: [
          {
            bidderId: "buyer-1",
            bidderName: "Raras",
            submittedAt: new Date("2026-04-05T00:00:00Z")
          },
          {
            bidderId: "buyer-2",
            bidderName: "Alya",
            submittedAt: new Date("2026-04-05T01:00:00Z")
          }
        ],
        bids: [
          {
            bid: {
              id: "bid-1",
              pemasaranId: "pm-1",
              userId: "buyer-1",
              bidHash: "hash-1",
              nominal: "12500000",
              salt: "salt-1",
              revealedAt: null,
              createdAt: new Date("2026-04-05T00:00:00Z")
            },
            bidderName: "Raras"
          }
        ]
      }
    );

    expect(auction.visibility).toBe("TERKUNCI");
    expect(auction.finalPrice).toBeNull();
    expect(auction.appraisalValue).toBe(11000000);
    expect(auction.specifications).toEqual({
      jenisEmas: "Cincin",
      kadarEmas: "24K",
      berat: "3,20 gram"
    });
    expect(auction.endingAt).toBe("2099-04-08T00:00:00.000Z");
    expect(auction.bids).toEqual([]);
    expect(auction.participantPreviews?.[0]).toMatchObject({
      bidderName: "Raras",
      submittedAtLabel: "5 Apr 2026, 07.00 WIB"
    });
    expect(auction.participantPreviews?.[1]).toMatchObject({
      bidderName: "Alya",
      submittedAtLabel: "5 Apr 2026, 08.00 WIB"
    });
  });

  it("shows a waiting reveal phase after deadline without exposing bid values", () => {
    const auction = serializeAdminPemasaran(
      {
        id: "pm-reveal",
        barangId: "barang-1",
        mode: "vickrey",
        price: null,
        basePrice: "10000000",
        durationDays: 7,
        durationSeconds: 604800,
        startsAt: new Date("2026-04-01T00:00:00Z"),
        endsAt: new Date("2026-04-08T00:00:00Z"),
        revealEndsAt: new Date("2099-04-08T00:10:00Z"),
        winnerId: null,
        finalPrice: null,
        iteration: 1,
        status: "aktif",
        createdByUserId: "admin-1",
        createdAt: new Date("2026-04-01T00:00:00Z"),
        updatedAt: new Date("2026-04-01T00:00:00Z")
      },
      {
        lotName: "Cincin",
        bidCount: 2,
        bids: [
          {
            bid: {
              id: "bid-1",
              pemasaranId: "pm-reveal",
              userId: "buyer-1",
              bidHash: "hash-1",
              nominal: null,
              salt: null,
              revealedAt: null,
              createdAt: new Date("2026-04-05T00:00:00Z")
            },
            bidderName: "Raras"
          },
          {
            bid: {
              id: "bid-2",
              pemasaranId: "pm-reveal",
              userId: "buyer-2",
              bidHash: "hash-2",
              nominal: "13250000",
              salt: "salt-2",
              revealedAt: new Date("2026-04-08T00:04:00Z"),
              createdAt: new Date("2026-04-05T01:00:00Z")
            },
            bidderName: "Alya"
          }
        ]
      }
    );

    expect(auction.visibility).toBe("MENUNGGU_REVEAL");
    expect(auction.finalPrice).toBeNull();
    expect(auction.winner).toBeNull();
    expect(auction.note).toMatch(/menunggu buyer reveal/i);
    expect(auction.revealedBidCount).toBe(1);
    expect(auction.pendingRevealCount).toBe(1);
    expect(auction.bids?.[0]).toMatchObject({ isRevealed: false });
    expect(auction.bids?.[1]).toMatchObject({ isRevealed: true });
    expect(auction.bids?.[1]).not.toHaveProperty("nominal");
  });

  it("exposes settled bid amounts for admin audit without exposing vickrey secrets", () => {
    const auction = serializeAdminPemasaran(
      {
        id: "pm-2",
        barangId: "barang-1",
        mode: "vickrey",
        price: null,
        basePrice: "10000000",
        durationDays: 7,
        durationSeconds: 604800,
        startsAt: new Date("2026-04-01T00:00:00Z"),
        endsAt: new Date("2026-04-08T00:00:00Z"),
        revealEndsAt: new Date("2026-04-08T00:10:00Z"),
        winnerId: "buyer-1",
        finalPrice: "13250000",
        iteration: 1,
        status: "selesai",
        createdByUserId: "admin-1",
        createdAt: new Date("2026-04-01T00:00:00Z"),
        updatedAt: new Date("2026-04-08T00:00:00Z")
      },
      {
        lotName: "Cincin",
        bidCount: 3,
        winnerName: "Raras",
        bids: [
          {
            bid: {
              id: "bid-1",
              pemasaranId: "pm-2",
              userId: "buyer-1",
              bidHash: "hash-1",
              nominal: "15000000",
              salt: "salt-1",
              revealedAt: new Date("2026-04-08T00:05:00Z"),
              createdAt: new Date("2026-04-05T00:00:00Z")
            },
            bidderName: "Raras"
          },
          {
            bid: {
              id: "bid-2",
              pemasaranId: "pm-2",
              userId: "buyer-2",
              bidHash: "hash-2",
              nominal: "13250000",
              salt: "salt-2",
              revealedAt: new Date("2026-04-08T00:08:00Z"),
              createdAt: new Date("2026-04-05T01:00:00Z")
            },
            bidderName: "Alya"
          }
        ]
      }
    );

    expect(auction.visibility).toBe("HASIL_DIBUKA");
    expect(auction.bids!).toHaveLength(2);
    expect(auction.bids![0]).toMatchObject({
      rank: 1,
      bidderName: "Raras",
      isWinner: true,
      determinesFinalPrice: false,
      amount: 15000000
    });
    expect(auction.bids![0]).not.toHaveProperty("nominal");
    expect(auction.bids![0]).not.toHaveProperty("salt");
    expect(auction.bids![0]).not.toHaveProperty("bidHash");
    expect(auction.bids![1]).toMatchObject({
      rank: 2,
      bidderName: "Alya",
      isWinner: false,
      determinesFinalPrice: true,
      amount: 13250000
    });
    expect(auction.bids![1]).not.toHaveProperty("nominal");
  });

  it("keeps vickrey winner payment data connected to the marketing session", () => {
    const auction = serializeAdminPemasaran(
      {
        id: "pm-vickrey-payment",
        barangId: "barang-1",
        mode: "vickrey",
        price: null,
        basePrice: "10000000",
        durationDays: 7,
        durationSeconds: 604800,
        startsAt: new Date("2026-04-01T00:00:00Z"),
        endsAt: new Date("2026-04-08T00:00:00Z"),
        revealEndsAt: new Date("2026-04-08T00:10:00Z"),
        winnerId: "buyer-1",
        finalPrice: "13250000",
        iteration: 1,
        status: "selesai",
        createdByUserId: "admin-1",
        createdAt: new Date("2026-04-01T00:00:00Z"),
        updatedAt: new Date("2026-04-08T00:00:00Z")
      },
      {
        lotName: "Cincin",
        winnerName: "Raras",
        transaction: {
          id: "trx-vickrey-1",
          buyerName: "Raras",
          paymentMethod: "langsung",
          status: "menunggu_konfirmasi_langsung",
          proofUrl: null,
          reference: "VCK-001",
          paymentDeadline: new Date("2026-04-09T00:00:00Z")
        }
      }
    );

    expect(auction.transactionId).toBe("trx-vickrey-1");
    expect(auction.transactionStatus).toBe("MENUNGGU_KONFIRMASI_LANGSUNG");
    expect(auction.buyerName).toBe("Raras");
    expect(auction.paymentMethod).toBe("BAYAR_LANGSUNG");
    expect(auction.paymentDeadline).toBe("2026-04-09T00:00:00.000Z");
  });

  it("passes handover deadline and completion source through marketing serializers", () => {
    const auction = serializeAdminPemasaran(
      {
        id: "pm-fixed-handover",
        barangId: "barang-1",
        mode: "fixed_price",
        price: "12500000",
        basePrice: null,
        durationDays: null,
        durationSeconds: null,
        startsAt: new Date("2026-05-01T00:00:00Z"),
        endsAt: null,
        revealEndsAt: null,
        winnerId: null,
        finalPrice: null,
        iteration: 1,
        status: "aktif",
        createdByUserId: "admin-1",
        createdAt: new Date("2026-05-01T00:00:00Z"),
        updatedAt: new Date("2026-05-01T00:00:00Z")
      },
      {
        lotName: "Kalung Emas",
        transaction: {
          id: "trx-fixed-handover",
          buyerName: "Raras",
          paymentMethod: "transfer",
          status: "lunas",
          handoverProofUrl: "/uploads/serah-terima/trx-fixed-handover.jpg",
          handoverProofUploadedAt: new Date("2026-05-04T15:30:00Z"),
          completionSource: null
        }
      }
    );

    expect(auction.handoverAutoCompleteAt).toBe("2026-05-07T15:30:00.000Z");
    expect(auction.handoverComplaintAt).toBeNull();
    expect(auction.completionSource).toBeNull();
  });

  it("serializes transaction status labels", () => {
    const transaction = serializeAdminTransaction({
      id: "TRX-001",
      pemasaranId: "pm-1",
      userId: "buyer-1",
      buyerName: "Raras",
      lotName: "Cincin",
      lotId: "barang-1",
      type: "fixed_price",
      amount: "12500000",
      paymentMethod: "transfer",
      status: "bukti_diunggah",
      proofUrl: "/uploads/bukti.jpg",
      handoverProofUrl: null,
      handoverProofUploadedAt: null,
      handoverProofUploadedByUserId: null,
      handoverComplaintAt: null,
      handoverComplaintNote: null,
      completedAt: null,
      completionSource: null,
      rejectionReason: null,
      referenceNumber: null,
      paymentDeadline: new Date("2026-04-25T00:00:00Z"),
      verifiedByUserId: null,
      verifiedAt: null,
      createdAt: new Date("2026-04-24T00:00:00Z"),
      updatedAt: new Date("2026-04-24T00:00:00Z"),
      buyerEmail: "raras@example.com",
      buyerPhone: "+62 812 1111 2222",
      buyerNationalId: "7171010101010001"
    });

    expect(transaction.status).toBe("BUKTI_DIUNGGAH");
    expect(transaction.method).toBe("TRANSFER_BANK");
    expect(transaction.total).toBe(12500000);
    expect(transaction.deadlineAt).toBe("2026-04-25T00:00:00.000Z");
    expect(transaction.buyerEmail).toBe("raras@example.com");
    expect(transaction.printableReceipt).toBe(false);
  });

  it("keeps legacy proof URLs separate from transfer references", () => {
    const transaction = serializeAdminTransaction({
      id: "TRX-LEGACY",
      pemasaranId: "pm-1",
      userId: "buyer-1",
      buyerName: "Raras",
      lotName: "Cincin",
      lotId: "barang-1",
      type: "fixed_price",
      amount: "12500000",
      paymentMethod: "transfer",
      status: "lunas",
      proofUrl: "/uploads/bukti.jpg (BRI-8888)",
      handoverProofUrl: null,
      handoverProofUploadedAt: null,
      handoverProofUploadedByUserId: null,
      handoverComplaintAt: null,
      handoverComplaintNote: null,
      completedAt: null,
      completionSource: null,
      rejectionReason: null,
      referenceNumber: null,
      paymentDeadline: new Date("2026-04-25T00:00:00Z"),
      verifiedByUserId: "admin-1",
      verifiedAt: new Date("2026-04-25T01:00:00Z"),
      createdAt: new Date("2026-04-24T00:00:00Z"),
      updatedAt: new Date("2026-04-25T01:00:00Z")
    });

    expect(transaction.proofFile).toBe("/uploads/bukti.jpg");
    expect(transaction.reference).toBe("BRI-8888");
    expect(transaction.printableReceipt).toBe(false);
  });

  it("keeps buyer-completed transactions locked until handover proof exists", () => {
    const transaction = serializeAdminTransaction({
      id: "TRX-SELESAI",
      pemasaranId: "pm-1",
      userId: "buyer-1",
      buyerName: "Raras",
      lotName: "Kalung Emas",
      lotId: "barang-1",
      type: "fixed_price",
      amount: "100000000",
      paymentMethod: "transfer",
      status: "selesai",
      proofUrl: "/uploads/bukti.jpg",
      handoverProofUrl: null,
      handoverProofUploadedAt: null,
      handoverProofUploadedByUserId: null,
      handoverComplaintAt: null,
      handoverComplaintNote: null,
      completedAt: null,
      completionSource: null,
      rejectionReason: null,
      referenceNumber: "BRI-7777",
      paymentDeadline: null,
      verifiedByUserId: "admin-1",
      verifiedAt: new Date("2026-05-04T14:11:00Z"),
      createdAt: new Date("2026-05-04T14:07:00Z"),
      updatedAt: new Date("2026-05-04T14:15:00Z")
    });

    expect(transaction.status).toBe("SELESAI");
    expect(transaction.printableReceipt).toBe(false);
  });

  it("exposes handover auto-complete metadata for admin transaction views", () => {
    const transaction = serializeAdminTransaction({
      id: "TRX-LUNAS-HANDOVER",
      pemasaranId: "pm-1",
      userId: "buyer-1",
      buyerName: "Raras",
      lotName: "Kalung Emas",
      lotId: "barang-1",
      type: "fixed_price",
      amount: "100000000",
      paymentMethod: "transfer",
      status: "lunas",
      proofUrl: "/uploads/bukti.jpg",
      handoverProofUrl: "/uploads/serah-terima/trx-handover.jpg",
      handoverProofUploadedAt: new Date("2026-05-04T15:30:00Z"),
      handoverProofUploadedByUserId: "admin-2",
      handoverComplaintAt: null,
      handoverComplaintNote: null,
      completedAt: null,
      completionSource: null,
      rejectionReason: null,
      referenceNumber: "BRI-7777",
      paymentDeadline: null,
      verifiedByUserId: "admin-1",
      verifiedAt: new Date("2026-05-04T14:11:00Z"),
      createdAt: new Date("2026-05-04T14:07:00Z"),
      updatedAt: new Date("2026-05-04T14:15:00Z")
    });

    expect(transaction.handoverComplaintAt).toBeNull();
    expect(transaction.handoverAutoCompleteAt).toBe("7 Mei 2026, 22.30 WIB");
    expect(transaction.handoverAutoCompleteAtRaw).toBe("2026-05-07T15:30:00.000Z");
  });

  it("holds admin auto-complete metadata when buyer submits a handover complaint", () => {
    const transaction = serializeAdminTransaction({
      id: "TRX-COMPLAINED",
      pemasaranId: "pm-1",
      userId: "buyer-1",
      buyerName: "Raras",
      lotName: "Kalung Emas",
      lotId: "barang-1",
      type: "fixed_price",
      amount: "100000000",
      paymentMethod: "transfer",
      status: "lunas",
      proofUrl: "/uploads/bukti.jpg",
      handoverProofUrl: "/uploads/serah-terima/trx-handover.jpg",
      handoverProofUploadedAt: new Date("2026-05-04T15:30:00Z"),
      handoverComplaintAt: new Date("2026-05-05T01:00:00Z"),
      handoverComplaintNote: "Foto tidak sesuai.",
      handoverProofUploadedByUserId: "admin-2",
      completedAt: null,
      completionSource: null,
      rejectionReason: null,
      referenceNumber: "BRI-7777",
      paymentDeadline: null,
      verifiedByUserId: "admin-1",
      verifiedAt: new Date("2026-05-04T14:11:00Z"),
      createdAt: new Date("2026-05-04T14:07:00Z"),
      updatedAt: new Date("2026-05-04T14:15:00Z")
    } as any);

    expect(transaction.handoverComplaintAt).toBe("5 Mei 2026, 08.00 WIB");
    expect(transaction.handoverComplaintNote).toBe("Foto tidak sesuai.");
    expect(transaction.handoverAutoCompleteAt).toBeNull();
    expect(transaction.handoverAutoCompleteAtRaw).toBeNull();
  });

  it("treats transactions with handover proof as printable final receipts", () => {
    const transaction = serializeAdminTransaction({
      id: "TRX-HANDOVER",
      pemasaranId: "pm-1",
      userId: "buyer-1",
      buyerName: "Raras",
      lotName: "Kalung Emas",
      lotId: "barang-1",
      type: "fixed_price",
      amount: "100000000",
      paymentMethod: "transfer",
      status: "selesai",
      proofUrl: "/uploads/bukti.jpg",
      handoverProofUrl: "/uploads/serah-terima/trx-handover.jpg",
      handoverProofUploadedAt: new Date("2026-05-04T15:30:00Z"),
      handoverProofUploadedByUserId: "admin-2",
      handoverComplaintAt: null,
      handoverComplaintNote: null,
      completedAt: null,
      completionSource: null,
      rejectionReason: null,
      referenceNumber: "BRI-7777",
      paymentDeadline: null,
      verifiedByUserId: "admin-1",
      verifiedAt: new Date("2026-05-04T14:11:00Z"),
      createdAt: new Date("2026-05-04T14:07:00Z"),
      updatedAt: new Date("2026-05-04T14:15:00Z"),
      verifiedByName: "Admin Unit Ranotana",
      handoverProofUploadedByName: "Petugas Serah Terima"
    });

    expect(transaction.status).toBe("SELESAI");
    expect(transaction.printableReceipt).toBe(true);
    expect(transaction.verifiedBy).toBe("Admin Unit Ranotana");
    expect(transaction.handoverProofUploadedBy).toBe("Petugas Serah Terima");
  });
});
