# Superadmin Compliance, Account, and Modal Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menyamakan statistik pelanggaran, format rekening, dan header popup detail superadmin dengan sumber serta pola visual yang konsisten.

**Architecture:** Ekstrak aturan status blacklist dan normalisasi rekening menjadi helper murni yang dapat digunakan service dan serializer. Pertahankan komponen popup yang ada, tetapi ubah komposisi header agar mengikuti pola popup perpanjangan gadai tanpa mengubah isi detail.

**Tech Stack:** Next.js 15, React, TypeScript, Drizzle ORM, Tailwind CSS, Vitest, Testing Library.

---

### Task 1: Shared Active Blacklist Rule

**Files:**
- Modify: `lib/blacklist/effective-state.ts`
- Modify: `lib/superadmin/serializers.ts`
- Modify: `lib/services/monitoring.service.ts`
- Test: `tests/blacklist-escalation.test.ts`

- [ ] **Step 1: Write the failing test**

Add assertions that a level 1 or 2 blacklist with `blockedUntil` in the past is inactive, while level 3 remains active until manual review.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/blacklist-escalation.test.ts`

Expected: FAIL because the shared active-state helper does not exist.

- [ ] **Step 3: Write minimal implementation**

Add a pure helper accepting `isActive`, `totalViolations`, `blockedUntil`, and `now`. Use it in the blacklist serializer and dashboard aggregation.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/blacklist-escalation.test.ts tests/superadmin-pages.test.tsx`

Expected: PASS.

### Task 2: Bank and Account Number Normalization

**Files:**
- Modify: `lib/superadmin/validation.ts`
- Modify: `lib/superadmin/serializers.ts`
- Modify: `components/superadmin/unit-form.tsx`
- Test: `tests/superadmin-validation.test.ts`
- Test: `tests/superadmin-serializers.test.ts`

- [ ] **Step 1: Write the failing tests**

Assert that `Bank Rakyat Indonesia (BRI)` becomes `BRI`, `Bank Mandiri` becomes `Mandiri`, and `0123-4567 8901` becomes `012345678901`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/superadmin-validation.test.ts tests/superadmin-serializers.test.ts`

Expected: FAIL with unnormalized bank and account values.

- [ ] **Step 3: Write minimal implementation**

Create exported normalization helpers in validation, apply them to account payloads, and reuse them in serializers for legacy rows. Change bank option labels/values to the normalized names.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/superadmin-validation.test.ts tests/superadmin-serializers.test.ts`

Expected: PASS.

### Task 3: Centered Floating Modal Header

**Files:**
- Modify: `components/pages/superadmin-pages.tsx`
- Test: `tests/superadmin-pages.test.tsx`

- [ ] **Step 1: Write the failing component test**

Open account and admin detail popups, then assert the dialog title is centered and the floating icon header marker is present.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/superadmin-pages.test.tsx`

Expected: FAIL because the existing header is left aligned and inline.

- [ ] **Step 3: Write minimal implementation**

Refactor only `SuperAdminUnitDetailPopup`: add top spacing, floating circular icon, centered title/subtitle, and absolute close button while preserving modal accessibility and content grid.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/superadmin-pages.test.tsx`

Expected: PASS.

### Task 4: Integrated Verification

**Files:**
- Verify all modified files.

- [ ] **Step 1: Run focused tests**

Run: `npm test -- tests/blacklist-escalation.test.ts tests/superadmin-validation.test.ts tests/superadmin-serializers.test.ts tests/superadmin-monitoring-query.test.ts tests/superadmin-pages.test.tsx`

Expected: PASS with zero failed tests.

- [ ] **Step 2: Run TypeScript**

Run: `npx tsc --noEmit --pretty false`

Expected: exit code 0.

- [ ] **Step 3: Run production build**

Run: `npm run build`

Expected: successful Next.js production build.

- [ ] **Step 4: Review scope**

Run: `git diff --check` and `git status --short`.

Expected: only planned implementation, tests, spec, and plan are modified.
