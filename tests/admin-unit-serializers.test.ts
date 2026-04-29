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

    expect(item.status).toBe("GADAI");
    expect(item.ownerName).toBe("Raras");
    expect(item.appraisalValue).toBe(8500000);
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
        startsAt: new Date("2026-04-01T00:00:00Z"),
        endsAt: new Date("2099-04-08T00:00:00Z"),
        winnerId: null,
        finalPrice: null,
        iteration: 1,
        status: "aktif",
        createdByUserId: "admin-1",
        createdAt: new Date("2026-04-01T00:00:00Z"),
        updatedAt: new Date("2026-04-01T00:00:00Z")
      },
      { lotName: "Cincin", bidCount: 2 }
    );

    expect(auction.visibility).toBe("TERKUNCI");
    expect(auction.finalPrice).toBeNull();
    expect(auction.endingAt).toBe("2099-04-08T00:00:00.000Z");
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
      rejectionReason: null,
      referenceNumber: null,
      paymentDeadline: new Date("2026-04-25T00:00:00Z"),
      verifiedByUserId: null,
      verifiedAt: null,
      createdAt: new Date("2026-04-24T00:00:00Z"),
      updatedAt: new Date("2026-04-24T00:00:00Z")
    });

    expect(transaction.status).toBe("BUKTI_DIUNGGAH");
    expect(transaction.method).toBe("TRANSFER_BANK");
    expect(transaction.total).toBe(12500000);
    expect(transaction.deadlineAt).toBe("2026-04-25T00:00:00.000Z");
  });
});
