# Backend Superadmin End-to-End dengan Integrasi Frontend, PostgreSQL, dan Role Auth

Tanggal: 2026-04-23  
Proyek: Prototipe Pegadaian Lelang  
Area: Backend dan Integrasi Frontend Superadmin

## Tujuan

Membangun backend `superadmin` yang benar-benar terhubung ke:

- session auth role `super_admin`
- database PostgreSQL melalui Drizzle ORM
- halaman frontend `superadmin` yang sudah ada

Scope fitur mengikuti `PRD.md`, dengan fokus pada area:

- dashboard global superadmin
- CRUD unit
- kelola rekening bank per unit
- CRUD akun admin unit
- monitoring global lintas unit
- blacklist global dan aksi cabut blacklist lebih awal

Hasil akhirnya bukan hanya route API tersedia, tetapi halaman superadmin juga harus membaca dan mengubah data nyata dari database.

## Kesesuaian dengan PRD

PRD menetapkan bahwa `Super Admin` memiliki kapabilitas:

- CRUD unit Pegadaian
- CRUD akun Admin Unit
- mengelola rekening bank per unit
- monitoring global semua barang, transaksi, dan lelang lintas unit
- melihat dan mengelola blacklist global lintas unit, termasuk cabut blokir lebih awal

PRD juga menetapkan bahwa:

- akun `admin_unit` dibuat oleh `superadmin`
- `rekening_unit` dikelola per unit, bukan per akun admin
- satu unit boleh memiliki lebih dari satu rekening
- hanya satu rekening yang aktif pada satu waktu
- aksi blacklist superadmin harus tercatat
- route `superadmin` harus dilindungi role `super_admin`

Semua poin itu menjadi aturan inti desain ini.

## Pendekatan yang Dipilih

### Domain-Service First

Backend superadmin dibangun dengan pemisahan service per domain, lalu route handler hanya menjadi lapisan tipis untuk:

- otorisasi session
- validasi request
- pemanggilan service
- pembentukan response

Pendekatan ini dipilih karena paling sesuai dengan PRD bagian maintainability dan paling aman untuk integrasi frontend-backend.

### Alasan Pemilihan

- service layer lebih mudah diuji dan di-debug
- route API tidak menampung business logic besar
- frontend superadmin lebih mudah disambungkan ke response yang konsisten
- mudah diperluas ke domain admin unit dan monitoring sistem secara menyeluruh

## Outcome yang Diinginkan

Setelah tahap ini selesai:

- session `super_admin` dapat mengakses seluruh halaman dan route `superadmin`
- role lain tidak dapat mengakses area dan API `superadmin`
- data unit, rekening, admin unit, monitoring, dan blacklist tidak lagi bergantung pada mock
- frontend `superadmin` membaca data dari database nyata
- aksi create/update/delete penting tercermin di PostgreSQL
- fitur create admin unit menghasilkan akun yang bisa login dengan password sementara
- aksi pengelolaan rekening menjaga aturan satu rekening aktif per unit
- aksi cabut blacklist mengubah data dan menulis audit log

## Arsitektur

### Lapisan Sistem

1. **Frontend Superadmin**
   - halaman di `app/superadmin/*`
   - komponen tampilan di `components/pages/superadmin-pages.tsx`
   - melakukan fetch ke endpoint `api/superadmin/*`

2. **Route Handler**
   - berada di `app/api/superadmin/*`
   - memeriksa session dan role
   - memvalidasi input
   - memanggil service domain

3. **Service Layer**
   - `lib/services/unit.service.ts`
   - `lib/services/rekening-unit.service.ts`
   - `lib/services/admin-unit.service.ts`
   - `lib/services/monitoring.service.ts`
   - `lib/services/blacklist.service.ts`

4. **Database Layer**
   - schema baru dan lama dikelola via Drizzle
   - PostgreSQL menjadi sumber data tunggal

### Auth dan Role Guard

Proteksi route mengikuti fondasi auth yang sudah ada:

- semua route `api/superadmin/*` memakai session Better Auth
- helper role-aware di `lib/auth/session.ts` dipakai ulang
- user tanpa session -> `401`
- session valid tapi role bukan `super_admin` -> `403`

Untuk halaman frontend:

- layout `app/superadmin/layout.tsx` tetap memakai session role `super_admin`
- jika role salah, user diarahkan ke home path role masing-masing

## Model Data

### Tabel `units`

Tabel baru untuk merepresentasikan unit Pegadaian.

Field minimal:

- `id`
- `kode_unit`
- `nama_unit`
- `alamat`
- `is_aktif`
- `created_at`
- `updated_at`

Aturan:

- `kode_unit` unik
- unit tidak dihapus keras dalam alur normal; status `is_aktif` dipakai untuk nonaktif

### Tabel `rekening_unit`

Tabel baru untuk rekening pembayaran milik unit.

Field:

- `id`
- `unit_id`
- `nama_bank`
- `nomor_rekening`
- `nama_pemilik_rekening`
- `is_aktif`
- `created_at`
- `updated_at`

Aturan:

- satu unit boleh memiliki banyak rekening
- satu rekening hanya milik satu unit
- hanya satu rekening aktif per unit
- saat rekening baru diaktifkan, rekening aktif lama otomatis nonaktif

Constraint penting:

```sql
CREATE UNIQUE INDEX rekening_unit_satu_aktif_per_unit
ON rekening_unit (unit_id)
WHERE is_aktif = TRUE;
```

### Tabel `users`

Tabel auth yang sudah ada dipakai ulang untuk semua role:

- `buyer`
- `admin_unit`
- `super_admin`

Pemakaian untuk admin unit:

- `role = 'admin_unit'`
- `unit_id` wajib terisi
- `is_aktif` dipakai untuk nonaktifkan akun tanpa menghapus historinya

Catatan:

- bila field `unit_id` dan `is_aktif` belum ada pada schema auth saat ini, keduanya akan ditambahkan lewat migrasi Drizzle

### Tabel `blacklist`

Tabel domain blacklist akan ditambahkan agar sesuai PRD.

Field inti:

- `id`
- `user_id`
- `total_pelanggaran`
- `is_aktif`
- `tanggal_blokir_mulai`
- `tanggal_blokir_selesai`
- `dicabut_oleh`
- `alasan_pencabutan`
- `updated_at`

### Tabel `log_blacklist_action`

Audit trail untuk aksi blacklist.

Field inti:

- `id`
- `blacklist_id`
- `target_user_id`
- `aksi`
- `dilakukan_oleh`
- `keterangan`
- `created_at`

Nilai `aksi` yang dipakai untuk scope ini:

- `cabut_manual`

### Data Monitoring

Monitoring global tidak membutuhkan tabel baru terpisah.

Data dibentuk dari query agregasi lintas:

- `units`
- `users`
- `rekening_unit`
- `blacklist`
- tabel operasional lain yang sudah ada atau masih mock-backed sementara

Untuk tahap ini, bila domain `barang` dan `transaksi` belum sepenuhnya bermigrasi ke backend nyata, monitoring akan:

- memakai data nyata untuk `unit`, `admin`, `rekening`, `blacklist`
- memakai agregasi dari domain yang sudah tersedia di database
- mempertahankan fallback yang eksplisit hanya jika ada bagian PRD yang belum memiliki tabel nyata

## Endpoint API

### Unit

- `GET /api/superadmin/unit`
  - daftar seluruh unit
- `POST /api/superadmin/unit`
  - tambah unit baru
- `GET /api/superadmin/unit/[id]`
  - detail unit
- `PUT /api/superadmin/unit/[id]`
  - edit unit
- `DELETE /api/superadmin/unit/[id]`
  - nonaktifkan unit

### Rekening Unit

- `GET /api/superadmin/unit/[id]/rekening`
  - daftar rekening unit
- `POST /api/superadmin/unit/[id]/rekening`
  - tambah rekening baru
- `PUT /api/superadmin/unit/[id]/rekening/[rid]`
  - edit rekening
  - set rekening aktif
  - nonaktifkan rekening

### Admin Unit

- `GET /api/superadmin/admin`
  - daftar akun admin unit
- `POST /api/superadmin/admin`
  - buat akun admin unit baru
- `GET /api/superadmin/admin/[id]`
  - detail akun admin
- `PUT /api/superadmin/admin/[id]`
  - edit data admin
- `DELETE /api/superadmin/admin/[id]`
  - nonaktifkan akun admin

### Monitoring

- `GET /api/superadmin/monitoring`
  - KPI global
  - ringkasan unit
  - antrian perhatian utama

### Blacklist

- `GET /api/superadmin/blacklist`
  - daftar blacklist global lintas unit
- `POST /api/superadmin/blacklist/[userId]/cabut`
  - cabut blacklist lebih awal

### Auth Support

Tidak membuat login route baru.

Login tetap memakai halaman dan endpoint auth yang sudah ada.  
Yang berubah adalah:

- login role-aware redirect
- route `superadmin` memakai proteksi session server-side

## Integrasi Frontend

### `/superadmin`

Halaman dashboard global akan membaca:

- jumlah unit aktif
- jumlah admin unit aktif
- jumlah rekening aktif
- jumlah blacklist aktif
- ringkasan monitoring

Data diambil dari `GET /api/superadmin/monitoring`.

### `/superadmin/unit`

Halaman daftar unit akan:

- fetch daftar unit dari `GET /api/superadmin/unit`
- submit form tambah unit ke `POST /api/superadmin/unit`
- memakai data nyata setelah create/update

### `/superadmin/unit/[id]`

Halaman detail unit akan membaca:

- informasi identitas unit
- rekening aktif
- jumlah admin unit
- ringkasan operasional singkat

Data diambil dari `GET /api/superadmin/unit/[id]`.

### `/superadmin/unit/[id]/rekening`

Halaman rekening unit akan:

- fetch seluruh rekening unit
- tambah rekening baru
- edit rekening
- aktifkan rekening tertentu
- nonaktifkan rekening

Semua aksi tersambung ke endpoint rekening unit.

### `/superadmin/admin`

Halaman admin unit akan:

- fetch daftar admin
- tambah admin baru dengan:
  - nama
  - email
  - unit
  - password sementara
- edit unit dan status aktif admin
- nonaktifkan admin

Setelah create berhasil, akun harus langsung bisa login lewat `/login`.

### `/superadmin/monitoring`

Halaman monitoring akan:

- fetch data read-only dari `GET /api/superadmin/monitoring`
- tidak mengubah data secara langsung

### `/superadmin/blacklist`

Halaman blacklist akan:

- fetch blacklist global
- menampilkan alasan, durasi, dan unit terkait
- submit form cabut blacklist ke endpoint `cabut`

## Validasi Bisnis

### Unit

- `kode_unit` wajib unik
- `nama_unit` wajib terisi
- unit yang masih dipakai admin tidak dihapus keras

### Rekening Unit

- `nama_bank`, `nomor_rekening`, `nama_pemilik_rekening` wajib terisi
- unit harus valid
- satu unit boleh punya banyak rekening
- satu unit hanya satu rekening aktif
- aktivasi rekening baru harus menonaktifkan rekening aktif sebelumnya dalam satu transaksi database

### Admin Unit

- email wajib unik
- unit wajib ada
- password sementara wajib valid
- role selalu diset `admin_unit`
- admin dinonaktifkan dengan `is_aktif = false`, bukan hard delete

### Blacklist

- hanya blacklist aktif yang bisa dicabut
- alasan pencabutan wajib diisi
- aksi cabut harus memperbarui record blacklist dan menulis `log_blacklist_action`

## Error Handling

Response error yang dipakai konsisten:

- `400` request invalid
- `401` belum login
- `403` role bukan `super_admin`
- `404` data tidak ditemukan
- `409` konflik bisnis seperti email sudah dipakai atau konflik rekening aktif

Format response minimal:

```json
{
  "message": "Penjelasan error yang aman ditampilkan ke UI"
}
```

## Strategi Debugging

Karena targetnya integrasi frontend-backend-database, debugging tidak akan dilakukan dengan trial and error.

Urutan debugging yang dipakai:

1. cek payload request dari frontend
2. cek response status dan body API
3. cek log server route handler
4. cek hasil query service
5. cek isi tabel PostgreSQL

Untuk masalah integrasi:

- jika tombol frontend gagal, verifikasi dimulai dari network request
- jika API gagal, verifikasi dilanjutkan ke service dan query
- jika data tidak muncul, verifikasi dilakukan sampai isi tabel database

## Verifikasi End-to-End

Verifikasi yang wajib dijalankan setelah implementasi:

1. login sebagai `super_admin`
2. `GET /api/superadmin/unit` berhasil
3. tambah unit baru dari UI dan pastikan record masuk ke tabel `units`
4. tambah rekening baru dan pastikan record masuk ke `rekening_unit`
5. aktifkan rekening baru dan pastikan rekening aktif sebelumnya nonaktif
6. buat akun admin unit dan pastikan:
   - row user terbentuk
   - role = `admin_unit`
   - `unit_id` benar
   - admin bisa login
   - login mengarah ke `/admin`
7. buka halaman monitoring dan pastikan response berasal dari query backend
8. buka halaman blacklist dan cabut blacklist aktif
9. pastikan perubahan blacklist masuk ke tabel `blacklist`
10. pastikan audit aksi masuk ke `log_blacklist_action`
11. pastikan `buyer` dan `admin_unit` ditolak dari route `api/superadmin/*`

## Batasan Tahap Ini

Tahap ini fokus pada domain superadmin.

Out of scope untuk iterasi ini:

- email pengiriman kredensial admin unit
- reset password mandiri admin unit
- notifikasi real-time
- cron dan domain lelang penuh
- refactor domain lain di luar kebutuhan superadmin

## Deliverable

Deliverable implementasi yang diharapkan:

- schema dan migrasi Drizzle untuk domain superadmin
- service layer superadmin
- route `api/superadmin/*` yang berjalan
- integrasi halaman superadmin ke API nyata
- verifikasi HTTP dan PostgreSQL bahwa fitur bekerja
- akun admin unit hasil create bisa login dengan password sementara

