# Admin Unit Backend Design

## Goal

Build the Admin Unit backend as a PRD-first domain API that connects the existing admin UI to PostgreSQL through Drizzle, while preserving role isolation by unit.

## Scope

This phase covers Admin Unit workflows:

- Barang gadai input, edit, detail, and local media metadata.
- Status transitions: perpanjang, tebus, jadikan jaminan, pasarkan, pasarkan ulang.
- Pemasaran sessions for fixed price and Vickrey.
- Transaction review: verify transfer, reject proof, confirm direct payment.
- Unit-scoped blacklist review and manual extension.
- Dashboard and list pages reading from database instead of mock data.

## Architecture

The implementation follows the Super Admin pattern already in the repo:

- Database schema lives in `lib/db/schema/admin.ts`.
- Business rules live in focused services under `lib/services/`.
- Request validation and UI serializers live under `lib/admin-unit/`.
- Route handlers in `app/api/admin/**` only enforce auth, parse input, call services, and return JSON.
- Admin pages call server services directly for SSR data and use client forms for mutations.

## Data Model

New tables:

- `barang`
- `media_barang`
- `riwayat_perpanjangan`
- `pemasaran`
- `bids`
- `transaksi`
- `pelanggaran_user`
- `riwayat_status_barang`

Existing tables reused:

- `user`
- `units`
- `rekening_unit`
- `blacklist`
- `blacklist_action_log`

Every Admin Unit query filters by `session.user.unitId`. The request body never decides which unit is being accessed.

## Local Media

For this prototype, media upload is represented as a local URL/path stored in `media_barang`. The UI can store paths such as `/uploads/barang/example.jpg`; external storage is out of scope for this phase.

## Business Rules

- `GADAI -> GADAI`: perpanjangan with later due date.
- `GADAI -> DITEBUS`: penebusan with reference.
- `GADAI -> JAMINAN`: conversion after due-date review.
- `JAMINAN -> DIPASARKAN`: first publication.
- `GAGAL -> DIPASARKAN`: relisting.
- Only one active `pemasaran` per barang.
- Admin cannot read or mutate data from another unit.
- Bid nominal is not exposed before Vickrey deadline.
- `LUNAS` transactions cannot be changed again.
- Admin Unit can extend an active blacklist, but cannot revoke it.

## Verification

Verification must include:

- Unit-scoped validation tests.
- Serializer tests for admin UI payloads.
- HTTP checks for `/admin`, `/admin/barang`, `/admin/transaksi`, and key detail pages.
- PostgreSQL checks confirming rows are created and updated by API actions.
