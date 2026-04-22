# Buyer Auth Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan backend register dan login pembeli dengan Better Auth, Drizzle ORM, dan PostgreSQL, lalu menghubungkannya ke form auth yang sudah ada.

**Architecture:** Better Auth menjadi pusat autentikasi berbasis email/password dan session cookie httpOnly. Drizzle mengelola schema PostgreSQL untuk tabel auth dan profil pembeli, sementara App Router Next.js menyediakan route auth dan integrasi form melalui server actions atau handler terfokus.

**Tech Stack:** Next.js App Router, TypeScript, Better Auth, Drizzle ORM, drizzle-kit, PostgreSQL, pg, Vitest

---

### Task 1: Pasang fondasi package dan environment auth

**Files:**
- Modify: `C:\Users\Asus\Downloads\PrototipePegadaian\package.json`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\drizzle.config.ts`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\.env.example`

- [ ] Tambahkan dependency backend inti: `better-auth`, `drizzle-orm`, `pg`, dan dependency dev `drizzle-kit`, `@types/pg`.
- [ ] Buat `drizzle.config.ts` untuk output migrasi dan schema path.
- [ ] Tambahkan `.env.example` minimal untuk `DATABASE_URL` dan `BETTER_AUTH_SECRET`.

### Task 2: Buat database layer dan schema auth pembeli

**Files:**
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\lib\db\client.ts`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\lib\db\schema\auth.ts`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\lib\db\schema\buyer-profile.ts`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\lib\db\schema\index.ts`

- [ ] Inisialisasi pool PostgreSQL dan instance Drizzle.
- [ ] Definisikan tabel auth yang dibutuhkan Better Auth.
- [ ] Definisikan tabel `buyerProfiles` untuk `fullName`, `phoneNumber`, `ktpNumber`, dan `role`.
- [ ] Ekspor schema terpusat agar bisa dipakai oleh Drizzle dan Better Auth.

### Task 3: Tambahkan util validasi register pembeli dengan TDD

**Files:**
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\lib\auth\buyer-auth-validation.ts`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\tests\buyer-auth-validation.test.ts`

- [ ] Tulis test gagal untuk validasi register:
  - email wajib valid
  - password minimal 8 karakter
  - semua field buyer wajib ada
- [ ] Jalankan test spesifik hingga gagal dengan alasan yang benar.
- [ ] Implementasikan util validasi minimum sampai test lulus.
- [ ] Jalankan ulang test spesifik untuk memastikan hijau.

### Task 4: Konfigurasi Better Auth dan route handler

**Files:**
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\lib\auth.ts`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\lib\auth-client.ts`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\app\api\auth\[...all]\route.ts`

- [ ] Konfigurasikan Better Auth dengan `emailAndPassword.enabled = true`.
- [ ] Hubungkan Better Auth ke Drizzle adapter untuk provider `pg`.
- [ ] Pastikan route App Router `/api/auth/[...all]` aktif.
- [ ] Buat auth client untuk dipakai oleh form React.

### Task 5: Tambahkan hook pembuatan profil pembeli saat register

**Files:**
- Modify: `C:\Users\Asus\Downloads\PrototipePegadaian\lib\auth.ts`
- Potential helper create: `C:\Users\Asus\Downloads\PrototipePegadaian\lib\auth\buyer-profile-service.ts`

- [ ] Sambungkan proses sign-up agar setelah user auth dibuat, profil pembeli ikut tersimpan.
- [ ] Tetapkan role awal sebagai `buyer`.
- [ ] Pastikan email tetap unik di level auth dan user tidak tercipta ganda.

### Task 6: Hubungkan form register dan login ke backend nyata

**Files:**
- Modify: `C:\Users\Asus\Downloads\PrototipePegadaian\components\pages\public-pages.tsx`
- Potential create: `C:\Users\Asus\Downloads\PrototipePegadaian\components\auth\login-form.tsx`
- Potential create: `C:\Users\Asus\Downloads\PrototipePegadaian\components\auth\register-form.tsx`

- [ ] Pisahkan form statis menjadi komponen client yang mengirim request lewat `authClient`.
- [ ] Tampilkan error user-friendly untuk email duplikat, password salah, dan field tidak valid.
- [ ] Redirect sukses login/register ke area buyer, idealnya `/dashboard`.

### Task 7: Tambahkan util session server-side

**Files:**
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\lib\auth\session.ts`

- [ ] Tambahkan util server untuk membaca session user aktif dari request headers.
- [ ] Siapkan util ini agar nanti bisa dipakai untuk proteksi route buyer.

### Task 8: Verifikasi auth flow

**Files:**
- Verify only

- [ ] Jalankan test baru `buyer-auth-validation.test.ts`.
- [ ] Jalankan route dev untuk `/login` dan `/register`.
- [ ] Verifikasi route `/api/auth/[...all]` terpasang tanpa error.
- [ ] Catat jika verifikasi penuh database tidak bisa dijalankan tanpa `DATABASE_URL` lokal yang valid.

### Task 9: Catatan residual

**Files:**
- No code change required unless issue found

- [ ] Catat bahwa login admin/superadmin belum termasuk scope.
- [ ] Catat jika error test lama di folder `tests` selain test baru masih tetap ada dan tidak terkait implementasi auth pembeli.
