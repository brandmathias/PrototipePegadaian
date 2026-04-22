# Buyer Session Guard Design

**Date:** 2026-04-23
**Scope:** Proteksi session untuk area akun pembeli (`/dashboard`, `/transaksi`, `/profil`) menggunakan Better Auth yang sudah aktif.

## Goal

Mengubah area buyer dari mock login menjadi area privat yang benar-benar membaca session Better Auth. Guest yang mencoba masuk ke route akun harus diarahkan ke login, lalu setelah berhasil masuk dikembalikan ke halaman tujuan semula.

## Recommended Approach

Gunakan **server-side route guard** di `app/(user)/layout.tsx` sebagai satu pintu masuk untuk seluruh halaman buyer. Layout membaca session lewat Better Auth, memverifikasi role `buyer`, lalu:

- jika tidak ada session: redirect ke `/login?next=<path>`
- jika ada session tapi bukan `buyer`: redirect ke `/login`
- jika session valid: teruskan data session ke shell buyer dan halaman akun

Pendekatan ini lebih baik daripada guard per halaman karena alurnya konsisten, lebih sedikit duplikasi, dan mudah dipakai ulang nanti untuk area admin/superadmin.

## Behavior

### 1. Route privat buyer

Route berikut dianggap privat:

- `/dashboard`
- `/transaksi`
- `/transaksi/[id]`
- `/transaksi/[id]/nota`
- `/profil`
- `/riwayat-bid` jika route lama masih dipertahankan

### 2. Redirect guest

Jika guest membuka route privat buyer, sistem membuat redirect ke:

- `/login?next=/dashboard`
- `/login?next=/transaksi`
- dan seterusnya

Nilai `next` hanya boleh berupa path internal agar tidak membuka celah open redirect.

### 3. Redirect setelah login

Setelah login berhasil:

- jika ada `next` yang valid, arahkan ke path tersebut
- jika tidak ada `next`, default ke `/dashboard`

Register buyer mengikuti logika yang sama agar alur pertama kali masuk juga tetap mulus.

### 4. Session-backed buyer shell

`BuyerShell` tidak lagi mengambil identitas utama dari mock `userSummary` untuk nama akun. Shell menerima data user dari session server:

- nama user
- email
- role

Data tambahan buyer yang belum diambil dari database profile tetap bisa memakai mock sementara bila hanya untuk konten demonstratif non-auth.

## Data Flow

1. Request masuk ke route di `app/(user)`
2. Layout memanggil helper session Better Auth di server
3. Session diverifikasi:
   - tidak ada -> redirect login dengan `next`
   - role bukan buyer -> redirect login
   - valid -> render buyer shell
4. Buyer shell menerima user session dan menampilkan identitas yang benar
5. Form login/register membaca `next` dari query param dan melakukan redirect setelah sukses

## Files to Touch

- Modify: `C:\Users\Asus\Downloads\PrototipePegadaian\app\(user)\layout.tsx`
- Modify: `C:\Users\Asus\Downloads\PrototipePegadaian\components\layout\buyer-shell.tsx`
- Modify: `C:\Users\Asus\Downloads\PrototipePegadaian\components\auth\login-form.tsx`
- Modify: `C:\Users\Asus\Downloads\PrototipePegadaian\components\auth\register-form.tsx`
- Create: `C:\Users\Asus\Downloads\PrototipePegadaian\lib\auth\guards.ts`
- Modify: `C:\Users\Asus\Downloads\PrototipePegadaian\lib\auth\session.ts`
- Optional cleanup: `C:\Users\Asus\Downloads\PrototipePegadaian\app\(user)\riwayat-bid\page.tsx`

## Error Handling

- session tidak ada -> redirect ke login
- session ada tapi role salah -> redirect ke login
- `next` kosong atau tidak valid -> fallback ke `/dashboard`
- jika auth backend error keras, layout tetap fail closed dan tidak membiarkan guest melihat area buyer

## Testing Strategy

- unit test untuk validator `next` path aman
- verifikasi HTTP manual:
  - guest ke `/dashboard` -> redirect ke `/login?next=/dashboard`
  - login berhasil -> kembali ke `/dashboard`
  - guest ke `/transaksi` -> redirect ke `/login?next=/transaksi`
- verifikasi visual:
  - header buyer menampilkan nama session nyata
  - login/register tetap normal

## Out of Scope

- proteksi admin dan superadmin
- refresh token flow atau session management lanjutan
- mengganti seluruh mock buyer data non-auth ke database riil
