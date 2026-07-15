# Violation Detail Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align admin-unit and superadmin violation details with the approved compact dossier layout.

**Architecture:** Keep the existing shared `SuperadminBlacklistDetailWorkspace` as the single render path. Replace side-panel-only decision context with timeline metadata and one reusable level-explanation section, preserving existing countdown, dossier image, and timeline interaction logic.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Vitest, Testing Library.

## Global Constraints

- Do not modify the header, sidebar, data services, countdown behavior, or primary color system.
- Do not add dependencies.
- Keep both `scope="admin-unit"` and `scope="superadmin"` on the same workspace component.
- Preserve the buyer identity status badge; remove only hero right-rail badges.

---

### Task 1: Define the approved detail-layout regression

**Files:**
- Modify: `tests/admin-blacklist-page.test.tsx`
- Modify: `tests/superadmin-pages.test.tsx`

**Interfaces:**
- Consumes: `SuperadminBlacklistDetailWorkspace` through existing admin and superadmin page fixtures.
- Produces: assertions for visible labels/counts and removed side panels.

- [ ] **Step 1: Write failing tests**

```tsx
expect(screen.getByText("Kasus Terakhir")).toBeInTheDocument();
expect(screen.getByText("Pelanggaran Tercatat")).toBeInTheDocument();
expect(screen.getByText("Keterangan Level Pelanggaran")).toBeInTheDocument();
expect(screen.queryByText("Log Keputusan Sistem")).not.toBeInTheDocument();
expect(screen.queryByText("Ketetapan Level")).not.toBeInTheDocument();
expect(screen.queryByText("Konteks Lintas Unit")).not.toBeInTheDocument();
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `rtk npm exec -- vitest run tests/admin-blacklist-page.test.tsx tests/superadmin-pages.test.tsx --exclude ".worktrees/**"`

Expected: FAIL because the existing workspace still renders the old labels/panels.

- [ ] **Step 3: Implement the minimal shared layout change**

```tsx
<section>
  <div className="flex flex-wrap items-start justify-between gap-4">
    <h2>Riwayat Pelanggaran (Timeline)</h2>
    <ViolationRecordSummary total={items.length} />
  </div>
</section>
<ViolationLevelGuide />
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `rtk npm exec -- vitest run tests/admin-blacklist-page.test.tsx tests/superadmin-pages.test.tsx --exclude ".worktrees/**"`

Expected: PASS.

### Task 2: Verify the shared workspace is production safe

**Files:**
- Modify: `components/superadmin/superadmin-blacklist-detail-workspace.tsx`
- Test: `tests/admin-blacklist-page.test.tsx`
- Test: `tests/superadmin-pages.test.tsx`

**Interfaces:**
- Consumes: existing `crossUnitViolationSummary`, `items`, `getLevelTone`, and `getRestrictionCopy` data.
- Produces: identical revised layout for admin unit and superadmin.

- [ ] **Step 1: Run type and formatting checks**

Run: `rtk npm exec -- tsc --noEmit; rtk git diff --check`

Expected: exit 0.

- [ ] **Step 2: Run a production build**

Run: `rtk npm run build`

Expected: exit 0; existing unrelated lint warnings may remain.
