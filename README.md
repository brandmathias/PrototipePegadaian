# Ruang Agunan

> Prototype sistem informasi pengelolaan barang agunan, pemasaran Harga Tetap, dan Lelang Tertutup Vickrey untuk kebutuhan tugas akhir.

Ruang Agunan menghubungkan proses pencatatan barang agunan, masa jatuh tempo, pemasaran, transaksi, pembayaran, serah-terima, notifikasi, pelanggaran, dan monitoring lintas unit dalam satu aplikasi web.

> **Disclaimer:** ini adalah project akademik. Bukan aplikasi Pegadaian resmi, bukan layanan transaksi finansial, dan seluruh data yang dipakai bersifat simulasi.

## Ringkasan Kondisi Implementasi

| Area | Kondisi saat ini |
| --- | --- |
| Barang | Admin Unit memasukkan barang, spesifikasi kategori, media, nilai taksiran, data penggadai, dan jatuh tempo. |
| Jatuh tempo | Dipilih melalui kalender dengan jam, menit, dan detik agar dapat disimulasikan cepat. |
| Pemasaran | Barang baru bisa dipasarkan setelah jatuh tempo lewat; UI menonaktifkan tombol dan backend memvalidasi aturan yang sama. |
| Harga Tetap | Buyer transfer, mengunggah bukti, lalu Admin Unit memverifikasi atau menolak dengan alasan. |
| Lelang Tertutup | Menggunakan aturan Vickrey: bid tertinggi menang, harga akhir memakai bid tertinggi kedua. |
| Privasi bid | Bid disimpan sebagai data privat internal; UI/API menyensor nama dan nominal selama lelang aktif. Tidak menggunakan encrypted escrow pada branch utama. |
| Pembayaran lelang | Pemenang membayar langsung di unit maksimal 24 jam, kemudian dikonfirmasi Admin Unit. |
| Pelanggaran | Gagal membayar lelang dapat menghasilkan pelanggaran dan pembatasan akun bertingkat. |
| Katalog | Sesi pemasaran baru—termasuk hasil pemasaran ulang—diurutkan berdasarkan waktu publikasi baru dan tampil paling atas. |

## Peran Pengguna

### Guest

- Melihat beranda, katalog, detail barang, dan pusat bantuan.
- Tidak dapat membeli, membuat wishlist, mengirim bid, atau mengakses transaksi.

### Buyer

- Register dan login.
- Melihat katalog, detail, media, statistik lot, dan wishlist.
- Membeli barang Harga Tetap dan mengunggah bukti pembayaran.
- Mengirim satu bid per sesi Lelang Tertutup.
- Melihat transaksi, hasil lelang, nota, notifikasi, profil, dan pelanggaran pribadi.

### Admin Unit

- Mengelola barang dan media untuk unit sendiri.
- Mengatur tanggal serta waktu jatuh tempo sampai detik.
- Memasarkan barang setelah jatuh tempo.
- Mengelola Harga Tetap dan Lelang Tertutup.
- Memverifikasi bukti pembayaran, mengonfirmasi pembayaran langsung, dan mengunggah bukti serah-terima.
- Melihat riwayat barang, transaksi, pemasaran, dan pelanggaran pada scope unit.

### Superadmin

- Mengelola unit, rekening unit, Admin Unit, dan akun Superadmin.
- Memantau dashboard nasional, transaksi lintas unit, blacklist, dan kebijakan pelanggaran.

## Alur Utama

```text
Admin Unit input barang + waktu jatuh tempo
  -> masa gadai berjalan
  -> jatuh tempo lewat
  -> barang dipasarkan sebagai Harga Tetap atau Lelang Tertutup
  -> Buyer memilih beli atau mengirim bid
  -> transaksi/verifikasi/settlement diproses
  -> bukti serah-terima dan nota tersedia sesuai status
  -> Superadmin memantau data lintas unit
```

## Harga Tetap

1. Buyer memilih barang Harga Tetap.
2. Sistem membuat transaksi transfer dengan nominal dan rekening unit.
3. Buyer mengunggah bukti pembayaran JPG, PNG, atau PDF (maksimum 5 MB).
4. Admin Unit melakukan **Verifikasi Bukti Pembayaran Pembelian Barang Harga Tetap**.
5. Bukti dapat disetujui atau ditolak dengan alasan yang tercatat.
6. Setelah pembayaran terverifikasi, Admin Unit mengunggah bukti serah-terima.
7. Buyer dapat menyelesaikan transaksi dan membuka nota setelah syaratnya terpenuhi.

Jika bukti Harga Tetap ditolak, barang dapat dipasarkan kembali melalui sesi pemasaran baru. Riwayat sesi lama tetap tersimpan, sedangkan sesi baru menjadi listing terbaru di katalog.

## Lelang Tertutup Vickrey

### Aturan hasil lelang

- Buyer mengirim nominal minimal sebesar harga dasar.
- Hanya satu bid per Buyer pada satu sesi.
- Bid tertinggi yang valid menang.
- Harga akhir memakai bid tertinggi kedua.
- Bila hanya satu bid valid, harga akhir memakai harga dasar.
- Jika nominal tertinggi sama, bid yang masuk lebih awal menang.
- Tanpa bid valid, sesi gagal dan barang dapat dipasarkan ulang.

### Privasi bid saat ini

Branch utama menggunakan **bid privat di database**, bukan encrypted escrow:

- Tabel bid menyimpan nominal dan identitas bidder untuk kebutuhan internal settlement.
- Selama lelang aktif, serializer/API/UI tidak mengungkap nama penawar atau nominal ke katalog, Buyer lain, Admin Unit, maupun Superadmin.
- Setelah deadline, sistem settlement menghitung hasil dan area yang berwenang dapat melihat hasil/ranking sesuai status lelang.

Model ini melindungi alur pengguna aplikasi, tetapi **bukan enkripsi terhadap akses database langsung**. Database harus diperlakukan sebagai area internal dan hanya boleh diakses administrator infrastruktur yang berwenang. Bila kebutuhan keamanan meningkat, model escrow terenkripsi perlu dikembangkan kembali pada branch terpisah.

### Setelah lelang selesai

Cron memproses sesi yang melewati `endsAt`, menentukan pemenang serta harga akhir, dan membuat transaksi pemenang dengan batas pembayaran 24 jam. Jika pemenang tidak membayar sampai batas waktu, transaksi ditandai gagal dan sistem mencatat pelanggaran sesuai kebijakan blacklist.

## Status Penting

| Domain | Status/contoh |
| --- | --- |
| Barang | `gadai`, `jaminan`, `dipasarkan`, `menunggu_pembayaran`, `gagal`, `ditebus`, `selesai` |
| Pemasaran | `aktif`, `selesai`, `gagal`; setiap pemasaran memiliki `iteration` |
| Transaksi | `menunggu_pembayaran`, `bukti_diunggah`, `ditolak_bukti`, `menunggu_konfirmasi_langsung`, `lunas`, `selesai`, `gagal` |
| Bid | Tersimpan privat saat aktif; hasil dibuka setelah deadline/settlement |

## Fitur Tambahan

- Katalog dengan pencarian, filter, sortir, galeri media, dan statistik lot.
- Wishlist Buyer.
- Dashboard Admin Unit dan Superadmin dengan tren Harga Tetap/Lelang Tertutup.
- Notifikasi in-app dan badge belum dibaca.
- Riwayat status barang dan perpanjangan masa gadai.
- Bukti serah-terima dan nota transaksi.
- Pembatasan akun serta riwayat pelanggaran.
- Placeholder register/login memakai contoh nilai yang ringkas; spasi pada nomor telepon dan NIK dihapus saat input.

## Tech Stack

| Kategori | Teknologi |
| --- | --- |
| Framework | Next.js 15 App Router |
| UI | React 19, Tailwind CSS, lucide-react |
| Bahasa | TypeScript |
| Database | PostgreSQL |
| ORM | Drizzle ORM + `pg` |
| Autentikasi | Better Auth |
| Testing | Vitest, Testing Library |
| Cetak nota | Browser print, jsPDF, html2canvas |
| Deployment | Docker, Next.js standalone output |

## Menjalankan Project Lokal

### 1. Install dependency

```bash
npm install
```

### 2. Siapkan environment

Salin `.env.example` menjadi `.env.local`, lalu isi nilainya.

```bash
cp .env.example .env.local
```

Environment utama:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/prototipe_pegadaian
BETTER_AUTH_SECRET=buat-secret-random-minimum-32-karakter
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=buat-secret-khusus-cron

# Kosongkan lokal; isi path volume persisten pada production.
UPLOADS_DIR=

# Gunakan hours hanya untuk simulasi lokal; production memakai days.
BLACKLIST_DURATION_UNIT=days
```

Jangan commit `.env.local` atau membagikan nilai secret. `DATABASE_URL`, `BETTER_AUTH_SECRET`, dan `CRON_SECRET` adalah data sensitif.

### 3. Siapkan database

```bash
npm run db:push
```

### 4. Jalankan server development

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Testing dan Build

```bash
# Semua test
npm test

# Test terarah (mengabaikan worktree lokal bila ada)
npx vitest run tests/login-form.test.tsx tests/admin-inventory-create-form.test.tsx --exclude .worktrees/**

# Pemeriksaan TypeScript
npx tsc --noEmit --pretty false

# Build production
npm run build
```

## Cron Produksi

Endpoint cron berada di `/api/cron/proses-lelang` dan memerlukan header berikut:

```text
Authorization: Bearer <CRON_SECRET>
```

Jadwalkan endpoint ini secara teratur pada platform deployment. Cron menangani settlement lelang yang berakhir, peringatan deadline pembayaran, pembayaran pemenang yang lewat batas waktu, masa blacklist yang berakhir, serta penyelesaian serah-terima yang memenuhi syarat.

## Deployment dan Upload Media

Build Docker menggunakan output standalone. Pada production, set `UPLOADS_DIR` ke volume persisten agar media barang, bukti pembayaran, dan bukti serah-terima tidak hilang setelah container dibuat ulang atau redeploy.

Folder upload publik dapat diberi cache panjang. Jika memakai CDN, purging cache mungkin diperlukan setelah pemulihan atau penggantian media.

## Keamanan yang Diterapkan

- Session Better Auth dan guard role pada server/API.
- Isolasi Admin Unit berdasarkan unit dan data Buyer berdasarkan user aktif.
- Validasi format input, nominal, dan upload bukti pembayaran.
- Sensor nominal/nama penawar pada UI/API selama Lelang Tertutup aktif.
- Endpoint cron memakai secret bearer.
- Header keamanan browser: CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, serta `Permissions-Policy`.
- Penyimpanan upload mendukung volume persisten pada production.

### Batas keamanan yang perlu diketahui

- Sistem tidak memiliki payment gateway atau verifikasi mutasi bank otomatis.
- Bid privat bukan enkripsi database: operator yang memiliki akses langsung ke database masih dapat membaca data internal sesuai haknya.
- CSP saat ini masih mengizinkan inline script/style untuk kompatibilitas runtime; evaluasi penguatan CSP diperlukan jika aplikasi dikembangkan sebagai produk produksi.

## Struktur Folder

```text
app/                         Route, page, layout, dan route handler Next.js
components/                  Komponen UI per area aplikasi
lib/                         Auth, database, service, serializer, validasi, utilitas
public/                      Asset brand dan upload lokal
scripts/                     Migrasi dan utilitas operasional
tests/                       Test Vitest
docs/readme-screenshots/     Referensi lokasi screenshot README
PRD.md                       Spesifikasi produk hidup
README.md                    Dokumentasi project
```

## Screenshot

Simpan screenshot dokumentasi pada `docs/readme-screenshots/`. Disarankan merekam beranda, katalog, detail barang, register/login, dashboard Buyer, transaksi, input barang dengan kalender waktu, pemasaran, verifikasi bukti pembayaran, dashboard Admin Unit, dan dashboard Superadmin.

---

<p align="center">
  <strong>Ruang Agunan</strong><br />
  Prototype Sistem Informasi Pengelolaan Aset Agunan<br />
  Program Studi Teknik Informatika — Universitas Sam Ratulangi
</p>
