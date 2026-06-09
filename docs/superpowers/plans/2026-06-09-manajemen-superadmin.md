# Manajemen Superadmin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a responsive Superadmin account-management surface with Owner/Operator access, guardrails, audit history, and persistent Owner notifications.

**Architecture:** Store the access level on the existing `user` row, keep audit events in a focused table, centralize guardrails in a service, expose small API routes, and render the page through a dedicated superadmin workspace component. Extend the existing alert center so superadmin notifications come from the database like buyer notifications already do.

**Tech Stack:** Next.js 15 App Router, React 19, Drizzle ORM, PostgreSQL, Better Auth credential accounts, Tailwind CSS, lucide-react, Vitest, Testing Library.

---

### Task 1: Data Model

**Files:**
- Modify: `lib/db/schema/auth.ts`
- Modify: `lib/db/schema/superadmin.ts`
- Generate: `drizzle/0015_*.sql`

- [ ] Add nullable `superAdminLevel: text("super_admin_level")` to `users`.
- [ ] Add `superadminAccountAuditLogs` with actor, target, action, note, metadata, and timestamp.
- [ ] Generate a Drizzle migration.
- [ ] Ensure existing superadmin rows with null level are treated as Owner in service code.

### Task 2: Validation And Service

**Files:**
- Modify: `lib/superadmin/validation.ts`
- Create: `lib/services/superadmin-account.service.ts`
- Modify: `lib/services/notification.service.ts`

- [ ] Add validation for superadmin account creation, update, and reset password.
- [ ] Implement `listSuperAdminAccounts(currentUserId)`.
- [ ] Implement `createSuperAdminAccount(actorUserId, payload)`.
- [ ] Implement `updateSuperAdminAccount(actorUserId, targetUserId, payload)`.
- [ ] Implement `resetSuperAdminPassword(actorUserId, targetUserId, payload)`.
- [ ] Enforce Owner-only mutation, self-deactivation block, and last-active-owner block.
- [ ] Log accepted and rejected sensitive actions.
- [ ] Notify all active Owners after sensitive actions.
- [ ] Extend notification type/entity unions for superadmin access events.

### Task 3: API Routes

**Files:**
- Create: `app/api/superadmin/accounts/route.ts`
- Create: `app/api/superadmin/accounts/[id]/route.ts`
- Create: `app/api/superadmin/accounts/[id]/reset-password/route.ts`
- Create: `app/api/superadmin/notifikasi/route.ts`
- Create: `app/api/superadmin/notifikasi/[id]/route.ts`
- Create: `app/api/superadmin/notifikasi/read-all/route.ts`

- [ ] Wire all routes through `requireSuperAdminApiSession`.
- [ ] Return 403 for non-Owner mutations from service errors.
- [ ] Return 409 for duplicate email and protected-owner conflicts.
- [ ] Return 404 for missing target accounts.
- [ ] Reuse existing notification service for list, mark one read, and mark all read.

### Task 4: UI And Navigation

**Files:**
- Create: `app/superadmin/manajemen-superadmin/page.tsx`
- Modify: `app/superadmin/layout.tsx`
- Create: `components/superadmin/superadmin-account-workspace.tsx`
- Modify: `components/ui/use-buyer-notifications.ts`
- Modify: `components/ui/alert-center.tsx`

- [ ] Add sidebar item `Manajemen Superadmin`.
- [ ] Render compact hero, statistics, search/filter, responsive account list, audit rail, and create form.
- [ ] Owner sees create/update/reset/deactivate controls.
- [ ] Operator sees read-only controls and explanatory inline feedback.
- [ ] Use modal/confirm patterns with mobile-safe widths and `100dvh` constraints.
- [ ] Add toast with `scope: "superadmin"` and `persist: true` after sensitive actions where appropriate.
- [ ] Extend alert center to fetch `/api/superadmin/notifikasi?limit=12` when `scope="superadmin"`.

### Task 5: Tests

**Files:**
- Create: `tests/superadmin-account-service.test.ts`
- Create: `tests/superadmin-account-routes.test.ts`
- Create: `tests/superadmin-account-workspace.test.tsx`
- Modify: `tests/buyer-alert-center.test.tsx`
- Modify: `tests/notification-routes.test.ts`

- [ ] Test level normalization: null superadmin level behaves as Owner.
- [ ] Test Operator cannot mutate accounts.
- [ ] Test Owner cannot deactivate self.
- [ ] Test Owner cannot deactivate or demote the last active Owner.
- [ ] Test create/update/reset write audit rows and Owner notifications.
- [ ] Test superadmin notification routes use the current superadmin user id.
- [ ] Test alert center fetches superadmin persistent notifications.
- [ ] Test the workspace renders Owner actions and Operator read-only state.

### Task 6: Verification

**Files:**
- No source edits unless verification finds root cause.

- [ ] Run `npx tsc --noEmit`.
- [ ] Run targeted Vitest files for new feature.
- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Start local dev server if needed.
- [ ] Browser check `/superadmin/manajemen-superadmin` on desktop and mobile widths.
