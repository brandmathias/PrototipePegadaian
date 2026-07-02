# Retire Manual Blacklist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove every runtime and PostgreSQL dependency belonging only to blacklist review, manual revoke, or manual extension.

**Architecture:** Keep the automatic sequential blacklist pipeline and simplify its audit log to system-owned fields only. Level 3 becomes a finite 365-day automatic suspension, and the existing expiry job becomes responsible for closing the blacklist and reactivating the buyer.

**Tech Stack:** Next.js 15, TypeScript, Drizzle ORM, PostgreSQL, Vitest

---

### Task 1: Lock the retired-feature boundary with tests

**Files:**
- Create: `tests/retired-manual-blacklist.test.ts`
- Modify: `tests/blacklist-restrictions.test.ts`
- Modify: `tests/cron-service.test.ts`

- [ ] **Step 1: Write the failing schema and route regression test**

Assert that the Drizzle table objects do not contain the nine retired column keys and that the three manual route/page files plus two manual forms no longer exist.

- [ ] **Step 2: Write the failing policy test**

Assert that level 3 has `suspendsLogin: true`, has no `requiresManualReview` property, and becomes inactive after `blockedUntil`.

- [ ] **Step 3: Write the failing expiry test**

Assert that an expired level-3 row is closed, the buyer is reactivated, and the automatic expiry log contains no performer fields.

- [ ] **Step 4: Run the tests and verify RED**

Run:

```powershell
rtk npx vitest run tests/retired-manual-blacklist.test.ts tests/blacklist-restrictions.test.ts tests/cron-service.test.ts
```

Expected: failures identify existing schema keys, files, perpetual manual-review policy, and old expiry writes.

### Task 2: Remove manual runtime surfaces

**Files:**
- Delete: `app/api/superadmin/blacklist/[userId]/cabut/route.ts`
- Delete: `app/api/admin/blacklist/[userId]/perpanjang/route.ts`
- Delete: `app/admin/blacklist/[userId]/perpanjang/page.tsx`
- Delete: `components/superadmin/cabut-blacklist-form.tsx`
- Delete: `components/admin-unit/admin-blacklist-extend-form.tsx`
- Delete: `lib/blacklist/revoke.ts`
- Modify: `components/pages/admin-pages.tsx`
- Modify: `components/pages/admin-pages.lazy.tsx`
- Modify: `components/pages/superadmin-pages.tsx`
- Modify: `lib/admin-unit/validation.ts`
- Modify: `lib/superadmin/validation.ts`
- Modify: related validation and page tests

- [ ] **Step 1: Delete the manual route, page, form, and reason-option files**
- [ ] **Step 2: Remove their imports, dynamic exports, validation functions, and manual-review copy**
- [ ] **Step 3: Remove obsolete validation expectations**

### Task 3: Simplify automatic blacklist runtime and schema

**Files:**
- Modify: `lib/db/schema/superadmin.ts`
- Modify: `lib/db/schema/admin.ts`
- Modify: `lib/services/blacklist.service.ts`
- Modify: `lib/services/admin-blacklist.service.ts`
- Modify: `lib/services/cron.service.ts`
- Modify: `lib/services/monitoring.service.ts`
- Modify: `lib/blacklist/history.ts`
- Modify: `lib/blacklist/restrictions.ts`
- Modify: `lib/blacklist/effective-state.ts`
- Modify: `lib/services/buyer.service.ts`
- Modify: `lib/services/notification-events.ts`
- Modify: serializers and focused tests

- [ ] **Step 1: Remove all nine retired Drizzle columns**
- [ ] **Step 2: Remove revoke/extend services and manual actor joins**
- [ ] **Step 3: Serialize every retained action-log row as a system action**
- [ ] **Step 4: Replace `requiresManualReview` with `suspendsLogin`**
- [ ] **Step 5: Make date expiry apply to level 3 and reactivate its buyer**
- [ ] **Step 6: Remove `resolved_at` from monitoring SQL**

### Task 4: Create the destructive migration and current cleanup

**Files:**
- Create: `drizzle/0020_retire_manual_blacklist.sql`
- Create: `drizzle/meta/0020_snapshot.json`
- Modify: `drizzle/meta/_journal.json`
- Modify: `lib/db/obsolete-database-cleanup.ts`
- Modify: `tests/obsolete-database-cleanup.test.ts`
- Modify: `scripts/seed-blacklist-test-accounts.ts`
- Modify: `lib/mock-data.ts`

- [ ] **Step 1: Update current code so it no longer references retired columns**
- [ ] **Step 2: Generate migration metadata**

Run:

```powershell
rtk npm run db:generate -- --name retire_manual_blacklist
```

- [ ] **Step 3: Prepend data normalization**

Before dropping columns, delete non-automatic action rows and ensure retained level-3 rows have a finite `blocked_until`.

- [ ] **Step 4: Run targeted tests and verify GREEN**

Run:

```powershell
rtk npx vitest run tests/retired-manual-blacklist.test.ts tests/blacklist-restrictions.test.ts tests/cron-service.test.ts tests/blacklist-history.test.ts tests/obsolete-database-cleanup.test.ts
```

Expected: all selected tests pass.

### Task 5: Verify and apply production migration

**Files:**
- Temporary local helper only: `codex-tmp-retire-manual-blacklist.ts`

- [ ] **Step 1: Run the full relevant test set, typecheck, and build**

```powershell
rtk npm test
rtk npx tsc --noEmit --pretty false
rtk npm run build
```

- [ ] **Step 2: Run the production migration inside a rollback transaction**
- [ ] **Step 3: Apply the same migration transactionally**
- [ ] **Step 4: Audit `information_schema.columns`, retired tables, action values, and active expiry state**
- [ ] **Step 5: Delete the temporary helper**

### Task 6: Commit and push

- [ ] **Step 1: Inspect `git diff`, `git diff --check`, and final status**
- [ ] **Step 2: Commit with `fix(db): retire manual blacklist schema`**
- [ ] **Step 3: Push `master` to `origin`**
