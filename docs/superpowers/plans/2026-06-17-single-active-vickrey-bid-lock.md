# Single Active Vickrey Bid Lock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent buyer from bidding on more than one Lelang Tertutup at a time, while preserving the existing 24-hour violation flow.

**Architecture:** Derive bid lock from existing bid, marketing, and transaction state instead of adding a table. Enforce on the server before inserting bids and expose a small lock summary to lot detail UI.

**Tech Stack:** Next.js App Router, React, Drizzle ORM, Vitest, Testing Library.

---

## File Structure

- Modify `lib/services/buyer.service.ts`: add lock policy helper, DB lookup, submit guard, and `getBuyerProfileStatus` lock summary.
- Modify `components/public/lot-detail-page.tsx`: read lock summary and disable Vickrey CTA for other lots.
- Modify `components/buyer/vickrey-bid-form.tsx`: accept explicit bid lock props for page-level bid forms.
- Modify `components/pages/public-pages.tsx`: keep legacy `BidPage` prop shape compatible.
- Test `tests/buyer-vickrey-bid-lock.test.ts`: service lock policy and server guard.
- Test `tests/buyer-vickrey-pages.test.tsx`: UI disabled CTA for active bid lock.

## Tasks

### Task 1: Spec And Planning Docs

**Files:**
- Create: `docs/superpowers/specs/2026-06-17-single-active-vickrey-bid-lock-design.md`
- Create: `docs/superpowers/plans/2026-06-17-single-active-vickrey-bid-lock.md`

- [ ] Write approved design and plan documents.
- [ ] Commit docs with `git commit -m "docs: specify single active vickrey bid lock"`.

### Task 2: RED Tests

**Files:**
- Create: `tests/buyer-vickrey-bid-lock.test.ts`
- Modify: `tests/buyer-vickrey-pages.test.tsx`

- [ ] Add policy tests for active bid, unpaid winner, losing bid, failed bid, verified winner, and failed winner.
- [ ] Add `submitVickreyBid` test expecting a second auction bid to reject with the active-lock message.
- [ ] Add lot detail test expecting disabled CTA and active-lock copy when buyer has another active auction lock.
- [ ] Run `npm test -- tests/buyer-vickrey-bid-lock.test.ts tests/buyer-vickrey-pages.test.tsx` and verify failure before production code changes.

### Task 3: GREEN Service Guard

**Files:**
- Modify: `lib/services/buyer.service.ts`

- [ ] Add `ACTIVE_VICKREY_BID_LOCK_MESSAGE`.
- [ ] Add `isActiveVickreyBidLockRow` policy helper.
- [ ] Add `getActiveVickreyBidLock(userId, currentPemasaranId?)`.
- [ ] In `submitVickreyBid`, check existing bid first, then reject if another active Vickrey bid lock exists.
- [ ] Add `vickreyBidLock` summary to `getBuyerProfileStatus`.

### Task 4: GREEN UI

**Files:**
- Modify: `components/public/lot-detail-page.tsx`
- Modify: `components/buyer/vickrey-bid-form.tsx`
- Modify: `components/pages/public-pages.tsx`

- [ ] Extend buyer status type with optional `vickreyBidLock`.
- [ ] Disable lot-detail Vickrey CTA when another active bid lock exists.
- [ ] Pass explicit lock props to `VickreyBidForm`.
- [ ] Keep blacklist copy priority above bid-lock copy.

### Task 5: Verification And Git

**Files:**
- Verify all modified files.

- [ ] Run `npm test -- tests/buyer-vickrey-bid-lock.test.ts tests/buyer-vickrey-pages.test.tsx tests/buyer-auction-refresh.test.ts tests/cron-overdue-idempotency.test.ts`.
- [ ] Run `npm run build`.
- [ ] Commit implementation with `git commit -m "feat: enforce single active vickrey bid"`.
- [ ] Push `master` to origin.

## Self-Review

- Spec coverage: plan covers server guard, derived lock, UI disabled state, and tests for payment/blacklist boundaries.
- Placeholder scan: no placeholder tasks remain.
- Type consistency: lock fields use `active`, `lotId`, and `lotName` across service and UI.
