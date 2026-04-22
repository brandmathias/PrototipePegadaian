# Public Auth Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Memisahkan pengalaman guest dan autentikasi, lalu merapikan beranda publik agar lebih sesuai workflow PRD dan lebih jelas untuk calon pembeli.

**Architecture:** Halaman publik tetap berada di route group `(public)` dengan `PublicShell`, sementara `login/register` dipindah ke route group `(auth)` dengan `AuthShell` khusus. Beranda publik direvisi agar fokus ke eksplorasi katalog, kepercayaan, dan CTA yang relevan tanpa narasi editorial yang membingungkan.

**Tech Stack:** Next.js App Router, React Server Components, Tailwind CSS, komponen UI lokal

---

### Task 1: Pisahkan shell autentikasi dari shell publik

**Files:**
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\components\layout\auth-shell.tsx`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\app\(auth)\layout.tsx`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\app\(auth)\login\page.tsx`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\app\(auth)\register\page.tsx`
- Delete: `C:\Users\Asus\Downloads\PrototipePegadaian\app\(public)\login\page.tsx`
- Delete: `C:\Users\Asus\Downloads\PrototipePegadaian\app\(public)\register\page.tsx`
- Modify: `C:\Users\Asus\Downloads\PrototipePegadaian\components\pages\public-pages.tsx`

- [ ] Tambahkan `AuthShell` dengan brand minimal, layout terpusat, dan latar yang tidak mewarisi shell publik.
- [ ] Buat route group `(auth)` untuk `login/register`.
- [ ] Arahkan halaman `login/register` baru ke komponen yang sudah ada, lalu sesuaikan struktur visual form agar terasa sebagai layar auth mandiri.
- [ ] Hapus route auth lama dari `(public)` agar tidak lagi memakai `PublicShell`.

### Task 2: Rapikan shell publik

**Files:**
- Modify: `C:\Users\Asus\Downloads\PrototipePegadaian\components\layout\public-shell.tsx`

- [ ] Pertahankan header guest sederhana: brand, `Beranda`, `Katalog`, dan tombol `Masuk`.
- [ ] Pastikan tombol `Masuk` mengarah ke route auth baru dan tidak menampilkan layout publik saat dibuka.
- [ ] Pastikan footer publik tetap hanya muncul di area guest.

### Task 3: Revisi isi beranda publik

**Files:**
- Modify: `C:\Users\Asus\Downloads\PrototipePegadaian\components\pages\home-page.tsx`
- Reuse when helpful: `C:\Users\Asus\Downloads\PrototipePegadaian\components\shared\lot-card.tsx`
- Reuse when helpful: `C:\Users\Asus\Downloads\PrototipePegadaian\components\shared\section-heading.tsx`

- [ ] Ganti hero menjadi narasi produk Pegadaian yang lebih lugas: jelajah barang, pilih beli langsung atau ikut lelang, lalu masuk bila ingin bertransaksi.
- [ ] Kurangi istilah seperti `editorial`, `Sovereign`, atau copy promosi yang tidak membantu keputusan pengguna.
- [ ] Tambahkan blok kepercayaan dan langkah singkat penggunaan untuk guest.
- [ ] Pertahankan CTA utama ke katalog dan CTA sekunder ke login.

### Task 4: Verifikasi route dan alur navigasi

**Files:**
- Verify routes only

- [ ] Cek `http://localhost:3000/`
- [ ] Cek `http://localhost:3000/katalog`
- [ ] Cek `http://localhost:3000/login`
- [ ] Cek `http://localhost:3000/register`
- [ ] Pastikan perpindahan guest -> masuk/register tidak lagi memperlihatkan shell publik penuh.

### Task 5: Catatan residual

**Files:**
- No code change required unless issue found during verification

- [ ] Catat jika masih ada route lama seperti `/riwayat-bid` yang belum dibersihkan dari workflow buyer.
- [ ] Catat jika verifikasi TypeScript masih hanya terhalang oleh error lama di folder `tests`.
