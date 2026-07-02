import { describe, expect, it } from "vitest";

import {
  LEGACY_REAL_ACCOUNT_ID_REPAIRS,
  OBSOLETE_DATABASE_CLEANUP_SQL,
  OBSOLETE_DATABASE_TABLES,
  OBSOLETE_DEMO_USER_IDS
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

  it("repairs real accounts that still use demo or seed identifiers", () => {
    expect(LEGACY_REAL_ACCOUNT_ID_REPAIRS.map((repair) => repair.oldUserId)).toEqual([
      "admin-unit-demo-local",
      "buyer-admin-unit-demo-local",
      "seed-buyer-simple-1",
      "seed-buyer-simple-2"
    ]);

    for (const repair of LEGACY_REAL_ACCOUNT_ID_REPAIRS) {
      expect(repair.newUserId).not.toMatch(/demo|seed|mock|qa|test/i);
      expect(repair.newAccountRowId).not.toMatch(/demo|seed|mock|qa|test/i);
      expect(normalizedSql).toContain(repair.oldUserId);
      expect(normalizedSql).toContain(repair.newUserId);
    }

    expect(normalizedSql).toContain("legacy_real_account_id_repairs");
    expect(normalizedSql).toContain(`"phone_number" = null`);
    expect(normalizedSql).toContain("information_schema.table_constraints");
    expect(normalizedSql).toContain("referential_constraints");
    expect(normalizedSql).toContain(`update "pemasaran_views"`);
    expect(normalizedSql).toContain(`update "notifications" set "entity_id" = concat`);
    expect(normalizedSql).not.toContain(`update "notifications" set "entity_id" = concat('blacklist-', repair.new_user_id), "updated_at"`);
    expect(normalizedSql).toContain(`update "account"`);
    expect(normalizedSql).toContain(`"account_id" = repair.new_user_id`);
    expect(normalizedSql).toContain(`update "buyer_profile"`);
    expect(normalizedSql).toContain(`update "blacklist"`);
    expect(normalizedSql).not.toContain(`and blacklist."user_id" in (`);
  });

  it("deletes only explicit demo, QA, E2E, and seed test accounts after protected repairs", () => {
    expect(OBSOLETE_DEMO_USER_IDS).toEqual([
      "e72cbc9a-4c10-4df5-9f42-0069cb9a7449",
      "f574be26-79b1-4605-b992-f29e8c27b4ec",
      "9fac63bb-092c-4917-a1c5-6ec38ebb139e",
      "THcz3hXzETC2aE7FLoyQNQUqIybyQrqg",
      "ay2OrSTlMDhOq2BRmf6mf6L2k3tgZj0h",
      "BIMKBXimQSMHVl5gJjz9c8OSUppHvajp",
      "x8zkHFb7RHBiecsFPENz2pcoAzBOTKuo",
      "hGCZedleORx2YWzc1WMnx6mnbsVoHbA5",
      "hu2DffTnOpghsE3PNH1EPoQNrBxHYnpU",
      "7oSngAdHUgQs6KUWRifJdg0DXGhr8h8h",
      "9GgghqI1pf47KIXknFnozYXq1sLBMMG4",
      "ojZUiy342QiFZWWSoNjhHjTVoUvlVJ8m",
      "seed-level1-expired-user",
      "seed-level2-active-user",
      "pM2ZN4FVbyCPWirptofxurjVz3VspWSt"
    ]);

    expect(OBSOLETE_DEMO_USER_IDS).not.toContain("admin-unit-demo-local");
    expect(OBSOLETE_DEMO_USER_IDS).not.toContain("buyer-admin-unit-demo-local");
    expect(OBSOLETE_DEMO_USER_IDS).not.toContain("seed-buyer-simple-1");
    expect(OBSOLETE_DEMO_USER_IDS).not.toContain("seed-buyer-simple-2");
    expect(normalizedSql).toContain("obsolete_demo_user_ids");
    expect(normalizedSql).toContain(`concat('user:', obsolete_demo_user_ids."id")`);
    expect(normalizedSql).toContain(`delete from "user"`);
  });
});
