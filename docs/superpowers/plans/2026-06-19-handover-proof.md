# Handover Proof Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a separate handover-proof feature for verified transactions so buyer completion requires admin-uploaded delivery evidence.

**Architecture:** Add nullable handover-proof fields to `transaksi`, expose them through buyer/admin/superadmin serializers, create an admin upload route, and render a shared lightweight preview card with fullscreen image support. Keep transaction status unchanged until buyer confirms completion.

**Tech Stack:** Next.js App Router, React client leaf components, Tailwind CSS, Drizzle ORM, PostgreSQL, Vitest.

---

### Task 1: Data and serialization

**Files:**
- Modify: `lib/db/schema/admin.ts`
- Generate: `drizzle/0017_*.sql`
- Modify: `lib/contracts/buyer.ts`
- Modify: `lib/buyer/serializers.ts`
- Modify: `lib/admin-unit/serializers.ts`
- Modify: `lib/services/buyer.service.ts`
- Modify: `lib/services/admin-transaction.service.ts`
- Modify: `lib/services/admin-pemasaran.service.ts`

- [x] Add nullable handover proof columns to `transaksi`.
- [x] Include handover proof fields in buyer/admin/superadmin data selections.
- [x] Serialize handover proof as a separate object/fields from payment proof.
- [x] Require handover proof before `completeBuyerTransaction` changes `LUNAS` to `SELESAI`.

### Task 2: Admin upload API

**Files:**
- Modify: `lib/admin-unit/validation.ts`
- Create: `app/api/admin/transaksi/[id]/bukti-serah-terima/route.ts`

- [x] Validate one image file or stored file URL.
- [x] Save uploads to `public/uploads/serah-terima`.
- [x] Call admin service with `unitId`, `adminId`, and transaction id.
- [x] Return serialized transaction or a clear error message.

### Task 3: Shared UI

**Files:**
- Create: `components/shared/handover-proof-card.tsx`
- Create: `components/admin-unit/handover-proof-upload-form.tsx`
- Modify: `components/buyer/complete-purchase-button.tsx`

- [x] Build the buyer reference card style: left metadata ledger, right image frame, green identity accent, clean empty state.
- [x] Support fullscreen image preview with portal, Escape handling, and body scroll lock.
- [x] Build admin upload controls under the same visual card.
- [x] Let completion button render disabled with an explanatory message.

### Task 4: Page integrations

**Files:**
- Modify: `components/pages/user-pages.tsx`
- Modify: `components/pages/admin-transaction-pages.tsx`
- Modify: `components/pages/superadmin-pages.tsx`

- [x] Render buyer handover card on verified fixed-price and vickrey transaction details.
- [x] Disable buyer completion until handover proof exists.
- [x] Render admin handover upload panel in transaction detail workspace.
- [x] Render superadmin read-only handover audit card in fixed-price and vickrey detail views.

### Task 5: Verification

**Files:**
- Modify/Add tests in `tests/`

- [x] Add failing tests before production changes.
- [x] Run targeted Vitest files.
- [x] Run `npx tsc --noEmit --pretty false`.
- [x] Run `npm run build`.
