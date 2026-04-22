# Backend Auth Pembeli dengan Better Auth, Drizzle, dan PostgreSQL

Tanggal: 2026-04-23  
Proyek: Prototipe Pegadaian Lelang  
Area: Backend Register dan Login Pembeli

## Tujuan

Membangun backend autentikasi yang fokus pada dua alur pembeli:

- registrasi mandiri pembeli
- login pembeli menggunakan email dan password

Implementasi harus memakai:

- PostgreSQL sebagai database utama
- Drizzle ORM untuk schema, migrasi, dan akses database
- Better Auth sebagai sistem autentikasi
- session cookie bawaan Better Auth sebagai mekanisme sesi yang aman

Scope sengaja dibatasi agar fondasi auth benar lebih dulu sebelum menambah role admin atau super admin.

## Kesesuaian dengan PRD

PRD menyebutkan bahwa:

- pembeli melakukan registrasi mandiri
- data registrasi pembeli mencakup nama lengkap, email, nomor telepon, password, dan nomor KTP
- pembeli login dengan email dan password
- admin unit dan super admin tidak register sendiri

Untuk bagian sesi, PRD menyebut `JWT di httpOnly cookie`. Pada implementasi tahap ini, sistem akan memakai session cookie aman bawaan Better Auth. Secara tujuan keamanan dan UX, pendekatan ini tetap memenuhi kebutuhan inti PRD dan lebih tepat secara teknis untuk fondasi awal.

## Pendekatan yang Dipilih

### Better Auth Native Session

Better Auth menjadi pusat alur register, login, session, dan logout.  
Drizzle dipakai untuk schema dan adapter database.  
PostgreSQL menjadi sumber data tunggal.

### Alasan Pemilihan

- paling sedikit kode auth kustom
- lebih aman dan lebih mudah dirawat
- tidak menduplikasi logika session
- cocok untuk Next.js full stack
- mempermudah perluasan nanti ke admin unit dan super admin

## Outcome yang Diinginkan

Setelah tahap ini selesai:

- pembeli bisa daftar dari `/register`
- pembeli bisa login dari `/login`
- sesi aktif tersimpan di cookie httpOnly Better Auth
- user yang sudah login bisa dikenali dari server
- data profil pembeli yang dibutuhkan PRD tersimpan di database
- struktur auth siap diperluas ke role lain tanpa bongkar fondasi

## Arsitektur

### Lapisan Sistem

1. **UI Form**
   - halaman `login` dan `register` yang sudah ada akan dikaitkan ke backend nyata
   - validasi dasar tetap ada di client, tetapi validasi final dilakukan di server

2. **Auth Layer**
   - Better Auth menangani:
     - sign up
     - sign in
     - session management
     - cookie management

3. **Database Layer**
   - Drizzle mengelola schema auth dan schema profil pembeli
   - PostgreSQL menyimpan user, session, account, verification, dan profil pembeli

4. **Server Integration**
   - route auth Better Auth disediakan via App Router
   - util server disiapkan untuk membaca session user dari request

## Model Data

### Tabel Auth

Better Auth akan membutuhkan tabel inti untuk autentikasi. Nama tabel mengikuti kebutuhan Better Auth dan adapter Drizzle yang dipakai saat implementasi. Secara konsep, tabel ini mencakup:

- `user`
- `session`
- `account`
- `verification`

### Tabel Profil Pembeli

Di luar tabel auth inti, dibutuhkan tabel profil pembeli agar field PRD tetap jelas dan tidak bercampur dengan field auth generik.

Nama tabel yang direkomendasikan:

- `buyer_profiles`

Field yang disimpan:

- `id`
- `user_id`
- `full_name`
- `phone_number`
- `ktp_number`
- `role`
- `created_at`
- `updated_at`

### Aturan Data

- `email` harus unik
- `phone_number` wajib diisi saat register
- `ktp_number` wajib diisi saat register
- `role` untuk scope ini bernilai tetap `buyer`
- relasi `buyer_profiles.user_id -> user.id`

## Workflow Register

1. User membuka `/register`
2. User mengisi:
   - nama lengkap
   - email
   - nomor telepon
   - nomor KTP
   - password
3. Server memvalidasi:
   - semua field wajib terisi
   - email valid
   - password minimal 8 karakter
   - email belum dipakai
4. Better Auth membuat user auth
5. Sistem membuat `buyer_profile` untuk user tersebut
6. Session login bisa langsung dibuat setelah register berhasil
7. User diarahkan ke area buyer

### Catatan Register

Untuk tahap ini, registrasi hanya untuk pembeli. Tidak ada jalur register untuk admin unit atau super admin.

## Workflow Login

1. User membuka `/login`
2. User mengisi email dan password
3. Better Auth memverifikasi kredensial
4. Jika valid, Better Auth membuat session cookie httpOnly
5. User diarahkan ke area buyer

## Session dan Akses

### Mekanisme Session

- session dikelola oleh Better Auth
- cookie bersifat httpOnly
- akses ke halaman buyer nantinya dapat memakai pengecekan session server-side

### Role

Untuk tahap ini:

- hanya role `buyer` yang diaktifkan
- admin unit dan super admin belum ikut login aktif

Namun desain database harus tetap memungkinkan penambahan role lain kemudian.

## Struktur File yang Direkomendasikan

Berikut unit utama yang perlu ada setelah implementasi:

- `drizzle.config.ts`
- `.env` atau `.env.local` untuk koneksi database dan secret auth
- `lib/db.ts` untuk koneksi PostgreSQL + Drizzle
- `lib/db/schema/*.ts` untuk schema auth dan buyer profile
- `lib/auth.ts` untuk konfigurasi Better Auth
- `app/api/auth/[...all]/route.ts` untuk endpoint Better Auth
- util server untuk membaca session user aktif

Jika integrasi form memerlukan action server atau API wrapper tambahan, unit tersebut harus tetap dipisahkan dengan tanggung jawab yang jelas.

## Integrasi ke Frontend yang Sudah Ada

Frontend `login/register` yang saat ini masih statis akan dihubungkan ke backend auth nyata.

Yang perlu berubah di level UI:

- form register mengirim data ke backend register
- form login mengirim data ke backend login
- error message ditampilkan lebih jelas bila email sudah dipakai, password salah, atau field belum lengkap
- sukses login/register mengarahkan ke buyer area

Yang belum perlu di tahap ini:

- lupa password
- verifikasi email
- social login
- dashboard role-based untuk admin

## Error Handling

Sistem harus menangani minimal kondisi berikut:

- email sudah terdaftar saat register
- password kurang dari 8 karakter
- field wajib kosong
- email atau password salah saat login
- kegagalan koneksi database
- session gagal dibuat

Prinsip respons:

- pesan cukup jelas untuk user
- detail teknis tidak dibocorkan ke UI
- log error tetap cukup untuk debugging developer

## Verifikasi

Setelah implementasi, minimal harus bisa diverifikasi bahwa:

- migrasi database bisa dibuat dan dijalankan
- tabel auth dan `buyer_profiles` terbentuk
- register pembeli berhasil
- login pembeli berhasil
- session cookie terbentuk
- route buyer mengenali user yang sudah login
- register gagal jika email sudah dipakai
- login gagal jika password salah

## Scope Guard

Pekerjaan ini hanya mencakup:

- fondasi PostgreSQL
- setup Drizzle
- setup Better Auth
- register pembeli
- login pembeli
- session pembeli

Pekerjaan ini tidak mencakup:

- login admin unit
- login super admin
- CRUD akun admin oleh super admin
- blacklist logic
- forgot password
- email verification
- RBAC penuh lintas role
