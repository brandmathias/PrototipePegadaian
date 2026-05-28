# Buyer Responsive Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve buyer-side responsiveness and perceived performance across phone, tablet, laptop, and desktop viewports without touching admin surfaces.

**Architecture:** Keep existing buyer pages and contracts intact, then improve shared buyer surfaces first: shell/navigation, shared media rendering, catalog/wishlist card rhythm, countdown update pressure, and transaction row responsiveness. Prefer scoped class and prop changes over broad rewrites.

**Tech Stack:** Next.js App Router, React 19, Tailwind CSS, Vitest, Testing Library.

---

### Task 1: Buyer Shell And Navigation

**Files:**
- Modify: `components/layout/buyer-top-nav.tsx`
- Test: `tests/buyer-shell.test.tsx`

- [ ] Add a mobile/tablet navigation rail under the buyer header with touch-sized links and no duplicate accessible names.
- [ ] Add a mobile search row so catalog search remains available below desktop width.
- [ ] Verify buyer shell tests still pass.

### Task 2: Shared Countdown Performance

**Files:**
- Modify: `components/buyer/live-countdown.tsx`
- Modify: `components/pages/catalog-page.tsx`
- Modify: `components/pages/wishlist-page.tsx`
- Modify: `components/buyer/auction-loser-recommendation-countdown.tsx`
- Test: `tests/buyer-countdown.test.tsx`
- Test: `tests/catalog-page.test.tsx`
- Test: `tests/buyer-wishlist-page.test.tsx`

- [ ] Add an optional `updateIntervalMs` prop to `LiveCountdown`, defaulting to one second for payment-critical countdowns.
- [ ] Use a one-minute interval for catalog, wishlist, and recommendation countdowns where minute-level freshness is enough.
- [ ] Keep existing second-level countdown tests passing.

### Task 3: Catalog And Wishlist Card Rhythm

**Files:**
- Modify: `components/pages/catalog-page.tsx`
- Modify: `components/pages/wishlist-page.tsx`
- Test: `tests/catalog-page.test.tsx`
- Test: `tests/buyer-wishlist-page.test.tsx`

- [ ] Stabilize product name, metadata, realtime stats, price, and CTA bands so cards remain aligned with different tag counts and long names.
- [ ] Preserve the 10 billion catalog max-price limit already requested by the user.
- [ ] Keep CTAs visible and touch-sized on mobile.

### Task 4: Buyer Transaction Rows

**Files:**
- Modify: `components/buyer/transactions-workspace.tsx`
- Test: `tests/transactions-page.test.tsx`

- [ ] Change fixed-width transaction row columns to responsive minmax tracks so rows do not overflow on tablets and narrow laptops.
- [ ] Clamp long transaction and bid titles to two lines.
- [ ] Keep transaction/bid actions visible on all breakpoints.

### Task 5: Shared Media And Reduced Motion

**Files:**
- Modify: `components/shared/lot-figure.tsx`
- Modify: `app/globals.css`
- Test: targeted buyer tests plus TypeScript.

- [ ] Give shared lot images explicit lazy loading, decoding hints, and refined responsive `sizes`.
- [ ] Add reduced-motion safeguards for common buyer animations and hover lifts.
- [ ] Run TypeScript and buyer-focused tests.
