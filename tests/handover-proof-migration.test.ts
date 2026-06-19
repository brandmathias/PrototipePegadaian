import { describe, expect, it } from "vitest";

import { HANDOVER_PROOF_MIGRATION_SQL } from "@/lib/db/handover-proof-migration";

describe("handover proof production migration", () => {
  it("only applies additive idempotent handover proof changes", () => {
    expect(HANDOVER_PROOF_MIGRATION_SQL).not.toMatch(/\bdrop\b/i);
    expect(HANDOVER_PROOF_MIGRATION_SQL).not.toMatch(/\bdelete\s+from\b/i);
    expect(HANDOVER_PROOF_MIGRATION_SQL).not.toMatch(/\btruncate\b/i);
    expect(HANDOVER_PROOF_MIGRATION_SQL).toMatch(/add column if not exists "handover_proof_url"/i);
    expect(HANDOVER_PROOF_MIGRATION_SQL).toMatch(/transaksi_handover_proof_uploaded_by_user_id_user_id_fk/i);
  });
});
