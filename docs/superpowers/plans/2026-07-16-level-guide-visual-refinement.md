# Level Guide Visual Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the violation-level guide clearer without changing its content or layout structure.

**Architecture:** Refine the existing `ViolationLevelGuide` shared by the admin-unit and superadmin detail workspaces. Keep the same three cards, using stronger per-level Tailwind tones and slightly larger typography.

**Tech Stack:** React, TypeScript, Tailwind CSS, Vitest, Testing Library.

## Global Constraints

- Reuse the existing shared component; do not add packages or separate visual variants.
- Keep Level 1 amber, Level 2 orange, and Level 3 rose.
- The icon disc must be solid per-level color with a white icon; no white background.
- Preserve responsive three-column-to-stack layout.

---

### Task 1: Refine the shared level guide

**Files:**
- Modify: `components/superadmin/superadmin-blacklist-detail-workspace.tsx:590-649`
- Test: `tests/superadmin-pages.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
const badge = screen.getByText("Level 1").parentElement;
expect(badge).toHaveClass("px-3.5", "py-2", "text-[0.9rem]");
expect(badge?.querySelector("span")).toHaveClass("bg-amber-500", "text-white");
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --run tests/superadmin-pages.test.tsx`

- [ ] **Step 3: Implement the minimal visual refinement**

```tsx
<div className={cn("inline-flex items-center gap-2.5 rounded-full px-3.5 py-2 text-[0.9rem] font-black", level.badgeTone)}>
  <span className={cn("grid size-7 shrink-0 place-items-center rounded-full text-white", level.iconTone)}>
```

- [ ] **Step 4: Verify the test and type-check**

Run: `npm test -- --run tests/superadmin-pages.test.tsx tests/admin-blacklist-page.test.tsx && npx tsc --noEmit`

- [ ] **Step 5: Commit and push**

```bash
git add components/superadmin/superadmin-blacklist-detail-workspace.tsx tests/superadmin-pages.test.tsx docs/superpowers/plans/2026-07-16-level-guide-visual-refinement.md
git commit -m "style: strengthen violation level guide"
git push origin master
```
