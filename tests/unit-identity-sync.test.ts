import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  rewriteSbgUnitNumber,
  syncAdminUnitDisplayName,
  syncUnitReferenceText,
} from "@/lib/superadmin/unit-identity-sync";

describe("unit identity synchronization", () => {
  it("rewrites existing SBG codes with the latest unit number", () => {
    expect(rewriteSbgUnitNumber("SBG-1179300000000004", "CP-MND-11787")).toBe(
      "SBG-1178700000000004",
    );
    expect(rewriteSbgUnitNumber("LEGACY-4", "CP-MND-11787")).toBe("LEGACY-4");
  });

  it("updates generated admin labels without overwriting personal names", () => {
    expect(syncAdminUnitDisplayName("Admin Unit Ranotana", "UPC Wanea")).toBe(
      "Admin Unit Wanea",
    );
    expect(syncAdminUnitDisplayName("Budi Santoso", "UPC Wanea")).toBe(
      "Budi Santoso",
    );
  });

  it("updates unit references embedded in operational account text", () => {
    expect(
      syncUnitReferenceText(
        "PT Pegadaian UPC Ranotana",
        "UPC Ranotana",
        "UPC Wanea",
      ),
    ).toBe("PT Pegadaian UPC Wanea");
    expect(
      syncUnitReferenceText("Ranotana", "UPC Ranotana", "UPC Wanea"),
    ).toBe("Wanea");
  });

  it("keeps unit, SBG, admin identity, accounts, and caches in one update flow", async () => {
    const service = await readFile(
      path.join(process.cwd(), "lib/services/unit.service.ts"),
      "utf8",
    );
    const updateFlow = service.slice(
      service.indexOf("export async function updateUnit"),
      service.indexOf("export async function deactivateUnit"),
    );

    expect(updateFlow).toContain("db.transaction");
    expect(updateFlow).toContain("rewriteSbgUnitNumber");
    expect(updateFlow).toContain("syncAdminUnitDisplayName");
    expect(updateFlow).toContain("syncUnitReferenceText");
    expect(updateFlow).toContain('revalidateTag("admin-layout")');
    expect(updateFlow).toContain('revalidateTag("admin-dashboard")');
    expect(updateFlow).toContain('revalidateTag("superadmin-monitoring")');
  });
});
