import { describe, expect, it } from "vitest";

import {
  OBSOLETE_DATABASE_CLEANUP_SQL,
  OBSOLETE_DATABASE_TABLES
} from "@/lib/db/obsolete-database-cleanup";

const normalizedSql = OBSOLETE_DATABASE_CLEANUP_SQL.replace(/\s+/g, " ").trim().toLowerCase();

describe("obsolete database cleanup", () => {
  it("drops only the retired blacklist review tables in dependency order", () => {
    expect(OBSOLETE_DATABASE_TABLES).toEqual([
      "blacklist_review_attachment",
      "blacklist_review_case"
    ]);

    const attachmentDrop = normalizedSql.indexOf(
      'drop table if exists "blacklist_review_attachment"'
    );
    const caseDrop = normalizedSql.indexOf('drop table if exists "blacklist_review_case"');

    expect(attachmentDrop).toBeGreaterThanOrEqual(0);
    expect(caseDrop).toBeGreaterThan(attachmentDrop);
    expect(normalizedSql).not.toContain(" cascade");

    for (const activeTable of [
      "pelanggaran_user",
      "blacklist",
      "blacklist_action_log",
      "transaksi",
      "user",
      "account",
      "verification"
    ]) {
      expect(normalizedSql).not.toContain(`drop table if exists "${activeTable}"`);
    }
  });

  it("purges only proven-dead legacy events and expired auth rows", () => {
    expect(normalizedSql).toContain(`"type" = 'blacklist_review_submitted'`);
    expect(normalizedSql).toContain(`"entity_type" = 'blacklist_review'`);
    expect(normalizedSql).toContain(`"entity_type" = 'superadmin_audit'`);
    expect(normalizedSql).toContain(`'superadmin_account_created'`);
    expect(normalizedSql).toContain(`'superadmin_account_updated'`);
    expect(normalizedSql).toContain(`'superadmin_account_reset'`);
    expect(normalizedSql).toContain(`'superadmin_account_guardrail'`);
    expect(normalizedSql).toContain(
      `"action" in ('review_diajukan', 'review_ditolak', 'otomatis')`
    );
    expect(normalizedSql).toContain(`set "action" = 'cabut_manual'`);
    expect(normalizedSql).toContain(`where "action" = 'review_disetujui'`);
    expect(normalizedSql).toContain(`set "resolution_type" = 'cabut_manual'`);
    expect(normalizedSql).toContain(
      `where "resolution_type" = 'review_disetujui'`
    );
    expect(normalizedSql).toMatch(
      /replace\(\s*"note", 'membutuhkan review manual', 'membutuhkan evaluasi manual'\s*\)/
    );
    expect(normalizedSql).toContain(
      `delete from "barang" where "id" like 'seed-level3-review-%'`
    );
    expect(normalizedSql).toContain(
      `delete from "user" where "id" = 'seed-level3-review-user'`
    );
    expect(normalizedSql).toContain(`delete from "user" where "id" like 'qa-%'`);
    expect(normalizedSql).toContain(`delete from "buyer_profile" as profile`);
    expect(normalizedSql).toContain(`owner."role" <> 'buyer'`);
    expect(normalizedSql).toContain(`delete from "session" where "expires_at" <= now()`);
    expect(normalizedSql).toContain(`delete from "verification" where "expires_at" <= now()`);
  });
});
