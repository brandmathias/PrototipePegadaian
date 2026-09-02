# Midtrans Harga Tetap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menyediakan checkout Midtrans Snap Sandbox yang otomatis menyelaraskan pembayaran Harga Tetap pada Buyer, Admin Unit, Superadmin, dan PostgreSQL.

**Architecture:** Backend membuat reservasi berjangka dan token Snap dari nominal database. Webhook Midtrans adalah satu-satunya jalur yang dapat mengubah transaksi menjadi lunas; browser hanya membuka Snap dan merefresh data. Status gateway tersimpan dalam transaksi agar seluruh peran membaca sumber data yang sama.

**Tech Stack:** Next.js 15 route handlers, React 19, TypeScript, Drizzle ORM, PostgreSQL, Vitest, Midtrans Snap REST API.

**Spec:** `docs/superpowers/specs/2026-09-02-midtrans-fixed-price-design.md`

## Global Constraints

- Hanya `fixed_price` memakai Midtrans; Vickrey tidak berubah.
- Gunakan API HTTP bawaan; jangan menambah SDK Midtrans.
- Server Key tidak boleh dikirim ke browser atau Git.
- Status lunas hanya berasal dari webhook tervalidasi dan status API Midtrans.
- Reservasi Harga Tetap berlaku 15 menit dan harus dilepas jika gagal/kedaluwarsa.
- Setiap perubahan perilaku ditulis test terlebih dahulu.

---

### Task 1: Gateway contract dan penyimpanan transaksi

**Files:**
- Create: `lib/payments/midtrans.ts`
- Modify: `lib/db/schema/admin.ts`
- Create: `drizzle/0029_midtrans_fixed_price.sql`
- Create: `scripts/apply-midtrans-fixed-price-migration.ts`
- Modify: `.env.example`
- Test: `tests/midtrans-payment.test.ts`

**Interfaces:**
- Produces `createMidtransSnapTransaction`, `verifyMidtransNotification`, `mapMidtransTransactionStatus`, dan `MIDTRANS_RESERVATION_MINUTES`.

- [ ] **Step 1: Write failing tests** untuk konfigurasi, pemetaan `settlement`, `capture`, `pending`, `expire`, dan signature yang salah.
- [ ] **Step 2: Run** `npx vitest run tests/midtrans-payment.test.ts --no-file-parallelism` dan pastikan gagal karena modul belum ada.
- [ ] **Step 3: Implement minimal gateway module**, schema, SQL migrasi, dan script penerapan migrasi.
- [ ] **Step 4: Run test yang sama** dan pastikan lulus.
- [ ] **Step 5: Commit** perubahan kontrak gateway dan migrasi.

### Task 2: Checkout dan reservasi Harga Tetap

**Files:**
- Modify: `lib/services/buyer.service.ts`
- Modify: `lib/buyer/validation.ts`
- Modify: `lib/buyer/fixed-price-visibility.ts`
- Modify: `app/api/user/beli/[pemasaranId]/route.ts`
- Test: `tests/buyer-fixed-price-locks.test.ts`
- Test: `tests/midtrans-checkout.test.ts`

**Interfaces:**
- Consumes `createMidtransSnapTransaction`.
- Produces `createFixedPricePurchase(...): { transaction, snapToken }` and reserves a marketing session for 15 minutes.

- [ ] **Step 1: Write failing tests** bahwa checkout tanpa konfigurasi tidak membuat transaksi, checkout menghasilkan token, dan transaksi kedaluwarsa dilepas.
- [ ] **Step 2: Run** `npx vitest run tests/midtrans-checkout.test.ts --no-file-parallelism` dan pastikan gagal.
- [ ] **Step 3: Implement minimal checkout** dengan nominal dari database, deadline 15 menit, reuse transaksi buyer sendiri, dan pengunci unik.
- [ ] **Step 4: Run test checkout serta pengunci Harga Tetap** dan pastikan lulus.
- [ ] **Step 5: Commit** checkout dan reservasi.

### Task 3: Webhook yang tervalidasi dan sinkronisasi lintas peran

**Files:**
- Create: `app/api/payments/midtrans/notification/route.ts`
- Modify: `lib/services/admin-transaction.service.ts`
- Modify: `lib/services/notification-events.ts`
- Modify: `lib/buyer/serializers.ts`
- Modify: `lib/admin-unit/serializers.ts`
- Test: `tests/midtrans-notification.test.ts`

**Interfaces:**
- Consumes `verifyMidtransNotification` dan transaksi lokal berdasarkan `paymentOrderId`.
- Produces transisi idempoten ke `lunas` atau `gagal`, riwayat barang, dan notifikasi Buyer/Admin Unit/Superadmin.

- [ ] **Step 1: Write failing tests** untuk signature salah, nominal berbeda, settlement pertama, settlement berulang, serta expire yang melepas katalog.
- [ ] **Step 2: Run** `npx vitest run tests/midtrans-notification.test.ts --no-file-parallelism` dan pastikan gagal.
- [ ] **Step 3: Implement minimal webhook** yang memvalidasi status API, membandingkan data lokal, dan memutasi database atomik.
- [ ] **Step 4: Run test webhook** dan pastikan lulus.
- [ ] **Step 5: Commit** webhook dan sinkronisasi status.

### Task 4: UI Buyer dan workspace operasional

**Files:**
- Modify: `components/buyer/fixed-price-buy-button.tsx`
- Modify: `components/buyer/purchase-workflow.tsx`
- Modify: `components/pages/admin-pages.tsx`
- Modify: `components/pages/admin-marketing-pages.tsx`
- Modify: `components/pages/user-dashboard-page.tsx`
- Test: `tests/fixed-price-buy-button.test.tsx`
- Test: `tests/purchase-workflow.test.tsx`

**Interfaces:**
- Consumes URL redirect Snap dari checkout API.
- Produces UI pembayaran Midtrans untuk Buyer serta status otomatis tanpa tindakan verifikasi bukti Harga Tetap pada Admin Unit.

- [ ] **Step 1: Write failing UI tests** untuk token Snap, callback yang hanya refresh halaman, dan ketiadaan tombol verifikasi bukti pada transaksi Midtrans.
- [ ] **Step 2: Run UI tests** dan pastikan gagal.
- [ ] **Step 3: Implement UI minimal** untuk redirect Snap Sandbox, fallback konfigurasi, serta label status lintas peran.
- [ ] **Step 4: Run UI tests** dan pastikan lulus.
- [ ] **Step 5: Commit** perubahan antarmuka.

### Task 5: Verifikasi akhir dan pengiriman

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-09-02-midtrans-fixed-price-design.md`

- [ ] **Step 1: Dokumentasikan** environment variable dan setup Notification URL Sandbox.
- [ ] **Step 2: Run test fokus** seluruh test Midtrans, checkout, Buyer, Admin Unit, dan Superadmin.
- [ ] **Step 3: Run** `npm run build`.
- [ ] **Step 4: Review diff** terhadap `codex/baseline-current-web-2026-09-02`, perbaiki temuan penting, lalu commit dan push branch.
