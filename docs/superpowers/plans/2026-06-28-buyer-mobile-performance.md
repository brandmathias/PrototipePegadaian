# Buyer Mobile Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce buyer mobile network and main-thread work while keeping all image and video previews eagerly visible.

**Architecture:** Preserve server-rendered buyer data and narrow recurring client work. Card statistics become event and visibility driven, detail statistics retain one controlled poll, media uses responsive Next.js optimization, and duplicate global motion is removed.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Vitest, Testing Library, Tailwind CSS, standalone Docker.

---

### Task 1: Statistics Refresh Policy

**Files:**
- Modify: `components/shared/lot-realtime-stats.tsx`
- Modify: `components/public/lot-detail-page.tsx`
- Test: `tests/lot-realtime-stats.test.tsx`

- [x] **Step 1: Write failing tests**

Test that server-provided statistics render without an immediate request, card statistics refresh once after a visible-tab event, and a positive `pollIntervalMs` enables controlled polling.

- [x] **Step 2: Verify RED**

Run `npm test -- tests/lot-realtime-stats.test.tsx` and confirm the current default mount request or 15-second interval violates the assertions.

- [x] **Step 3: Implement minimal behavior**

Default `pollIntervalMs` to `null`, skip the initial GET when `initialStats` exists, subscribe to `visibilitychange`, preserve mutation-event refresh, and pass `pollIntervalMs={30000}` on the detail page.

- [x] **Step 4: Verify GREEN**

Run `npm test -- tests/lot-realtime-stats.test.tsx` and confirm all statistics policy tests pass.

### Task 2: Eager Responsive Buyer Media

**Files:**
- Modify: `components/buyer/buyer-violation-page.tsx`
- Modify: `components/buyer/transactions-workspace.tsx`
- Modify: `components/buyer/auction-winner-page.tsx`
- Modify: `components/buyer/auction-loser-page.tsx`
- Modify: `components/buyer/profile-page.tsx`
- Test: `tests/buyer-mobile-performance.test.ts`

- [x] **Step 1: Write failing source-contract tests**

Assert that buyer preview components contain no `loading="lazy"`, the violation page contains no native `<img>`, and winner/loser primary images opt into eager priority loading.

- [x] **Step 2: Verify RED**

Run `npm test -- tests/buyer-mobile-performance.test.ts` and confirm failures identify the current transaction lazy image and native violation images.

- [x] **Step 3: Implement minimal media changes**

Replace violation `<img>` elements with `Image fill sizes loading="eager"`, change transaction previews to eager optimized images, and mark primary result-page and profile media eager or priority without removing video elements.

- [x] **Step 4: Verify GREEN**

Run `npm test -- tests/buyer-mobile-performance.test.ts tests/buyer-violation-page.test.tsx` and confirm the media contract and page behavior pass.

### Task 3: Isolate The Violation Countdown

**Files:**
- Modify: `components/buyer/buyer-violation-page.tsx`
- Test: `tests/buyer-violation-page.test.tsx`

- [x] **Step 1: Add a failing countdown ownership test**

Assert that the ticking interval belongs to the countdown leaf and not the full buyer violation page.

- [x] **Step 2: Verify RED**

Run the focused performance contract and confirm the ownership assertion fails before the component split.

- [x] **Step 3: Implement the countdown leaf**

Move synchronized clock state and the one-second interval into a small `ViolationCountdown` child. Keep history expansion state in `BuyerViolationPage`.

- [x] **Step 4: Verify GREEN**

Run the focused performance contract and `npm test -- tests/buyer-violation-page.test.tsx`.

### Task 4: Remove Global DOM Reveal Work

**Files:**
- Modify: `app/layout.tsx`
- Modify: `components/shared/page-transition.tsx`
- Modify: `app/globals.css`
- Test: `tests/buyer-mobile-performance.test.ts`

- [x] **Step 1: Extend the failing source-contract test**

Assert that the root layout does not mount `GlobalScrollReveal` and the transition module does not construct an `IntersectionObserver`.

- [x] **Step 2: Verify RED**

Run `npm test -- tests/buyer-mobile-performance.test.ts` and confirm the observer assertions fail.

- [x] **Step 3: Remove observer code and unused reveal CSS**

Keep `PageTransition` for existing shells, remove `GlobalScrollReveal`, and remove `.scroll-reveal` rules. Buyer route templates continue to provide their existing CSS transition.

- [x] **Step 4: Verify GREEN**

Run `npm test -- tests/buyer-mobile-performance.test.ts`.

### Task 5: Production Verification

**Files:**
- Verify: `Dockerfile`
- Verify: `next.config.mjs`
- Verify: `package.json`

- [x] **Step 1: Run buyer regression tests**

Run `npm test -- tests/catalog-page.test.tsx tests/buyer-wishlist-page.test.tsx tests/buyer-violation-page.test.tsx tests/lot-realtime-stats.test.tsx tests/buyer-mobile-performance.test.ts`.

- [x] **Step 2: Run repository checks**

Run `npm test`, `npx tsc --noEmit --pretty false`, and `npm run build`.

Result: 50 focused buyer tests pass, TypeScript passes, and the production build succeeds. The complete suite retains its unrelated baseline of 478 passing tests, five stale assertion failures, and one font-mock suite failure.

- [x] **Step 3: Compare production output**

Record shared first-load JavaScript and buyer route sizes from `next build`. Confirm no route regresses materially from the baseline: shared 102 KB, catalog 141 KB, wishlist 138 KB, violation 118 KB, and buyer result pages 158 KB.

- [ ] **Step 4: Verify live deployment**

The local Docker contract is correct: `npm run build`, `NODE_ENV=production`, and `node server.js`. Dokploy still needs a production redeploy without a custom development start command; afterward inspect a live JavaScript chunk and confirm it does not contain `next-devtools/dev-overlay`.
