# Cross-Unit Blacklist History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore each admin unit's local violation ledger while preserving one synchronized global blacklist view for superadmin.

**Architecture:** Admin-unit reads start from local `pelanggaran_user` traces, then join those buyers to their global blacklist rows by buyer ID. Existing global escalation milestones assign each local trace its true Level 1, 2, or 3; the latest counted local milestone supplies the admin row's level, dates, status, and unit identity. Superadmin code and database schema remain unchanged.

**Tech Stack:** TypeScript, Next.js 15, Drizzle ORM, PostgreSQL, Vitest.

## Global Constraints

- No database schema change and no duplicate blacklist rows.
- Admin units see only item and transaction details owned by their unit.
- Superadmin keeps one global buyer row and all authorized cross-unit traces.
- Restriction durations remain Level 1 = 7 days, Level 2 = 30 days, Level 3 = 365 days.
- Tests must fail before production code changes and pass afterward.

---

### Task 1: Admin-unit local milestone regression

**Files:**
- Create: `tests/admin-blacklist-service.test.ts`
- Modify: `lib/services/admin-blacklist.service.ts`

**Interfaces:**
- Consumes: `deriveEffectiveBlacklistState()`, `listUnpaidAuctionTraces(unitId, userId?)`, and the existing Drizzle `db` client.
- Produces: `listAdminBlacklist(unitId)` rows whose `level`, `blockedUntilAt`, `status`, `lastIncidentAt`, `unit`, and `unitName` describe the latest counted local milestone.

- [ ] **Step 1: Write a failing service regression test**

Mock the Drizzle select chains for one Sarinah trace, a global blacklist row whose `unitId` points to Wanea, and three global facts. Assert that `listAdminBlacklist("unit-sarinah")` returns Safira as ended Level 1 with Sarinah identity instead of returning an empty list.

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `rtk npm test -- --run tests/admin-blacklist-service.test.ts`

Expected: FAIL because the current first query filters `blacklist.unit_id` to Sarinah and cannot seed the local row.

- [ ] **Step 3: Implement local-first list loading**

In `listAdminBlacklist(unitId)`:

1. Load local unpaid-auction traces first.
2. Return `[]` when there are no local traces.
3. Load global blacklist rows with `inArray(blacklists.userId, localUserIds)` and without filtering `blacklists.unitId`.
4. Derive the latest local milestone from the existing global milestone calculation.
5. Exclude buyers without a counted local milestone.
6. Serialize with the local milestone's level, deadline, occurrence timestamp, requested unit ID, and local unit name.

- [ ] **Step 4: Run the focused test and confirm GREEN**

Run: `rtk npm test -- --run tests/admin-blacklist-service.test.ts`

Expected: PASS for Sarinah Level 1 ended and Wanea-owned global row.

### Task 2: Local detail authorization and privacy

**Files:**
- Modify: `tests/admin-blacklist-service.test.ts`
- Modify: `lib/services/admin-blacklist.service.ts`

**Interfaces:**
- Consumes: counted local traces plus the buyer's global blacklist row.
- Produces: `getAdminBlacklistByUserId(unitId, userId)` that authorizes by counted local trace and returns local-only transaction/item traces.

- [ ] **Step 1: Add failing detail tests**

Add cases proving:

- Sarinah can open Safira even when the global blacklist row points to Wanea.
- An unrelated unit with no local trace receives `Riwayat blacklist tidak ditemukan di unit Anda.`
- Returned `unpaidAuctionTraces` contains only the requested unit's trace.

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `rtk npm test -- --run tests/admin-blacklist-service.test.ts`

Expected: FAIL because the current detail query authorizes through `blacklist.unit_id`.

- [ ] **Step 3: Implement trace-first detail authorization**

In `getAdminBlacklistByUserId(unitId, userId)`:

1. Load local traces before the blacklist row and reject an empty result.
2. Load the global blacklist row using only `blacklists.userId`.
3. Build the global escalation context and require a counted local milestone.
4. Keep all returned auction/item/transaction traces local.
5. Override displayed level, deadline, incident time, and unit identity with the latest local milestone.
6. Keep global counts only in `crossUnitViolationSummary`.

- [ ] **Step 4: Run focused tests and confirm GREEN**

Run: `rtk npm test -- --run tests/admin-blacklist-service.test.ts`

Expected: all list, authorization, and privacy tests PASS.

### Task 3: Synchronization and release verification

**Files:**
- Modify only if required by a failing assertion: `tests/blacklist-escalation.test.ts`
- Verify unchanged: `lib/services/blacklist.service.ts`

**Interfaces:**
- Consumes: existing superadmin global effective-state derivation.
- Produces: evidence that the admin fix does not downgrade or duplicate the superadmin Level 3 view.

- [ ] **Step 1: Run synchronization regressions**

Run: `rtk npm test -- --run tests/admin-blacklist-service.test.ts tests/blacklist-escalation.test.ts tests/admin-blacklist-page.test.tsx tests/superadmin-serializers.test.ts`

Expected: PASS; the global three-milestone state remains Level 3 while local views use their respective milestones.

- [ ] **Step 2: Run static verification**

Run: `rtk npx tsc --noEmit`

Expected: exit code 0.

- [ ] **Step 3: Run production build**

Run: `rtk npm run build`

Expected: exit code 0 and successful Next.js production build.

- [ ] **Step 4: Review the final diff**

Run: `rtk git diff --check` and `rtk git diff --stat`

Expected: no whitespace errors; only the service, regression test, and documentation are changed.

