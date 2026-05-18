import { describe, expect, it } from "vitest";

import { serializeBuyerBid, serializeBuyerTransaction } from "@/lib/buyer/serializers";

describe("buyer serializers", () => {
  it("splits legacy proof values into payment proof and reference", () => {
    const transaction = serializeBuyerTransaction({
      id: "trx-fixed-legacy",
      pemasaranId: "pm-fixed",
      type: "fixed_price",
      amount: "12450000",
      paymentMethod: "transfer",
      status: "bukti_diunggah",
      proofUrl: "/uploads/bukti/transfer.jpg (BRI-2026-001)",
      rejectionReason: null,
      referenceNumber: null,
      paymentDeadline: new Date("2026-05-05T02:30:00Z"),
      verifiedAt: null,
      createdAt: new Date("2026-05-04T02:30:00Z"),
      lotName: "Kalung Emas 18K",
      lotId: "barang-1",
      imageUrl: "/uploads/barang/kalung.jpg",
      unitName: "UPC Ranotana",
      unitAddress: "Jl. Sam Ratulangi, Manado",
      account: {
        bankName: "Bank Rakyat Indonesia (BRI)",
        accountNumber: "0123-4567-8901-234",
        accountHolderName: "PT Pegadaian (Persero)",
        branchName: "Manado"
      }
    });

    expect(transaction.paymentProof).toBe("/uploads/bukti/transfer.jpg");
    expect(transaction.reference).toBe("BRI-2026-001");
    expect(transaction.imageUrl).toBe("/uploads/barang/kalung.jpg");
    expect(transaction.status).toBe("BUKTI_DIUNGGAH");
  });

  it("maps buyer completion into the final SELESAI status with a printable receipt", () => {
    const transaction = serializeBuyerTransaction({
      id: "trx-fixed-done",
      pemasaranId: "pm-fixed",
      type: "fixed_price",
      amount: "100000000",
      paymentMethod: "transfer",
      status: "selesai",
      proofUrl: "/uploads/bukti/transfer.jpg",
      rejectionReason: null,
      referenceNumber: "BRI-2026-999",
      paymentDeadline: new Date("2026-05-05T02:30:00Z"),
      verifiedAt: new Date("2026-05-04T14:11:00Z"),
      createdAt: new Date("2026-05-04T14:07:00Z"),
      lotName: "Kalung Emas",
      lotId: "barang-2",
      imageUrl: "/uploads/barang/kalung-emas.jpg",
      unitName: "UPC Ranotana",
      unitAddress: "Jl. Sam Ratulangi, Manado",
      account: null
    });

    expect(transaction.status).toBe("SELESAI");
    expect(transaction.deadline).toBe("Selesai");
    expect(transaction.deadlineAt).toBeUndefined();
    expect(transaction.receiptNumber).toBe("INV/TRX-FIXE");
    expect(transaction.imageUrl).toBe("/uploads/barang/kalung-emas.jpg");
  });

  it("exposes vickrey winner payment context from the related transaction", () => {
    const bid = serializeBuyerBid({
      pemasaranId: "pm-vickrey-1",
      lotName: "Cincin Emas",
      unitName: "UPC Ranotana",
      bidAmount: "150000000",
      basePrice: "90000000",
      finalPrice: "100000000",
      paymentAmount: "100000000",
      paymentDeadline: new Date("2026-05-05T14:07:00Z"),
      transactionStatus: "menunggu_pembayaran",
      endsAt: new Date("2026-05-04T14:07:00Z"),
      marketingStatus: "selesai",
      winnerId: "buyer-1",
      transactionId: "trx-vickrey-1",
      userId: "buyer-1"
    } as any);

    expect(bid.status).toBe("MENANG");
    expect(bid.finalPrice).toBe(100000000);
    expect(bid.paymentAmount).toBe(100000000);
    expect(bid.transactionStatus).toBe("MENUNGGU_PEMBAYARAN");
    expect(bid.paymentDeadlineAt).toBe("2026-05-05T14:07:00.000Z");
    expect(bid.note).toMatch(/harga bayar vickrey/i);
  });

  it("keeps unrevealed vickrey bid nominal hidden in buyer history", () => {
    const bid = serializeBuyerBid({
      pemasaranId: "pm-vickrey-commit",
      lotName: "Cincin Emas",
      unitName: "UPC Ranotana",
      bidAmount: null,
      basePrice: "90000000",
      finalPrice: null,
      paymentAmount: null,
      paymentDeadline: null,
      transactionStatus: null,
      endsAt: new Date("2026-05-04T14:07:00Z"),
      revealEndsAt: new Date("2099-05-04T14:17:00Z"),
      marketingStatus: "aktif",
      winnerId: null,
      transactionId: null,
      userId: "buyer-1",
      bidHash: "864c8c7761ec3f2dc6c9f9fb35f7161915406597a38871d4b2b78cf231b87f6d",
      revealedAt: null
    } as any);

    expect(bid.bidAmount).toBeUndefined();
    expect(bid.isRevealed).toBe(false);
    expect(bid.canReveal).toBe(true);
    expect(bid.revealDeadlineAt).toBe("2099-05-04T14:17:00.000Z");
    expect(bid.bidHash).toBe("864c8c7761ec3f2dc6c9f9fb35f7161915406597a38871d4b2b78cf231b87f6d");
    expect(bid.note).toMatch(/reveal nominal/i);
  });

  it("marks encrypted escrow bids as automatic instead of requiring manual reveal", () => {
    const bid = serializeBuyerBid({
      pemasaranId: "pm-vickrey-escrow",
      lotName: "Mobil",
      unitName: "UPC Ranotana",
      bidAmount: null,
      encryptedBidPayload: "v1:encrypted",
      basePrice: "100000000",
      finalPrice: null,
      paymentAmount: null,
      paymentDeadline: null,
      transactionStatus: null,
      endsAt: new Date("2099-05-04T14:07:00Z"),
      revealEndsAt: new Date("2099-05-04T14:17:00Z"),
      marketingStatus: "aktif",
      winnerId: null,
      transactionId: null,
      userId: "buyer-1",
      bidHash: "864c8c7761ec3f2dc6c9f9fb35f7161915406597a38871d4b2b78cf231b87f6d",
      revealedAt: null
    } as any);

    expect(bid.bidAmount).toBeUndefined();
    expect(bid.canReveal).toBe(false);
    expect(bid.escrowed).toBe(true);
    expect(bid.note).toMatch(/escrow otomatis/i);
  });

  it("explains vickrey winner direct payment notes", () => {
    const transaction = serializeBuyerTransaction({
      id: "trx-vickrey-direct",
      pemasaranId: "pm-vickrey",
      type: "vickrey",
      amount: "100000000",
      paymentMethod: "langsung",
      status: "menunggu_konfirmasi_langsung",
      proofUrl: null,
      rejectionReason: null,
      referenceNumber: null,
      paymentDeadline: new Date("2026-05-05T14:07:00Z"),
      verifiedAt: null,
      createdAt: new Date("2026-05-04T14:07:00Z"),
      lotName: "Mobil",
      lotId: "barang-vickrey",
      imageUrl: null,
      unitName: "UPC Ranotana",
      unitAddress: "Jl. Sam Ratulangi, Manado",
      account: null
    });

    expect(transaction.kind).toBe("VICKREY_WIN");
    expect(transaction.method).toBe("BAYAR_LANGSUNG");
    expect(transaction.status).toBe("MENUNGGU_KONFIRMASI_LANGSUNG");
    expect(transaction.paymentNotes.join(" ")).toMatch(/pembayaran hanya dapat diselesaikan langsung/i);
  });

  it("marks a vickrey winning bid as failed when the payment transaction expires", () => {
    const bid = serializeBuyerBid({
      pemasaranId: "pm-vickrey-gagal",
      lotName: "Gelang Berlian",
      unitName: "UPC Ranotana",
      bidAmount: "150000000",
      basePrice: "90000000",
      finalPrice: "100000000",
      paymentAmount: "100000000",
      paymentDeadline: new Date("2026-05-05T14:07:00Z"),
      transactionStatus: "gagal",
      endsAt: new Date("2026-05-04T14:07:00Z"),
      marketingStatus: "gagal",
      winnerId: "buyer-1",
      transactionId: "trx-vickrey-gagal",
      userId: "buyer-1"
    } as any);

    expect(bid.status).toBe("GAGAL");
    expect(bid.note).toMatch(/pembayaran vickrey gagal/i);
  });
});
