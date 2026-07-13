# ERD dan Class Diagram Skripsi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menghasilkan ERD lengkap, class diagram domain, PNG siap skripsi, dan penjelasan seluruh tabel Ruang Agunan.

**Architecture:** Data diagram bersumber langsung dari enam file schema Drizzle. ERD mengelompokkan tabel menurut domain dan menggunakan relasi 1:N. Class diagram memakai kelas domain serta operasi yang benar-benar ada pada service aplikasi.

**Tech Stack:** PostgreSQL 18.4, Drizzle ORM, Excalidraw JSON, Node.js 22, SVG, PNG.

## Global Constraints

- Gunakan `lib/db/schema/*.ts` sebagai sumber nama tabel, kolom, tipe data, dan foreign key.
- Sertakan 20 tabel, termasuk Better Auth dan audit, dengan label Teknis atau Audit.
- Gunakan notasi Chen untuk ERD dan UML untuk class diagram.
- Semua teks Excalidraw memakai `fontFamily: 5`.
- Simpan output pada `docs/skripsi/diagram/`.

## File Structure

- Create: `scripts/generate-thesis-diagrams.mjs` -- dataset dan generator deterministik.
- Create: `scripts/verify-thesis-diagrams.mjs` -- validasi JSON, cakupan, dan ukuran gambar.
- Create: `docs/skripsi/diagram/erd-ruang-agunan.excalidraw` dan `erd-ruang-agunan.svg`.
- Create: `docs/skripsi/diagram/class-diagram-ruang-agunan.excalidraw` dan `class-diagram-ruang-agunan.svg`.
- Create: `docs/skripsi/diagram/erd-ruang-agunan.png` dan `class-diagram-ruang-agunan.png`.
- Create: `docs/skripsi/penjelasan-tabel-ruang-agunan.md`.

### Task 1: Buat dataset schema yang menjadi sumber tunggal

**Files:**
- Create: `scripts/generate-thesis-diagrams.mjs`
- Read: `lib/db/schema/auth.ts`, `admin.ts`, `superadmin.ts`, `buyer-profile.ts`, `buyer-wishlist.ts`, dan `notifications.ts`

- [ ] Definisikan 20 entitas dengan nama tabel, kelompok domain, kolom yang ditampilkan, dan label PK/FK.
- [ ] Definisikan seluruh relasi `references()` sebagai hubungan berlabel dan berkardinalitas 1:N atau 1:1.
- [ ] Buat mode `--check-schema` yang memverifikasi set minimal `user`, `units`, `barang`, `pemasaran`, `bids`, `transaksi`, dan `blacklist`.
- [ ] Jalankan `node scripts/generate-thesis-diagrams.mjs --check-schema`; hasil yang diharapkan: `Schema coverage OK: 20 tables`.
- [ ] Commit: `git add scripts/generate-thesis-diagrams.mjs && git commit -m "docs: define thesis diagram dataset"`.

### Task 2: Buat ERD lengkap dalam Excalidraw dan SVG

**Files:**
- Create: `docs/skripsi/diagram/erd-ruang-agunan.excalidraw`
- Create: `docs/skripsi/diagram/erd-ruang-agunan.svg`
- Modify: `scripts/generate-thesis-diagrams.mjs`

- [ ] Buat empat area: Identitas dan Otorisasi, Operasional Unit dan Aset, Pemasaran dan Transaksi, serta Kepatuhan dan Audit.
- [ ] Render setiap entitas sebagai kotak dengan atribut inti dan label `PK`/`FK`; tampilkan relasi sebagai garis berlabel dengan kardinalitas.
- [ ] Buat mode `--erd`, lalu validasi dengan `node -e "JSON.parse(require('fs').readFileSync('docs/skripsi/diagram/erd-ruang-agunan.excalidraw'))"`.
- [ ] Pastikan ERD memiliki 20 entitas dan setiap relasi FK yang ditampilkan mempunyai garis relasi.
- [ ] Commit: `git add docs/skripsi/diagram/erd-ruang-agunan.excalidraw docs/skripsi/diagram/erd-ruang-agunan.svg scripts/generate-thesis-diagrams.mjs && git commit -m "docs: add complete Ruang Agunan ERD"`.

### Task 3: Buat class diagram domain dalam Excalidraw dan SVG

**Files:**
- Create: `docs/skripsi/diagram/class-diagram-ruang-agunan.excalidraw`
- Create: `docs/skripsi/diagram/class-diagram-ruang-agunan.svg`
- Modify: `scripts/generate-thesis-diagrams.mjs`

- [ ] Tampilkan kelas `User`, `Unit`, `RekeningUnit`, `Barang`, `MediaBarang`, `Pemasaran`, `Bid`, `Transaksi`, `PelanggaranUser`, `Blacklist`, `Notification`, dan `VickreySettlementService`.
- [ ] Gunakan atribut UML seperti `- id: String` dan operasi nyata seperti `+ submitVickreyBid()`, `+ createFixedPricePurchase()`, `+ verifyAdminTransaction()`, `+ publishAdminBarang()`, serta `+ processExpiredVickreyAuctions()`.
- [ ] Buat asosiasi yang sesuai dengan relasi database dan dependency service dari `VickreySettlementService` ke `Pemasaran`, `Bid`, dan `Transaksi`.
- [ ] Validasi JSON Excalidraw dan cari nama seluruh kelas wajib dengan `rg -n "VickreySettlementService|submitVickreyBid|processExpiredVickreyAuctions" docs/skripsi/diagram/class-diagram-ruang-agunan.excalidraw`.
- [ ] Commit: `git add docs/skripsi/diagram/class-diagram-ruang-agunan.excalidraw docs/skripsi/diagram/class-diagram-ruang-agunan.svg scripts/generate-thesis-diagrams.mjs && git commit -m "docs: add Ruang Agunan class diagram"`.

### Task 4: Tulis narasi dan penjelasan seluruh tabel

**Files:**
- Create: `docs/skripsi/penjelasan-tabel-ruang-agunan.md`
- Modify: `scripts/generate-thesis-diagrams.mjs`

- [ ] Buat narasi untuk Gambar ERD dan Gambar Class Diagram dalam bahasa akademik Indonesia.
- [ ] Buat bagian inti bisnis untuk `user`, `units`, `rekening_unit`, `barang`, `media_barang`, `pemasaran`, `bids`, `transaksi`, `pelanggaran_user`, `blacklist`, `buyer_wishlist`, dan `notifications`.
- [ ] Buat bagian Teknis Better Auth untuk `session`, `account`, dan `verification`; buat bagian Audit dan Riwayat untuk tabel tersisa.
- [ ] Untuk setiap tabel, tulis paragraf fungsi dan tabel Markdown berkolom `Nama Kolom`, `Tipe Data`, dan `Keterangan`.
- [ ] Validasi seluruh judul tabel dengan `rg -n "^### Tabel" docs/skripsi/penjelasan-tabel-ruang-agunan.md`; hasil yang diharapkan: 20 bagian tabel.
- [ ] Commit: `git add docs/skripsi/penjelasan-tabel-ruang-agunan.md scripts/generate-thesis-diagrams.mjs && git commit -m "docs: explain Ruang Agunan database tables"`.

### Task 5: Render PNG dan periksa hasil visual

**Files:**
- Create: `docs/skripsi/diagram/erd-ruang-agunan.png`
- Create: `docs/skripsi/diagram/class-diagram-ruang-agunan.png`
- Read: semua berkas SVG dan Excalidraw dari Task 2 dan Task 3

- [ ] Render kedua SVG ke PNG lanskap berukuran minimal 2400 x 1350 piksel menggunakan renderer SVG yang tersedia.
- [ ] Periksa ukuran dengan `node scripts/verify-thesis-diagrams.mjs --images`; hasil yang diharapkan: `Image dimensions OK: 2400x1350`.
- [ ] Tinjau PNG secara visual: tidak ada teks bertumpuk, label PK/FK terbaca, dan garis relasi tidak menimpa isi tabel.
- [ ] Commit: `git add docs/skripsi/diagram/erd-ruang-agunan.png docs/skripsi/diagram/class-diagram-ruang-agunan.png scripts/verify-thesis-diagrams.mjs && git commit -m "docs: render thesis diagrams for report"`.

## Plan Self-Review

- Task 1 menjamin kesesuaian schema.
- Task 2 menghasilkan ERD Chen lengkap.
- Task 3 menghasilkan class diagram UML berdasarkan domain dan service nyata.
- Task 4 menghasilkan penjelasan tabel inti, teknis, dan audit.
- Task 5 menghasilkan gambar yang siap disisipkan dalam skripsi.
