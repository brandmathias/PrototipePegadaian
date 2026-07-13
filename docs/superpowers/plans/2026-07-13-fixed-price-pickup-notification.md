# Fixed-Price Pickup Notification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan instruksi pengambilan barang beserta nama dan alamat unit pada notifikasi pembayaran Harga Tetap yang disetujui.

**Architecture:** Perluas input helper notifikasi pembayaran yang sudah ada dan teruskan data transaksi/unit dari service admin. Pesan dibedakan berdasarkan tipe transaksi agar alur Vickrey tidak berubah.

**Tech Stack:** TypeScript, Next.js, Vitest

## Global Constraints

- Tidak menambah dependency, skema database, query, atau komponen UI.
- Pesan pengambilan hanya untuk transaksi `fixed_price`.
- Pertahankan perubahan lokal notifikasi penolakan.

---

### Task 1: Fixed-price pickup notification

**Files:**
- Modify: `tests/notification-events.test.ts`
- Modify: `tests/admin-transaction-service.test.ts`
- Modify: `lib/services/notification-events.ts`
- Modify: `lib/services/admin-transaction.service.ts`

**Interfaces:**
- Consumes: hasil join transaksi yang memiliki `transaction.type`, `unit.name`, dan `unit.address`.
- Produces: `notifyPaymentVerified` dengan konteks tipe transaksi dan unit.

- [ ] **Step 1: Write failing tests**

Tambahkan assertion bahwa notifikasi Harga Tetap berisi instruksi segera mengambil barang, nama unit, dan alamat unit; pastikan service meneruskan data tersebut.

- [ ] **Step 2: Verify RED**

Run: `npm test -- --run tests/notification-events.test.ts tests/admin-transaction-service.test.ts`

Expected: FAIL karena input unit belum diteruskan dan pesan lama belum berisi instruksi pengambilan.

- [ ] **Step 3: Implement minimally**

Perluas input `notifyPaymentVerified`, pilih pesan berdasarkan `transactionType`, lalu teruskan `row.unit.name` dan `row.unit.address` dari service admin.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- --run tests/notification-events.test.ts tests/admin-transaction-service.test.ts tests/buyer-alert-center.test.tsx`

Expected: seluruh test lulus.

- [ ] **Step 5: Verify project**

Run: `npx tsc --noEmit` dan `npm run build`

Expected: TypeScript tanpa error dan build exit 0.
