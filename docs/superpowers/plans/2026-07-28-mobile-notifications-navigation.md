# Mobile Notifications Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing buyer notification centre discoverable on mobile and remove the redundant Ruang Agunan icon from notification cards.

**Architecture:** Reuse the existing `/notifikasi` route and `BuyerNotificationsPage`; only expose it from the buyer mobile drawer. Keep notification state in `AlertCenter` and use a plain mobile navigation link so no additional request, asset, or polling loop is introduced.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Vitest, Testing Library.

## Global Constraints

- Reuse `/notifikasi`; do not add a duplicate route or data source.
- Keep notification controls touch-safe with a minimum 44 px target.
- Remove the card-side brand image; do not add images or dependencies.
- Preserve the existing desktop alert trigger and mobile-safe alert sheet.

---

### Task 1: Add regression coverage for notification discovery and card content

**Files:**
- Modify: `tests/buyer-shell.test.tsx`
- Modify: `tests/buyer-alert-center.test.tsx`

**Interfaces:**
- Consumes: `BuyerShell`, `AlertCenter`.
- Produces: regression assertions for the `/notifikasi` link and icon-free notification card.

- [ ] **Step 1: Write the failing tests**

```tsx
expect(screen.getByRole("link", { name: "Buka Notifikasi" })).toHaveAttribute("href", "/notifikasi");
expect(screen.queryByRole("img", { name: "Logo Ruang Agunan" })).not.toBeInTheDocument();
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/buyer-shell.test.tsx tests/buyer-alert-center.test.tsx --run`

Expected: the navigation assertion fails because mobile navigation lacks `/notifikasi`; the card assertion fails because the right-side logo remains.

- [ ] **Step 3: Commit test-only change**

```bash
git add tests/buyer-shell.test.tsx tests/buyer-alert-center.test.tsx
git commit -m "test: cover buyer mobile notification access"
```

### Task 2: Expose the existing notification page from mobile navigation

**Files:**
- Modify: `components/layout/buyer-top-nav.tsx`

**Interfaces:**
- Consumes: `Bell`, existing `buyerNav` route definitions.
- Produces: a mobile drawer link to `/notifikasi`.

- [ ] **Step 1: Add the mobile-only notification entry**

```tsx
<Link href="/notifikasi" onClick={() => setIsOpen(false)}>
  <Bell aria-hidden="true" className="size-5 shrink-0" />
  <span>Notifikasi</span>
</Link>
```

- [ ] **Step 2: Keep the entry touch-safe and active-aware**

Use the existing mobile-link classes, add `min-h-11`, and mark `aria-current="page"` when `pathname === "/notifikasi"`.

- [ ] **Step 3: Run the buyer shell test**

Run: `npm test -- tests/buyer-shell.test.tsx --run`

Expected: PASS.

### Task 3: Remove redundant notification-card branding

**Files:**
- Modify: `components/ui/alert-center.tsx`

**Interfaces:**
- Consumes: the existing notification icon, title, body, timestamp, and action link.
- Produces: a two-column notification card whose content has more reading space.

- [ ] **Step 1: Remove the right-side `next/image` logo node and unused import**

```tsx
// Keep the existing semantic notification icon at the left.
// Remove only the standalone right-side brand image.
```

- [ ] **Step 2: Run the alert-center test**

Run: `npm test -- tests/buyer-alert-center.test.tsx --run`

Expected: PASS.

### Task 4: Verify, commit, and push

**Files:**
- Modify: `components/layout/buyer-top-nav.tsx`
- Modify: `components/ui/alert-center.tsx`
- Modify: `tests/buyer-shell.test.tsx`
- Modify: `tests/buyer-alert-center.test.tsx`

- [ ] **Step 1: Run focused verification**

Run: `npm test -- tests/buyer-shell.test.tsx tests/buyer-alert-center.test.tsx tests/buyer-notifications-page.test.tsx --run`

- [ ] **Step 2: Run static verification**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Inspect mobile layout**

Verify at 320, 375, 414, and 768 px: no horizontal scrolling, link target remains at least 44 px high, and the notification sheet remains usable.

- [ ] **Step 4: Commit and push**

```bash
git add components/layout/buyer-top-nav.tsx components/ui/alert-center.tsx tests/buyer-shell.test.tsx tests/buyer-alert-center.test.tsx docs/superpowers/plans/2026-07-28-mobile-notifications-navigation.md
git commit -m "feat: expose buyer notifications on mobile"
git push origin master
```
