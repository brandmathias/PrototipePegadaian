import { describe, expect, it } from "vitest";

import {
  ADMIN_BARANG_MEDIA_LIMIT,
  validateAdminBarangPayload,
  validateAdminBarangMediaList,
  validateBlacklistExtendPayload,
  validatePemasaranPayload,
  validatePerpanjanganPayload,
  validateTransactionVerificationPayload
} from "@/lib/admin-unit/validation";

describe("admin unit validation", () => {
  it("normalizes barang gadai input", () => {
    const payload = validateAdminBarangPayload({
      name: "  Cincin Emas 18K ",
      category: "emas",
      condition: "baik",
      appraisalValue: "8500000",
      loanValue: "6500000",
      pawnedAt: "2026-04-01",
      dueDate: "2026-05-01",
      ownerName: " Raras ",
      customerNumber: "CST-001",
      description: "Barang lengkap."
    });

    expect(payload.name).toBe("Cincin Emas 18K");
    expect(payload.appraisalValue).toBe("8500000");
    expect(payload.loanValue).toBe("6500000");
  });

  it("rejects invalid loan and due date", () => {
    expect(() =>
      validateAdminBarangPayload({
        name: "Laptop",
        category: "elektronik",
        condition: "baik",
        appraisalValue: "5000000",
        loanValue: "6000000",
        pawnedAt: "2026-04-01",
        dueDate: "2026-04-01",
        ownerName: "Budi"
      })
    ).toThrow("Nilai gadai tidak boleh melebihi nilai taksiran.");
  });

  it("validates perpanjangan date must move forward", () => {
    expect(
      validatePerpanjanganPayload(
        {
          newDueDate: "2026-06-01",
          note: "Nasabah memperpanjang."
        },
        "2026-05-01"
      )
    ).toEqual({
      newDueDate: "2026-06-01",
      note: "Nasabah memperpanjang."
    });

    expect(() => validatePerpanjanganPayload({ newDueDate: "2026-04-30" }, "2026-05-01")).toThrow(
      "Tanggal jatuh tempo baru harus lebih besar dari tanggal saat ini."
    );
  });

  it("validates pemasaran fixed price and vickrey payloads", () => {
    expect(validatePemasaranPayload({ mode: "fixed_price", price: "12500000" })).toMatchObject({
      mode: "fixed_price",
      price: "12500000"
    });

    expect(validatePemasaranPayload({ mode: "vickrey", price: "10000000", durationDays: "7" })).toMatchObject({
      mode: "vickrey",
      price: "10000000",
      durationDays: 7
    });

    expect(() => validatePemasaranPayload({ mode: "vickrey", price: "0", durationDays: "31" })).toThrow(
      "Harga pemasaran harus lebih dari 0."
    );
  });

  it("validates transaction verification and blacklist extension", () => {
    expect(validateTransactionVerificationPayload({ reference: "REF-001" })).toEqual({
      reference: "REF-001"
    });

    expect(() => validateTransactionVerificationPayload({ reference: "" })).toThrow(
      "Nomor referensi wajib diisi."
    );

    expect(validateBlacklistExtendPayload({ blockedUntil: "2026-07-01", reason: "Pelanggaran berulang." })).toEqual({
      blockedUntil: "2026-07-01",
      reason: "Pelanggaran berulang."
    });
  });

  it("limits barang media uploads to four foto or video files", () => {
    expect(
      validateAdminBarangMediaList([
        { type: "foto", url: "/uploads/barang/foto-1.jpg", fileName: "foto-1.jpg", sizeBytes: 1000 },
        { type: "video", url: "/uploads/barang/video-1.mp4", fileName: "video-1.mp4", sizeBytes: 2000 }
      ])
    ).toEqual([
      {
        type: "foto",
        url: "/uploads/barang/foto-1.jpg",
        fileName: "foto-1.jpg",
        sizeBytes: 1000,
        sortOrder: 0
      },
      {
        type: "video",
        url: "/uploads/barang/video-1.mp4",
        fileName: "video-1.mp4",
        sizeBytes: 2000,
        sortOrder: 1
      }
    ]);

    expect(() =>
      validateAdminBarangMediaList(
        Array.from({ length: ADMIN_BARANG_MEDIA_LIMIT + 1 }, (_, index) => ({
          type: "foto",
          url: `/uploads/barang/foto-${index}.jpg`
        }))
      )
    ).toThrow(`Maksimal ${ADMIN_BARANG_MEDIA_LIMIT} foto atau video untuk satu barang.`);

    expect(() => validateAdminBarangMediaList([{ type: "dokumen", url: "/uploads/barang/file.pdf" }])).toThrow(
      "Jenis media hanya bisa foto atau video."
    );
  });
});
