# Manajemen Superadmin Design

## Tujuan

Menambahkan area superadmin untuk mengelola dan memonitor akun superadmin lain. Fitur ini menutup asumsi bahwa hanya ada satu superadmin, sekaligus menjaga akses tertinggi tetap aman, terlacak, dan responsif di seluruh ukuran layar.

## Ruang Lingkup

- Menu baru: `Manajemen Superadmin`.
- Route halaman: `/superadmin/manajemen-superadmin`.
- Data akun tetap memakai tabel `user` dengan `role = "super_admin"`.
- Level akses baru: `owner` dan `operator`.
- Owner dapat membuat akun superadmin, mengubah level, mengaktifkan/nonaktifkan akun, dan reset password sementara.
- Operator dapat melihat halaman secara read-only.
- Akun tidak dihapus permanen; status dikelola melalui `isActive`.
- UI mengikuti bahasa visual halaman `Manajemen Unit`: hero compact, statistik, filter, tabel/list responsif, modal/form, toast, confirm dialog, dan alert bell.

## Aturan Keamanan

- Akun superadmin lama tanpa level eksplisit diperlakukan sebagai `owner` agar akses existing tidak terkunci.
- Hanya Owner aktif yang boleh melakukan aksi sensitif.
- Owner tidak boleh menonaktifkan dirinya sendiri.
- Sistem tidak boleh menyisakan 0 Owner aktif.
- Reset password sementara hanya dapat dilakukan oleh Owner.
- Perubahan level Owner/Operator harus melewati endpoint yang menjalankan guardrail di service.

## Audit Dan Notifikasi

Audit MVP dicatat hanya untuk aktivitas Manajemen Superadmin:

- membuat akun superadmin
- mengubah level Owner/Operator
- mengaktifkan atau menonaktifkan akun
- reset password sementara
- aksi ditolak karena guardrail

Notifikasi persistent dikirim ke semua Owner aktif untuk aksi sensitif. Notifikasi muncul di pusat alert/bell superadmin, memiliki badge unread, dapat ditandai dibaca, dan mengarah ke halaman Manajemen Superadmin.

## Arsitektur

- Schema:
  - tambah `user.super_admin_level`
  - tambah tabel `superadmin_account_audit_log`
- Service:
  - `lib/services/superadmin-account.service.ts` untuk list/create/update/reset/audit/notifikasi
- API:
  - `GET /api/superadmin/accounts`
  - `POST /api/superadmin/accounts`
  - `PATCH /api/superadmin/accounts/[id]`
  - `POST /api/superadmin/accounts/[id]/reset-password`
  - `GET /api/superadmin/notifikasi`
  - `PATCH /api/superadmin/notifikasi/[id]`
  - `POST /api/superadmin/notifikasi/read-all`
- UI:
  - `components/superadmin/superadmin-account-workspace.tsx`
  - page server route mengambil data real dan meneruskan `currentUserId`
- Alert:
  - perluasan hook notifikasi agar superadmin juga membaca notifikasi database, bukan hanya toast lokal

## Verifikasi

- Unit test validasi dan guardrail service.
- Route test untuk notifikasi superadmin.
- Component test untuk halaman Manajemen Superadmin.
- `npx tsc --noEmit`.
- `npm test`.
- `npm run build`.
- Browser check desktop/mobile untuk halaman baru, modal, tabel/list, dan alert bell.
