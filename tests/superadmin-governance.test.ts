import { describe, expect, it } from "vitest";

import {
  buildGovernanceSnapshot,
  classifyGovernanceFollowUp,
  isActiveBuyerViolation
} from "@/lib/superadmin/governance";

describe("superadmin governance rules", () => {
  it("keeps rejected fixed price proof in follow-up, not active buyer violation", () => {
    const caseInfo = classifyGovernanceFollowUp({
      marketingMode: "fixed_price",
      marketingStatus: "aktif",
      transactionStatus: "ditolak_bukti",
      transactionType: "fixed_price"
    });

    expect(caseInfo.category).toBe("perlu_tindak_lanjut");
    expect(isActiveBuyerViolation(caseInfo)).toBe(false);
  });

  it("keeps auctions without bids in follow-up, not active buyer violation", () => {
    const caseInfo = classifyGovernanceFollowUp({
      bidCount: 0,
      marketingMode: "vickrey",
      marketingStatus: "gagal",
      transactionStatus: null,
      transactionType: null
    });

    expect(caseInfo.category).toBe("perlu_tindak_lanjut");
    expect(isActiveBuyerViolation(caseInfo)).toBe(false);
  });

  it("only treats overdue unpaid Vickrey winner incidents as active buyer violations", () => {
    const caseInfo = classifyGovernanceFollowUp({
      bidCount: 3,
      hasViolationIncident: true,
      marketingMode: "vickrey",
      marketingStatus: "selesai",
      transactionStatus: "gagal",
      transactionType: "vickrey"
    });

    expect(caseInfo.category).toBe("pelanggaran_aktif");
    expect(isActiveBuyerViolation(caseInfo)).toBe(true);
  });

  it("builds the national snapshot without mixing follow-up and violations", () => {
    const snapshot = buildGovernanceSnapshot({
      collateralItems: 8,
      marketedItems: 5,
      soldItems: 3,
      followUpItems: 2,
      validatedTransactionValue: 72500000
    });

    expect(snapshot.map((item) => item.label)).toEqual([
      "Barang Jaminan",
      "Sedang Dipasarkan",
      "Terjual",
      "Perlu Tindak Lanjut",
      "Nilai Transaksi Tervalidasi"
    ]);
    expect(snapshot[3]).toMatchObject({ value: "2" });
    expect(snapshot[4].value).toBe("Rp 72,5 jt");
  });
});
