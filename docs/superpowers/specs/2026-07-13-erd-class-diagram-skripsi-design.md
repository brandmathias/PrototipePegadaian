# ERD dan Class Diagram untuk Laporan Skripsi

## Tujuan

Menyediakan artefak visual dan penjelasan database yang sesuai dengan implementasi aktif aplikasi Ruang Agunan. Artefak ditujukan untuk laporan skripsi, sehingga setiap diagram harus mudah dibaca saat dicetak dan tetap dapat ditelusuri ke schema Drizzle ORM.

## Ruang lingkup

Dokumentasi mencakup dua tingkat pembacaan.

1. **Versi inti bisnis** untuk isi utama laporan: User, Unit, Rekening Unit, Barang, Media Barang, Pemasaran, Bid, Transaksi, Pelanggaran User, Blacklist, Wishlist, dan Notifikasi.
2. **Versi lengkap implementasi** untuk lampiran atau subbab teknis: seluruh versi inti ditambah tabel Better Auth (`session`, `account`, `verification`) serta tabel audit (`blacklist_action_log`, `superadmin_account_audit_log`), `riwayat_perpanjangan`, `riwayat_status_barang`, dan `pemasaran_views`.

## ERD

ERD menggunakan notasi Chen seperti referensi pengguna: entitas berbentuk kotak, atribut penting berada di dalam kotak dengan penanda `PK` dan `FK`, serta garis relasi memakai kardinalitas `1` dan `N`. Atribut yang ditampilkan merupakan atribut bisnis dan kunci relasi; atribut teknis yang sangat panjang tidak dimasukkan ke diagram agar tetap terbaca.

Diagram lengkap dikelompokkan dalam empat area visual:

- Identitas dan otorisasi: `user`, `buyer_profile`, `session`, `account`, `verification`.
- Operasional unit dan aset: `units`, `rekening_unit`, `barang`, `media_barang`, `riwayat_perpanjangan`, `riwayat_status_barang`.
- Pemasaran dan transaksi: `pemasaran`, `pemasaran_views`, `bids`, `transaksi`, `buyer_wishlist`.
- Kepatuhan dan audit: `pelanggaran_user`, `blacklist`, `blacklist_action_log`, `notifications`, `superadmin_account_audit_log`.

## Class diagram

Class diagram memakai notasi UML, terdiri dari kelas domain utama berikut.

- `User`, `Unit`, `Barang`, `Pemasaran`, `Bid`, `Transaksi`, `Blacklist`, dan `Notification`.
- Kelas pendukung `RekeningUnit`, `MediaBarang`, `BuyerProfile`, `Wishlist`, `PelanggaranUser`, dan `RiwayatStatusBarang`.
- `VickreySettlementService` merepresentasikan proses penentuan pemenang setelah deadline dan pembuatan transaksi pemenang.

Operasi yang ditampilkan hanya operasi yang benar-benar tersedia pada service aplikasi, misalnya `submitVickreyBid`, `createFixedPricePurchase`, `verifyAdminTransaction`, `publishAdminBarang`, dan `processExpiredVickreyAuctions`.

## Penjelasan tabel

Setiap tabel diberi:

- Paragraf fungsi dalam bahasa akademik dan mudah dipahami.
- Tabel kolom dengan `Nama Kolom`, `Tipe Data`, dan `Keterangan`.
- Penanda `PK` untuk primary key dan `FK` untuk foreign key.

Untuk menjaga ukuran bab laporan, penjelasan versi inti bisnis digunakan di bagian utama. Penjelasan tabel Better Auth, audit, log, serta tabel pendukung tetap dibuat dan diletakkan di lampiran teknis.

## Format keluaran

- Dua berkas Excalidraw yang dapat diedit: ERD lengkap dan class diagram.
- Dua PNG resolusi tinggi dengan tata letak lanskap untuk dokumen skripsi.
- Satu dokumen Markdown berisi narasi gambar dan penjelasan seluruh tabel.

## Validasi

- Nama tabel, kolom, tipe data, dan foreign key harus sesuai dengan `lib/db/schema`.
- Relasi transaksi dan Vickrey harus konsisten dengan `buyer.service.ts` dan `cron.service.ts`.
- Tabel Better Auth dan audit diberi label teknis agar pembaca dapat membedakannya dari tabel inti bisnis.
