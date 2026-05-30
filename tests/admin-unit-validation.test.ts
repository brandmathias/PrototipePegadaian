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

  it("normalizes category-specific barang specifications", () => {
    const payload = validateAdminBarangPayload({
      name: "Cincin Emas Berlian",
      category: "perhiasan",
      condition: "baik",
      appraisalValue: "18500000",
      loanValue: "12000000",
      pawnedAt: "2026-04-01",
      dueDate: "2026-05-01",
      ownerName: "Raras",
      specifications: {
        jenisEmas: "  Cincin ",
        kadarEmas: "99,9%",
        berat: "3,20 gram",
        bentuk: "Perhiasan",
        panjang: "18 cm",
        diameter: "16 mm",
        sertifikat: "Antam",
        nomorMesin: "Bukan field perhiasan"
      }
    });

    expect(payload.specifications).toEqual({
      berat: "3,20 gram",
      bentuk: "Perhiasan",
      diameter: "16 mm",
      jenisEmas: "Cincin",
      kadarEmas: "99,9%",
      panjang: "18 cm",
      sertifikat: "Antam"
    });
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

    expect(() =>
      validateAdminBarangPayload({
        name: "Laptop",
        category: "elektronik",
        condition: "baik",
        appraisalValue: "5000000",
        loanValue: "4500000",
        pawnedAt: "2026-02-31",
        dueDate: "2026-03-15",
        ownerName: "Budi"
      })
    ).toThrow("Tanggal gadai belum valid.");
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

  it("validates pemasaran fixed price and structured vickrey durations", () => {
    expect(validatePemasaranPayload({ mode: "fixed_price", price: "12500000" })).toEqual({
      mode: "fixed_price",
      price: "12500000"
    });

    expect(
      validatePemasaranPayload({
        mode: "vickrey",
        price: "10000000",
        durationDays: "7",
        durationHours: "4",
        durationMinutes: "30",
        durationSeconds: "15"
      })
    ).toEqual({
      mode: "vickrey",
      price: "10000000",
      durationDays: 7,
      durationHours: 4,
      durationMinutes: 30,
      durationSeconds: 15,
      totalSeconds: 621015
    });

    expect(() =>
      validatePemasaranPayload({
        mode: "vickrey",
        price: "10000000",
        durationDays: "0",
        durationHours: "24"
      })
    ).toThrow("Jam lelang harus 0 sampai 23.");

    expect(() =>
      validatePemasaranPayload({
        mode: "vickrey",
        price: "10000000",
        durationDays: "0",
        durationHours: true
      })
    ).toThrow("Jam lelang harus 0 sampai 23.");

    expect(() =>
      validatePemasaranPayload({
        mode: "vickrey",
        price: "10000000",
        durationDays: "0",
        durationMinutes: "60"
      })
    ).toThrow("Menit lelang harus 0 sampai 59.");

    expect(() =>
      validatePemasaranPayload({
        mode: "vickrey",
        price: "10000000",
        durationDays: "0",
        durationMinutes: []
      })
    ).toThrow("Menit lelang harus 0 sampai 59.");

    expect(() =>
      validatePemasaranPayload({
        mode: "vickrey",
        price: "10000000",
        durationDays: "0",
        durationSeconds: "60"
      })
    ).toThrow("Detik lelang harus 0 sampai 59.");

    expect(() =>
      validatePemasaranPayload({
        mode: "vickrey",
        price: "10000000",
        durationDays: "0",
        durationSeconds: "1e2"
      })
    ).toThrow("Detik lelang harus 0 sampai 59.");

    expect(() =>
      validatePemasaranPayload({
        mode: "vickrey",
        price: "10000000",
        durationDays: "0",
        durationHours: "0",
        durationMinutes: "0",
        durationSeconds: "0"
      })
    ).toThrow("Durasi lelang harus lebih dari 0 detik.");

    expect(() =>
      validatePemasaranPayload({
        mode: "vickrey",
        price: "10000000",
        durationDays: "30",
        durationHours: "0",
        durationMinutes: "0",
        durationSeconds: "1"
      })
    ).toThrow("Durasi lelang maksimal 30 hari.");

    expect(() => validatePemasaranPayload({ mode: "vickrey", price: "0", durationDays: "7" })).toThrow(
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

  it("limits barang media uploads to five foto or video files", () => {
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

    expect(() => validateAdminBarangMediaList([null])).toThrow("Media barang belum valid.");
  });
});
