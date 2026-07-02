import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { HANDOVER_AUTO_COMPLETION_MIGRATION_SQL } from "@/lib/db/handover-auto-completion-migration";
import { REMOVE_HANDOVER_COMPLAINT_MIGRATION_SQL } from "@/lib/db/remove-handover-complaint-migration";
import { transaksi } from "@/lib/db/schema";

describe("retired handover complaint surface", () => {
  it("does not expose complaint columns in the active transaction schema or additive migration", () => {
    expect(Object.keys(transaksi)).not.toEqual(
      expect.arrayContaining(["handoverComplaintAt", "handoverComplaintNote"]),
    );
    expect(HANDOVER_AUTO_COMPLETION_MIGRATION_SQL).not.toMatch(/handover_complaint/i);
  });

  it.each([
    "app/api/user/transaksi/[id]/komplain-serah-terima/route.ts",
    "components/buyer/handover-complaint-button.tsx",
  ])("removes %s", (path) => {
    expect(existsSync(resolve(process.cwd(), path))).toBe(false);
  });

  it("drops both retired PostgreSQL columns idempotently", () => {
    expect(REMOVE_HANDOVER_COMPLAINT_MIGRATION_SQL).toMatch(
      /drop column if exists "handover_complaint_at"/i,
    );
    expect(REMOVE_HANDOVER_COMPLAINT_MIGRATION_SQL).toMatch(
      /drop column if exists "handover_complaint_note"/i,
    );
  });

  it("applies the destructive migration before the production server starts", () => {
    const dockerfile = readFileSync(resolve(process.cwd(), "Dockerfile"), "utf8");

    expect(dockerfile).toContain("COPY --from=builder --chown=nextjs:nodejs /app/scripts/start-production.mjs ./start-production.mjs");
    expect(dockerfile).toContain('CMD ["node", "start-production.mjs"]');
  });
});
