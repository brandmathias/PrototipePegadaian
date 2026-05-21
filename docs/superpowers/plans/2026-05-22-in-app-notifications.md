# In-App Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add persistent buyer in-app notifications backed by database, API routes, backend event creation, and a polling bell UI.

**Architecture:** Notifications are stored in a Drizzle/PostgreSQL table and accessed through a focused service layer. Buyer API routes only use the authenticated session user ID, while backend services create idempotent notifications from Vickrey settlement, payment verification/rejection, and blacklist activation events.

**Tech Stack:** Next.js App Router, React, Vitest, Drizzle ORM, PostgreSQL.

---

### Task 1: Notification Schema And Service

**Files:**
- Create: `lib/db/schema/notifications.ts`
- Modify: `lib/db/schema/index.ts`
- Create: `lib/services/notification.service.ts`
- Test: `tests/notification-service.test.ts`

- [ ] Write failing service tests for create, idempotent create, list, unread count, mark one read, and mark all read.
- [ ] Add Drizzle `notifications` table with user/type/entity indexes and export it.
- [ ] Implement notification service functions using the existing `db` client.
- [ ] Run `npm test -- tests/notification-service.test.ts`.

### Task 2: Buyer Notification API Routes

**Files:**
- Create: `app/api/user/notifikasi/route.ts`
- Create: `app/api/user/notifikasi/read-all/route.ts`
- Create: `app/api/user/notifikasi/unread-count/route.ts`
- Create: `app/api/user/notifikasi/[id]/route.ts`
- Test: `tests/notification-routes.test.ts`

- [ ] Write failing route tests for list, unread filter, unread count, mark one read, read-all, and unauthorized access.
- [ ] Implement routes using `requireBuyerApiSession`.
- [ ] Ensure all mutations scope by `access.userId`, never request body.
- [ ] Run `npm test -- tests/notification-routes.test.ts`.

### Task 3: Backend Event Notifications

**Files:**
- Modify: `lib/services/cron.service.ts`
- Modify: `lib/services/admin-transaction.service.ts`
- Test: `tests/notification-events.test.ts`

- [ ] Write failing tests that Vickrey settlement, overdue blacklist activation, payment verification, and payment rejection create notifications.
- [ ] Add `createNotificationOnce` calls after successful transaction/blacklist/payment state changes.
- [ ] Keep Vickrey nominal hidden until settlement has already produced a result.
- [ ] Run `npm test -- tests/notification-events.test.ts`.

### Task 4: Buyer Polling Alert Center

**Files:**
- Create: `components/ui/use-buyer-notifications.ts`
- Modify: `components/ui/alert-center.tsx`
- Test: `tests/buyer-alert-center.test.tsx`

- [ ] Write failing UI tests for unread badge, server notification rendering, mark-as-read click, read-all click, and local toast fallback.
- [ ] Add polling hook that fetches `/api/user/notifikasi` every 30 seconds for buyer scope.
- [ ] Update `AlertCenter` so buyer scope merges persisted notifications with local toast notifications.
- [ ] Do not auto-mark notifications read just because the panel opens.
- [ ] Run `npm test -- tests/buyer-alert-center.test.tsx`.

### Task 5: Migration, Docs, Verification

**Files:**
- Generate: `drizzle/*notification*.sql`
- Modify: `PRD.md`

- [ ] Generate a Drizzle migration for the notification table.
- [ ] Update PRD to mention persistent in-app notifications and polling.
- [ ] Run targeted tests for notification service/routes/events/UI.
- [ ] Run `npx tsc --noEmit`.
