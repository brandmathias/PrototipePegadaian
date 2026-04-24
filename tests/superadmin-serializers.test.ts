import { describe, expect, it } from "vitest";

import {
  serializeMonitoringSummary,
  serializeUnitAccount,
  serializeUnitListItem
} from "@/lib/superadmin/serializers";

describe("superadmin serializers", () => {
  it("serializes unit summary for ui", () => {
    expect(
      serializeUnitListItem({
        id: "unit-1",
        code: "CP-MND-01",
        name: "Pegadaian CP Manado",
        address: "Jl. Piere Tendean No. 88",
        isActive: true,
        adminCount: 2,
        accountCount: 1,
        activeAccount: null
      })
    ).toMatchObject({
      id: "unit-1",
      code: "CP-MND-01",
      name: "Pegadaian CP Manado",
      status: "Aktif"
    });
  });

  it("serializes active account ui shape", () => {
    expect(
      serializeUnitAccount({
        id: "acc-1",
        bankName: "BRI",
        accountNumber: "0123",
        accountHolderName: "PT Pegadaian",
        branchName: "Manado",
        isActive: true
      })
    ).toEqual({
      id: "acc-1",
      bankName: "BRI",
      accountNumber: "0123",
      accountHolder: "PT Pegadaian",
      branch: "Manado",
      status: "AKTIF"
    });
  });

  it("serializes monitoring summary to dashboard shape", () => {
    expect(
      serializeMonitoringSummary({
        totalUnits: 2,
        activeUnits: 2,
        totalAdmins: 3,
        activeAccounts: 2,
        activeBlacklists: 1
      })
    ).toMatchObject({
      headline: expect.any(String),
      metrics: expect.arrayContaining([
        expect.objectContaining({ label: "Total Unit", value: "2" })
      ])
    });
  });
});
