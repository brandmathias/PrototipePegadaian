# Catalog Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce catalog LCP contention and initial client work for guest and buyer users without reintroducing build-time database access.

**Architecture:** Keep the cached catalog query behind `connection()`. Render the static hero from a Server Component, preload its small AVIF only on desktop, remove below-fold image preloads, and dynamically load the authenticated buyer navigation.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Vitest.

---

### Task 1: Lock Performance Behavior

**Files:**
- Modify: `tests/catalog-performance.test.ts`

- [x] Add source assertions requiring a server-rendered catalog hero, a desktop AVIF preload, no first-card priority, and a dynamic buyer navigation import.
- [x] Run `npx vitest run tests/catalog-performance.test.ts` and confirm the new assertions fail for the missing behavior.

### Task 2: Correct Critical Resource Priority

**Files:**
- Create: `components/pages/catalog-hero.tsx`
- Modify: `app/(public)/katalog/page.tsx`
- Modify: `components/pages/catalog-page.tsx`
- Modify: `components/layout/public-shell.tsx`
- Modify: `components/layout/buyer-top-nav.tsx`

- [x] Move the static hero markup out of the client catalog component.
- [x] Add a desktop-only preload for `/uploads/Hero%20Section%20Katalog%20Buyer.avif`.
- [x] Stop preloading the first catalog card and catalog brand images.
- [x] Load `BuyerTopNav` dynamically from the public shell.
- [x] Run the focused catalog tests and confirm they pass.

### Task 3: Verify Production Safety

**Files:**
- Verify all modified files.

- [x] Run focused catalog and layout tests.
- [x] Run `npx tsc --noEmit --pretty false`.
- [x] Run `npm run build` and confirm `/katalog` remains runtime-rendered without build-time database access.
- [x] Run `git diff --check` and inspect the final diff.
