# Remove Handover Complaint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove every application and PostgreSQL dependency belonging to the handover-complaint feature.

**Architecture:** Preserve the current verified-payment, handover-proof, buyer-completion, and grace-period auto-completion pipeline. Delete the complaint branch at each shared boundary and use one destructive, idempotent migration to remove its two transaction columns.

**Tech Stack:** Next.js 15, TypeScript, Drizzle ORM, PostgreSQL, Vitest

---

### Task 1: Lock the retired-feature boundary

**Files:**
- Create: `tests/retired-handover-complaint.test.ts`
- Modify: `tests/handover-finalization.test.ts`
- Modify: `tests/cron-overdue-idempotency.test.ts`

- [ ] Add assertions that the complaint route, component, schema keys, migration additions, and active runtime terms do not exist.
- [ ] Change finalization expectations so eligibility depends only on `lunas` status and the handover deadline.
- [ ] Change cron expectations so the query and automatic-completion note contain no complaint branch.
- [ ] Run the tests and confirm they fail against the current implementation.

### Task 2: Remove frontend and API surfaces

**Files:**
- Delete: `components/buyer/handover-complaint-button.tsx`
- Delete: `app/api/user/transaksi/[id]/komplain-serah-terima/route.ts`
- Modify: `components/pages/user-pages.tsx`
- Modify: `components/pages/admin-marketing-pages.tsx`
- Modify: `components/pages/admin-transaction-pages.tsx`
- Modify: `components/pages/superadmin-pages.tsx`

- [ ] Remove buyer complaint imports, actions, notices, and copy.
- [ ] Remove complaint-specific admin-unit and superadmin status branches.
- [ ] Keep the grace-period notice focused on buyer completion.

### Task 3: Remove service, contract, and serializer dependencies

**Files:**
- Modify: `lib/contracts/buyer.ts`
- Modify: `lib/services/buyer.service.ts`
- Modify: `lib/services/admin-pemasaran.service.ts`
- Modify: `lib/services/admin-transaction.service.ts`
- Modify: `lib/services/cron.service.ts`
- Modify: `lib/buyer/serializers.ts`
- Modify: `lib/admin-unit/serializers.ts`
- Modify: `lib/transactions/handover-finalization.ts`

- [ ] Delete the buyer complaint mutation and data mapping.
- [ ] Delete complaint fields from cross-role types and serializers.
- [ ] Remove complaint filters from auto-completion while retaining its deadline and idempotency guards.

### Task 4: Remove PostgreSQL columns

**Files:**
- Modify: `lib/db/schema/admin.ts`
- Modify: `lib/db/handover-auto-completion-migration.ts`
- Create: `drizzle/0022_remove_handover_complaint.sql`
- Create: `drizzle/meta/0022_snapshot.json`
- Modify: `drizzle/meta/_journal.json`
- Create: `lib/db/remove-handover-complaint-migration.ts`
- Create: `scripts/remove-handover-complaint.ts`
- Modify: `package.json`

- [ ] Remove the two Drizzle schema fields.
- [ ] Stop the legacy auto-completion migration from recreating them.
- [ ] Generate the current Drizzle migration metadata.
- [ ] Add idempotent `DROP COLUMN IF EXISTS` SQL and a transactional production runner.

### Task 5: Update tests and verify

**Files:**
- Modify: complaint-related serializer, page, cron, and migration tests.

- [ ] Remove obsolete complaint fixtures and expectations.
- [ ] Run focused tests until green.
- [ ] Run the full test suite, TypeScript check, and production build.
- [ ] Audit the repository for active complaint identifiers and copy.
- [ ] Apply the destructive migration and audit `information_schema.columns`.

### Task 6: Publish

- [ ] Inspect the complete diff and run `git diff --check`.
- [ ] Commit the verified implementation.
- [ ] Push `master` to `origin`.
