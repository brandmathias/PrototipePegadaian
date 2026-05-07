import { describe, expect, it } from "vitest";

import { serializeBuyerTransaction } from "@/lib/buyer/serializers";

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
});
