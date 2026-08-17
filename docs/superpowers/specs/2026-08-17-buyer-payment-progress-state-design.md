# Buyer Payment Progress State Design

## Goal

Keep the buyer's payment-progress rail truthful for both fixed-price and Vickrey purchases.

## Problem

`LUNAS` means the admin has verified payment; the buyer has not necessarily received the item or confirmed the purchase. The rail currently passes `LUNAS` as its completed state, causing the final node, full progress line, and `Alur selesai` badge to appear too early.

## Decision

Use the existing `SELESAI` status as the only final state for the rail. For `LUNAS`, steps 1 and 2 remain complete while step 3 is the active, pending buyer-confirmation step.

## User-facing behavior

- `LUNAS`: show `Posisi sekarang | Tahap 3 dari 3` and a clear waiting-for-buyer confirmation message.
- `SELESAI`: show `Alur selesai | Tahap 3 dari 3`; all three nodes are complete.
- The rule applies unchanged to fixed-price and Vickrey purchases because both reuse `PaymentProgressRail`.

## Scope and safety

- Change only buyer UI state/copy in `components/pages/user-pages.tsx`.
- Do not alter API, database, payment verification, handover, receipt, or automatic-completion behavior.
- Add regression coverage for a verified-but-not-completed fixed-price transaction and a Vickrey transaction.
