# Single Active Vickrey Bid Lock Design

Status: approved for implementation
Date: 2026-06-17
Scope: buyer Lelang Tertutup bid eligibility and blacklist collision prevention

## Context

The current auction flow lets one buyer submit bids on multiple active Lelang Tertutup sessions. If the buyer wins more than one session, the system can create multiple unpaid winner obligations with overlapping 24-hour deadlines. Current blacklist logic avoids double escalation while a restriction is active, but the business rule is still confusing because parallel unpaid winner obligations can exist.

## Goal

Prevent parallel Lelang Tertutup obligations by allowing each buyer to hold only one active Lelang Tertutup bid or unpaid winner obligation at a time.

## Locked Rules

- A buyer may submit a bid to only one active Lelang Tertutup session at a time.
- The lock starts when the bid is successfully submitted.
- If the buyer loses, the lock ends when auction results are settled.
- If the auction fails without a winning obligation for the buyer, the lock ends when the auction is marked failed.
- If the buyer wins, the lock continues until admin unit verifies payment.
- Admin verification is represented by a winning transaction reaching `lunas` or `selesai`.
- If the buyer wins and does not pay within 24 hours, the bid lock ends when the transaction fails, and the blacklist restriction becomes the active blocker.
- Buyers may still view other auction detail pages while locked.
- Other auction bid CTAs are disabled with a clear message while the lock is active.
- Server-side submit must reject a second bid even if UI state is stale.

## User-Facing Copy

When a buyer tries to bid on another auction while locked:

> Anda masih memiliki bid aktif pada lelang lain. Tunggu hasil lelang tersebut sebelum mengikuti lelang baru.

If the buyer already won and payment is pending, the same blocker applies until admin verification. Blacklist messages continue to take priority when a blacklist is active.

## Implementation Shape

Add a derived lock helper in `lib/services/buyer.service.ts` using existing `bids`, `pemasaran`, `barang`, and `transaksi` records. No database migration is needed.

The helper treats these states as active locks:

- buyer bid on `pemasaran.status = 'aktif'`
- buyer winning bid on a settled auction where the related Vickrey transaction is not `lunas`, `selesai`, or `gagal`

The helper treats these states as unlocked:

- settled auction where buyer is not the winner
- failed auction
- winning transaction with status `lunas` or `selesai`
- winning transaction with status `gagal`, because blacklist/violation logic handles the penalty

## Tests

- `submitVickreyBid` rejects second auction bid while another active bid exists.
- Active bid-lock policy returns true for active auction bid.
- Active bid-lock policy returns true for unpaid winning transaction.
- Active bid-lock policy returns false after losing.
- Active bid-lock policy returns false after admin-verified payment.
- Lot detail page disables the auction CTA when buyer has an active bid lock on another lot.
