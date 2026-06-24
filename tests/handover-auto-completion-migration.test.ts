import { describe, expect, it } from "vitest";

import { HANDOVER_AUTO_COMPLETION_MIGRATION_SQL } from "@/lib/db/handover-auto-completion-migration";

describe("handover auto-completion production migration", () => {
  it("only applies additive idempotent transaction columns", () => {
    expect(HANDOVER_AUTO_COMPLETION_MIGRATION_SQL).not.toMatch(/\bdrop\b/i);
    expect(HANDOVER_AUTO_COMPLETION_MIGRATION_SQL).not.toMatch(/\bdelete\s+from\b/i);
    expect(HANDOVER_AUTO_COMPLETION_MIGRATION_SQL).not.toMatch(/\btruncate\b/i);
    expect(HANDOVER_AUTO_COMPLETION_MIGRATION_SQL).toMatch(/add column if not exists "handover_complaint_at"/i);
    expect(HANDOVER_AUTO_COMPLETION_MIGRATION_SQL).toMatch(/add column if not exists "handover_complaint_note"/i);
    expect(HANDOVER_AUTO_COMPLETION_MIGRATION_SQL).toMatch(/add column if not exists "completed_at"/i);
    expect(HANDOVER_AUTO_COMPLETION_MIGRATION_SQL).toMatch(/add column if not exists "completion_source"/i);
  });
});
