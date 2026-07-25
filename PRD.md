# Product Requirements Document (PRD)

## Ruang Agunan

**Versi:** 7.0  
**Status:** Living PRD — diselaraskan dengan implementasi pada 25 Juli 2026  
**Konteks:** Prototype tugas akhir Teknik Informatika  
**Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, PostgreSQL, Drizzle ORM, Better Auth, Vitest, Docker

---

## 1. Ringkasan Produk

Ruang Agunan adalah prototype aplikasi web untuk mengelola siklus barang agunan: pencatatan barang, masa gadai, pemasaran, transaksi Harga Tetap, Lelang Tertutup, bukti pembayaran, serah-terima, riwayat, notifikasi, dan pengawasan lintas unit.

Aplikasi ini dirancang sebagai simulasi akademik end-to-end. Aset, identitas, transaksi, rekening, dan proses pembayaran di dalamnya adalah data prototype. Ruang Agunan bukan layanan resmi Pegadaian dan tidak terhubung ke sistem atau layanan internal lembaga mana pun.

### 1.1 Tujuan

- Memberikan katalog publik untuk barang yang sedang dipasarkan.
- Memisahkan kewenangan Buyer, Admin Unit, dan Superadmin.
- Menyediakan dua mekanisme pemasaran: Harga Tetap dan Lelang Tertutup Vickrey.
- Menjaga informasi bid tertutup pada antarmuka dan respons aplikasi selama sesi lelang aktif.
- Mendukung bukti pembayaran, verifikasi manual oleh Admin Unit, bukti serah-terima, nota, dan riwayat transaksi.
- Menyediakan monitoring unit, laporan nasional, serta pembatasan akun bertingkat bagi pelanggaran pembayaran lelang.

### 1.2 Batasan Produk

- Tidak menggunakan payment gateway, email, SMS, atau WhatsApp otomatis.
- Pembayaran Harga Tetap menggunakan transfer dan diverifikasi manual oleh Admin Unit.
- Pembayaran pemenang Lelang Tertutup dikonfirmasi langsung oleh Admin Unit di unit terkait.
- Database adalah area internal untuk operator berwenang; aplikasi tidak menjadikan akses database mentah sebagai akses publik.
- Lelang, blacklist, dan data pembayaran dipakai untuk demonstrasi konsep, bukan dasar transaksi hukum atau finansial nyata.

---

## 2. Peran dan Otorisasi

| Peran | Ruang lingkup utama |
| --- | --- |
| Guest | Melihat beranda, katalog, detail barang, dan pusat bantuan. Tidak dapat bertransaksi. |
| Buyer | Registrasi/login, wishlist, pembelian Harga Tetap, bid Lelang Tertutup, pembayaran, transaksi, nota, notifikasi, profil, dan riwayat pelanggaran pribadi. |
| Admin Unit | Mengelola barang, media, masa gadai, pemasaran, transaksi, bukti pembayaran, bukti serah-terima, dan data operasional unitnya sendiri. |
| Superadmin | Mengelola unit, rekening unit, Admin Unit, akun Superadmin, monitoring nasional, transaksi lintas unit, blacklist, dan kebijakan pelanggaran. |

Aturan otorisasi:

- Session dibaca melalui Better Auth dan guard server memeriksa role pada halaman maupun API.
- Admin Unit dibatasi oleh `unitId`; ia tidak boleh mengelola barang atau transaksi unit lain.
- Buyer hanya dapat memutasi wishlist, bid, profil, dan transaksi miliknya sendiri.
- Superadmin memiliki cakupan lintas unit, tetapi tetap menggunakan endpoint dan guard yang terpisah dari Admin Unit.

---

## 3. Alur Barang Agunan

### 3.1 Input dan masa gadai

Admin Unit mengisi nama barang, kategori, kondisi, spesifikasi kategori, nilai taksiran, nomor nasabah, nama penggadai, deskripsi, dan media foto/video. Nilai taksiran menggunakan prefiks Rupiah pada sisi kiri input.

Saat input barang, Admin Unit memilih **tanggal jatuh tempo** melalui kalender dan dapat mengatur **jam, menit, serta detik**. Pengaturan sampai detik disediakan agar skenario demonstrasi, misalnya jatuh tempo lima menit, dapat diuji tanpa menunggu berhari-hari.

### 3.2 Aturan pemasaran setelah jatuh tempo

Barang berstatus `gadai` atau `jaminan` belum boleh dipasarkan selama `dueDate` masih berada di masa depan. Tombol **Pasarkan Barang** tampil nonaktif sampai waktu tersebut terlewati, dan backend juga menolak permintaan pemasaran yang dipaksakan sebelum jatuh tempo. Ini penting karena pembatasan tidak hanya bergantung pada tampilan.

Setelah jatuh tempo:

1. Admin Unit memilih mode pemasaran.
2. Sistem membuat sesi pemasaran baru dan mengubah status barang menjadi `dipasarkan`.
3. Riwayat perubahan status barang dicatat.
4. Barang dapat tampil pada katalog sesuai aturan mode dan status aktif.

### 3.3 Status barang

| Status | Arti operasional |
| --- | --- |
| `gadai` / `jaminan` | Barang berada dalam masa gadai atau siap dikelola, tetapi belum dipasarkan. |
| `dipasarkan` | Barang memiliki sesi pemasaran aktif. |
| `menunggu_pembayaran` | Ada proses pembayaran yang belum selesai/diverifikasi. |
| `terjual` / `selesai` | Pembayaran dan serah-terima telah diselesaikan. |
| `gagal` | Sesi pemasaran atau transaksi gagal dan dapat dievaluasi untuk pemasaran ulang sesuai aturan. |
| `ditebus` | Barang ditebus oleh pemilik sehingga tidak tersedia untuk pemasaran. |

### 3.4 Pemasaran ulang dan urutan katalog

Jika bukti pembayaran Harga Tetap ditolak, pemasaran dapat dikembalikan ke katalog melalui iterasi pemasaran baru. Sistem menyimpan `iteration` pada sesi pemasaran dan memakai waktu pembuatan sesi baru sebagai dasar urutan katalog. Karena itu, barang yang benar-benar baru dipasarkan atau dipasarkan ulang tampil pada posisi teratas; sesi lama tetap menjadi riwayat dan tidak mengubah urutan sesi aktif baru.

---

## 4. Katalog Publik dan Wishlist

### 4.1 Katalog

Katalog hanya menampilkan pemasaran aktif dari unit aktif dan barang berstatus `dipasarkan`.

Fitur yang tersedia:

- Pencarian, filter kategori, mode pemasaran, unit, dan rentang harga.
- Pengurutan sesuai konteks katalog, termasuk pemasaran terbaru dan lelang yang segera berakhir.
- Kartu barang dengan media utama, kondisi, harga atau harga dasar, unit, dan badge mode.
- Detail barang dengan galeri media, spesifikasi, deskripsi, data unit, CTA, dan statistik agregat.
- Statistik lot berupa jumlah tayangan, wishlist, dan peserta; statistik ini informatif dan tidak memengaruhi hasil lelang.

### 4.2 Wishlist

Buyer dapat menambah atau menghapus barang dari wishlist melalui katalog atau detail barang. Relasi wishlist dibuat unik per buyer dan pemasaran. Barang yang sudah tidak tersedia dapat tetap muncul sebagai arsip agar buyer memahami perubahan statusnya.

---

## 5. Harga Tetap

### 5.1 Alur Buyer

1. Buyer membuka barang Harga Tetap dan memilih beli.
2. Sistem membuat transaksi transfer sesuai harga tetap dan rekening unit.
3. Buyer melakukan transfer lalu mengunggah bukti pembayaran (JPG, PNG, atau PDF; maksimum 5 MB).
4. Status berubah menjadi menunggu verifikasi bukti pembayaran oleh Admin Unit.
5. Admin Unit menyetujui atau menolak bukti dengan alasan.
6. Setelah pembayaran terverifikasi, Admin Unit mengunggah bukti serah-terima.
7. Buyer dapat menyelesaikan transaksi dan membuka/cetak nota sesuai status yang tersedia.

### 5.2 Aturan penting

- Judul proses operasional memakai istilah **Verifikasi Bukti Pembayaran Pembelian Barang Harga Tetap**.
- Bukti yang ditolak tidak otomatis dianggap lunas; alasan penolakan dicatat pada transaksi dan riwayat barang.
- Barang yang kembali dipasarkan memakai sesi/iterasi baru sehingga sejarah transaksi lama tetap terlacak.
- Bukti serah-terima hanya dapat diunggah setelah pembayaran diverifikasi.

---

## 6. Lelang Tertutup Vickrey

### 6.1 Tujuan dan mekanisme

Lelang Tertutup menggunakan aturan Vickrey:

- Bid valid tertinggi menjadi pemenang.
- Harga akhir adalah bid valid tertinggi kedua.
- Jika hanya ada satu bid valid, harga akhir memakai harga dasar.
- Jika nominal sama, bid yang dikirim lebih awal menjadi pemenang.
- Jika tidak ada bid valid, sesi dinyatakan gagal dan barang dapat dipasarkan ulang.

Buyer hanya dapat memiliki satu bid pada satu sesi pemasaran. Bid tidak dapat diubah atau dibatalkan setelah dicatat.

### 6.2 Model privasi bid yang digunakan saat ini

Implementasi saat ini memakai **data bid privat di database**, bukan encrypted escrow. Tabel `bids` menyimpan `pemasaranId`, `userId`, `nominal`, dan waktu pengiriman sebagai data operasional internal. Tidak ada kolom escrow terenkripsi, AES, salt, atau hash integrity yang menjadi bagian dari model data aktif.

Selama lelang aktif:

- API dan serializer tidak mengirim nominal bid ke tampilan Buyer, Admin Unit, Superadmin, atau katalog publik.
- Nama/identitas penawar dan nominal pada tampilan operasional disensor atau tidak ditampilkan sebagai daftar bid terbuka.
- Buyer hanya mengetahui bid miliknya sendiri pada alur input/riwayat yang relevan; peserta tidak dapat melihat bid peserta lain.

Setelah deadline:

- Proses settlement membaca data internal yang diperlukan.
- Sistem menghitung pemenang dan harga akhir memakai aturan Vickrey.
- Hasil, pemenang, dan ranking bid dapat dibuka pada area yang berwenang sesuai status sesi.

**Batas keamanan yang harus dipahami:** sensor UI/API melindungi pengguna aplikasi dan mengurangi kebocoran selama sesi aktif. Ini bukan enkripsi data terhadap orang yang telah diberi akses langsung ke database. Akses database karena itu harus dibatasi kepada operator infrastruktur yang berwenang, memakai kredensial yang aman, dan tidak dibagikan.

### 6.3 Alur settlement dan pembayaran pemenang

1. Sesi berakhir pada `endsAt`.
2. Cron menjalankan settlement lelang yang kedaluwarsa.
3. Sistem mengambil bid internal, menentukan hasil, dan mengubah status pemasaran.
4. Untuk pemenang, sistem membuat transaksi bayar langsung dengan batas waktu 24 jam.
5. Admin Unit mengonfirmasi pembayaran pemenang di unit.
6. Jika batas pembayaran terlewati, transaksi ditandai gagal, pelanggaran dibuat, dan pembatasan akun dihitung sesuai kebijakan.

Cron juga menangani notifikasi mendekati jatuh tempo pembayaran, berakhirnya blacklist, dan penyelesaian otomatis serah-terima yang memenuhi syarat.

---

## 7. Transaksi, Serah-Terima, dan Nota

Status transaksi utama:

| Status | Penjelasan |
| --- | --- |
| `menunggu_pembayaran` | Menunggu buyer membayar/unggah bukti untuk Harga Tetap. |
| `bukti_diunggah` | Bukti transfer telah dikirim dan menunggu verifikasi Admin Unit. |
| `ditolak_bukti` | Bukti pembayaran ditolak beserta alasan. |
| `menunggu_konfirmasi_langsung` | Pemenang lelang menunggu konfirmasi pembayaran langsung di unit. |
| `lunas` | Pembayaran telah diverifikasi. |
| `selesai` | Serah-terima/penyelesaian transaksi sudah lengkap. |
| `gagal` | Pembayaran atau proses transaksi gagal/terlewati deadline. |

Data transaksi menyimpan status, nominal pembayaran, metode, batas pembayaran bila ada, bukti pembayaran, alasan penolakan, verifier, bukti serah-terima, dan waktu penyelesaian. UI menampilkan nama petugas dan waktu tindakan hanya jika tindakan tersebut memang sudah terjadi.

---

## 8. Pelanggaran dan Blacklist

Pelanggaran digunakan terutama untuk pemenang Lelang Tertutup yang tidak menyelesaikan pembayaran sebelum deadline.

- Riwayat pelanggaran tersimpan pada `pelanggaran_user`.
- Status pembatasan tersimpan pada `blacklist` dan tindakan administrasi tercatat pada `blacklist_action_log`.
- Eskalasi menggunakan urutan milestone, bukan sekadar total hitungan mentah.
- Durasi normal memakai hari; `BLACKLIST_DURATION_UNIT=hours` hanya disediakan untuk pengujian/simulasi lokal yang cepat.
- Cron diproses secara idempoten agar transaksi kedaluwarsa tidak menciptakan pelanggaran ganda saat tugas terjadwal dipanggil ulang.

Admin Unit membaca pelanggaran yang terkait unitnya, sedangkan Superadmin memantau dan mengelola kebijakan lintas unit.

---

## 9. Modul Operasional

### 9.1 Admin Unit

- Dashboard unit dengan ringkasan barang, pemasaran, transaksi, dan tren penjualan.
- Kelola Barang: tambah, edit sesuai kebijakan, media, perpanjangan, penebusan, detail, dan riwayat.
- Pemasaran: Harga Tetap dan Lelang Tertutup, detail sesi, iterasi, hasil, dan countdown.
- Transaksi: verifikasi bukti pembayaran, tolak dengan alasan, konfirmasi bayar langsung, unggah bukti serah-terima, dan nota.
- Pelanggaran/blacklist unit serta notifikasi operasional.

### 9.2 Superadmin

- Dashboard nasional dan monitoring per unit.
- Kelola unit, rekening unit, Admin Unit, serta akun Superadmin.
- Melihat transaksi lintas unit dan detail barang unit.
- Mengelola blacklist global dan kebijakan pelanggaran.
- Notifikasi operasional dan profil.

### 9.3 Buyer

- Dashboard, katalog, wishlist, profil, notifikasi, transaksi, riwayat bid, hasil menang/tidak menang, nota, serta halaman pelanggaran.
- Register meminta nama, email, nomor telepon, NIK, dan kata sandi dengan contoh nilai yang ringkas pada placeholder.
- Spasi pada nomor telepon dan NIK dihapus di input; validasi server tetap memeriksa format nomor dan 16 digit NIK.

---

## 10. Model Data Inti

| Entitas | Peran |
| --- | --- |
| `users`, `session`, `account` | Akun, role, dan session Better Auth. |
| `buyer_profiles` | Profil tambahan Buyer. |
| `units`, `unit_accounts` | Unit pelaksana dan rekening tujuan. |
| `barang`, `media_barang` | Barang agunan, masa gadai, spesifikasi, dan media. |
| `pemasaran` | Sesi Harga Tetap/Lelang, harga, waktu, status, iterasi, pemenang, dan harga akhir. |
| `bids` | Bid privat internal: pemasaran, buyer, nominal, dan waktu kirim. |
| `transaksi` | Pembayaran, bukti, deadline, verifier, serah-terima, dan penyelesaian. |
| `pemasaran_views`, `buyer_wishlist` | Statistik tampilan dan preferensi Buyer. |
| `riwayat_status_barang`, `riwayat_perpanjangan` | Kronologi status dan perpanjangan barang. |
| `pelanggaran_user`, `blacklist`, `blacklist_action_log` | Pelanggaran, pembatasan, dan audit tindakan. |
| `notifications` | Notifikasi in-app. |

Kendala data penting:

- Satu buyer hanya satu bid per pemasaran (`bids_pemasaran_user_unique`).
- Satu barang tidak dapat memiliki lebih dari satu pemasaran aktif (`pemasaran_active_per_barang_unique`).
- Riwayat pemasaran lama tetap boleh tersimpan untuk audit dan iterasi ulang.

---

## 11. Keamanan dan Privasi

Kontrol yang diterapkan saat ini:

- Better Auth dengan session berbasis database dan cookie; role guard diterapkan pada akses server/API.
- Validasi payload pada batas layanan, termasuk format buyer, nominal bid, dan upload bukti pembayaran.
- Validasi upload bukti pembayaran: JPG/PNG/PDF dengan batas ukuran 5 MB.
- Isolasi data Admin Unit berdasarkan unit, dan isolasi data Buyer berdasarkan user aktif.
- Privasi bid melalui sensor serializer/UI/API selama lelang aktif.
- Header browser global: Content Security Policy, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, dan `Permissions-Policy`.
- Endpoint cron memerlukan `Authorization: Bearer <CRON_SECRET>`.
- Media publik dipisahkan dari validasi file; penyimpanan produksi mendukung volume persisten melalui `UPLOADS_DIR` agar upload tidak hilang saat redeploy.

Yang bukan klaim aplikasi:

- Tidak ada jaminan kerahasiaan terhadap pengguna yang secara sah atau tidak sah telah memperoleh akses langsung ke database.
- Tidak ada payment gateway maupun verifikasi bank otomatis.
- `script-src` dan `style-src` CSP masih memuat `'unsafe-inline'` karena kebutuhan runtime aplikasi; ini bukan CSP paling ketat yang mungkin diterapkan.

---

## 12. Rute dan API Penting

| Area | Rute contoh |
| --- | --- |
| Publik | `/`, `/katalog`, `/katalog/[id]`, `/bantuan` |
| Autentikasi | `/login`, `/register` |
| Buyer | `/dashboard`, `/wishlist`, `/transaksi`, `/riwayat-bid`, `/notifikasi`, `/profil`, `/pelanggaran` |
| Aksi Buyer | `/katalog/[id]/beli`, `/katalog/[id]/bid`, `/transaksi/[id]/nota`, hasil menang/tidak menang |
| Admin Unit | `/admin/dashboard`, `/admin/barang`, `/admin/pemasaran`, `/admin/transaksi`, `/admin/pelanggaran` |
| Superadmin | `/superadmin/dashboard`, `/superadmin/unit`, `/superadmin/transaksi`, `/superadmin/blacklist`, `/superadmin/kebijakan` |
| Cron | `/api/cron/proses-lelang` |

Route API harus dianggap sebagai boundary otorisasi, bukan sekadar sumber data untuk UI. Client tidak boleh dipercaya untuk menentukan role, `unitId`, status pembayaran, pemenang, atau harga akhir.

---

## 13. Kebutuhan Nonfungsional

- Responsif untuk desktop dan mobile.
- Waktu, countdown, dan deadline ditampilkan dalam format aplikasi yang konsisten.
- Media mendukung foto/video barang; penyimpanan produksi membutuhkan volume persisten.
- Katalog/detail bersifat dinamis agar status lot terbaru dapat ditampilkan.
- Test menggunakan Vitest dan Testing Library; pemeriksaan TypeScript menggunakan `npx tsc --noEmit --pretty false`.
- Build produksi menggunakan `next build` dengan output standalone untuk container.

---

## 14. Acceptance Criteria Ringkas

### Buyer

- Dapat register/login dengan format email, nomor telepon, NIK, dan kata sandi yang tervalidasi.
- Dapat melihat katalog tanpa login, tetapi aksi transaksi memerlukan akun Buyer.
- Dapat melakukan satu bid valid per sesi lelang dan tidak melihat bid peserta lain saat sesi aktif.
- Dapat mengunggah bukti Harga Tetap, membaca keputusan verifikasi, dan mengikuti proses serah-terima.

### Admin Unit

- Tidak dapat memasarkan barang sebelum jatuh tempo, baik dari tombol maupun request backend.
- Dapat mengatur waktu jatuh tempo sampai detik.
- Hanya dapat mengelola data unitnya.
- Dapat memverifikasi/menolak bukti pembayaran dan mengunggah bukti serah-terima.

### Superadmin

- Dapat memonitor data lintas unit tanpa mengambil alih scope operasional Admin Unit.
- Dapat mengelola unit, akun operasional, kebijakan, serta blacklist global.

### Dokumentasi

- PRD dan README menjelaskan model bid privat saat ini, bukan encrypted escrow.
- Dokumentasi membedakan kontrol UI/API dengan proteksi terhadap akses langsung ke database.

---

## 15. Di Luar Cakupan

- Integrasi bank/payment gateway.
- Verifikasi OCR otomatis atas bukti pembayaran.
- Notifikasi email/SMS/WhatsApp otomatis.
- Integrasi identitas resmi atau layanan Pegadaian.
- Jaminan legal, audit kepatuhan formal, atau penggunaan sebagai sistem produksi finansial.
