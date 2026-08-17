# Three-Stage Buyer Settlement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the buyer-facing settlement flow identify whether admin unit or buyer must act after a payment is verified.

**Architecture:** Keep the persisted transaction status unchanged: `LUNAS` remains payment verified and `SELESAI` remains completed purchase. Derive the active final stage from the existing optional `handoverProof`: absent means the admin unit must upload evidence; present means the buyer may confirm completion. Retain the three-stage workflow and use the same derivation in the buyer transaction list.

**Tech Stack:** Next.js, React, TypeScript, Vitest, Testing Library.

## Global Constraints

- Do not add a database status or migration; `handoverProof` already expresses the missing distinction.
- Apply the same rule to `FIXED_PRICE` and `VICKREY_WIN` transactions.
- Only `SELESAI` represents a completed sale.
- Exclude generated `graphify-out/` files from commits.

---

### Task 1: Prove the post-verification ownership states

**Files:**
- Modify: `tests/buyer-transaction-detail-page.test.tsx`
- Modify: `tests/transactions-page.test.tsx`

**Interfaces:**
- Consumes: `BuyerTransaction.status`, `BuyerTransaction.handoverProof`
- Produces: regression coverage for `LUNAS` before and after a handover proof exists.

- [ ] **Step 1: Write failing detail-page assertions**

Add a `LUNAS` transaction without `handoverProof` and assert the workflow shows `Posisi sekarang | Tahap 2 dari 3`, `Menunggu Bukti Serah-Terima dari Admin Unit`, and not `Menunggu Konfirmasi Buyer`. Update the existing `LUNAS`-with-proof test to keep the same `Tahap 2 dari 3` position until buyer confirmation.

- [ ] **Step 2: Write failing list assertions**

For the existing `Ipad` `LUNAS` fixture without a handover proof, assert `Menunggu Bukti Serah-Terima`, `Menunggu admin unit mengunggah bukti serah-terima barang.`, and `Bukti serah-terima belum tersedia`.

- [ ] **Step 3: Run the focused tests to verify red**

Run: `npm test -- tests/buyer-transaction-detail-page.test.tsx tests/transactions-page.test.tsx --no-file-parallelism`

Expected: failure because the current three-stage rail and transaction list label the no-proof `LUNAS` state as waiting for buyer.

### Task 2: Render the three-stage settlement workflow

**Files:**
- Modify: `components/pages/user-pages.tsx:648-750`

**Interfaces:**
- Consumes: `transaction.status === "LUNAS"`, `transaction.handoverProof`, `transaction.completedAt`
- Produces: three `PaymentWorkflowStep` records; stage three is active for both admin handover and buyer confirmation, and is complete only for `SELESAI`.

- [ ] **Step 1: Derive ownership from the existing proof field**

```ts
const handoverUploaded = Boolean(transaction.handoverProof);
const awaitingHandoverProof = paymentVerified && !handoverUploaded;
const awaitingBuyerConfirmation = paymentVerified && handoverUploaded;
```

- [ ] **Step 2: Clarify the final stage without adding a fourth stage**

Use `Serah-Terima & Konfirmasi Buyer` as stage three. When `awaitingHandoverProof`, its headline is `Menunggu Bukti Serah-Terima dari Admin Unit` and its actor is `Admin Unit`. Only when `awaitingBuyerConfirmation` should its headline read `Menunggu Konfirmasi Buyer`.

- [ ] **Step 3: Keep completion semantics intact**

Set `completed` only for `SELESAI`; completed workflows show all three stages as finished. Keep the active final stage labelled `Tahap 2 dari 3` until it is complete. Preserve the existing failed-payment branch without allowing it to imply handover completion.

- [ ] **Step 4: Run focused tests to verify green**

Run: `npm test -- tests/buyer-transaction-detail-page.test.tsx tests/transactions-page.test.tsx --no-file-parallelism`

Expected: both suites pass and prove each responsible party is named correctly.

### Task 3: Match list copy to the same ownership state

**Files:**
- Modify: `components/buyer/transactions-workspace.tsx:64-249`

**Interfaces:**
- Consumes: `BuyerTransaction.status`, `BuyerTransaction.handoverProof`
- Produces: truthful status badge, descriptive copy, and notice for every `LUNAS` transaction.

- [ ] **Step 1: Let the list helpers inspect the transaction**

Change the status-meta helper to receive `BuyerTransaction` instead of just `status`, then derive no-proof and proof-uploaded `LUNAS` copy from `transaction.handoverProof`.

- [ ] **Step 2: Render the two verified-payment states**

For no proof, use `Menunggu Bukti Serah-Terima`, copy that says admin unit must upload the evidence, and a notice titled `Bukti serah-terima belum tersedia`. For proof uploaded, keep `Menunggu Konfirmasi Buyer` and make the notice explicitly state that the evidence is available.

- [ ] **Step 3: Preserve all non-`LUNAS` statuses**

Do not alter labels, filters, actions, or notices for payment, verification, failed, cancelled, and `SELESAI` transactions.

- [ ] **Step 4: Run focused tests to verify green**

Run: `npm test -- tests/buyer-transaction-detail-page.test.tsx tests/transactions-page.test.tsx --no-file-parallelism`

Expected: both suites pass.

### Task 4: Verify and deliver

**Files:**
- Modify: `docs/superpowers/plans/2026-08-17-clarify-handover-stages.md`
- Modify: `components/pages/user-pages.tsx`
- Modify: `components/buyer/transactions-workspace.tsx`
- Modify: `components/shared/payment-workflow-rail.tsx`
- Modify: `tests/buyer-transaction-detail-page.test.tsx`
- Modify: `tests/transactions-page.test.tsx`

- [ ] **Step 1: Run static verification**

Run: `npx tsc --noEmit`

- [ ] **Step 2: Update code graph**

Run: `graphify update .`

- [ ] **Step 3: Inspect exact staged diff**

Run: `git diff --check`, stage only the six listed files, then run `git diff --cached --check`.

- [ ] **Step 4: Commit and push**

Run: `git commit -m "fix(buyer): clarify handover responsibility"` then `git push origin HEAD:master`.

## Self-Review

- Covers both required ownership states and both buyer transaction types because the rule reads shared `BuyerTransaction.handoverProof`.
- Does not introduce a duplicate database status or change completion semantics.
- The failing tests identify the exact prior ambiguity: `LUNAS` without proof appeared to wait for buyer.
