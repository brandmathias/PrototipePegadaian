# Cross-Role Transaction Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menyatukan data transaksi dan perilaku UI buyer, admin unit, serta superadmin sesuai desain integrasi lintas peran.

**Architecture:** Sumber data diperbaiki di service/serializer terlebih dahulu, lalu komponen bersama digunakan untuk progres transaksi dan dokumentasi penyerahan. Perubahan tampilan admin serta superadmin dibuat paralel dengan struktur yang sama, sementara wishlist dan navigasi aktif diperbaiki pada komponen shell masing-masing.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS 3, Drizzle ORM, PostgreSQL.

---

### Task 1: Sinkronisasi Identitas Buyer

**Files:**
- Modify: `lib/services/admin-pemasaran.service.ts`
- Modify: `lib/services/admin-transaction.service.ts`
- Modify: `lib/services/buyer.service.ts`

- [x] Pastikan seluruh query transaksi dan pemasaran membaca nama, email, serta telepon terkini dari tabel `user`.
- [x] Hilangkan fallback profil buyer untuk email pada permukaan admin bila menyebabkan nilai lama menang atas akun terbaru.
- [x] Periksa serializer buyer menggunakan profil terbaru setelah perubahan akun.

### Task 2: Progres Transaksi Bersama dan Audit Waktu

**Files:**
- Modify: `components/shared/payment-workflow-rail.tsx`
- Modify: `components/pages/user-pages.tsx`
- Modify: `components/pages/admin-transaction-pages.tsx`
- Modify: `components/pages/admin-marketing-pages.tsx`
- Modify: `components/pages/superadmin-pages.tsx`
- Modify: `app/globals.css`

- [x] Tambahkan waktu kejadian ke model tahap progres.
- [x] Ganti redaksi `Workflow` menjadi `Alur` dan `Selesai & Nota` menjadi `Selesai`.
- [x] Gunakan presentasi progres yang sama pada admin unit dan superadmin.
- [x] Tambahkan animasi status yang ringan serta fallback reduced-motion.

### Task 3: Bukti Penyerahan pada Detail Pemasaran Admin

**Files:**
- Modify: `components/pages/admin-marketing-pages.tsx`

- [x] Render `HandoverProofUploadForm` pada workspace pemenang lelang admin.
- [x] Batasi unggah sampai pembayaran terverifikasi.
- [x] Pertahankan `HandoverProofCard` read-only pada superadmin.

### Task 4: Perapian Mekanisme Lelang dan Ranking

**Files:**
- Modify: `components/pages/admin-marketing-pages.tsx`
- Modify: `components/pages/superadmin-pages.tsx`

- [x] Hapus elipsis nominal dan gunakan kelas ukuran responsif berdasarkan panjang angka.
- [x] Pastikan nominal tidak membungkus pada angka ratusan juta atau lebih.
- [x] Hapus kolom serta data Member ID dari semua ranking table aktif dan arsip.
- [x] Redistribusikan colgroup agar tabel tetap rapi.

### Task 5: Wishlist Tidak Tersedia

**Files:**
- Modify: `components/pages/wishlist-page.tsx`
- Modify: `app/globals.css`

- [x] Render `unavailableItems` dalam bagian khusus.
- [x] Gunakan kartu muted dengan alasan ketidaktersediaan.
- [x] Hilangkan aksi pembelian/lelang dan pertahankan aksi hapus wishlist.

### Task 6: Navigasi Aktif Lintas Role

**Files:**
- Modify: `components/layout/dashboard-shell.tsx`
- Modify: `components/layout/buyer-top-nav.tsx`

- [x] Tambahkan resolver route aktif untuk detail unit superadmin.
- [x] Pastikan detail transaksi buyer menyorot Transaksi.
- [x] Pastikan detail pemasaran admin menyorot Pemasaran.

### Task 7: Checklist Harian dan Redaksi Validasi

**Files:**
- Modify: `components/pages/admin-dashboard-checklist-card.tsx`
- Modify: `components/pages/user-pages.tsx`
- Modify: `components/pages/admin-transaction-pages.tsx`
- Modify: `components/pages/admin-marketing-pages.tsx`

- [x] Simpan kunci tanggal Makassar dan reset saat kalender berganti.
- [x] Perbaiki status validasi agar tidak menyebut pembayaran tertahan ketika pembayaran sudah sah.
- [x] Bedakan pembatasan akun dari syarat bukti penyerahan.

### Task 8: Hapus Cetak Ringkasan

**Files:**
- Modify: `components/pages/user-pages.tsx`
- Modify: `components/pages/admin-marketing-pages.tsx`
- Modify: `components/pages/superadmin-pages.tsx`

- [x] Hapus seluruh tombol `Cetak Ringkasan` dan `Cetak Ringkasan Lelang`.
- [x] Pertahankan seluruh tombol `Cetak Nota`.

### Task 9: Verifikasi dan Publikasi

**Files:**
- Inspect all modified files.

- [x] Jalankan pencarian manual untuk redaksi/kolom/tombol yang harus hilang.
- [x] Jalankan `npx tsc --noEmit --pretty false`.
- [x] Jalankan ESLint pada file yang berubah.
- [x] Jalankan `npm run build`.
- [x] Periksa `git diff --check` dan status.
- [x] Commit seluruh perubahan dengan pesan integrasi lintas peran.
- [x] Push branch `master` ke `origin`.
