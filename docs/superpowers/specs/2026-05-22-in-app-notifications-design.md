# In-App Notifications Design

Status: proposed for review
Date: 2026-05-22
Scope: buyer-first persistent notifications for Vickrey auction, payment, and blacklist events

## Context

The application already has a bell icon and alert panel through `AlertCenter` and toast state. That implementation is UI-only and in-memory, so notifications disappear on refresh and cannot be generated reliably by backend events.

The Vickrey flow now needs persistent in-app notifications so buyers do not have to repeatedly check the bid history or transaction pages to know whether they won, need to pay, were verified, or received account restrictions.

External channels such as email, SMS, WhatsApp, push notifications, and WebSocket real-time delivery stay out of scope for the prototype. A lightweight polling model is enough and easier to test.

## Goals

- Store buyer notifications in the database.
- Show unread notification count on the buyer navbar bell.
- Poll unread notifications every 30 seconds.
- Create notifications automatically from backend events.
- Link each notification to the relevant page, such as bid history, transaction detail, or blacklist status.
- Keep notification access scoped to the authenticated user.

## Non-Goals

- No WebSocket or server-sent events.
- No external notification providers.
- No admin notification center in this phase.
- No full event-sourcing audit log.
- No notification preferences UI yet.

## Recommended Data Model

Add a `notifications` table:

```sql
id text primary key
user_id text not null references users(id) on delete cascade
title text not null
message text not null
type text not null
entity_type text
entity_id text
action_href text
is_read boolean not null default false
created_at timestamp with time zone not null default now()
read_at timestamp with time zone
metadata jsonb
```

Recommended indexes:

```sql
create index notifications_user_unread_created_idx
  on notifications (user_id, is_read, created_at desc);

create index notifications_user_created_idx
  on notifications (user_id, created_at desc);

create unique index notifications_unique_event_idx
  on notifications (user_id, type, entity_id)
  where entity_id is not null;
```

The unique event index prevents duplicated cron notifications for the same transaction or auction outcome.

Drizzle implementation should follow the current schema style: `pgTable`, `text`, `boolean`, `timestamp(..., { withTimezone: true })`, `index`, and `uniqueIndex`. The `id` can use the same application-generated ID approach used by other domain tables in this project instead of relying on database UUID generation.

## Notification Types

`vickrey_win`
: Buyer won a Vickrey auction and a direct-payment transaction was created.

`payment_verified`
: Admin verified payment for fixed price or Vickrey direct payment.

`payment_rejected`
: Admin rejected or requested correction for uploaded payment proof.

`payment_deadline`
: Payment deadline is approaching or already overdue.

`blacklist_active`
: Account restriction was activated because of unpaid winning auction or repeated violation.

`transaction_created`
: Transaction was created after fixed-price purchase or Vickrey settlement.

## Backend Flow

Create `lib/services/notification.service.ts` with:

- `createNotification(input)`
- `createNotificationOnce(input)`
- `listUserNotifications(userId, options)`
- `getUnreadNotificationCount(userId)`
- `markNotificationRead(userId, notificationId)`
- `markAllNotificationsRead(userId)`

Use `createNotificationOnce` for cron-driven and settlement-driven events so repeated background jobs do not create duplicates.

## Event Integration Points

Vickrey settlement:

- When an expired Vickrey auction is processed and a winner transaction is created, create `vickrey_win`.
- Action link: `/transaksi/{transactionId}`.
- Message should explain that payment is direct at the unit and must be completed within 24 hours.

Payment verification:

- When admin verifies payment, create `payment_verified`.
- Action link: `/transaksi/{transactionId}`.
- For verified transactions, mention that the buyer can open the digital note after completion.

Payment rejection:

- When admin rejects payment proof, create `payment_rejected`.
- Action link: `/transaksi/{transactionId}`.
- Include the admin note if available.

Payment deadline warning:

- Cron or payment-status processing creates `payment_deadline` if a payment is close to expiry, recommended threshold 3 hours before deadline.
- Use idempotency so the same transaction gets only one deadline warning.

Blacklist activation:

- When blacklist/restriction is activated, create `blacklist_active`.
- Action link: `/riwayat-bid` or an account restriction page if one is added later.

## API Endpoints

`GET /api/user/notifikasi`

- Returns the latest notifications for the authenticated buyer.
- Supports `?unread=true`.
- Supports optional pagination with `limit` and `cursor`.

`GET /api/user/notifikasi/unread-count`

- Returns `{ count }`.
- Used by the navbar bell badge.

`PATCH /api/user/notifikasi/[id]`

- Marks a single notification as read.
- Must verify the notification belongs to the authenticated user.

`POST /api/user/notifikasi/read-all`

- Marks all notifications for the authenticated user as read.

All endpoints must derive `user_id` from the session, never from request body.

## Frontend UX

Extend the current bell experience instead of replacing the visual language:

- Bell badge shows unread count, capped as `9+`.
- Dropdown shows title, short message, WIB timestamp, unread indicator, and CTA.
- Opening the panel should not automatically mark everything as read.
- A notification is marked read when the buyer clicks it or presses "Tandai semua dibaca".
- Empty state should say there are no new notifications and point users back to catalog or transactions.

Polling behavior:

- Poll unread count and latest notifications every 30 seconds when buyer is logged in.
- Pause or slow polling when the tab is hidden if needed later.
- Refresh immediately after important buyer actions, such as payment proof upload or transaction completion.

## Security Rules

- Buyers can only read and update their own notifications.
- Admin Unit cannot query buyer notifications through these endpoints.
- Notification messages must not expose sealed bid nominal before auction deadline.
- Vickrey winner notifications are created only after settlement has opened the result.
- Use idempotency for cron events to prevent duplicate notifications.

## Testing Plan

Service tests:

- Create notification.
- Create notification once with duplicate guard.
- List latest notifications.
- Count unread notifications.
- Mark one notification as read.
- Mark all as read.

Route tests:

- Authenticated buyer can list own notifications.
- Unauthenticated user is rejected.
- Buyer cannot mark another user's notification as read.
- Read-all only affects the current buyer.

Event tests:

- Vickrey settlement creates winner notification.
- Payment verification creates payment notification.
- Payment rejection creates rejection notification.
- Deadline warning is idempotent.
- Blacklist activation creates restriction notification.

UI tests:

- Bell badge renders unread count.
- Dropdown shows persisted notifications.
- Read action updates the badge.
- Polling refreshes notification list.

## Implementation Phases

1. Add database schema and service layer.
2. Add authenticated notification API routes.
3. Integrate backend event creation in Vickrey settlement, payment verification, payment rejection, deadline warning, and blacklist activation.
4. Connect buyer `AlertCenter` to polling-backed notifications while preserving local toast behavior.
5. Add tests and update PRD.

## Open Decision

Recommendation: implement buyer notifications first. Admin Unit can receive its own notification center later after the buyer flow is stable, because the current pain point is buyer awareness after auction result, payment status, and blacklist events.
