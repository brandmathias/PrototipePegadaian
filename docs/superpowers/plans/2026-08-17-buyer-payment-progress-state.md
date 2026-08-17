# Buyer Payment Progress State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent verified payments from appearing as completed purchases in the buyer progress rail.

**Architecture:** `PaymentProgressRail` already renders all buyer transaction kinds. Its `completed` prop must receive only the final transaction state, while `currentStep` keeps `LUNAS` on step 3 so the first two nodes remain complete and the last node remains active.

**Tech Stack:** Next.js, React, TypeScript, Vitest, Testing Library.

## Global Constraints

- `LUNAS` is payment verification only; `SELESAI` is the only completed purchase state.
- Reuse the existing shared rail; no new component, API, dependency, or database change.
- Preserve the existing user-provided workspace changes by working in this isolated worktree.

---

### Task 1: Protect verified-but-pending buyer transactions

**Files:**

- Modify: `tests/buyer-transaction-detail-page.test.tsx:673-706`
- Modify: `components/pages/user-pages.tsx:648-755`

**Interfaces:**

- Consumes: `BuyerTransaction.status`, where `LUNAS` means verified and `SELESAI` means final.
- Produces: `PaymentProgressRail` receives `completed={transaction.status === "SELESAI"}`.

- [ ] **Step 1: Write the failing test**

```tsx
expect(within(workflow).queryByText(/alur selesai/i)).not.toBeInTheDocument();
expect(within(workflow).getByText(/posisi sekarang.*tahap 3 dari 3/i)).toBeInTheDocument();
expect(within(workflow).getByRole("heading", { name: /menunggu konfirmasi buyer/i })).toBeInTheDocument();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/buyer-transaction-detail-page.test.tsx --no-file-parallelism`

Expected: the LUNAS regression test fails because the rail still displays `Alur selesai`.

- [ ] **Step 3: Write minimal implementation**

```tsx
const completed = transaction.status === "SELESAI";

<PaymentWorkflowRail completed={completed} currentStep={currentStep} />
```

For a non-final stage 3, use the headline `Menunggu Konfirmasi Buyer`; retain the existing verified-payment detail.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/buyer-transaction-detail-page.test.tsx --no-file-parallelism`

Expected: all tests in the file pass.

### Task 2: Cover fixed-price and final completion states

**Files:**

- Modify: `tests/buyer-transaction-detail-page.test.tsx:344-389`

**Interfaces:**

- Consumes: a fixed-price `BuyerTransaction` with `status: "LUNAS"` and handover proof.
- Produces: coverage that shared rendering remains pending before `SELESAI`, while the existing final-state tests preserve completed behavior.

- [ ] **Step 1: Write the failing test**

```tsx
expect(within(workflow).queryByText(/alur selesai/i)).not.toBeInTheDocument();
expect(within(workflow).getByRole("heading", { name: /menunggu konfirmasi buyer/i })).toBeInTheDocument();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/buyer-transaction-detail-page.test.tsx --no-file-parallelism`

Expected: the fixed-price LUNAS assertion fails for the same premature completion state.

- [ ] **Step 3: Keep implementation shared**

No additional production branch is needed: Task 1 changes the shared `PaymentProgressRail` call site used by fixed-price and Vickrey details.

- [ ] **Step 4: Run focused and full verification**

Run: `npm test -- tests/buyer-transaction-detail-page.test.tsx tests/buyer-vickrey-pages.test.tsx --no-file-parallelism`

Expected: focused buyer transaction tests pass, followed by the full test suite, type check/build if available, and graph update.

