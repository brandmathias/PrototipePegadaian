# Product Requirements Document (PRD)

## Ruang Agunan

**Versi:** 6.0  
**Status:** Living PRD, disesuaikan dengan implementasi saat ini  
**Tanggal pembaruan:** 25 Juni 2026  
**Konteks:** Project tugas akhir Program Studi Teknik Informatika  
**Stack utama:** Next.js App Router, React, TypeScript, Tailwind CSS, PostgreSQL, Drizzle ORM, Better Auth, Vitest, Docker

---

## 1. Ringkasan Produk

Ruang Agunan adalah aplikasi web full-stack untuk mensimulasikan pengelolaan aset agunan dari proses pencatatan barang, publikasi katalog, penjualan harga tetap, lelang tertutup, pembayaran, verifikasi, serah terima, hingga pelaporan dan pembatasan akun akibat pelanggaran pembayaran.

Aplikasi ini dikembangkan sebagai project tugas akhir akademik. Ruang Agunan bukan sistem resmi, bukan platform komersial, dan tidak terhubung dengan layanan internal lembaga mana pun. Seluruh fitur, data, dan alur dibuat untuk kebutuhan demonstrasi, pengujian konsep, dan dokumentasi pengembangan perangkat lunak.

### 1.1 Tujuan Produk

- Menyediakan katalog aset agunan berbasis web yang dapat dibuka oleh pengunjung dan pengguna terdaftar.
- Mendukung dua mekanisme pemasaran: Harga Tetap dan Lelang Tertutup.
- Menjaga kerahasiaan nominal penawaran selama periode Lelang Tertutup berlangsung.
- Memberikan workspace operasional untuk Admin Unit dalam mengelola aset, pemasaran, transaksi, verifikasi pembayaran, dan riwayat barang.
- Memberikan workspace nasional untuk Superadmin dalam memantau unit, admin, blacklist, kebijakan pelanggaran, dan performa lintas unit.
- Menyediakan dashboard laporan yang rapi untuk membaca tren nilai transaksi, volume transaksi, dan performa penjualan.
- Menyediakan pusat bantuan yang menjelaskan aturan utama dengan bahasa pengguna.
- Menjadi bahan tugas akhir yang dapat dipresentasikan sebagai prototype sistem informasi end-to-end.

### 1.2 Batasan Produk

- Tidak memakai payment gateway.
- Tidak mengirim email, SMS, atau WhatsApp otomatis.
- Pembayaran diverifikasi manual oleh Admin Unit.
- Data barang, buyer, unit, dan transaksi adalah data prototype.
- Lelang Tertutup dibuat untuk simulasi akademik, bukan layanan lelang resmi.
- Deploy production bersifat demonstrasi dan dapat berubah sesuai kebutuhan tugas akhir.

### 1.3 Keunggulan Aplikasi

Ruang Agunan memiliki beberapa keunggulan utama yang menjadi pembeda dibanding katalog transaksi biasa:

| Keunggulan | Penjelasan |
| --- | --- |
| Mekanisme Lelang Tertutup berbasis Vickrey Auction | Buyer memasukkan penawaran terbaik secara privat. Sistem menentukan pemenang setelah deadline, sehingga proses tidak bergantung pada negosiasi manual atau perang harga terbuka. |
| Privasi nominal bid | Nominal bid tidak terlihat oleh peserta lain, Admin Unit, maupun Superadmin sebelum lelang selesai. Hal ini menjaga strategi buyer dan mengurangi peluang intervensi selama lelang berjalan. |
| Encrypted escrow | Nominal bid disimpan dalam payload terenkripsi, sehingga data sensitif tidak dibuka sebelum waktu settlement. |
| Bid integrity | Setiap bid memiliki hash integrity berbasis pemasaran, user, nominal, dan salt. Hash ini dipakai untuk memastikan isi bid tidak berubah. |
| Settlement otomatis | Setelah deadline, backend membuka escrow, memvalidasi hash, menentukan pemenang, dan membuat transaksi pemenang secara otomatis. |
| Pembatasan akun bertingkat | Buyer yang menang tetapi tidak menyelesaikan pembayaran mendapat pelanggaran dan pembatasan fitur secara bertahap. |
| Role isolation | Guest, Buyer, Admin Unit, dan Superadmin memiliki cakupan akses berbeda. Admin Unit hanya mengelola data unitnya, sedangkan Superadmin mengawasi lintas unit. |
| Dashboard operasional | Admin Unit dan Superadmin mendapat chart nilai transaksi, filter periode, tooltip detail, dan ringkasan performa untuk mendukung pengambilan keputusan. |
| Audit trail | Perubahan barang, transaksi, blacklist, dan notifikasi memiliki catatan data yang dapat ditelusuri. |
| Dokumentasi tugas akhir | PRD dan README disusun agar penguji dapat memahami konteks produk, fitur, arsitektur, mekanisme unggulan, dan batasan akademik. |

### 1.4 Ringkasan Mekanisme End-to-End

Ruang Agunan menghubungkan seluruh proses dalam satu alur:

1. Admin Unit mencatat barang agunan beserta data pemilik, kategori, kondisi, estimasi, dan media.
2. Barang yang siap dipasarkan dipublikasikan sebagai Harga Tetap atau Lelang Tertutup.
3. Guest dan Buyer melihat katalog, filter barang, membaca detail, dan melihat statistik lot.
4. Buyer dapat menyimpan wishlist, membeli Harga Tetap, atau mengirim bid Lelang Tertutup.
5. Transaksi Harga Tetap berjalan melalui transfer dan unggah bukti pembayaran.
6. Lelang Tertutup berjalan privat sampai deadline, lalu settlement otomatis menentukan hasil.
7. Admin Unit memverifikasi pembayaran dan serah terima.
8. Buyer menerima notifikasi, melihat status transaksi, dan mencetak nota.
9. Jika pemenang Lelang Tertutup tidak membayar, sistem mencatat pelanggaran dan menerapkan pembatasan akun.
10. Superadmin memantau performa nasional, unit, admin, blacklist, dan kebijakan pelanggaran.

---

## 2. Persona dan Hak Akses

### 2.1 Guest

Guest adalah pengguna publik yang belum login.

Hak akses:

- Membuka beranda.
- Membuka katalog.
- Membuka detail barang.
- Melihat media, harga, unit, dan status pemasaran.
- Melihat pusat bantuan.
- Tidak dapat membeli, menyukai barang, mengirim bid, atau melihat transaksi.

### 2.2 Buyer

Buyer adalah pengguna terdaftar yang dapat mengikuti transaksi.

Hak akses:

- Login dan register.
- Membuka dashboard buyer.
- Mencari, memfilter, dan mengurutkan katalog.
- Melihat detail barang dengan media foto/video.
- Menyimpan barang ke wishlist.
- Membeli barang Harga Tetap.
- Mengirim bid pada Lelang Tertutup.
- Melihat transaksi, riwayat bid, notifikasi, profil, pelanggaran, dan pusat bantuan.
- Mengunggah bukti pembayaran untuk transaksi transfer.
- Menandai transaksi selesai setelah pembayaran dan serah terima valid.
- Melihat nota transaksi.
- Mengajukan bantuan terkait pembatasan akun.

### 2.3 Admin Unit

Admin Unit adalah operator unit yang mengelola aset dan transaksi unitnya sendiri.

Hak akses:

- Membuka dashboard unit.
- Mengelola barang agunan unit.
- Mengunggah dan menghapus media barang.
- Mencatat perpanjangan, penebusan, dan perubahan status barang.
- Menjadikan barang siap dipasarkan.
- Mempublikasikan barang sebagai Harga Tetap atau Lelang Tertutup.
- Melihat daftar pemasaran dan detail sesi pemasaran.
- Melihat peserta dan hasil Lelang Tertutup setelah lelang selesai.
- Memverifikasi pembayaran transfer dan bayar langsung.
- Menolak bukti pembayaran dengan alasan.
- Mengunggah bukti serah terima.
- Membaca riwayat transaksi dan riwayat barang.
- Melihat daftar pelanggaran/blacklist di unitnya.
- Membuka profil Admin Unit.

### 2.4 Superadmin

Superadmin adalah pengelola nasional lintas unit.

Hak akses:

- Membuka dashboard nasional.
- Mengelola unit dan rekening unit.
- Mengelola Admin Unit.
- Mengelola akun Superadmin.
- Melihat monitoring nasional dan monitoring per unit.
- Melihat transaksi lintas unit.
- Mengelola blacklist global dan detail pelanggaran.
- Mengatur kebijakan pelanggaran.
- Membuka profil Superadmin.
- Membaca notifikasi operasional.

---

## 3. Modul Produk

### 3.1 Beranda Publik

Beranda menjadi pintu masuk untuk memperkenalkan Ruang Agunan, menampilkan nilai utama aplikasi, dan mengarahkan pengguna ke katalog atau autentikasi.

Kebutuhan:

- Menampilkan identitas aplikasi Ruang Agunan.
- Menampilkan CTA ke katalog dan login/register.
- Menggunakan visual yang konsisten dengan brand hijau-emas.
- Tetap responsif pada desktop dan mobile.

### 3.2 Katalog dan Detail Barang

Katalog menampilkan barang yang sedang dipasarkan dan masih aktif.

Fitur:

- Kartu barang dengan media utama.
- Filter keyword, kategori, mode pemasaran, unit, dan rentang harga.
- Sortir berdasarkan terbaru, populer, harga, dan waktu lelang.
- Badge mode Harga Tetap atau Lelang Tertutup.
- Statistik ringkas lot: dilihat, disukai, dan peserta.
- Detail barang dengan galeri media, deskripsi, spesifikasi, harga, unit, dan CTA.
- Tombol wishlist untuk buyer yang sudah login.

Aturan:

- Barang yang sudah selesai, gagal, ditebus, atau tidak aktif tidak muncul sebagai barang tersedia.
- Guest dapat melihat katalog tetapi tidak dapat melakukan aksi transaksi.
- Statistik katalog hanya bersifat informatif dan tidak memengaruhi hasil lelang.

### 3.3 Wishlist Buyer

Wishlist membantu buyer menyimpan barang yang diminati.

Fitur:

- Tambah/hapus wishlist dari katalog atau detail.
- Halaman wishlist khusus buyer.
- Filter mode, kategori, kondisi, unit, rentang harga, dan sortir.
- Tampilan grid/list.
- Pemisahan barang aktif dan barang yang sudah tidak tersedia.
- Badge jumlah wishlist pada navbar.

Aturan:

- Wishlist hanya dapat dimutasi oleh buyer aktif.
- Kombinasi user dan barang pemasaran harus unik.
- Barang tidak tersedia tetap dapat ditampilkan sebagai arsip wishlist agar pengguna paham perubahan status.

### 3.4 Harga Tetap

Harga Tetap adalah alur pembelian langsung dengan harga yang sudah ditentukan.

Alur buyer:

1. Buyer membuka barang berlabel Harga Tetap.
2. Buyer menekan tombol beli.
3. Sistem membuat transaksi transfer dengan batas waktu pembayaran.
4. Buyer melakukan transfer sesuai nominal dan rekening tujuan.
5. Buyer mengunggah bukti transfer.
6. Admin Unit memverifikasi atau menolak pembayaran.
7. Setelah lunas, buyer menyelesaikan transaksi.
8. Nota dapat dibuka dan dicetak.

Aturan:

- Transaksi Harga Tetap hanya menggunakan metode transfer.
- Transfer membutuhkan bukti pembayaran dari buyer.
- Admin Unit wajib memverifikasi sebelum status menjadi lunas.
- Barang tidak boleh kembali tampil di katalog setelah transaksi selesai.

### 3.5 Lelang Tertutup

Lelang Tertutup adalah alur penawaran privat yang menggunakan konsep Vickrey Auction. Pada konsep ini, buyer didorong memasukkan penawaran terbaik sesuai nilai yang benar-benar ia sanggupi, karena proses pemenang dan harga akhir dihitung oleh sistem setelah periode lelang selesai. Mekanisme ini membuat buyer tidak perlu menebak strategi peserta lain selama lelang berjalan.

Alur buyer:

1. Buyer membuka barang berlabel Lelang Tertutup.
2. Buyer membaca detail barang, harga dasar, unit, dan batas akhir.
3. Buyer mengisi nominal penawaran minimal sama dengan harga dasar.
4. Sistem menampilkan modal persetujuan konsekuensi pembayaran.
5. Buyer wajib menyetujui aturan sebelum mengirim bid.
6. Sistem menyimpan bid secara tertutup.
7. Selama lelang berjalan, nominal bid tidak terlihat oleh peserta lain, Admin Unit, maupun Superadmin.
8. Setelah deadline, backend menentukan hasil lelang secara otomatis.
9. Jika menang, sistem membuat transaksi bayar langsung di unit.
10. Jika tidak menang, buyer dapat membuka halaman hasil bukan pemenang.

Konsep Vickrey Auction:

- Semua peserta mengirim bid secara tertutup.
- Pemenang ditentukan dari bid valid tertinggi.
- Harga akhir dihitung saat settlement selesai: jika ada lebih dari satu bid valid, harga akhir mengacu pada bid valid tertinggi kedua; jika hanya ada satu bid valid, harga akhir memakai harga dasar.
- Jika terdapat nilai tertinggi yang sama, sistem memakai waktu bid paling awal sebagai tie-breaker.
- Pada kondisi nilai tertinggi sama, harga akhir mengikuti nilai bid yang sama tersebut karena bid runner-up memiliki nominal setara.
- Jika tidak ada bid valid, sesi dinyatakan gagal dan barang dapat dipasarkan ulang.

Mekanisme encrypted escrow:

1. Saat buyer mengirim bid, client menyiapkan nominal dan salt.
2. Sistem membuat `bidHash` menggunakan SHA-256 dari kombinasi `pemasaranId:userId:nominal:salt`.
3. Backend memvalidasi hash tersebut sebelum menyimpan bid.
4. Nominal bid dan salt disimpan sebagai encrypted escrow menggunakan AES-256-GCM.
5. AAD atau Additional Authenticated Data mengikat payload terenkripsi ke `pemasaranId`, `userId`, dan `bidHash`.
6. Sebelum deadline, kolom nominal terbuka tidak diisi, sehingga Admin Unit dan Superadmin tidak membaca angka bid.
7. Setelah deadline, cron/backend membuka escrow menggunakan secret server.
8. Payload hasil decrypt diverifikasi ulang dengan hash integrity.
9. Bid yang valid dipakai untuk menentukan pemenang, harga akhir, dan transaksi pemenang.

Keunggulan mekanisme ini:

- Privasi peserta lebih kuat karena nominal bid tidak tampil selama lelang aktif.
- Admin Unit dan Superadmin tetap bisa mengawasi sesi tanpa mengetahui angka bid sebelum waktunya.
- Hash integrity membantu membuktikan bahwa nominal dan salt tidak berubah.
- AES-256-GCM memberi perlindungan confidentiality dan authenticity pada payload bid.
- Settlement dilakukan otomatis, mengurangi keputusan manual yang berpotensi tidak konsisten.
- Buyer mendapat alur hasil yang jelas: menang, tidak menang, atau sesi gagal.

Aturan:

- Satu buyer hanya dapat mengirim satu bid pada satu sesi lelang.
- Bid tidak dapat diubah atau dibatalkan setelah dikirim.
- Nominal bid tidak boleh tampil sebelum deadline.
- Admin Unit dan Superadmin hanya dapat melihat hasil setelah lelang berakhir.
- Pemenang wajib menyelesaikan pembayaran sesuai batas waktu.
- Gagal membayar dapat menghasilkan pelanggaran dan pembatasan akun.

### 3.6 Transaksi Buyer

Halaman transaksi menjadi pusat status pembayaran buyer.

Fitur:

- Daftar transaksi aktif dan riwayat.
- Detail transaksi dengan status, barang, unit, pembayaran, dan instruksi.
- Upload bukti pembayaran.
- Komplain atau catatan serah terima jika diperlukan.
- Nota transaksi setelah pembayaran valid.
- Halaman pemenang Lelang Tertutup.
- Halaman bukan pemenang Lelang Tertutup.

Status transaksi:

- `menunggu_pembayaran`
- `bukti_diunggah`
- `ditolak_bukti`
- `menunggu_konfirmasi_langsung`
- `lunas`
- `selesai`
- `gagal`

### 3.7 Notifikasi In-App

Notifikasi memberi informasi penting untuk buyer, admin, dan superadmin.

Fitur:

- Badge jumlah belum dibaca.
- Daftar notifikasi pada menu pengguna.
- Tandai satu notifikasi atau semua notifikasi sebagai dibaca.
- Notifikasi untuk transaksi, pembayaran, hasil lelang, pelanggaran, dan keputusan review.

Kebutuhan teknis:

- Notifikasi disimpan di database.
- Polling digunakan untuk mengambil data terbaru.
- Mutasi notifikasi harus dibatasi berdasarkan user aktif.

### 3.8 Pusat Bantuan

Pusat Bantuan menjelaskan aturan penting dengan bahasa yang mudah dipahami.

Fitur:

- FAQ pencarian.
- Penjelasan fitur bidding terkunci.
- Penjelasan mekanisme Lelang Tertutup.
- Penjelasan strategi bid dengan narasi non-teknis.
- Penjelasan Harga Tetap, pengambilan barang, pembatasan Level 2, durasi pembatasan, level sanksi, dan disclaimer transaksi.
- Jawaban FAQ rata kiri-kanan agar tampilan lebih rapi.

Kebutuhan konten:

- Tidak memakai bahasa teknis berlebihan pada jawaban untuk pengguna umum.
- Menekankan bahwa nominal bid tidak diketahui peserta lain, Admin Unit, maupun Superadmin sebelum lelang selesai.
- Menjaga narasi tetap informatif tanpa membocorkan detail teknis yang tidak perlu pada halaman bantuan publik.

### 3.9 Admin Unit: Dashboard

Dashboard Admin Unit memberikan ringkasan operasional unit.

Fitur:

- Header brand Ruang Agunan.
- Ringkasan barang, pemasaran, transaksi, dan status unit.
- Laporan tren penjualan.
- Filter periode laporan: hari ini, 7 hari, 30 hari, 3 bulan, 12 bulan, bulan berjalan, tahun berjalan, semua waktu, dan rentang kustom.
- Chart Laporan Tren Penjualan dengan dua seri: Harga Tetap dan Lelang Tertutup.
- Sumbu Y berbasis nilai transaksi dalam Rupiah juta.
- Tooltip hover yang menampilkan tanggal, total nilai, rincian Harga Tetap, Lelang Tertutup, dan volume transaksi.
- Titik/garis tidak ditampilkan pada tanggal dengan nilai 0, tetapi area chart tetap bisa disorot untuk membaca tooltip tanggal tersebut.
- Label sumbu X diringkas agar tidak bertumpuk.

### 3.10 Admin Unit: Kelola Barang

Modul Kelola Barang mengatur siklus aset unit.

Fitur:

- Tambah barang.
- Detail barang.
- Edit barang.
- Upload media foto/video.
- Hapus media.
- Perpanjang masa barang.
- Tebus barang.
- Jadikan jaminan.
- Pasarkan barang.
- Pasarkan ulang barang gagal.
- Riwayat barang dan kronologi status.

Aturan:

- Admin Unit hanya melihat dan mengelola barang milik unitnya.
- Perubahan status harus tercatat sebagai riwayat.
- Barang yang sudah dipasarkan memiliki batasan edit agar tidak mengacaukan data transaksi.

### 3.11 Admin Unit: Pemasaran

Pemasaran memiliki dua area utama:

- Harga Tetap.
- Lelang Tertutup.

Fitur:

- Daftar sesi pemasaran.
- Detail sesi pemasaran.
- Countdown untuk Lelang Tertutup.
- Hasil lelang setelah deadline.
- Informasi pemenang dan transaksi setelah lelang selesai.
- Isolasi nominal bid sebelum lelang selesai.

### 3.12 Admin Unit: Transaksi

Transaksi Admin Unit mengelola pembayaran dan arsip transaksi.

Fitur:

- Verifikasi pembayaran.
- Riwayat transaksi.
- Detail transaksi.
- Verifikasi transfer.
- Tolak bukti pembayaran dengan alasan.
- Konfirmasi bayar langsung.
- Upload bukti serah terima.
- Cetak nota.

Kebutuhan UI:

- Daftar transaksi berbentuk list per baris agar mudah dipindai.
- Status kerja harus jelas.
- Detail transaksi tidak boleh overflow pada email, nomor, atau teks panjang.

### 3.13 Admin Unit: Pelanggaran dan Blacklist

Admin Unit dapat membaca pelanggaran yang berkaitan dengan unitnya.

Fitur:

- Daftar blacklist unit.
- Detail blacklist user.
- Perpanjang pembatasan jika diperlukan.
- Membaca riwayat pelanggaran.

Aturan:

- Admin Unit tidak menjadi pengambil keputusan nasional final.
- Data yang tampil tetap dibatasi pada cakupan unit.

### 3.14 Superadmin: Dashboard Nasional

Dashboard Superadmin menampilkan ringkasan lintas unit.

Fitur:

- Ringkasan unit, admin, barang, transaksi, dan pelanggaran.
- Tren nilai transaksi tervalidasi.
- Chart dua seri Harga Tetap dan Lelang Tertutup.
- Tooltip dengan rincian nilai dan volume transaksi.
- Filter periode dan rentang kustom.
- Legend chart berbentuk lingkaran agar konsisten dengan marker chart.

### 3.15 Superadmin: Unit, Admin, dan Akun

Fitur:

- Kelola unit.
- Detail unit.
- Kelola rekening unit.
- Kelola Admin Unit.
- Kelola akun Superadmin.
- Reset password akun.
- Aktivasi/nonaktivasi akun sesuai kebutuhan operasional.

### 3.16 Superadmin: Monitoring dan Kebijakan

Fitur:

- Monitoring nasional.
- Monitoring per unit.
- Transaksi lintas unit.
- Kebijakan pelanggaran.
- Blacklist global.
- Detail blacklist.
- Cabut blacklist.

---

## 4. Model Data Utama

| Entitas | Fungsi |
| --- | --- |
| `users` | Data akun dan role pengguna. |
| `buyer_profiles` | Profil tambahan buyer. |
| `units` | Data unit pelaksana. |
| `unit_accounts` | Rekening pembayaran unit. |
| `barang` | Data aset agunan. |
| `media_barang` | Foto/video barang. |
| `pemasaran` | Sesi pemasaran Harga Tetap atau Lelang Tertutup. |
| `pemasaran_views` | Statistik view unik lot. |
| `buyer_wishlist` | Relasi wishlist buyer dan pemasaran. |
| `bids` | Data bid Lelang Tertutup. |
| `transaksi` | Data transaksi pembayaran. |
| `pelanggaran_user` | Riwayat pelanggaran pembayaran. |
| `blacklist` | Status pembatasan akun. |
| `blacklist_action_log` | Audit tindakan blacklist. |
| `notifications` | Notifikasi in-app. |
| `riwayat_status_barang` | Kronologi perubahan status barang. |
| `riwayat_perpanjangan` | Riwayat perpanjangan barang. |

---

## 5. Mekanisme Teknis Lelang Tertutup

### 5.1 Komponen Keamanan Bid

| Komponen | Fungsi |
| --- | --- |
| `salt` | Nilai acak dari client agar hash bid tidak mudah ditebak. |
| `bidHash` | SHA-256 dari `pemasaranId:userId:nominal:salt` untuk mengecek integritas bid. |
| `encrypted_bid_payload` | Payload terenkripsi yang berisi nominal dan salt. |
| AES-256-GCM | Algoritma enkripsi untuk menjaga isi escrow tetap rahasia dan terautentikasi. |
| AAD | Data tambahan yang mengikat escrow ke konteks pemasaran, user, dan hash. |
| `VICKREY_ESCROW_SECRET` | Secret server untuk membuka escrow saat settlement. |

### 5.2 Alur Submit Bid

```text
Buyer memasukkan nominal
  -> client membuat salt
  -> client/backend membuat bidHash
  -> backend memvalidasi hash
  -> nominal + salt dienkripsi sebagai escrow
  -> database menyimpan bidHash dan encrypted payload
  -> nominal plaintext tidak dibuka sebelum deadline
```

### 5.3 Alur Settlement

```text
Deadline lelang tercapai
  -> cron/backend mengambil sesi yang selesai
  -> setiap escrow bid dibuka
  -> hash integrity diverifikasi ulang
  -> bid valid diurutkan berdasarkan nominal tertinggi
  -> jika nominal sama, bid paling awal menang
  -> sistem membuat transaksi untuk pemenang
  -> buyer dan admin menerima status hasil
```

### 5.4 Nilai Unggul Settlement Otomatis

- Keputusan pemenang tidak dilakukan manual oleh admin.
- Nominal bid baru terbuka setelah waktu yang ditetapkan.
- Hasil dapat diaudit melalui data bid, hash, waktu submit, transaksi, dan notifikasi.
- Jika pemenang tidak membayar, sistem mencatat pelanggaran dan memproses blacklist bertingkat.
- Buyer tidak perlu melakukan reveal manual pada alur escrow baru, karena backend dapat membuka escrow otomatis setelah deadline.

---

## 6. State Machine

### 6.1 Status Barang

```text
gadai
  -> jaminan
  -> ditebus

jaminan
  -> dipasarkan
  -> ditebus

dipasarkan + Harga Tetap
  -> menunggu_pembayaran
  -> terjual

dipasarkan + Lelang Tertutup
  -> menunggu_pembayaran jika ada pemenang
  -> gagal jika tidak ada pemenang atau pembayaran overdue
  -> terjual setelah selesai
```

### 6.2 Status Transaksi

```text
Harga Tetap transfer:
menunggu_pembayaran -> bukti_diunggah -> lunas -> selesai
menunggu_pembayaran -> bukti_diunggah -> ditolak_bukti -> bukti_diunggah

Lelang Tertutup bayar langsung:
menunggu_konfirmasi_langsung -> lunas -> selesai
menunggu_konfirmasi_langsung -> gagal jika melewati batas pembayaran
```

### 6.3 Level Pembatasan

| Level | Dampak | Durasi |
| --- | --- | --- |
| Level 1 | Buyer tidak bisa menawar pada Lelang Tertutup, tetapi masih bisa membeli barang Harga Tetap | 7 hari |
| Level 2 | Buyer tidak bisa menawar pada Lelang Tertutup dan tidak bisa membeli barang Harga Tetap | 30 hari |
| Level 3+ | Akun buyer ditangguhkan sehingga tidak bisa login masuk ke dalam sistem | 365 hari |

---

## 7. Route Utama

### 7.1 Public dan Buyer

| Route | Fungsi |
| --- | --- |
| `/` | Beranda publik. |
| `/katalog` | Katalog barang. |
| `/katalog/[id]` | Detail barang. |
| `/katalog/[id]/beli` | Konfirmasi pembelian Harga Tetap. |
| `/katalog/[id]/bid` | Form bid Lelang Tertutup. |
| `/login` | Login. |
| `/register` | Register buyer. |
| `/dashboard` | Dashboard buyer. |
| `/wishlist` | Wishlist buyer. |
| `/transaksi` | Daftar transaksi buyer. |
| `/transaksi/[id]` | Detail transaksi buyer. |
| `/transaksi/[id]/pemenang` | Halaman pemenang Lelang Tertutup. |
| `/transaksi/[id]/nota` | Nota buyer. |
| `/riwayat-bid` | Riwayat bid buyer. |
| `/riwayat-bid/[pemasaranId]/bukan-pemenang` | Halaman bukan pemenang. |
| `/riwayat-bid/[pemasaranId]/verifikasi` | Verifikasi integritas bid. |
| `/pelanggaran` | Status pelanggaran buyer. |
| `/profil` | Profil buyer. |
| `/bantuan` | Pusat Bantuan. |

### 7.2 Admin Unit

| Route | Fungsi |
| --- | --- |
| `/admin` | Dashboard Admin Unit. |
| `/admin/barang` | Kelola barang. |
| `/admin/barang/tambah` | Tambah barang. |
| `/admin/barang/riwayat` | Riwayat barang. |
| `/admin/barang/[id]` | Detail barang. |
| `/admin/barang/[id]/edit` | Edit barang. |
| `/admin/barang/[id]/perpanjang` | Perpanjang barang. |
| `/admin/barang/[id]/tebus` | Tebus barang. |
| `/admin/barang/[id]/jadikan-jaminan` | Ubah menjadi jaminan. |
| `/admin/barang/[id]/pasarkan` | Pasarkan barang. |
| `/admin/barang/[id]/pasarkan-ulang` | Pasarkan ulang barang gagal. |
| `/admin/pemasaran` | Landing pemasaran. |
| `/admin/pemasaran/fixed-price` | Pemasaran Harga Tetap. |
| `/admin/pemasaran/fixed-price/[id]` | Detail Harga Tetap. |
| `/admin/pemasaran/vickrey-auction` | Pemasaran Lelang Tertutup. |
| `/admin/pemasaran/vickrey-auction/[id]` | Detail Lelang Tertutup. |
| `/admin/transaksi` | Landing transaksi. |
| `/admin/transaksi/verifikasi-pembayaran` | Verifikasi pembayaran. |
| `/admin/transaksi/riwayat` | Riwayat transaksi. |
| `/admin/transaksi/[id]` | Detail transaksi admin. |
| `/admin/transaksi/[id]/nota` | Nota admin. |
| `/admin/blacklist` | Blacklist unit. |
| `/admin/blacklist/[userId]` | Detail blacklist. |
| `/admin/profil` | Profil Admin Unit. |

### 7.3 Superadmin

| Route | Fungsi |
| --- | --- |
| `/superadmin` | Dashboard nasional. |
| `/superadmin/unit` | Kelola unit. |
| `/superadmin/unit/[id]` | Detail unit. |
| `/superadmin/unit/[id]/rekening` | Rekening unit. |
| `/superadmin/admin` | Kelola Admin Unit. |
| `/superadmin/manajemen-unit` | Workspace manajemen unit. |
| `/superadmin/manajemen-superadmin` | Kelola akun Superadmin. |
| `/superadmin/monitoring` | Monitoring nasional. |
| `/superadmin/monitoring-unit` | Monitoring per unit. |
| `/superadmin/kebijakan-pelanggaran` | Kebijakan pelanggaran. |
| `/superadmin/blacklist` | Blacklist global. |
| `/superadmin/blacklist/detail/[id]` | Detail blacklist global. |
| `/superadmin/profil` | Profil Superadmin. |

---

## 8. API Utama

| Area | Endpoint |
| --- | --- |
| Auth | `/api/auth/[...all]`, `/api/auth/me`, `/api/auth/logout` |
| Public | `/api/public/lots/[pemasaranId]/stats`, `/uploads/[...path]` |
| Buyer | `/api/user/beli/[pemasaranId]`, `/api/user/bid/[pemasaranId]`, `/api/user/transaksi`, `/api/user/wishlist/[pemasaranId]`, `/api/user/notifikasi`, `/api/user/profil` |
| Admin Unit | `/api/admin/barang`, `/api/admin/lelang`, `/api/admin/transaksi`, `/api/admin/blacklist`, `/api/admin/profil`, `/api/admin/notifikasi` |
| Superadmin | `/api/superadmin/unit`, `/api/superadmin/admin`, `/api/superadmin/accounts`, `/api/superadmin/monitoring`, `/api/superadmin/blacklist`, `/api/superadmin/profil`, `/api/superadmin/notifikasi` |
| Cron | `/api/cron/proses-lelang` |

---

## 9. Security, Privacy, dan Integrity

| Area | Kebutuhan |
| --- | --- |
| Auth | Better Auth mengelola session dan role. |
| Role guard | Halaman dan API memeriksa role buyer, admin_unit, atau super_admin. |
| Isolasi unit | Admin Unit hanya boleh membaca dan memutasi data unitnya. |
| Lelang Tertutup | Nominal bid tidak tampil sebelum deadline. |
| Privasi admin | Admin Unit dan Superadmin tidak mengetahui nominal bid peserta sebelum lelang selesai. |
| Encrypted escrow | Nominal dan salt disimpan dalam payload terenkripsi AES-256-GCM. |
| Bid integrity | SHA-256 dipakai untuk membuktikan nominal, user, pemasaran, dan salt tetap konsisten. |
| AAD escrow | Payload terenkripsi diikat ke konteks pemasaran, user, dan bidHash agar tidak bisa dipindah ke konteks lain. |
| Settlement | Escrow hanya dibuka setelah deadline oleh proses backend/cron. |
| Upload | File media, bukti pembayaran, dan bukti serah terima perlu validasi tipe dan ukuran. |
| Cron | Endpoint cron dilindungi secret. |
| Notifikasi | User hanya dapat membaca/mutasi notifikasinya sendiri. |
| Public data | Endpoint publik hanya mengembalikan data yang aman ditampilkan. |
| Audit | Perubahan penting perlu tercatat di riwayat atau log. |

---

## 10. UI/UX Requirements

### 10.1 Prinsip Umum

- Visual mengikuti brand Ruang Agunan dengan nuansa hijau, putih, dan aksen emas.
- Layout admin harus operasional, padat, dan mudah dipindai.
- Layout buyer harus ramah pengguna, informatif, dan jelas untuk transaksi.
- Informasi status harus mudah dikenali.
- Teks panjang tidak boleh overflow.
- Chart laporan harus bersih, tidak penuh label, dan mendukung tooltip.
- Kontrol filter periode harus stabil dan tidak menggeser layout secara ekstrem.

### 10.2 Dashboard dan Chart

- Chart Admin Unit dan Superadmin memakai dua seri Harga Tetap dan Lelang Tertutup.
- Legend menggunakan marker bulat.
- Sumbu Y pada laporan penjualan berbasis nilai transaksi.
- Sumbu X hanya menampilkan label terpilih agar tetap rapi.
- Tooltip dapat dibaca saat area chart disorot, termasuk tanggal dengan nilai 0.
- Tanggal di luar bulan pada date range picker tampil lebih transparan.

### 10.3 Pusat Bantuan

- FAQ dapat dicari.
- Jawaban rata kiri-kanan.
- Bahasa jawaban untuk buyer harus non-teknis.
- Mekanisme yang terlalu internal tidak perlu dibocorkan pada halaman bantuan.

---

## 11. Non-Functional Requirements

| Aspek | Target |
| --- | --- |
| Responsiveness | Desktop dan mobile harus dapat digunakan. |
| Maintainability | Business logic utama berada di service layer. |
| Performance | Katalog, wishlist, dan dashboard memakai data terfilter. |
| Reliability | Cron settlement dan overdue payment menjadi sumber kebenaran. |
| Print | Nota memiliki layout khusus print. |
| Accessibility | Tombol, link, form, dan dialog memiliki label/role yang jelas. |
| Deployment | Dockerfile mendukung Next.js standalone output. |
| Testing | Unit/integration test menggunakan Vitest untuk logic penting. |

---

## 12. Acceptance Criteria

### Buyer

- Guest dapat melihat beranda, katalog, detail barang, dan bantuan.
- Buyer dapat register, login, membuka dashboard, katalog, wishlist, transaksi, riwayat bid, pelanggaran, profil, dan bantuan.
- Buyer dapat membeli Harga Tetap.
- Buyer dapat mengirim bid Lelang Tertutup.
- Buyer dapat melihat hasil menang/kalah.
- Buyer dapat menerima notifikasi in-app.
- Buyer dapat mencetak nota setelah transaksi valid.

### Admin Unit

- Admin Unit dapat mengelola barang unitnya.
- Admin Unit dapat memasarkan barang sebagai Harga Tetap atau Lelang Tertutup.
- Admin Unit dapat memverifikasi pembayaran.
- Admin Unit dapat membaca riwayat barang dan riwayat transaksi.
- Admin Unit dapat membaca dashboard penjualan dengan chart dua seri.
- Admin Unit tidak dapat melihat nominal bid sebelum lelang selesai.

### Superadmin

- Superadmin dapat membaca dashboard nasional.
- Superadmin dapat mengelola unit, rekening, admin, dan akun superadmin.
- Superadmin dapat membaca monitoring dan blacklist global.
- Superadmin dapat mengatur kebijakan pelanggaran.
- Superadmin dapat membaca chart transaksi nasional dua seri.
- Superadmin tidak dapat melihat nominal bid sebelum lelang selesai.

### Dokumentasi

- README menjelaskan bahwa project hanya untuk tugas akhir.
- README memakai nama Ruang Agunan.
- README menyediakan tempat screenshot dengan format penamaan yang jelas.
- README mencantumkan identitas mahasiswa secara rapi.

---

## 13. Out of Scope

- Payment gateway production.
- Integrasi sistem resmi pihak ketiga.
- Mobile native app.
- Realtime WebSocket.
- Chat buyer-admin.
- Pengiriman barang/logistik.
- Email/SMS/WhatsApp otomatis.
- Akuntansi lengkap.
- Sistem produksi berskala enterprise.

---

## 14. Glosarium

| Istilah | Definisi |
| --- | --- |
| Ruang Agunan | Nama aplikasi tugas akhir. |
| Aset agunan | Barang yang dikelola dan dipasarkan di aplikasi. |
| Harga Tetap | Mekanisme pembelian langsung dengan harga yang sudah ditentukan. |
| Lelang Tertutup | Mekanisme penawaran privat sampai periode lelang selesai. |
| Vickrey Auction | Konsep lelang tertutup: pemenang ditentukan dari bid valid tertinggi, dan harga akhir dihitung saat settlement sesuai aturan sistem. |
| Encrypted Escrow | Penyimpanan sementara nominal bid dalam bentuk terenkripsi sampai deadline lelang tercapai. |
| AES-256-GCM | Algoritma enkripsi yang menjaga payload bid tetap rahasia dan terautentikasi. |
| SHA-256 | Algoritma hash yang dipakai untuk membuat bid integrity hash. |
| Salt | Nilai tambahan agar hash bid lebih unik dan tidak mudah ditebak. |
| AAD | Additional Authenticated Data, data konteks yang mengikat escrow ke pemasaran, user, dan hash tertentu. |
| Settlement | Proses backend setelah deadline untuk membuka escrow, memvalidasi bid, menentukan pemenang, dan membuat transaksi. |
| Buyer | Pengguna yang dapat membeli atau mengikuti lelang. |
| Admin Unit | Operator unit pelaksana. |
| Superadmin | Pengelola lintas unit. |
| Wishlist | Daftar barang yang disimpan buyer. |
| Transaksi | Catatan pembayaran dan penyelesaian pembelian. |
| Nota | Bukti transaksi setelah pembayaran valid. |
| Blacklist | Pembatasan akun akibat pelanggaran pembayaran. |
| Cron | Proses backend terjadwal untuk settlement dan pengecekan overdue. |
