# Fixed-Price Catalog Position Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep a rejected fixed-price item at its pre-transaction catalog position while creating the required new marketing iteration and preserving views and wishlists.

**Architecture:** The active replacement iteration inherits the source iteration's publication timestamp. Catalog ordering continues to use the active iteration timestamp; production startup and manual repair must preserve the inherited timestamp instead of replacing it with the payment-rejection timestamp.

**Tech Stack:** Next.js, TypeScript, Drizzle/PostgreSQL, Vitest, Node production startup migration.

## Global Constraints

- A rejected fixed-price payment creates a new active fixed-price marketing iteration.
- The new iteration inherits `starts_at` and `created_at` from the rejected transaction's source marketing iteration.
- Existing wishlist and view records move to the new iteration without resetting their counts.
- Rejection and relist history events retain their actual event timestamps.
- A later change from fixed-price to Vickrey is outside this repair and keeps its established behavior.

---

### Task 1: Protect the catalog-position invariant

**Files:**
- Modify: `tests/fixed-price-rejected-relist-repair.test.ts`
- Modify: `tests/fixed-price-catalog-visibility.test.ts`
- Modify: `lib/db/fixed-price-rejected-relist-repair.ts`
- Modify: `scripts/start-production.mjs`

**Interfaces:**
- Consumes: source and replacement `pemasaran` rows joined by `barang_id` and consecutive fixed-price iterations.
- Produces: repair SQL that copies the source iteration's publication timestamp into the replacement iteration.

- [ ] **Step 1: Write failing regression assertions**

Assert that repair/startup SQL assigns `previous_p."created_at"` to replacement `starts_at` and `created_at`, never the rejection timestamp. Replace the obsolete catalog test that expects relists at the top with the inherited-position contract.

- [ ] **Step 2: Run the focused tests and observe the expected failure**

Run: `npm test -- --run tests/fixed-price-rejected-relist-repair.test.ts tests/fixed-price-catalog-visibility.test.ts tests/public-catalog-ordering.test.ts --exclude ".worktrees/**"`

Expected: FAIL because production startup and manual repair currently assign the rejection time.

- [ ] **Step 3: Correct both repair paths**

Change the historical sync CTE to expose the source marketing `created_at` as `original_published_at`; update replacement `starts_at` and `created_at` from that value. Correct the candidate query alias and pass each candidate's source publication timestamp when a missing replacement iteration is created.

- [ ] **Step 4: Verify transaction and repair behavior**

Run the focused catalog, transaction, and repair tests, then TypeScript checking and the production build. Run `graphify update .` and `git diff --check`; do not stage generated `graphify-out` files.

- [ ] **Step 5: Commit and push**

Commit the catalog repair independently, then push both verified commits to `origin/master`.
