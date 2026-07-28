# Web Push Notifications Design

Status: approved for implementation
Date: 2026-07-28
Scope: opt-in Web Push delivery for the existing persistent notification center across buyer, Admin Unit, and Superadmin roles.

## Context

Ruang Agunan already stores the important operational events as persistent in-app notifications and renders them in `AlertCenter`. The feature needs an additional browser/device delivery channel without changing the application into a PWA or adding offline behavior.

The operating-system notification layout is controlled by the browser and device. The application can supply the title, message, Ruang Agunan icon, and destination, but cannot force a specific Android vendor layout.

## Goals

- Deliver an existing notification as Web Push only after the signed-in user explicitly enables it.
- Use the same recipient and authorization model as the current in-app notification center for buyer, Admin Unit, and Superadmin.
- Keep notification creation fast by recording a durable outbox item and delivering it later from the existing protected cron flow.
- Use the existing compact Ruang Agunan icon in the notification-card trailing position and as the browser notification icon.
- Align the descriptive information in each in-app card with `text-justify`, while retaining left-aligned titles and timestamps for scanability.
- Remove expired browser subscriptions automatically when a push provider responds with HTTP 404 or 410.

## Non-Goals

- No `manifest.webmanifest`, install prompt, offline cache, or PWA conversion.
- No Firebase, ntfy server, third-party SaaS, email, WhatsApp, or WebSocket delivery.
- No notification preference categories in this release; opt-in applies to the notifications the role already receives.
- No immediate network call from a business event request.

## Architecture

Use standards-based Web Push with VAPID and the `web-push` server package. A small service worker, registered only after the user presses the enable control, receives the encrypted push payload, displays a system notification, and opens the internal action URL when clicked.

The server stores one or more browser subscriptions per authenticated user. Every newly created or materially refreshed persistent notification creates or resets one outbox record. The protected auction cron processes a small bounded batch, sends to that user's active subscriptions, records delivery status, retries transient failures, and deletes invalid subscriptions. Therefore the request that creates a notification only uses local database work and never waits on a push gateway.

## Data Model

`push_subscriptions`

- `id` text primary key.
- `user_id` text not null, references `users(id)` with cascade delete.
- `endpoint` text not null and unique.
- `p256dh` text not null and `auth` text not null.
- `user_agent` text nullable for support diagnostics only.
- `created_at` and `updated_at` timestamps with time zone.

`push_deliveries`

- `id` text primary key.
- `notification_id` text not null, references `notifications(id)` with cascade delete, and is unique.
- `user_id` text not null, references `users(id)` with cascade delete.
- `status` text not null with `pending`, `sent`, `failed`, or `skipped`.
- `attempts` integer not null default 0, `last_error` text nullable, and `processed_at` timestamp nullable.
- `created_at` and `updated_at` timestamps with time zone.

The outbox is intentionally one row per in-app notification. A material refresh can reset that row to `pending`; a no-op refresh must not create a duplicate push.

## Security and Privacy

- The subscription route derives the user identity solely from the Better Auth session. It never accepts a user ID or role from the client.
- Subscription payloads are validated for HTTPS endpoint format and required `p256dh`/`auth` keys before storage.
- VAPID private material stays server-only in `VAPID_PRIVATE_KEY`. The browser receives only `NEXT_PUBLIC_VAPID_PUBLIC_KEY`.
- The service worker accepts only same-origin action paths and opens a safe internal URL.
- The push payload carries only the existing notification title, message, type, and internal link; it never exposes bid details or new personal data.

## UX and Performance

- `AlertCenter` preserves its existing visual language. Each row stays a compact card: semantic event icon left, content in the center, existing Ruang Agunan icon right.
- The message paragraph uses `text-justify`; title, CTA, and timestamp remain left-aligned.
- The enable/disable control is lazy and is mounted only in the existing notification dropdown. Browser permission is requested only as a direct click result.
- No push library is shipped to the browser. The service worker is a small static file and the server dependency is loaded only on server execution.
- The existing `public/brand/ruang-agunan-icon.png` is reused rather than uploading a larger duplicate asset.

## Configuration

Required server environment values:

```dotenv
VAPID_SUBJECT=mailto:admin@your-domain.example
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<generated public key>
VAPID_PRIVATE_KEY=<generated private key>
```

The application remains usable when VAPID is not configured; the opt-in control reports that browser push has not yet been configured, and the outbox processor skips delivery without failing auction settlement.

## Testing and Verification

- Unit test subscription normalization, VAPID configuration guard, and safe same-origin action handling.
- Route tests prove that the authenticated session owns every stored or removed subscription and malformed payloads are rejected.
- Service tests prove queue creation, no-op refresh protection, bounded processing, retry behavior, and removal of expired endpoints.
- UI tests prove the opt-in state, left/center/right card layout, Ruang Agunan asset, and justified message class.
- Run focused Vitest tests with `.worktrees/**` excluded, TypeScript checking, a production build when environment permits, and `graphify update .` after source changes.
