# Vickrey Auction Precise Duration Design

## Summary

Admin unit needs to configure Vickrey auction duration down to seconds so testing can complete quickly without waiting for day-based deadlines. The current implementation only accepts `durationDays`, which makes short operational tests impractical.

This design changes the admin marketing flow so Vickrey sessions can be configured with `days`, `hours`, `minutes`, and `seconds`, while keeping `startsAt` and `endsAt` as the canonical runtime fields used by countdowns, cron settlement, and buyer/admin pages.

## Goals

- Allow admin unit to configure Vickrey duration with day, hour, minute, and second precision.
- Keep existing fixed price behavior unchanged.
- Preserve compatibility with pages and services that already read `startsAt` and `endsAt`.
- Support rapid testing flows such as auctions that end in under a minute.

## Non-Goals

- No change to the buyer countdown rendering logic beyond consuming the already computed `endsAt`.
- No schema migration in this step unless implementation reveals an unavoidable need.
- No redesign of cron cadence or settlement semantics beyond using the new deadline precision.

## Recommended Approach

Use structured duration inputs in the admin marketing form:

- `durationDays`
- `durationHours`
- `durationMinutes`
- `durationSeconds`

The backend validates these components, converts them into total seconds, then computes `endsAt` from `startsAt + duration`. The database continues to rely on `startsAt` and `endsAt` for actual auction timing. The legacy `durationDays` column remains populated for compatibility, but it is treated as a derived convenience value rather than the source of truth for deadline precision.

This is preferred over an absolute `endsAt` picker because:

- It is faster for testing.
- It avoids manual timestamp math by admins.
- It still works well for long-running production sessions.

## User Experience

### Admin Marketing Form

When `mode = vickrey`, the form shows four numeric inputs:

- `Hari`
- `Jam`
- `Menit`
- `Detik`

Rules:

- All values must be integers.
- No negative values.
- `Jam` range: `0-23`
- `Menit` range: `0-59`
- `Detik` range: `0-59`
- Total duration must be greater than `0`.
- Total duration must not exceed `30` days.

Recommended defaults:

- `Hari = 0`
- `Jam = 0`
- `Menit = 5`
- `Detik = 0`

The form also shows:

- A human-readable duration summary, for example `0 hari 0 jam 2 menit 15 detik`
- A calculated estimated finish timestamp based on the current submit-time clock

When `mode = fixed_price`, these duration inputs are disabled or hidden because they are irrelevant to that flow.

## Data Model

### Canonical Fields

The system should continue treating these as canonical runtime auction fields:

- `pemasaran.startsAt`
- `pemasaran.endsAt`

These are already consumed by:

- buyer countdowns
- public catalog sorting and visibility
- admin monitoring views
- expired Vickrey settlement cron

### Compatibility Field

The existing `pemasaran.durationDays` column remains in place for now.

Behavior:

- For Vickrey auctions, it stores a derived integer day representation from the selected duration.
- For fixed price, it remains `null`.
- No logic that requires deadline precision may rely only on `durationDays`.

This lets the feature ship without forcing a schema migration across existing test data and services.

## Validation Rules

`validatePemasaranPayload` will accept:

- `mode`
- `price`
- `durationDays`
- `durationHours`
- `durationMinutes`
- `durationSeconds`

Validation behavior:

- `fixed_price` returns no auction duration.
- `vickrey` computes:
  - `totalSeconds`
  - `normalizedDays`
  - normalized structured duration parts
- invalid combinations throw clear admin-facing errors

Example invalid cases:

- all duration parts are `0`
- `minutes = 60`
- `seconds = 90`
- total duration exceeds `30` days

## Backend Behavior

`publishAdminBarang` should:

1. Validate the structured duration payload.
2. Create `startsAt = now`.
3. Compute `endsAt = new Date(now.getTime() + totalSeconds * 1000)`.
4. Insert `pemasaran` with:
   - `basePrice`
   - `startsAt`
   - `endsAt`
   - derived `durationDays`

This preserves all existing downstream behavior because cron and serializers already use `endsAt`.

## Testing Strategy

### Validation Tests

Update admin validation tests to cover:

- successful `vickrey` payload with short durations such as `0d 0h 0m 30s`
- rejection when total duration is zero
- rejection when hour/minute/second bounds are exceeded
- rejection when total duration is more than `30` days

### UI Tests

Add or update form tests to confirm:

- Vickrey mode reveals structured duration fields
- fixed price does not require them
- payload submission includes all four duration parts

### Service Tests

Add or update service tests to confirm:

- `endsAt` is computed with second precision
- Vickrey sessions with short durations still serialize and settle correctly

### Regression Scope

Run focused tests covering:

- admin unit validation
- admin marketing serialization
- cron Vickrey settlement

Because those areas depend directly on auction deadlines.

## Risks and Mitigations

### Risk: Hidden reliance on `durationDays`

Some older code paths or tests may still assume day-only duration.

Mitigation:

- Keep `durationDays` populated as a derived compatibility field.
- Audit current references and move precision-sensitive logic to `endsAt` or `totalSeconds`.

### Risk: UI confusion for production operators

Four duration fields can be noisier than a simple day input.

Mitigation:

- keep labels explicit
- use sensible defaults
- show a live computed summary and finish timestamp

### Risk: Flaky short-duration tests

Very short windows can become race-sensitive.

Mitigation:

- use deterministic mocked `Date` in tests where precise timing matters
- avoid 1-2 second expiry windows in automated tests unless intentionally testing race boundaries

## Implementation Slice

The implementation should stay focused on:

- `components/admin-unit/admin-marketing-form.tsx`
- `lib/admin-unit/validation.ts`
- `lib/services/admin-pemasaran.service.ts`
- related admin validation/service tests

Buyer/admin countdown consumers should only be touched if verification reveals a regression.
