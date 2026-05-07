# Admin Pemasaran Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make admin unit marketing feel like two distinct workflows, with media-first list/detail pages for `Fixed Price` and `Vickrey Auction`.

**Architecture:** Keep the existing admin shell, but split marketing into mode-aware read models and mode-specific UI surfaces. Shared data will come from a richer admin pemasaran serializer/service shape that includes media and only exposes fields relevant to the current mode.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Vitest, Drizzle ORM, PostgreSQL.

---

### Task 1: Build mode-aware admin pemasaran read models

**Files:**
- Modify: `lib/admin-unit/serializers.ts`
- Modify: `lib/services/admin-pemasaran.service.ts`
- Test: `tests/admin-unit-serializers.test.ts`

- [ ] **Step 1: Write the failing test**

Add tests that prove `serializeAdminPemasaran` returns different shapes for fixed price and vickrey, and that media is carried through the admin read model.

```ts
import { describe, expect, it } from "vitest";
import { serializeAdminPemasaran } from "@/lib/admin-unit/serializers";

describe("serializeAdminPemasaran", () => {
  it("returns fixed price fields without bid-only concepts", () => {
    const row = serializeAdminPemasaran(
      {
        id: "pm-fixed",
        barangId: "barang-1",
        mode: "fixed_price",
        price: "12500000",
        basePrice: null,
        durationDays: null,
        startsAt: new Date("2026-05-01T00:00:00Z"),
        endsAt: null,
        winnerId: null,
        finalPrice: null,
        iteration: 1,
        status: "aktif",
        createdByUserId: "admin-1",
        createdAt: new Date("2026-05-01T00:00:00Z"),
        updatedAt: new Date("2026-05-01T00:00:00Z")
      },
      {
        lotName: "Kalung Emas",
        media: [{ id: "m1", type: "foto", url: "/media/kalung.jpg", fileName: "kalung.jpg" }],
        transaction: {
          buyerName: "Raras",
          paymentMethod: "transfer",
          status: "bukti_diunggah",
          proofUrl: "/uploads/bukti.jpg",
          reference: "TRX-001"
        }
      }
    );

    expect(row.mode).toBe("FIXED_PRICE");
    expect(row.media).toHaveLength(1);
    expect(row.transactionStatus).toBe("BUKTI_DIUNGGAH");
    expect(row.visibility).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/admin-unit-serializers.test.ts`
Expected: fail because the new fixed-price fields and media-aware shape do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Update `serializeAdminPemasaran` to return a shared base shape plus mode-specific fields. Extend `listAdminPemasaran` and `getAdminPemasaranById` so they also return the item's media collection and a fixed-price transaction summary when present.

Shared fields should include `id`, `lotId`, `lot`, `code`, `category`, `condition`, `status`, `mode`, `primaryMedia`, `media`, `startsAt`, `endingAt`, and `note`.

Fixed price fields should include `price`, `transactionStatus`, `buyerName`, `paymentMethod`, `proofUrl`, `reference`, `soldAt`, and `paymentDeadline`.

Vickrey fields should keep `basePrice`, `participants`, `visibility`, `winner`, `finalPrice`, and `bids`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/admin-unit-serializers.test.ts`
Expected: pass with no remaining serializer regressions.

- [ ] **Step 5: Commit**

```bash
git add lib/admin-unit/serializers.ts lib/services/admin-pemasaran.service.ts tests/admin-unit-serializers.test.ts
git commit -m "feat: add mode-aware pemasaran read models"
```

### Task 2: Split marketing UI into fixed price and vickrey experiences

**Files:**
- Modify: `components/pages/admin-pages.tsx`
- Modify: `app/admin/pemasaran/page.tsx`
- Modify: `app/admin/pemasaran/fixed-price/page.tsx`
- Modify: `app/admin/pemasaran/vickrey-auction/page.tsx`
- Create: `app/admin/pemasaran/fixed-price/[id]/page.tsx`
- Create: `app/admin/pemasaran/vickrey-auction/[id]/page.tsx`
- Modify: `app/admin/lelang/[id]/page.tsx`
- Test: `tests/admin-pemasaran-pages.test.tsx`

- [ ] **Step 1: Write the failing test**

Add UI tests that assert fixed price pages never render bid-centric labels, while vickrey pages still render countdown, participant count, and bid visibility messaging. Also assert both detail pages render media-first layouts and the `Lihat sesi` link goes to the mode-specific route.

```tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminAuctionListPage } from "@/components/pages/admin-pages";

it("does not show bid-only language on fixed price cards", () => {
  render(
    <AdminAuctionListPage
      auctions={[
        {
          id: "pm-fixed",
          lotId: "barang-1",
          lot: "Kalung Emas",
          status: "AKTIF",
          ending: "-",
          endingAt: null,
          participants: 0,
          mode: "FIXED_PRICE",
          basePrice: 10000000,
          price: 12000000,
          finalPrice: null,
          winner: null,
          visibility: undefined,
          note: "Siap diverifikasi",
          media: [{ id: "m1", type: "foto", url: "/media/kalung.jpg" }]
        }
      ]}
    />
  );

  expect(screen.queryByText(/visibilitas bid/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/peserta/i)).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/admin-pemasaran-pages.test.tsx`
Expected: fail because the new mode-specific UI and detail routes are not implemented yet.

- [ ] **Step 3: Write minimal implementation**

Refactor the marketing UI into mode-aware components inside `components/pages/admin-pages.tsx` or a dedicated marketing page component file. Make the fixed price list/detail pages media-first, transaction-first, and free of auction labels. Make the vickrey list/detail pages media-first, countdown-first, and preserve sealed-bid rules.

Create mode-specific detail routes:

- `/admin/pemasaran/fixed-price/[id]`
- `/admin/pemasaran/vickrey-auction/[id]`

Keep `/admin/lelang/[id]` as a redirector to the correct new route based on the session mode.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/admin-pemasaran-pages.test.tsx`
Expected: pass, with fixed price and vickrey rendering different semantics and routes.

- [ ] **Step 5: Commit**

```bash
git add components/pages/admin-pages.tsx app/admin/pemasaran app/admin/lelang tests/admin-pemasaran-pages.test.tsx
git commit -m "feat: split marketing ui by mode"
```

### Task 3: Verify the complete admin marketing flow

**Files:**
- Verify: `app/admin/layout.tsx`
- Verify: `components/layout/dashboard-shell.tsx`
- Verify: `app/admin/pemasaran/page.tsx`
- Verify: `app/admin/pemasaran/fixed-price/page.tsx`
- Verify: `app/admin/pemasaran/vickrey-auction/page.tsx`
- Verify: `app/admin/pemasaran/fixed-price/[id]/page.tsx`
- Verify: `app/admin/pemasaran/vickrey-auction/[id]/page.tsx`
- Verify: `app/admin/lelang/[id]/page.tsx`

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all tests pass, including the new marketing serializer and page coverage.

- [ ] **Step 2: Run the production build**

Run: `npm run build`
Expected: exit code `0`.

- [ ] **Step 3: Check the flow in the local browser**

Open `http://localhost:3000/admin/pemasaran`, then verify:

- `Fixed Price` shows a media-first sales card with no bid language.
- `Vickrey Auction` shows a media-first auction card with participant/countdown language.
- `Lihat sesi` opens the correct mode-specific detail page.
- Fixed price detail shows transaction-oriented content.
- Vickrey detail keeps sealed bids hidden until the deadline has passed.

- [ ] **Step 4: Commit any verification-only fixes**

If verification exposes formatting or rendering issues, fix them in the touched files and re-run `npm test` plus `npm run build` before finishing.
