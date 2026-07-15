# Shared Bidder Ranking and Violation Media Implementation Plan

> **For Codex:** Execute each task in order and verify the red/green test cycle before moving forward.

**Goal:** Deliver one responsive bidder-ranking implementation for admin unit and superadmin, plus lightweight licensed fallback photos for the three historical violation goods.

**Architecture:** Normalize page-specific bid data into a shared `VickreyRankingTable`. Keep auction status decisions in the page wrappers, while the shared component owns all ranking visuals and responsive behavior. Add a pure violation-media resolver consumed by buyer, admin-unit, and superadmin services so database media remains authoritative and known historical goods receive a stable fallback.

**Tech stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Vitest, Testing Library, Pillow/WebP.

---

## Task 1: Add failing ranking tests

**Files:**
- Create: `tests/vickrey-ranking-table.test.tsx`
- Modify: `tests/admin-pemasaran-pages.test.tsx`
- Modify: `tests/superadmin-pages.test.tsx`

1. Test a shared ranking component with five rows.
2. Assert WebP medal images and accessible alt text for ranks 1-3.
3. Assert participant avatar/fallback, nominal, time, and status labels.
4. Assert the mobile card and desktop header layout hooks.
5. Add one integration assertion on each admin surface proving it renders the shared component.
6. Run the targeted tests and confirm they fail because the shared component is not implemented.

## Task 2: Add failing violation-media tests

**Files:**
- Create: `tests/violation-item-media.test.ts`

1. Assert a database URL is returned unchanged.
2. Assert the three exact goods resolve to their expected local WebP paths when database media is absent.
3. Assert unknown goods return `null`.
4. Run the test and confirm it fails because the resolver is not implemented.

## Task 3: Prepare optimized image assets

**Files:**
- Create: `public/media/ranking/peringkat-1.webp`
- Create: `public/media/ranking/peringkat-2.webp`
- Create: `public/media/ranking/peringkat-3.webp`
- Create: `public/media/violation-items/kalung-emas-rantai-singapura-22k.webp`
- Create: `public/media/violation-items/cincin-emas-solitaire-22k.webp`
- Create: `public/media/violation-items/gelang-emas-bangle-polos-22k.webp`

1. Convert the supplied transparent medal PNG files to 160x160 WebP.
2. Download the three selected Pexels images.
3. Crop each product image to a centered square and encode it as 720x720 WebP.
4. Inspect all six outputs visually and record their sizes.

## Task 4: Implement the shared ranking component

**Files:**
- Create: `components/shared/vickrey-ranking-table.tsx`
- Modify: `components/pages/admin-marketing-pages.tsx`
- Modify: `components/pages/superadmin-pages.tsx`

1. Define normalized row, status-tone, and component prop types.
2. Implement accessible desktop column headers and responsive card rows.
3. Render optimized medals for ranks 1-3, numeric markers for later ranks, and participant avatars with initials fallback.
4. Keep the existing auction-specific labels and status decisions in thin wrappers.
5. Add `bidderImage` to the admin bid type and pass it into normalized rows.
6. Remove the duplicated ranking marker/table visual implementations.
7. Run the shared and integration tests until green.

## Task 5: Implement violation-media fallback

**Files:**
- Create: `lib/blacklist/violation-item-media.ts`
- Modify: `lib/services/admin-blacklist.service.ts`
- Modify: `lib/services/blacklist.service.ts`
- Modify: `lib/services/buyer.service.ts`

1. Implement an exact, case-insensitive name-to-image mapping.
2. Return database media first, then the known fallback, then `null`.
3. Apply the resolver to all three service serializers.
4. Run the resolver and affected blacklist tests until green.

## Task 6: Verify quality and production readiness

1. Run focused ranking, blacklist, and buyer tests.
2. Run the full TypeScript check.
3. Run the production build.
4. Start or reuse the local app and inspect admin-unit and superadmin ranking at desktop and mobile widths.
5. Inspect the violation detail card and verify all three fallback images.
6. Check `git diff --check`, review scope, and report any deployment-only limitation honestly.
