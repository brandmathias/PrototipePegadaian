# Admin Unit Pemasaran Redesign Design

Date: 2026-05-04
Owner: Codex + User
Scope: Admin unit marketing list and session detail experience for `Fixed Price` and `Vickrey Auction`

## Summary

Admin unit marketing pages will be redesigned into two clearly differentiated operational surfaces:

- `Fixed Price` becomes a sales-monitoring view focused on item media, fixed price, payment readiness, buyer/transaction state, and admin follow-up actions.
- `Vickrey Auction` becomes an auction-monitoring view focused on item media, countdown, participant activity, sealed-bid visibility rules, winner/final price state, and post-deadline outcomes.

Both flows will share a consistent shell and information hierarchy, but they must not share misleading terminology or behavior. In particular, fixed price pages must never render bid-centric concepts such as bid visibility, participants, or bid tables.

## Goals

- Make `Fixed Price` and `Vickrey Auction` feel like two distinct admin workflows instead of one generic list.
- Show photo/video media directly on admin marketing list and detail pages so admins can verify what is being marketed without jumping back to inventory.
- Align displayed concepts with the PRD:
  - fixed price centers on sale price, payment method, verification, and sold state
  - vickrey centers on sealed bids, deadline, result reveal, winner, and B2 final payment price
- Preserve existing routing and data ownership rules for unit-specific access.

## Non-Goals

- No changes to buyer catalog UX in this task.
- No new payment gateway or transaction automation.
- No changes to bidding logic, cron settlement rules, or database state machine rules beyond exposing correct read models for admin UI.

## Recommended Approach

Use a `balanced operational showcase` layout.

Why this approach:

- It keeps the page useful for daily admin decisions, not just visual presentation.
- It gives enough media prominence to support item verification and merchandising quality control.
- It avoids the density and rigidity of a table-first cockpit while still surfacing operational state early.

Rejected alternatives:

- `ops cockpit`: efficient for very high row counts, but too sterile and weak on media context for the current item volume.
- `gallery-first merchandising`: strong visually, but under-serves payment, status, and deadline monitoring.

## UX Structure

### 1. Pemasaran Hub

The hub page remains the entry point with two child paths:

- `/admin/pemasaran/fixed-price`
- `/admin/pemasaran/vickrey-auction`

Visual treatment:

- `Fixed Price` card uses calm jade/green surfaces and shopping-oriented language.
- `Vickrey Auction` card uses amber/gold surfaces and auction-oriented language.

Each card shows:

- route label
- session count
- short workflow description
- prominent call-to-action

### 2. Fixed Price List

Each session appears as a sales card, not an auction card.

Primary content:

- large hero media area using the first photo/video as primary media
- item name, item code, category, and session status
- fixed sale price
- countdown only if a deadline exists for a pending buyer/payment context
- payment readiness note or transaction state summary
- concise next-step hint for admin

Allowed support fields:

- buyer name if transaction exists
- payment method if chosen
- proof uploaded / waiting verification / sold
- created or updated timing if already available in the read model

Forbidden fields:

- participant count
- bid visibility
- bid table
- winner/B1/B2 terminology

CTA:

- `Lihat sesi` links to `/admin/pemasaran/fixed-price/[id]`

### 3. Vickrey Auction List

Each session appears as an auction card with a more dynamic operational tone.

Primary content:

- large hero media area using the first photo/video as primary media
- item name, item code, category, and session status
- base price
- countdown / ended state
- participant count
- sealed-bid visibility state
- post-deadline reveal summary when allowed:
  - winner
  - final payable price

Behavior rules:

- Before deadline, no bid nominal values are shown.
- After deadline, result summary may be shown and detail page may reveal bid table according to current business rules.

CTA:

- `Lihat sesi` links to `/admin/pemasaran/vickrey-auction/[id]`

### 4. Fixed Price Detail

The detail page acts as a sales operations sheet.

Sections:

- media gallery with full-width photo/video presentation
- item snapshot: category, item code, condition, unit, price
- sale status panel: active / waiting payment / sold / failed
- transaction panel:
  - buyer name
  - chosen payment method
  - reference number if available
  - proof file preview if available
  - payment deadline if available
- admin guidance panel:
  - what the current state means
  - where the admin should continue next

Empty or missing transaction data should show a clean operational message, not auction placeholders.

### 5. Vickrey Auction Detail

The detail page acts as an auction operations sheet.

Sections:

- media gallery with full-width photo/video presentation
- item snapshot: category, item code, condition, unit, base price
- session timeline: start, end, remaining time, status
- sealed-bid rule panel explaining whether results are still locked
- result summary panel after reveal:
  - winner (B1)
  - final payable price (B2)
- bid table:
  - visible only after deadline
  - shows ranking, bidder identity, nominal, submitted time, and role in outcome

While active, the detail page must explicitly tell admins that nominal bids remain hidden until the session ends.

## Data Design

### Read Model Changes

The current admin marketing serializer is too vickrey-centric. Replace it with a base structure plus mode-specific fields.

Shared fields:

- `id`
- `lotId`
- `lot`
- `code`
- `category`
- `condition`
- `status`
- `mode`
- `primaryMedia`
- `media`
- `startsAt`
- `endingAt`
- `note`

Fixed price fields:

- `price`
- `transactionStatus`
- `buyerName`
- `paymentMethod`
- `proofUrl`
- `reference`
- `soldAt`
- `paymentDeadline`

Vickrey fields:

- `basePrice`
- `participants`
- `visibility`
- `winner`
- `finalPrice`
- `bids`

### Service Changes

`listAdminPemasaran(unitId)` must join enough item/media data to power list cards without separate item lookups.

`getAdminPemasaranById(unitId, pemasaranId)` must return:

- mode-aware session data
- item metadata
- media collection
- transaction summary for fixed price when present
- bid details for vickrey only when reveal rules allow

If there is no transaction yet for fixed price, the service should return null fields rather than placeholder auction semantics.

### Routing

New detail routes:

- `/admin/pemasaran/fixed-price/[id]`
- `/admin/pemasaran/vickrey-auction/[id]`

Compatibility rule:

- `/admin/lelang/[id]` becomes a mode-aware redirector to the correct new route.

List pages will update their `Lihat sesi` links to mode-specific routes.

### Component Architecture

Keep the current admin page composition style, but split generic marketing UI into focused units:

- shared marketing intro/header component
- shared media gallery component reusable by list/detail variants
- `FixedPriceSessionCard`
- `VickreySessionCard`
- `FixedPriceSessionDetail`
- `VickreySessionDetail`

This keeps mode-specific copy and fields isolated so future changes do not reintroduce mixed semantics.

### Visual Direction

Follow the existing admin shell, but make the two modes visibly distinct.

Fixed price:

- jade/green neutrals
- calm informational chips
- stable selling language
- strong emphasis on price and payment progress

Vickrey auction:

- amber/sand accents
- stronger tension around countdown and reveal state
- more contrast around status transitions
- strong separation between hidden-results and revealed-results states

Shared visual rules:

- large media first
- no decorative green/white overlays over item media
- full-bleed media containers with `object-cover`
- mobile-safe stacked layout
- no new third-party animation dependency required for this task

### Error and Empty States

- No sessions: show mode-specific empty states with guidance to publish from inventory.
- Session missing: show a friendly not-found state with a link back to the correct marketing route.
- No media: show a clear placeholder panel explaining the item has no uploaded media.
- Fixed price without transaction: explain that no buyer has started payment yet.
- Vickrey before deadline: explain that nominal bids remain hidden until the deadline passes.

## Testing and Verification

### Behavior Checks

- Fixed price list/detail never shows bid-specific labels.
- Vickrey list/detail never reveals bid nominal values before deadline.
- Admin can still access only sessions belonging to the active unit.
- Route redirects land on the correct mode-specific detail page.
- Media renders correctly for both images and videos.

### UI Checks

- Distinct visual identity between fixed price and vickrey pages.
- Media remains full-width and uncluttered on desktop and mobile.
- Empty states read naturally and do not mention the wrong workflow.

### Implementation Boundary

This design is focused enough for a single implementation plan:

- serializer/service reshaping
- mode-specific list/detail pages
- route split and redirect compatibility
- media surfacing in admin marketing views

No further decomposition is required before implementation.
