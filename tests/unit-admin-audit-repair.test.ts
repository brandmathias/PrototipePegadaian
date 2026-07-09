import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
  repairUnitAdminAuditTrail,
  UNIT_ADMIN_AUDIT_REPAIR_CANDIDATES_SQL,
  UNIT_ADMIN_AUDIT_REPAIR_CONTEXT_SQL,
  type UnitAdminAuditRepairCandidate,
  type UnitAdminAuditRepairContext,
} from "@/lib/db/unit-admin-audit-repair";

function makeClient(
  context: UnitAdminAuditRepairContext | null,
  candidates: UnitAdminAuditRepairCandidate[],
) {
  return {
    query: vi.fn(async (text: string) => {
      if (text === UNIT_ADMIN_AUDIT_REPAIR_CONTEXT_SQL) {
        return { rows: context ? [context] : [], rowCount: context ? 1 : 0 };
      }

      if (text === UNIT_ADMIN_AUDIT_REPAIR_CANDIDATES_SQL) {
        return { rows: candidates, rowCount: candidates.length };
      }

      if (text === "begin" || text === "commit" || text === "rollback") {
        return { rows: [], rowCount: null };
      }

      return { rows: [], rowCount: 1 };
    }),
  };
}

describe("unit admin audit repair", () => {
  const context: UnitAdminAuditRepairContext = {
    unit_id: "unit-wanea",
    unit_name: "UPC Wanea",
    replacement_user_id: "admin-wanea",
    replacement_user_name: "Hendra Wijaya",
  };

  const candidate: UnitAdminAuditRepairCandidate = {
    stale_user_id: "admin-ranotana-legacy",
    stale_user_name: "Admin Unit Ranotana",
    verified_transaction_count: 2,
    handover_transaction_count: 2,
    history_actor_count: 3,
    extension_history_count: 1,
    marketing_created_count: 1,
    barang_created_count: 1,
  };

  it("lists candidates during dry-run without writing changes", async () => {
    const client = makeClient(context, [candidate]);

    const result = await repairUnitAdminAuditTrail(client, {
      apply: false,
      replacementAdminName: "Hendra Wijaya",
      staleAdminNames: ["Admin Unit Ranotana"],
      unitName: "UPC Wanea",
    });

    expect(result).toEqual({
      applied: 0,
      candidates: [candidate],
      context,
      skipped: 0,
    });
    expect(client.query).toHaveBeenCalledTimes(2);
    expect(client.query).toHaveBeenCalledWith(UNIT_ADMIN_AUDIT_REPAIR_CONTEXT_SQL, [
      "UPC Wanea",
      "Hendra Wijaya",
    ]);
    expect(client.query).toHaveBeenCalledWith(UNIT_ADMIN_AUDIT_REPAIR_CANDIDATES_SQL, [
      "unit-wanea",
      ["admin unit ranotana"],
    ]);
  });

  it("repoints transaksi and audit references to the active Wanea admin when applied", async () => {
    const client = makeClient(context, [candidate]);

    const result = await repairUnitAdminAuditTrail(client, {
      apply: true,
      replacementAdminName: "Hendra Wijaya",
      staleAdminNames: ["Admin Unit Ranotana"],
      unitName: "UPC Wanea",
      nowFactory: () => new Date("2026-07-09T00:30:00.000Z"),
    });

    expect(result).toEqual({
      applied: 6,
      candidates: [candidate],
      context,
      skipped: 0,
    });
    expect(client.query).toHaveBeenCalledWith("begin");
    expect(client.query).toHaveBeenCalledWith("commit");
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining(`set "verified_by_user_id" = $2`),
      [
        "unit-wanea",
        "admin-wanea",
        "admin-ranotana-legacy",
        new Date("2026-07-09T00:30:00.000Z"),
      ],
    );
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining(`set "handover_proof_uploaded_by_user_id" = $2`),
      [
        "unit-wanea",
        "admin-wanea",
        "admin-ranotana-legacy",
        new Date("2026-07-09T00:30:00.000Z"),
      ],
    );
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining(`set "changed_by_user_id" = $2`),
      [
        "unit-wanea",
        "admin-wanea",
        "admin-ranotana-legacy",
        new Date("2026-07-09T00:30:00.000Z"),
      ],
    );
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining(`set "extended_by_user_id" = $2`),
      [
        "unit-wanea",
        "admin-wanea",
        "admin-ranotana-legacy",
        new Date("2026-07-09T00:30:00.000Z"),
      ],
    );
  });

  it("fails fast when the replacement admin for Wanea cannot be found", async () => {
    const client = makeClient(
      {
        unit_id: "unit-wanea",
        unit_name: "UPC Wanea",
        replacement_user_id: null,
        replacement_user_name: null,
      },
      [candidate],
    );

    await expect(
      repairUnitAdminAuditTrail(client, {
        apply: false,
        replacementAdminName: "Hendra Wijaya",
        staleAdminNames: ["Admin Unit Ranotana"],
        unitName: "UPC Wanea",
      }),
    ).rejects.toThrow(/admin aktif hendra wijaya/i);
  });

  it("exposes a production repair script", () => {
    const packageJson = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8"));

    expect(packageJson.scripts["db:repair:unit-admin-audit"]).toBe(
      "tsx scripts/repair-unit-admin-audit.ts",
    );
  });

  it("runs the Wanea admin audit repair during production startup", () => {
    const startupScript = readFileSync(join(process.cwd(), "scripts/start-production.mjs"), "utf8");

    expect(startupScript).toContain("lower('UPC Wanea')");
    expect(startupScript).toContain("lower('Hendra Wijaya')");
    expect(startupScript).toContain("admin unit ranotana");
    expect(startupScript).toContain("admin upc ranotana");
    expect(startupScript).toContain("updated_handover_transactions");
  });
});
