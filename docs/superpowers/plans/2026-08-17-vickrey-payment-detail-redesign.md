# Vickrey Winner Payment Detail Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the pending Vickrey-winner payment detail layout with the approved compact payment, audit, item, and handover design while preserving real transaction data and existing settlement behavior.

**Architecture:** Keep the shared `PaymentProgressRail` and `HandoverProofCard`, then add one pending-Vickrey presentation branch in `TransactionDetailPage`. Reuse the existing auction countdown client component with an inline variant so the server-rendered detail page receives a live `HH:mm:ss` timer without adding a second timer implementation.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS 3, Lucide React, Vitest, Testing Library.

## Global Constraints

- Do not open or test through a browser.
- Render only values already present in `BuyerTransaction` and `BuyerSessionUser`; do not copy sample identities or transaction numbers from the screenshot.
- Replace buyer-facing “loket unit” wording in this Vickrey flow with “unit terkait”.
- Keep `Dokumentasi Serah Terima Barang Fisik` at the bottom even before proof upload.
- Preserve existing fixed-price, verified Vickrey, completed Vickrey, and failed Vickrey branches.
- Commit and push only the implementation, tests, and this plan; exclude generated Graphify output and unrelated working-tree files.

---

### Task 1: Protect the pending Vickrey payment layout with a regression test

**Files:**
- Modify: `tests/buyer-transaction-detail-page.test.tsx`

**Interfaces:**
- Consumes: `TransactionDetailPage`, `BuyerTransaction`, and `BuyerSessionUser`.
- Produces: A regression test for the pending direct-payment Vickrey branch.

- [ ] **Step 1: Write the failing test**

Add a `VICKREY_WIN` fixture with `MENUNGGU_KONFIRMASI_LANGSUNG`, `BAYAR_LANGSUNG`, a real `deadlineAt`, and assertions for the urgent-payment card, item/winner card, audit card, truthful direct-payment copy, hidden legacy cards, and preserved handover documentation.

- [ ] **Step 2: Run the test to verify RED**

Run:

```powershell
npx vitest run tests/buyer-transaction-detail-page.test.tsx --exclude ".worktrees/**" --pool=forks --maxWorkers=1 --minWorkers=1
```

Expected: FAIL because the current branch still renders the three legacy cards and has no urgent-payment/audit/handover layout.

### Task 2: Add the compact live countdown presentation

**Files:**
- Modify: `components/buyer/auction-winner-countdown.tsx`
- Modify: `tests/buyer-countdown.test.tsx`

**Interfaces:**
- Consumes: `targetAt?: string | null`, `serverNow?: string`.
- Produces: `variant?: "tiles" | "inline"`, defaulting to `"tiles"`.

- [ ] **Step 1: Write the failing inline-countdown test**

Render with `variant="inline"`, advance fake timers, and assert tabular `HH:mm:ss` output reaches the next second without becoming negative.

- [ ] **Step 2: Run the countdown test to verify RED**

Run:

```powershell
npx vitest run tests/buyer-countdown.test.tsx --exclude ".worktrees/**" --pool=forks --maxWorkers=1 --minWorkers=1
```

Expected: FAIL because `variant` and the inline clock output do not exist.

- [ ] **Step 3: Implement the minimum variant**

Keep the current tile rendering unchanged and add an inline clock branch that prints `hours:minutes:seconds`.

- [ ] **Step 4: Re-run the countdown test to verify GREEN**

Expected: PASS.

### Task 3: Implement the approved pending-payment page

**Files:**
- Modify: `components/pages/user-pages.tsx`
- Modify: `components/shared/handover-proof-card.tsx`

**Interfaces:**
- Consumes: `buyer: BuyerSessionUser`, `transaction: BuyerTransaction`.
- Produces: `VickreyPendingPaymentDetail` used only for pending Vickrey direct-payment statuses.

- [ ] **Step 1: Update truthful Vickrey workflow wording**

Use “Datang ke {unit} untuk melakukan pembayaran secara langsung”, “dana diterima di unit terkait”, and “pembayaran langsung di unit terkait”.

- [ ] **Step 2: Add the compact page branch**

Render Header, `PaymentProgressRail`, Urgent Payment Card, Information/Audit grid, and `HandoverProofCard`, in that order. The urgent card uses the Lucide `Hourglass` in the approved concentric white/amber treatment and real amount, unit, and deadline values.

- [ ] **Step 3: Make audit and handover values truthful**

Use `transaction.createdAt`, `transaction.id`, `buyer.name`, `buyer.email`, and the current status. Show `Belum diunggah` rather than inventing an uploader before a handover proof exists, and rename the location label to `Lokasi Unit Terkait`.

- [ ] **Step 4: Run the detail-page test to verify GREEN**

Run the Task 1 command. Expected: all tests in the file pass.

### Task 4: Verify and deliver

**Files:**
- Verify all files above.

- [ ] **Step 1: Run focused and related tests**

```powershell
npx vitest run tests/buyer-transaction-detail-page.test.tsx tests/buyer-countdown.test.tsx --exclude ".worktrees/**" --pool=forks --maxWorkers=1 --minWorkers=1
```

- [ ] **Step 2: Run TypeScript, diff, and production build checks**

```powershell
npx tsc --noEmit --pretty false
git diff --check
npm run build
```

- [ ] **Step 3: Update the knowledge graph**

```powershell
graphify update .
```

- [ ] **Step 4: Stage only intended files, commit, and push**

```powershell
git add -- components/pages/user-pages.tsx components/buyer/auction-winner-countdown.tsx components/shared/handover-proof-card.tsx tests/buyer-transaction-detail-page.test.tsx tests/buyer-countdown.test.tsx docs/superpowers/plans/2026-08-17-vickrey-payment-detail-redesign.md
git commit -m "feat(buyer): redesign Vickrey payment detail"
git push origin master
```
