# Product Requirements Document (PRD)

## Prototipe Pegadaian Lelang

**Versi:** 5.1
**Status:** Living PRD, disesuaikan dengan implementasi saat ini
**Tanggal pembaruan:** 21 Mei 2026
**Stack:** Next.js App Router, React, Tailwind CSS, PostgreSQL, Drizzle ORM, Better Auth

---

## 1. Ringkasan Produk

Pegadaian Lelang adalah aplikasi web full-stack untuk mengelola siklus barang jaminan Pegadaian dari sisi Admin Unit, mempublikasikan barang ke katalog pembeli, menjalankan pemasaran Fixed Price atau Vickrey Auction, memproses transaksi pembayaran, mencetak nota, dan mencatat pelanggaran pembayaran lelang.

Produk ini sudah berkembang dari rancangan katalog sederhana menjadi workspace operasional multi-role:

- Pembeli dapat melihat katalog, membeli fixed price, ikut Vickrey Auction, memantau transaksi, melihat riwayat bid, dan membuka nota.
- Admin Unit dapat mengelola barang, media foto/video, pemasaran, transaksi, verifikasi pembayaran, riwayat transaksi, dan blacklist/pelanggaran.
- Super Admin dapat mengelola unit, rekening unit, admin unit, monitoring nasional, dan blacklist global.

### Tujuan Utama

- Menyediakan katalog barang Pegadaian berbasis web dengan media foto/video.
- Mendukung dua mode pemasaran: Fixed Price dan Vickrey Auction.
- Memberikan alur pembayaran yang jelas untuk pembeli dan Admin Unit.
- Menjaga privasi bid Vickrey sebelum deadline dengan encrypted escrow dan hash integrity.
- Mencatat pelanggaran pembayaran Vickrey secara otomatis dan menerapkan blacklist bertingkat.
- Menyediakan nota transaksi yang dapat dicetak dan disimpan sebagai PDF.

### Batasan Produk

- Tidak menggunakan payment gateway eksternal.
- Pembayaran diverifikasi manual oleh Admin Unit.
- Fixed Price dapat memakai transfer bank atau bayar langsung di unit.
- Vickrey Auction hanya memakai bayar langsung di unit setelah pemenang ditentukan.
- Sistem adalah prototipe akademik, bukan integrasi resmi dengan sistem internal Pegadaian.

---

## 2. Role dan Hak Akses

### 2.1 Guest

Guest adalah pengguna publik yang belum login.

Hak akses:

- Melihat halaman beranda.
- Melihat katalog barang.
- Melihat detail barang dan media.
- Tidak dapat membeli barang.
- Tidak dapat mengirim bid.

### 2.2 Buyer

Buyer adalah pengguna pembeli/peserta lelang yang login.

Hak akses:

- Melihat katalog dan detail barang.
- Mencari dan memfilter katalog berdasarkan keyword, kategori, mode, unit, dan rentang harga.
- Membeli barang Fixed Price.
- Memilih metode pembayaran Fixed Price: transfer bank atau bayar langsung.
- Mengunggah bukti transfer untuk transaksi transfer.
- Mengikuti Vickrey Auction dengan bid tertutup.
- Menyetujui syarat konsekuensi pembayaran sebelum submit bid Vickrey.
- Memantau transaksi dan workflow pembayaran.
- Menekan "Pembelian Selesai" setelah pembayaran diverifikasi dan barang/nota diterima.
- Melihat riwayat bid Vickrey.
- Melihat verifikasi integritas bid.
- Mengunduh atau mencetak nota transaksi.

### 2.3 Admin Unit

Admin Unit adalah operator Pegadaian pada unit tertentu. Semua data yang tampil harus dibatasi berdasarkan `unit_id` admin aktif.

Hak akses:

- Melihat dashboard unit.
- Mengelola barang jaminan milik unit.
- Menambah, mengedit, memperpanjang, menebus, dan mengubah barang menjadi jaminan siap pemasaran.
- Mengunggah dan menghapus media barang.
- Memasarkan barang sebagai Fixed Price atau Vickrey Auction.
- Mengatur durasi Vickrey hingga tingkat hari, jam, menit, dan detik untuk kebutuhan testing.
- Melihat workspace pemasaran Fixed Price dan Vickrey Auction.
- Melihat detail sesi pemasaran, hasil Vickrey, pemenang, harga final, dan status transaksi setelah hasil dibuka.
- Memverifikasi pembayaran transfer dan bayar langsung.
- Menolak bukti transfer dengan alasan.
- Melihat transaksi aktif dan riwayat transaksi dalam bentuk daftar per baris.
- Mencetak nota transaksi.
- Melihat daftar blacklist/pelanggaran di unit.
- Memperpanjang blacklist dengan alasan.

### 2.4 Super Admin

Super Admin adalah pengelola nasional/global.

Hak akses:

- Mengelola unit Pegadaian.
- Mengelola akun Admin Unit.
- Mengelola rekening bank aktif per unit.
- Melihat monitoring global.
- Melihat daftar blacklist nasional.
- Mencabut blacklist lebih awal dengan alasan.

---

## 3. Modul Utama

### 3.1 Public Catalog

Katalog publik menampilkan barang yang memiliki:

- `pemasaran.status = aktif`
- `barang.status = dipasarkan`
- `units.is_active = true`

Fitur katalog:

- Card barang dengan foto/video utama.
- Mode badge: Fixed Price atau Vickrey.
- Harga jual untuk Fixed Price.
- Harga dasar dan countdown untuk Vickrey.
- Search keyword.
- Filter kategori, mode, unit, dan rentang harga.
- Sortir daftar barang.
- Detail barang dengan media gallery, spesifikasi, unit, kondisi, harga, dan CTA sesuai mode.

### 3.2 Buyer Fixed Price

Fixed Price adalah pembelian harga tetap.

Alur buyer:

1. Buyer membuka detail barang Fixed Price.
2. Buyer menekan "Beli Sekarang".
3. Buyer memilih metode pembayaran:
   - Transfer bank.
   - Bayar langsung di unit.
4. Sistem membuat transaksi dengan batas waktu 24 jam.
5. Buyer melanjutkan ke halaman detail transaksi.
6. Jika transfer, buyer mengunggah bukti pembayaran.
7. Jika bayar langsung, buyer datang ke unit dan menunggu konfirmasi Admin Unit.
8. Setelah admin verifikasi, status menjadi `lunas`.
9. Buyer menekan "Pembelian Selesai".
10. Status transaksi menjadi `selesai` dan barang tetap keluar dari katalog sebagai `terjual`.

Workflow visual buyer Fixed Price:

- Melakukan Pembayaran
- Verifikasi
- Selesai

Catatan:

- Upload bukti adalah bagian dari tahap "Melakukan Pembayaran".
- Nota tersedia setelah transaksi diverifikasi admin.
- Transaksi yang sudah `selesai` masuk arsip/riwayat.

### 3.3 Buyer Vickrey Auction

Vickrey Auction adalah lelang tertutup. Pemenang adalah bid tertinggi, tetapi harga final mengikuti bid tertinggi kedua. Jika hanya ada satu penawar valid, harga final mengikuti harga dasar. Jika dua atau lebih buyer memasukkan nominal bid tertinggi yang sama, pemenang adalah buyer yang submit bid lebih dahulu berdasarkan timestamp `bids.created_at`, dan harga final yang dibayar adalah nominal bid yang sama tersebut.

Alur buyer:

1. Buyer membuka detail barang Vickrey.
2. Buyer menekan "Ikut Lelang Sekarang".
3. Buyer mengisi nominal bid minimal sama dengan harga dasar.
4. Saat buyer menekan tombol konfirmasi bid, sistem menampilkan modal syarat dan ketentuan penawaran:
   - Jika menang dan tidak menyelesaikan pembayaran dalam 24 jam, akun dikenakan pembatasan.
   - Jumlah pelanggaran aktif buyer ditampilkan, contoh `0x`.
   - Ringkasan Level 1, Level 2, dan Level 3+ ditampilkan agar buyer memahami konsekuensi bertingkat.
5. Buyer wajib mencentang persetujuan di dalam modal sebelum bid benar-benar dikirim.
6. Sistem membuat salt client-side dan hash integrity.
7. Sistem menyimpan bid sebagai encrypted escrow.
8. Buyer melihat status bid dari Riwayat Bid.
9. Setelah deadline, backend membuka escrow otomatis dan menentukan pemenang.
10. Jika buyer menang, sistem membuat transaksi Vickrey bayar langsung di unit.
11. Buyer datang ke unit untuk pembayaran langsung.
12. Admin Unit memverifikasi pembayaran.
13. Buyer menekan "Pembelian Selesai".

Workflow visual buyer Vickrey:

- Melakukan Pembayaran
- Verifikasi
- Selesai

Ketentuan Vickrey:

- Satu buyer hanya dapat submit satu bid per sesi.
- Bid tidak dapat diubah atau dibatalkan.
- Nominal bid tidak terlihat sebelum deadline.
- Bid baru memakai encrypted escrow dan hash integrity.
- Jika terdapat nominal bid tertinggi yang sama, sistem memakai aturan tie-breaker timestamp: bid yang masuk lebih awal menang.
- Pada kasus tie nominal tertinggi, bid sama yang masuk lebih lambat menjadi runner-up, sehingga harga final Vickrey sama dengan nominal bid tertinggi tersebut.
- Form reveal manual tetap ada untuk kompatibilitas bid legacy hash-only, tetapi alur utama baru tidak membutuhkan buyer reveal.
- Pembayaran Vickrey hanya bayar langsung di unit, tanpa upload bukti transfer.

### 3.4 Admin Unit: Kelola Barang

Barang adalah objek jaminan yang dikelola oleh unit.

Fitur:

- Tambah barang.
- Edit barang sebelum dipasarkan.
- Upload media foto/video.
- Hapus media sebelum barang tayang.
- Catat perpanjangan.
- Catat penebusan.
- Jadikan barang sebagai jaminan siap dipasarkan.
- Pasarkan barang ke Fixed Price atau Vickrey.
- Pasarkan ulang barang gagal.

Media:

- Media barang disimpan di `media_barang`.
- Detail katalog dan pemasaran menampilkan media asli barang.
- Foto utama menggunakan `sort_order = 0`.

### 3.5 Admin Unit: Pemasaran

Menu "Pemasaran" memiliki dua subhalaman:

- Fixed Price
- Vickrey Auction

Keduanya tampil sebagai daftar barang yang mirip katalog, bukan card administratif besar, agar Admin Unit cepat membaca barang, mode, status, harga, media, dan CTA detail.

Fixed Price:

- Menampilkan daftar barang harga tetap.
- Tidak menampilkan konsep bid, peserta, atau visibilitas bid.
- Detail sesi fokus pada harga jual, status pembeli, transaksi, media, dan pembayaran.

Vickrey Auction:

- Menampilkan daftar lot Vickrey aktif/selesai/gagal.
- Menampilkan countdown.
- Menampilkan status hasil.
- Menampilkan hasil setelah deadline: pemenang, harga final Vickrey, daftar bid, status pembayaran.
- Sebelum deadline, nominal bid tidak ditampilkan.
- Setelah deadline, backend membuka escrow otomatis dan hasil dapat ditinjau.

### 3.6 Admin Unit: Transaksi

Menu "Transaksi" memiliki dua subhalaman:

- Verifikasi Pembayaran
- Riwayat

Verifikasi Pembayaran:

- Menampilkan transaksi yang masih membutuhkan tindakan admin.
- Tampilan berbentuk daftar per baris.
- Admin menekan "Lihat detail" untuk membuka workspace detail.
- Detail menampilkan informasi buyer, barang, nominal, metode bayar, workflow pembayaran, bukti transfer jika ada, dan tindakan admin.

Riwayat:

- Menampilkan transaksi selesai/gagal/ditolak atau tidak lagi butuh tindakan.
- Tampilan berbentuk daftar per baris.
- Status kerja harus ter-highlight, bukan teks datar.
- Jika transaksi selesai, deadline/batas pembayaran tidak lagi menampilkan countdown. Cukup tampil sebagai "Selesai".

Detail transaksi Admin Unit:

- Memakai layout workspace dua kolom yang rapi.
- Menampilkan ringkasan transaksi.
- Menampilkan data buyer tanpa overflow pada email/nomor panjang.
- Menampilkan workflow visual yang jelas.
- Menampilkan tombol verifikasi, tolak, cetak nota, atau kembali sesuai status.

### 3.7 Nota Transaksi

Nota tersedia untuk buyer dan admin setelah pembayaran diverifikasi.

Ketentuan nota:

- Tampilan buyer dan admin konsisten.
- Nota memakai nuansa hijau dan emas.
- Nota harus muat dalam satu halaman cetak jika memungkinkan.
- Print mode menyembunyikan navbar, sidebar, URL visual aplikasi, tombol, dan elemen non-nota.
- Browser tetap dapat menampilkan header/footer bawaan print jika user mengaktifkannya, tetapi layout aplikasi tidak boleh menambah teks di luar kartu nota.
- Buyer dapat membuka nota, mencetak, dan menyimpan sebagai PDF dari dialog browser.

Isi nota:

- Identitas Pegadaian Lelang.
- Nomor/ID transaksi.
- Tanggal verifikasi.
- Rincian barang dan foto asli.
- Informasi buyer.
- Total pembayaran.
- Metode pembayaran.
- Referensi verifikasi.
- Unit pengambilan.
- Syarat dan ketentuan pengambilan barang.

---

## 4. State Machine Barang

Status utama barang di database:

- `jaminan`
- `dipasarkan`
- `menunggu_pembayaran`
- `terjual`
- `ditebus`
- `gagal`

Catatan implementasi:

- Istilah "gadai" dipakai sebagai konteks bisnis input barang, tetapi status kerja utama setelah barang masuk sistem adalah `jaminan`.
- Barang `dipasarkan` tampil di katalog jika ada pemasaran aktif.
- Barang masuk `menunggu_pembayaran` setelah Vickrey selesai dan pemenang ditentukan.
- Barang menjadi `terjual` setelah pembayaran diverifikasi dan/atau transaksi selesai.
- Barang menjadi `gagal` jika Vickrey tidak punya penawar atau pemenang tidak membayar dalam 24 jam.
- Barang `gagal` dapat dipasarkan ulang oleh Admin Unit.

Alur ringkas:

```text
jaminan
  -> ditebus
  -> dipasarkan

dipasarkan + fixed_price
  -> transaksi dibuat
  -> lunas
  -> selesai
  -> terjual

dipasarkan + vickrey
  -> deadline tercapai
  -> gagal jika tidak ada bid valid
  -> menunggu_pembayaran jika ada pemenang
  -> lunas setelah admin verifikasi bayar langsung
  -> selesai setelah buyer konfirmasi selesai
  -> terjual

menunggu_pembayaran + vickrey overdue 24 jam
  -> gagal
  -> pelanggaran_user
  -> blacklist bertingkat
```

---

## 5. State Machine Transaksi

Status transaksi di database:

- `menunggu_pembayaran`
- `bukti_diunggah`
- `ditolak_bukti`
- `menunggu_konfirmasi_langsung`
- `lunas`
- `selesai`
- `gagal`

### Fixed Price Transfer

```text
menunggu_pembayaran
  -> bukti_diunggah
  -> ditolak_bukti
  -> bukti_diunggah
  -> lunas
  -> selesai
```

### Fixed Price Bayar Langsung

```text
menunggu_konfirmasi_langsung
  -> lunas
  -> selesai
```

### Vickrey Bayar Langsung

```text
menunggu_konfirmasi_langsung
  -> lunas
  -> selesai

menunggu_konfirmasi_langsung + lewat 24 jam
  -> gagal
  -> blacklist bertingkat
```

Aturan:

- Transaksi `lunas` tidak bisa ditolak bukti.
- Transaksi `selesai` tidak bisa diubah lagi.
- Buyer hanya bisa menekan selesai setelah transaksi `lunas`.
- Admin Unit hanya bisa memverifikasi transaksi milik unitnya.

---

## 6. Vickrey Auction: Privasi dan Fairness

### 6.1 Model Saat Ini

Sistem memakai pendekatan encrypted escrow + hash integrity.

Saat buyer submit bid:

- Client membuat `salt`.
- Client menghitung `bidHash = sha256(pemasaranId:userId:nominal:salt)`.
- Backend memvalidasi hash.
- Backend menyimpan nominal dan salt di `encrypted_bid_payload`.
- Kolom `bids.nominal` dan `bids.salt` tetap `null` sebelum deadline.

Setelah deadline:

- Cron/backend membaca lot Vickrey yang sudah selesai.
- Backend decrypt `encrypted_bid_payload`.
- Backend memverifikasi ulang hash integrity.
- Jika valid dan nominal >= harga dasar, backend mengisi `bids.nominal`, `bids.salt`, dan `revealed_at`.
- Backend menghitung pemenang dan harga final.
- Backend membuat transaksi Vickrey untuk pemenang dengan metode `langsung`.

### 6.2 Privasi Admin

Sebelum deadline:

- Admin Unit tidak boleh menerima nominal bid dari API.
- Detail lelang menampilkan ringkasan peserta dan status, bukan nominal.
- Database memang menyimpan ciphertext, bukan nominal terbuka.

Setelah deadline:

- Backend boleh membuka escrow untuk settlement.
- Hasil Vickrey dapat ditinjau.
- Harga final dan pemenang tersedia.
- Data bid dapat dipakai untuk audit sesuai aturan tampilan dan endpoint admin.

### 6.3 Settlement dan Tie-Breaker

Aturan settlement Vickrey:

- Bid valid adalah bid yang berhasil didecrypt, lolos hash integrity, dan nominalnya minimal sama dengan harga dasar.
- Bid diurutkan berdasarkan nominal tertinggi.
- Jika nominal berbeda, pemenang adalah nominal tertinggi dan harga final adalah nominal tertinggi kedua.
- Jika hanya ada satu bid valid, pemenang membayar harga dasar.
- Jika dua atau lebih bid valid memiliki nominal tertinggi yang sama, pemenang adalah bid dengan `created_at` paling awal.
- Pada kondisi nominal tertinggi sama, harga final adalah nominal yang sama tersebut karena runner-up bernilai sama dengan pemenang.
- Jika timestamp juga sama sampai presisi database, sistem memakai `bids.id` sebagai fallback deterministik agar hasil settlement tetap stabil.

### 6.4 Legacy Reveal

Form reveal buyer tetap disediakan untuk bid lama yang masih memakai mekanisme hash-only.

Aturan:

- Bid baru tidak membutuhkan buyer reveal manual.
- Jika ada bid legacy yang belum reveal, sistem dapat menunggu reveal window sesuai konfigurasi `reveal_ends_at`.
- Jika reveal window selesai dan bid tetap tidak reveal, bid legacy tidak ikut settlement.

---

## 7. Blacklist dan Pelanggaran

Pelanggaran terjadi saat pemenang Vickrey tidak menyelesaikan pembayaran dalam 24 jam.

Sistem mencatat:

- `pelanggaran_user`
- `blacklist`
- `blacklist_action_log`

### 7.1 Kebijakan Blacklist 3 Level

| Total Pelanggaran | Level | Durasi | Pembatasan |
| --- | --- | --- | --- |
| 1x | Level 1 | 7 hari | Tidak bisa submit bid Vickrey. Fixed Price masih boleh. |
| 2x | Level 2 | 30 hari | Tidak bisa submit bid Vickrey dan tidak bisa membuat transaksi Fixed Price baru. |
| 3x atau lebih | Level 3 | 365 hari | Tidak bisa membuat transaksi baru dan perlu review/cabut manual oleh Super Admin. |

Catatan:

- Buyer tetap dapat login dan melihat katalog kecuali kebijakan bisnis diubah kemudian.
- Transaksi yang sudah berjalan tetap dapat diselesaikan.
- Pembatasan Fixed Price hanya berlaku untuk membuat transaksi baru mulai Level 2.
- Admin Unit dapat memperpanjang blacklist.
- Super Admin dapat mencabut blacklist lebih awal dengan alasan.

### 7.2 Informed Consent Sebelum Bid

Saat buyer menekan konfirmasi bid Vickrey, sistem wajib menampilkan warning aktif dalam modal syarat dan ketentuan:

```text
Jika Anda menang dan tidak menyelesaikan pembayaran dalam 24 jam, akun akan dikenakan pembatasan.
Pelanggaran Anda saat ini: 0x.
```

Buyer wajib mencentang persetujuan syarat di dalam modal sebelum bid benar-benar dikirim.
Modal juga wajib menjelaskan ringkasan level pembatasan: Level 1 selama 7 hari, Level 2 selama 30 hari, dan Level 3+ selama 365 hari/review admin.

---

## 8. Database Model

### 8.1 Auth

Tabel:

- `user`
- `session`
- `account`
- `verification`

Field penting `user`:

- `id`
- `name`
- `email`
- `role`
- `phone_number`
- `national_id`
- `unit_id`
- `is_active`

Role utama:

- `buyer`
- `admin_unit`
- `superadmin`

### 8.2 Buyer Profile

Tabel:

- `buyer_profile`

Menyimpan data profil buyer seperti nama lengkap, email, nomor HP, NIK, dan status profil.

### 8.3 Unit dan Rekening

Tabel:

- `units`
- `rekening_unit`

Aturan:

- Unit memiliki `code`, `name`, `address`, dan `is_active`.
- Satu unit hanya boleh punya satu rekening aktif.
- Rekening aktif dipakai untuk instruksi transfer fixed price.

### 8.4 Barang dan Media

Tabel:

- `barang`
- `media_barang`
- `riwayat_perpanjangan`
- `riwayat_status_barang`

Field penting `barang`:

- `id`
- `unit_id`
- `code`
- `name`
- `category`
- `condition`
- `description`
- `appraisal_value`
- `loan_value`
- `owner_name`
- `customer_number`
- `pawned_at`
- `due_date`
- `status`
- `created_by_user_id`

Catatan:

- Data nasabah/barang internal tidak boleh bocor ke endpoint publik.
- Media dapat berupa `foto` atau `video`.

### 8.5 Pemasaran

Tabel:

- `pemasaran`

Field penting:

- `id`
- `barang_id`
- `mode`
- `price`
- `base_price`
- `duration_days`
- `duration_seconds`
- `starts_at`
- `ends_at`
- `reveal_ends_at`
- `winner_id`
- `final_price`
- `iteration`
- `status`

Aturan:

- `mode` adalah `fixed_price` atau `vickrey`.
- Fixed Price memakai `price`.
- Vickrey memakai `base_price`, `starts_at`, `ends_at`, dan `duration_seconds`.
- Satu barang hanya boleh punya satu pemasaran aktif.

### 8.6 Bids

Tabel:

- `bids`

Field penting:

- `id`
- `pemasaran_id`
- `user_id`
- `bid_hash`
- `encrypted_bid_payload`
- `nominal`
- `salt`
- `revealed_at`
- `created_at`

Aturan:

- Unique per `pemasaran_id` dan `user_id`.
- `nominal` dan `salt` null sebelum escrow dibuka.
- `bid_hash` dipakai sebagai bukti integritas.
- `encrypted_bid_payload` dipakai untuk settlement otomatis.

### 8.7 Transaksi

Tabel:

- `transaksi`

Field penting:

- `id`
- `pemasaran_id`
- `user_id`
- `type`
- `amount`
- `payment_method`
- `status`
- `proof_url`
- `rejection_reason`
- `reference_number`
- `payment_deadline`
- `verified_by_user_id`
- `verified_at`

`type`:

- `fixed_price`
- `vickrey`

`payment_method`:

- `transfer`
- `langsung`

### 8.8 Pelanggaran dan Blacklist

Tabel:

- `pelanggaran_user`
- `blacklist`
- `blacklist_action_log`

Aturan:

- Pelanggaran dicatat per kejadian gagal bayar Vickrey.
- Blacklist aktif per user bersifat unik.
- `total_violations` menentukan level pembatasan.
- Action log menyimpan riwayat blokir otomatis, perpanjang manual, dan cabut manual.

### 8.9 Notifikasi In-App

Tabel:

- `notifications`

Field penting:

- `id`
- `user_id`
- `title`
- `message`
- `type`
- `entity_type`
- `entity_id`
- `action_href`
- `is_read`
- `created_at`
- `read_at`
- `metadata`

Aturan:

- Notifikasi buyer disimpan persisten di database.
- Notifikasi dibuat otomatis untuk pemenang Vickrey, transaksi dibuat, pembayaran diverifikasi/ditolak, deadline pembayaran mendekat, dan blacklist aktif.
- `entity_id` dipakai untuk idempotency agar cron tidak membuat notifikasi duplikat untuk event yang sama.
- Endpoint notifikasi harus selalu mengambil `user_id` dari session buyer.

---

## 9. API dan Route Aplikasi

### 9.1 Public Pages

| Route | Deskripsi |
| --- | --- |
| `/` | Beranda publik. |
| `/katalog` | Katalog barang. |
| `/katalog/[id]` | Detail barang. |
| `/katalog/[id]/beli` | Konfirmasi pembelian Fixed Price. |
| `/katalog/[id]/bid` | Form bid Vickrey. |
| `/login` | Login. |
| `/register` | Registrasi buyer. |

### 9.2 Buyer Pages

| Route | Deskripsi |
| --- | --- |
| `/dashboard` | Dashboard buyer. |
| `/transaksi` | Daftar transaksi buyer. |
| `/transaksi/[id]` | Detail pembayaran buyer. |
| `/transaksi/[id]/nota` | Nota buyer. |
| `/riwayat-bid` | Riwayat bid Vickrey. |
| `/riwayat-bid/[pemasaranId]/verifikasi` | Verifikasi integritas bid. |
| `/profil` | Profil buyer. |

### 9.3 Admin Unit Pages

| Route | Deskripsi |
| --- | --- |
| `/admin` | Dashboard admin unit. |
| `/admin/barang` | Daftar barang unit. |
| `/admin/barang/tambah` | Tambah barang. |
| `/admin/barang/[id]` | Detail barang. |
| `/admin/barang/[id]/edit` | Edit barang. |
| `/admin/barang/[id]/perpanjang` | Perpanjang barang. |
| `/admin/barang/[id]/tebus` | Tebus barang. |
| `/admin/barang/[id]/jadikan-jaminan` | Jadikan jaminan. |
| `/admin/barang/[id]/pasarkan` | Pasarkan barang. |
| `/admin/barang/[id]/pasarkan-ulang` | Pasarkan ulang barang gagal. |
| `/admin/pemasaran` | Landing pemasaran. |
| `/admin/pemasaran/fixed-price` | Daftar Fixed Price. |
| `/admin/pemasaran/fixed-price/[id]` | Detail Fixed Price. |
| `/admin/pemasaran/vickrey-auction` | Daftar Vickrey Auction. |
| `/admin/pemasaran/vickrey-auction/[id]` | Detail Vickrey Auction. |
| `/admin/transaksi` | Landing transaksi. |
| `/admin/transaksi/verifikasi-pembayaran` | Daftar verifikasi pembayaran. |
| `/admin/transaksi/riwayat` | Riwayat transaksi. |
| `/admin/transaksi/[id]` | Detail transaksi. |
| `/admin/transaksi/[id]/nota` | Nota admin. |
| `/admin/blacklist` | Daftar blacklist unit. |
| `/admin/blacklist/[userId]` | Detail blacklist user. |
| `/admin/blacklist/[userId]/perpanjang` | Perpanjang blacklist. |
| `/admin/profil` | Profil admin unit. |

### 9.4 Super Admin Pages

| Route | Deskripsi |
| --- | --- |
| `/superadmin` | Dashboard super admin. |
| `/superadmin/unit` | Daftar dan tambah unit. |
| `/superadmin/unit/[id]` | Detail unit. |
| `/superadmin/unit/[id]/rekening` | Kelola rekening unit. |
| `/superadmin/admin` | Kelola admin unit. |
| `/superadmin/monitoring` | Monitoring global. |
| `/superadmin/blacklist` | Blacklist global. |

### 9.5 API Buyer

| Method | Route | Deskripsi |
| --- | --- | --- |
| `POST` | `/api/user/beli/[pemasaranId]` | Buat transaksi Fixed Price. |
| `POST` | `/api/user/bid/[pemasaranId]` | Submit bid Vickrey encrypted escrow. |
| `POST` | `/api/user/bid/[pemasaranId]/reveal` | Reveal bid legacy hash-only. |
| `GET` | `/api/user/transaksi` | List transaksi buyer. |
| `GET` | `/api/user/transaksi/[id]` | Detail transaksi buyer. |
| `POST` | `/api/user/transaksi/[id]/upload-bukti` | Upload bukti transfer. |
| `POST` | `/api/user/transaksi/[id]/selesai` | Buyer menutup transaksi sebagai selesai. |
| `GET` | `/api/user/riwayat-bid` | Riwayat bid buyer. |
| `PUT` | `/api/user/profil` | Perbarui profil buyer. |
| `GET` | `/api/user/notifikasi` | List notifikasi buyer, mendukung filter unread. |
| `GET` | `/api/user/notifikasi/unread-count` | Jumlah notifikasi belum dibaca. |
| `PATCH` | `/api/user/notifikasi/[id]` | Tandai satu notifikasi sebagai dibaca. |
| `POST` | `/api/user/notifikasi/read-all` | Tandai semua notifikasi buyer sebagai dibaca. |

### 9.6 API Admin Unit

| Method | Route | Deskripsi |
| --- | --- | --- |
| `GET/POST` | `/api/admin/barang` | List dan tambah barang. |
| `GET/PUT` | `/api/admin/barang/[id]` | Detail dan edit barang. |
| `POST` | `/api/admin/barang/[id]/media` | Upload media barang. |
| `DELETE` | `/api/admin/barang/[id]/media/[mediaId]` | Hapus media barang. |
| `POST` | `/api/admin/barang/[id]/perpanjang` | Catat perpanjangan. |
| `POST` | `/api/admin/barang/[id]/tebus` | Catat penebusan. |
| `POST` | `/api/admin/barang/[id]/jadikan-jaminan` | Ubah status menjadi jaminan. |
| `POST` | `/api/admin/barang/[id]/pasarkan` | Publikasikan pemasaran. |
| `POST` | `/api/admin/barang/[id]/pasarkan-ulang` | Pasarkan ulang barang gagal. |
| `GET` | `/api/admin/lelang` | List sesi pemasaran. |
| `GET` | `/api/admin/lelang/[id]` | Detail sesi pemasaran/lelang. |
| `GET` | `/api/admin/transaksi` | List transaksi unit. |
| `GET` | `/api/admin/transaksi/[id]` | Detail transaksi unit. |
| `POST` | `/api/admin/transaksi/[id]/verifikasi` | Verifikasi pembayaran. |
| `POST` | `/api/admin/transaksi/[id]/tolak-bukti` | Tolak bukti transfer. |
| `POST` | `/api/admin/transaksi/[id]/konfirmasi-langsung` | Konfirmasi bayar langsung. |
| `GET` | `/api/admin/blacklist` | Daftar blacklist unit. |
| `GET` | `/api/admin/blacklist/[userId]` | Detail blacklist user. |
| `POST` | `/api/admin/blacklist/[userId]/perpanjang` | Perpanjang blacklist. |

### 9.7 API Super Admin

| Method | Route | Deskripsi |
| --- | --- | --- |
| `GET/POST` | `/api/superadmin/unit` | List dan tambah unit. |
| `GET/PUT/DELETE` | `/api/superadmin/unit/[id]` | Detail, edit, hapus/nonaktif unit. |
| `GET/POST` | `/api/superadmin/unit/[id]/rekening` | Kelola rekening unit. |
| `PUT` | `/api/superadmin/unit/[id]/rekening/[rid]` | Edit atau set rekening unit. |
| `GET/POST` | `/api/superadmin/admin` | List dan tambah admin unit. |
| `GET/PUT/DELETE` | `/api/superadmin/admin/[id]` | Detail/edit/nonaktif admin. |
| `GET` | `/api/superadmin/monitoring` | Monitoring global. |
| `GET` | `/api/superadmin/blacklist` | Blacklist global. |
| `POST` | `/api/superadmin/blacklist/[userId]/cabut` | Cabut blacklist. |

### 9.8 API Cron

| Method | Route | Deskripsi |
| --- | --- | --- |
| `POST` | `/api/cron/proses-lelang` | Proses Vickrey expired, settlement, transaksi pemenang, pembayaran overdue, dan blacklist otomatis. |

---

## 10. Business Rules

### 10.1 Barang

- Admin Unit hanya dapat mengakses barang milik unitnya.
- Barang yang sudah dipasarkan tidak boleh diedit bebas seperti barang jaminan biasa.
- Barang yang sudah terjual/selesai tidak boleh muncul lagi di katalog buyer.
- Barang gagal dapat dipasarkan ulang.
- Perubahan status barang harus dicatat di `riwayat_status_barang`.

### 10.2 Pemasaran

- Harga Fixed Price harus lebih dari 0.
- Harga dasar Vickrey harus lebih dari 0.
- Durasi Vickrey dapat diset dengan hari, jam, menit, dan detik.
- Total durasi Vickrey harus lebih dari 0.
- Jam 0 sampai 23.
- Menit 0 sampai 59.
- Detik 0 sampai 59.
- Satu barang tidak boleh memiliki lebih dari satu pemasaran aktif.

### 10.3 Bidding

- Buyer harus login.
- Buyer harus bukan blacklist aktif untuk Vickrey.
- Buyer harus menyetujui syarat konsekuensi sebelum submit.
- Nominal bid minimal harga dasar.
- Satu buyer hanya satu bid per sesi.
- Bid baru disimpan terenkripsi dan otomatis dibuka backend saat deadline.
- Hash integrity wajib cocok.

### 10.4 Pembayaran

- Fixed Price transfer membutuhkan rekening unit aktif.
- Fixed Price bayar langsung tetap dapat dibuat walaupun rekening unit belum tersedia.
- Vickrey hanya bayar langsung.
- Batas pembayaran transaksi adalah 24 jam.
- Admin wajib mengisi referensi saat verifikasi.
- Bukti transfer dapat ditolak jika tidak valid.
- Buyer hanya dapat menyelesaikan transaksi setelah status `lunas`.

### 10.5 Blacklist

- Pelanggaran bertambah jika pemenang Vickrey tidak membayar dalam 24 jam.
- Level 1 memblokir bid Vickrey.
- Level 2 memblokir bid Vickrey dan transaksi Fixed Price baru.
- Level 3 memakai durasi 365 hari dan membutuhkan review/cabut manual.
- Transaksi yang sudah berjalan tetap dapat diselesaikan walaupun akun sedang dibatasi.

### 10.6 Standar Waktu Operasional

- Semua timestamp di database disimpan sebagai nilai absolut UTC.
- Zona waktu operasional aplikasi adalah WIB (`Asia/Jakarta`, UTC+7).
- Semua tampilan tanggal/jam di buyer, Admin Unit, Super Admin, nota, dan mock data harus dikonversi ke WIB secara konsisten.
- Input durasi lelang dari Admin Unit dihitung dari waktu server, bukan jam device client.
- Countdown frontend menerima snapshot waktu server (`serverNow`) dan menghitung elapsed time dengan monotonic timer browser (`performance.now`).
- Jika user mengubah tanggal/jam device, countdown tidak boleh langsung meloncat ke expired; keputusan final tetap mengikuti timestamp backend.
- Backend/cron tetap menjadi sumber kebenaran untuk deadline Vickrey, settlement pemenang, batas pembayaran 24 jam, dan blacklist.

---

## 11. Security dan Privacy

| Area | Ketentuan |
| --- | --- |
| Auth | Menggunakan Better Auth dan session cookie. |
| Role guard | Halaman dan API memeriksa role buyer, admin_unit, atau superadmin. |
| Isolasi unit | Query Admin Unit harus selalu difilter berdasarkan unit dari session. |
| Public data | Endpoint publik tidak boleh mengembalikan data internal nasabah/penggadai. |
| Vickrey privacy | Nominal bid tidak disimpan sebagai plaintext sebelum deadline. |
| Vickrey integrity | Hash integrity mengikat pemasaran, user, nominal, dan salt. |
| Upload | File media dan bukti harus divalidasi ukuran/tipe dan disimpan dengan nama aman. |
| Cron | Endpoint cron dilindungi secret bearer token. |
| Notifikasi | Endpoint notifikasi buyer hanya boleh membaca/mutasi data milik session buyer. |
| Mutasi status | Transisi status dilakukan dari service layer, bukan update bebas dari client. |
| Nota | Print/download hanya menampilkan dokumen nota, bukan UI navigasi. |
| Waktu | Client tidak boleh menjadi sumber kebenaran deadline; server time dan UTC timestamp harus menjadi acuan. |

---

## 12. UI/UX Requirements

### 12.1 Prinsip Umum

- UI harus jelas untuk operator unit, bukan sekadar dekoratif.
- Daftar operasional admin sebaiknya berbentuk table/list per baris jika item banyak.
- Card besar hanya digunakan untuk detail atau ringkasan penting.
- Status kerja harus mudah dipindai.
- Workflow pembayaran harus visual dan tidak hanya teks datar.
- Katalog buyer dan daftar pemasaran admin harus konsisten dalam media dan informasi barang.

### 12.2 Buyer

- Navbar publik menyediakan Beranda, Katalog, Transaksi, notifikasi, profil, dan logout.
- Bell notifikasi buyer menampilkan badge unread dari database dan refresh berkala dengan polling ringan.
- Membuka panel notifikasi tidak otomatis menandai semua dibaca; buyer harus klik notifikasi atau tombol tandai dibaca.
- Detail barang memakai media gallery seperti katalog.
- Detail pembayaran menampilkan workflow 3 tahap.
- Riwayat bid menampilkan status: bid tercatat, menunggu hasil, menang, tidak menang, gagal.
- Nota harus menarik, informatif, dan print-friendly.

### 12.3 Admin Unit

- Sidebar menampilkan Dashboard, Kelola Barang, Pemasaran, Transaksi, Pelanggaran/Blacklist, Profil, Bantuan, Keluar.
- Pemasaran memiliki subnav Fixed Price dan Vickrey Auction.
- Transaksi memiliki subnav Verifikasi Pembayaran dan Riwayat.
- Detail transaksi harus menghindari layout berantakan, overflow email, dan card terlalu besar.
- Riwayat transaksi harus list per baris dengan CTA "Lihat detail".
- Jika transaksi selesai, tampilkan "Selesai" untuk deadline/batas pembayaran, bukan countdown yang terus berjalan.

---

## 13. Non-Functional Requirements

| Aspek | Target |
| --- | --- |
| Responsiveness | Desktop dan mobile harus dapat digunakan. |
| Maintainability | Business logic berada di `lib/services`, route handler hanya tipis. |
| Auditability | Riwayat status barang, blacklist action, dan transaksi penting harus tercatat. |
| Data consistency | Cron settlement dan overdue payment memakai transaksi database. |
| Notifications | Notifikasi in-app persisten di database dan diambil dengan polling 30 detik, bukan WebSocket. |
| Accessibility | Tombol, checkbox, link, dan form harus dapat diakses dengan label/role yang jelas. |
| Performance | Katalog dan daftar admin harus tetap ringan dengan query terfilter. |
| Print | Nota harus punya layout khusus print dan menghindari pemecahan halaman yang tidak perlu. |

---

## 14. Out of Scope Saat Ini

- Payment gateway online.
- Integrasi Core Pegadaian.
- Email/SMS/WhatsApp notification otomatis.
- WebSocket real-time.
- Mobile native app.
- Chat buyer-admin.
- Shipping/logistik eksternal.
- Review/rating buyer.
- Laporan keuangan lengkap dan ekspor akuntansi.
- Multi-currency.

---

## 15. Acceptance Criteria Utama

### Catalog

- Guest dapat membuka katalog dan detail barang.
- Buyer dapat mencari/filter barang.
- Barang yang sudah selesai/terjual tidak muncul di katalog.
- Media asli barang tampil di katalog, detail, transaksi, dan nota.

### Fixed Price

- Buyer dapat membuat transaksi transfer atau bayar langsung.
- Buyer transfer dapat upload bukti.
- Admin dapat verifikasi atau tolak bukti.
- Buyer dapat menekan selesai setelah lunas.
- Nota dapat dibuka dan dicetak.

### Vickrey

- Admin dapat membuat lot dengan durasi sampai detik.
- Buyer wajib centang syarat konsekuensi sebelum submit bid.
- Bid baru tersimpan encrypted escrow dan hash integrity.
- Admin tidak melihat nominal sebelum deadline.
- Cron membuka escrow otomatis setelah deadline.
- Sistem membuat transaksi bayar langsung untuk pemenang.
- Buyer pemenang menerima notifikasi in-app dan diarahkan ke detail transaksi pembayaran.
- Buyer menerima notifikasi saat pembayaran diverifikasi, ditolak, deadline hampir habis, atau blacklist aktif.
- Jika pemenang tidak membayar 24 jam, sistem mencatat pelanggaran dan blacklist.

### Blacklist

- Pelanggaran pertama memblokir Vickrey 7 hari.
- Pelanggaran kedua memblokir Vickrey dan Fixed Price baru 30 hari.
- Pelanggaran ketiga dan seterusnya memblokir transaksi baru 365 hari dan perlu review/cabut manual.
- Buyer tetap bisa menyelesaikan transaksi yang sudah ada.

---

## 16. Glosarium

| Istilah | Definisi |
| --- | --- |
| Barang Jaminan | Barang yang dikelola unit sebelum dipasarkan. |
| Pemasaran | Proses publikasi barang ke katalog sebagai Fixed Price atau Vickrey. |
| Fixed Price | Penjualan dengan harga tetap. |
| Vickrey Auction | Lelang tertutup, pemenang bid tertinggi membayar harga bid tertinggi kedua. |
| Encrypted Escrow | Nominal bid disimpan terenkripsi sampai deadline. |
| Hash Integrity | Bukti kriptografis untuk memastikan nominal dan salt tidak berubah. |
| Reveal Legacy | Alur lama untuk bid hash-only yang membutuhkan buyer membuka nominal setelah deadline. |
| Settlement | Proses backend menentukan hasil Vickrey setelah deadline. |
| Bayar Langsung | Pembayaran offline di unit Pegadaian. |
| Bukti Transfer | File bukti pembayaran yang diunggah buyer untuk Fixed Price transfer. |
| Nota | Dokumen bukti transaksi setelah pembayaran diverifikasi. |
| Blacklist | Pembatasan akun akibat gagal membayar hasil Vickrey. |
| Pelanggaran | Kejadian pemenang Vickrey tidak membayar dalam 24 jam. |
| Cron | Proses server terjadwal untuk settlement lelang dan blacklist otomatis. |
| Notifikasi In-App | Pesan persisten di dalam aplikasi yang muncul di bell buyer dan disimpan di database. |
