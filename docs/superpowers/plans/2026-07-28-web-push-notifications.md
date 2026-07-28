# Web Push Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add opt-in, standards-based Web Push to the persistent Ruang Agunan notification center without adding PWA or offline behavior.

**Architecture:** Persistent notifications remain the source of truth. New notification writes enqueue a durable, idempotent outbox entry; the authenticated cron drains a small batch using VAPID Web Push and records the result. The browser registers a tiny service worker only after an explicit enable action, stores its subscription through a session-bound API, and opens the existing internal notification destination on click.

**Tech Stack:** Next.js 15, React 19, TypeScript, Drizzle/PostgreSQL, Better Auth, Vitest, native Push API/service worker, `web-push`.

## Global Constraints

- Do not add a manifest, service-worker cache, offline fallback, install prompt, Firebase, ntfy, or a third-party push SaaS.
- Browser permission may only be requested from the explicit enable button in `AlertCenter`.
- The API derives the user solely from the active Better Auth session; client input may never choose a user or role.
- VAPID private material is server-only; only `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is exposed to browser code.
- Push gateway network work must run from a bounded cron outbox batch, never in a business-event response.
- Reuse `public/brand/ruang-agunan-icon.png`; do not add a duplicate image asset.
- Notification message text uses `text-justify`; titles, metadata, and CTA stay left-aligned.
- Run focused Vitest with `--exclude ".worktrees/**"`, then TypeScript checking and `graphify update .`.

---

## File Structure

- `lib/db/schema/push-notifications.ts`: Drizzle tables, delivery status type, and indexes.
- `lib/services/push-notification.service.ts`: subscription ownership, outbox queue, VAPID delivery, retry, and invalid-endpoint removal.
- `lib/services/notification.service.ts`: enqueue a created or materially refreshed persistent notification.
- `lib/services/cron.service.ts`: append bounded outbox processing to the current settlement cron result.
- `lib/auth/session.ts`: authenticated, role-agnostic API guard for the push subscription endpoint.
- `app/api/push/subscription/route.ts`: authenticated GET/POST/DELETE subscription management.
- `components/ui/push-notification-control.tsx`: permission-aware opt-in/out control with no initial push-library load.
- `components/ui/alert-center.tsx`: compact left/event, center/content, right/brand card layout and control placement.
- `public/push-service-worker.js`: static Push API and notification-click handlers.
- `drizzle/0027_web_push_notifications.sql`: generated schema migration, with Drizzle metadata generated at the same time.
- `tests/push-notification-service.test.ts`, `tests/push-subscription-route.test.ts`, and `tests/buyer-alert-center.test.tsx`: regression coverage.

### Task 1: Durable outbox and server delivery service

**Files:**
- Create: `lib/db/schema/push-notifications.ts`
- Modify: `lib/db/schema/index.ts`
- Modify: `lib/services/notification.service.ts`
- Create: `lib/services/push-notification.service.ts`
- Modify: `lib/services/cron.service.ts`
- Modify: `package.json`, `package-lock.json`
- Generated: `drizzle/0027_web_push_notifications.sql`, `drizzle/meta/0027_snapshot.json`, `drizzle/meta/_journal.json`
- Test: `tests/push-notification-service.test.ts`

**Interfaces:**
- Consumes: `NotificationRow` from `notifications`, `db`, and VAPID environment values.
- Produces: `queuePushDelivery(notification)`, `savePushSubscription(userId, input)`, `removePushSubscription(userId, endpoint)`, `hasPushSubscription(userId)`, and `processPendingPushDeliveries(limit?: number)`.

- [ ] **Step 1: Write the failing service tests**

```ts
it("queues one pending outbox entry for a new notification without sending to the gateway", async () => {
  await queuePushDelivery(notification);
  expect(mocks.insert).toHaveBeenCalled();
  expect(mocks.sendNotification).not.toHaveBeenCalled();
});

it("removes a 410 subscription and records a sent delivery for a successful endpoint", async () => {
  mocks.sendNotification.mockRejectedValueOnce({ statusCode: 410 });
  mocks.sendNotification.mockResolvedValueOnce(undefined);
  await expect(processPendingPushDeliveries(10)).resolves.toMatchObject({ processed: 1, sent: 1, removedSubscriptions: 1 });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/push-notification-service.test.ts --exclude ".worktrees/**"`

Expected: FAIL because `@/lib/services/push-notification.service` does not exist.

- [ ] **Step 3: Add the schema and migration**

```ts
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => ({ endpointUniqueIdx: uniqueIndex("push_subscriptions_endpoint_unique_idx").on(table.endpoint) }));
```

Add `pushDeliveries` with a unique `notificationId`, status, attempts, error, processed timestamp, and pending-status index. Export the schema. Install `web-push` and `@types/web-push`, then run `npm run db:generate -- --name web_push_notifications`.

- [ ] **Step 4: Implement the minimum outbox service**

```ts
export async function processPendingPushDeliveries(limit = 20): Promise<PushDeliverySummary> {
  if (!getVapidConfig()) return { processed: 0, sent: 0, failed: 0, skipped: 0, removedSubscriptions: 0 };
  const deliveries = await getPendingDeliveries(Math.min(Math.max(limit, 1), 20));
  for (const delivery of deliveries) await deliverToUserSubscriptions(delivery);
  return summary;
}
```

Use an upsert for the outbox. Reset it to `pending` only when the in-app notification content actually changed. Serialize a payload containing `title`, `body`, `href`, and the existing notification type. Set VAPID details only inside the server service. Treat 404/410 as an invalid browser subscription and delete only that endpoint; retain other endpoints for the same user. Treat other errors as a retryable failed delivery until three attempts, then mark failed. Add `pushDeliveries` output to `runAuctionSettlementCron` after the established settlement work.

- [ ] **Step 5: Run focused tests and commit the coherent server unit**

Run: `npm test -- tests/push-notification-service.test.ts tests/notification-service.test.ts --exclude ".worktrees/**"`

Expected: PASS. Commit after the API task so schema, service, and public route land atomically.

### Task 2: Session-bound subscription API and safe service worker

**Files:**
- Modify: `lib/auth/session.ts`
- Create: `app/api/push/subscription/route.ts`
- Create: `public/push-service-worker.js`
- Test: `tests/push-subscription-route.test.ts`

**Interfaces:**
- Consumes: `savePushSubscription(userId, input)`, `removePushSubscription(userId, endpoint)`, `hasPushSubscription(userId)`, and current Better Auth session.
- Produces: `GET /api/push/subscription` with `{ enabled, configured, publicKey }`; `POST` and `DELETE` only for the session user.

- [ ] **Step 1: Write failing route tests**

```ts
it("stores a valid subscription for the session user, not a client-supplied user", async () => {
  mocks.requireAuthenticatedApiSession.mockResolvedValue({ ok: true, userId: "buyer-1" });
  const response = await POST(jsonRequest({ endpoint: "https://push.example/subscription", keys: { p256dh: "key", auth: "auth" }, userId: "admin-1" }));
  expect(response.status).toBe(200);
  expect(mocks.savePushSubscription).toHaveBeenCalledWith("buyer-1", expect.any(Object));
});

it("rejects invalid endpoints and unauthenticated requests", async () => {
  mocks.requireAuthenticatedApiSession.mockResolvedValue({ ok: false, status: 401, message: "Silakan masuk terlebih dahulu." });
  await expect((await POST(jsonRequest({}))).status).toBe(401);
});
```

- [ ] **Step 2: Run the route test to verify it fails**

Run: `npm test -- tests/push-subscription-route.test.ts --exclude ".worktrees/**"`

Expected: FAIL because the route and shared guard do not exist.

- [ ] **Step 3: Implement the guard and subscription route**

```ts
export async function requireAuthenticatedApiSession() {
  const session = await getServerSession();
  if (!session?.user || ("isActive" in session.user && session.user.isActive === false)) {
    return { ok: false as const, status: 401, message: "Silakan masuk terlebih dahulu." };
  }
  return { ok: true as const, userId: session.user.id, session };
}
```

Validate `endpoint` with `new URL`, require `https:`, require non-empty `keys.p256dh` and `keys.auth`, and cap strings at 4096 characters. The GET response uses the current session user and returns the public key only when VAPID is fully configured. DELETE accepts an endpoint and deletes only when it belongs to that same user.

- [ ] **Step 4: Implement the static worker**

```js
self.addEventListener("push", (event) => {
  const payload = event.data ? event.data.json() : {};
  event.waitUntil(self.registration.showNotification(payload.title || "Ruang Agunan", {
    body: payload.body || "Ada pembaruan penting untuk Anda.",
    icon: "/brand/ruang-agunan-icon.png",
    badge: "/brand/ruang-agunan-icon.png",
    data: { href: typeof payload.href === "string" && payload.href.startsWith("/") ? payload.href : "/notifikasi" }
  }));
});
```

Add a `notificationclick` listener that closes the notification, focuses an existing same-origin window when possible, and otherwise opens the safe internal `href`. Do not add cache, fetch, install, or activate handlers.

- [ ] **Step 5: Run route tests and commit the server unit**

Run: `npm test -- tests/push-subscription-route.test.ts tests/push-notification-service.test.ts --exclude ".worktrees/**"`

Expected: PASS. Commit with Task 1 as `feat: add opt-in web push delivery`.

### Task 3: Notification center control and refined card layout

**Files:**
- Create: `components/ui/push-notification-control.tsx`
- Modify: `components/ui/alert-center.tsx`
- Test: `tests/buyer-alert-center.test.tsx`

**Interfaces:**
- Consumes: `GET`, `POST`, and `DELETE /api/push/subscription`; browser `serviceWorker`, `PushManager`, and notification permission APIs.
- Produces: a button that reports unsupported, unavailable, denied, disabled, or enabled state without requesting permission at mount time.

- [ ] **Step 1: Add failing UI assertions**

```tsx
expect(await screen.findByRole("img", { name: "Logo Ruang Agunan" })).toHaveAttribute("src", expect.stringContaining("ruang-agunan-icon.png"));
expect(screen.getByText(/silakan bayar langsung/i)).toHaveClass("text-justify");
expect(screen.getByRole("button", { name: /aktifkan notifikasi perangkat/i })).toBeInTheDocument();
```

- [ ] **Step 2: Run the UI test to verify it fails**

Run: `npm test -- tests/buyer-alert-center.test.tsx --exclude ".worktrees/**"`

Expected: FAIL because the brand image and enable control are absent.

- [ ] **Step 3: Implement the lazy opt-in control**

```tsx
const registration = await navigator.serviceWorker.register("/push-service-worker.js");
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: urlBase64ToUint8Array(publicKey)
});
await fetch("/api/push/subscription", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription) });
```

Load configuration when the dropdown opens, not on dashboard mount. Only execute the code above after the button click and after checking permission/support. Use concise Indonesian messages for unsupported browser, denied permission, missing server configuration, success, and failed save. The disable control calls `unsubscribe()` and then the scoped DELETE route.

- [ ] **Step 4: Update the card hierarchy with existing visual tokens**

```tsx
<div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl">...</div>
<div className="min-w-0 flex-1">...
  <p className="mt-0.5 text-justify text-[0.74rem] leading-relaxed ...">{notification.description}</p>
</div>
<Image alt="Logo Ruang Agunan" className="mt-0.5 size-7 shrink-0 object-contain opacity-90" height={28} src="/brand/ruang-agunan-icon.png" width={28} />
```

Keep the semantic event icon on the far left and move the unread dot inside the content header so the logo remains the right edge. Preserve current colors, links, keyboard semantics, focus behavior, 200ms transform/opacity transitions, and `prefers-reduced-motion` support. Do not change page layout, fonts, or route scopes.

- [ ] **Step 5: Run focused UI tests**

Run: `npm test -- tests/buyer-alert-center.test.tsx tests/admin-superadmin-notifications-page.test.tsx --exclude ".worktrees/**"`

Expected: PASS with buyer, Admin Unit, and Superadmin center behavior preserved.

### Task 4: Integration, documentation, and verification

**Files:**
- Modify: `.env.example` if it exists and documents runtime environment values.
- Modify: `README.md` only if environment setup is documented there.
- Modify: `docs/superpowers/specs/2026-07-28-web-push-notifications-design.md` and this plan to check completed steps.

**Interfaces:**
- Consumes: all completed feature interfaces and existing cron route.
- Produces: reproducible VAPID setup instructions and verified source graph.

- [ ] **Step 1: Document exact production configuration**

Document `npx web-push generate-vapid-keys --json`, the three required environment values, and that they must be added in Dokploy before the deployment can send device notifications. State that no PWA/offline setting is required.

- [ ] **Step 2: Run the complete focused test set**

Run: `npm test -- tests/push-notification-service.test.ts tests/push-subscription-route.test.ts tests/notification-service.test.ts tests/notification-routes.test.ts tests/notification-events.test.ts tests/buyer-alert-center.test.tsx --exclude ".worktrees/**"`

Expected: PASS.

- [ ] **Step 3: Run static and build verification**

Run: `npx tsc --noEmit` and `npm run build`.

Expected: TypeScript exits 0. Build exits 0 when required local environment values are available; if unavailable, record the exact environment blocker without claiming build verification.

- [ ] **Step 4: Refresh the code graph and inspect changes**

Run: `graphify update .`, `git status --short`, and `git diff --check`.

Expected: graph data may be dirty but source, migration, test, and document changes contain no whitespace errors. Do not stage generated `graphify-out` changes.

- [ ] **Step 5: Commit, fast-forward master, and push**

Run: `git add <feature files> && git commit -m "feat: add opt-in web push notifications"`; then fast-forward the clean source state into `master` and `git push origin master`.

Expected: `master` push succeeds. Do not claim production push delivery works until the VAPID variables are present in Dokploy and a real browser has opted in.
