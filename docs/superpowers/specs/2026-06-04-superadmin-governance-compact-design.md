# Superadmin Governance Compact Design

Status: approved for implementation planning
Date: 2026-06-04
Scope: penyusunan ulang navigasi, halaman, dan batas fitur superadmin agar informatif tanpa overwhelming

## Context

Area superadmin saat ini sudah memiliki dashboard, unit dan rekening, admin unit, monitoring nasional, dan blacklist global. Struktur ini fungsional, tetapi batas antar halaman masih terasa campur: master data unit terpisah dari admin unit, blacklist bercampur antara daftar sanksi dan keputusan review, dan dashboard belum jelas apakah menjadi pusat aksi atau pusat statistik.

Desain ini mengarahkan superadmin menjadi pusat keputusan dan governance lintas unit. Superadmin tidak dibuat sebagai admin unit versi nasional yang memuat semua detail operasional. Informasi nasional tetap ada, tetapi dipadatkan menjadi snapshot, chart informatif, tabel komparasi, dan antrean keputusan.

## Goals

- Membuat superadmin informatif tanpa terlalu banyak menu dan data mentah.
- Memisahkan fungsi governance, monitoring, master data, dan kebijakan.
- Menampilkan data nasional penting seperti barang jaminan, sedang dipasarkan, terjual, perlu tindak lanjut, dan nilai transaksi tervalidasi.
- Menggabungkan unit, rekening, dan admin unit ke satu area manajemen unit.
- Menjadikan review pelanggaran sebagai pusat keputusan final superadmin.
- Menjelaskan kebijakan pelanggaran secara read-only terlebih dahulu.

## Non-Goals

- Tidak membuat superadmin menjadi replika admin unit lintas nasional.
- Tidak menambahkan risk heat indicator otomatis pada fase awal.
- Tidak membuat audit sistem sebagai menu utama pada fase awal.
- Tidak membuat kebijakan pelanggaran bisa diedit langsung pada fase awal.
- Tidak menganggap fixed price ditolak admin unit sebagai pelanggaran buyer.

## Product Direction

Pendekatan final adalah Governance Compact.

Superadmin berfokus pada:

- apa yang harus diketahui secara nasional,
- apa yang perlu diputuskan,
- unit mana yang perlu dipantau,
- data unit apa yang perlu dikelola,
- aturan pelanggaran apa yang sedang berlaku.

## Navigation

Navigasi superadmin final terdiri dari lima menu utama:

1. Dashboard Nasional
2. Review & Pelanggaran
3. Monitoring Unit
4. Manajemen Unit
5. Kebijakan Pelanggaran

Istilah "Blacklist Global" tidak dipakai sebagai label utama. UI menggunakan istilah "Pelanggaran", "Pembatasan Aktif", atau "Status Pelanggaran". Istilah blacklist boleh tetap muncul pada konteks teknis atau detail aturan.

## Dashboard Nasional

Dashboard Nasional adalah halaman action-first, bukan halaman statistik penuh.

### Isi Utama

- Hero ringkas dengan judul Dashboard Nasional.
- Shortcut penting seperti Tinjau Pelanggaran dan Monitoring Unit.
- Snapshot Nasional.
- Chart Lifecycle Barang Nasional.
- Chart Tren Nilai Transaksi Tervalidasi.
- Prioritas Superadmin maksimal 3 sampai 5 item.

### Snapshot Nasional

Snapshot dibatasi ke lima metric utama:

- Barang Jaminan
- Sedang Dipasarkan
- Terjual
- Perlu Tindak Lanjut
- Nilai Transaksi Tervalidasi

### Definisi Metric

Barang Jaminan adalah barang yang sudah menjadi jaminan unit dan belum masuk pemasaran.

Sedang Dipasarkan adalah barang yang sedang aktif di fixed price atau Vickrey.

Terjual adalah barang yang transaksi atau pembayaran akhirnya sah.

Perlu Tindak Lanjut adalah kondisi operasional yang gagal, tertahan, atau perlu evaluasi ulang. Contohnya lelang tanpa bid, pemasaran gagal, fixed price ditolak verifikasi, atau transaksi yang melewati SLA operasional. Kategori ini bukan otomatis pelanggaran buyer.

Nilai Transaksi Tervalidasi adalah total nilai transaksi yang sudah sah, misalnya lunas atau selesai sesuai status sistem.

### Chart

Lifecycle Barang Nasional menampilkan alur atau komposisi:

Barang Jaminan -> Sedang Dipasarkan -> Terjual -> Perlu Tindak Lanjut

Chart ini boleh berbeda dari chart lama selama informatif dan mudah dibaca.

Tren Nilai Transaksi Tervalidasi menampilkan performa nilai transaksi nasional dari waktu ke waktu. Range dapat disiapkan harian, mingguan, dan bulanan.

### Prioritas Superadmin

Prioritas ditampilkan pendek, bukan tabel panjang. Contohnya:

- review pelanggaran menunggu keputusan,
- unit perlu penugasan admin,
- transaksi atau verifikasi melewati SLA operasional,
- pemasaran gagal yang perlu tindak lanjut,
- anomali data jika ada.

Unit aktif tanpa rekening aktif bukan kondisi normal dan tidak menjadi prioritas rutin, karena rekening aktif wajib ada saat unit dibuat.

## Review & Pelanggaran

Halaman ini menjadi pusat keputusan final superadmin untuk kasus pelanggaran dan pembatasan aktif.

### Antrean Keputusan

Menampilkan kasus yang perlu keputusan superadmin:

- nama buyer,
- barang atau lelang terkait,
- unit terkait,
- status rekomendasi admin unit,
- waktu pengajuan,
- prioritas atau SLA,
- tombol Tinjau Sekarang.

### Modal Tinjau Kasus

Tinjau Sekarang membuka modal keputusan dengan gaya workflow yang sudah ada di sistem.

Konten modal:

- identitas buyer,
- ringkasan barang, lelang, atau transaksi terkait,
- foto barang,
- jenis pelanggaran,
- keterangan buyer,
- bukti pendukung buyer,
- catatan atau rekomendasi admin unit,
- riwayat pelanggaran lintas unit,
- keputusan superadmin,
- alasan resmi keputusan.

Modal menjaga keputusan cepat. Untuk kasus yang kompleks, dapat tersedia aksi Buka Detail Lengkap.

### Pembatasan Aktif

Menampilkan buyer yang sedang terkena pembatasan:

- buyer,
- level pelanggaran,
- dampak akses,
- unit terkait,
- berlaku sampai,
- aksi lihat detail.

### Riwayat Keputusan

Riwayat keputusan superadmin tampil di halaman ini, bukan sebagai menu audit terpisah:

- keputusan disetujui atau ditolak,
- alasan,
- catatan,
- waktu keputusan,
- aktor.

## Monitoring Unit

Monitoring Unit fokus pada kesehatan operasional unit. Data buyer dan pelanggaran tidak menjadi fokus utama, tetapi angka pelanggaran aktif dapat muncul sebagai indikator ringkas.

### Ringkasan Atas

Metric ringkas:

- Total Unit
- Unit Aktif
- Perlu Penugasan Admin
- Transaksi Tertahan
- SLA Terlewati

### Tabel Komparasi Unit

Monitoring memakai tabel komparasi, bukan card besar per unit.

Kolom:

- Unit
- Barang Jaminan
- Sedang Dipasarkan
- Terjual
- Perlu Tindak Lanjut
- Transaksi Tertahan
- Pelanggaran Aktif
- Status Unit
- Aksi Detail

Risk Heat Indicator tidak diterapkan pada fase awal.

### Detail Unit

Detail unit dari monitoring berisi:

- breakdown barang,
- transaksi tertahan,
- pemasaran gagal,
- pelanggaran aktif,
- catatan atau rekomendasi tindakan.

## Manajemen Unit

Manajemen Unit menggabungkan unit, rekening, dan admin unit.

### Daftar Unit

Daftar unit menampilkan:

- nama unit,
- kode unit,
- alamat,
- status aktif atau nonaktif,
- rekening aktif utama,
- jumlah admin unit,
- aksi detail.

### Tambah Unit

Tambah unit memakai wizard dua langkah:

1. Data unit.
2. Rekening aktif utama.

Rekening aktif wajib diisi saat membuat unit. Jika rekening aktif belum diisi, unit tidak bisa dibuat.

Admin unit tidak wajib saat membuat unit. Admin dapat ditambahkan setelah unit resmi dibuat.

### Detail Unit

Detail unit memakai tab:

- Profil Unit
- Rekening
- Admin Unit
- Riwayat Aktivitas

### Rekening

Aturan rekening:

- setiap unit wajib memiliki satu rekening aktif utama,
- rekening cadangan boleh ditambahkan,
- rekening aktif dapat diubah,
- rekening aktif tidak boleh dihapus atau dinonaktifkan jika belum ada pengganti.

### Admin Unit

Fitur admin unit:

- tambah admin unit,
- pindahkan admin ke unit lain jika diperlukan,
- nonaktifkan admin,
- unit tanpa admin aktif tampil sebagai Perlu Penugasan Admin.

## Kebijakan Pelanggaran

Kebijakan Pelanggaran bersifat read-only pada fase awal. Halaman ini menjelaskan aturan pelanggaran yang sedang berlaku secara nasional.

### Definisi Pelanggaran

Pelanggaran buyer hanya terjadi jika pemenang lelang tidak menyelesaikan pembayaran dalam 24 jam.

Keterlambatan atau kegagalan lain boleh tampil sebagai Perlu Tindak Lanjut, tetapi tidak menaikkan level pelanggaran kecuali memenuhi definisi gagal bayar pemenang lelang.

Kasus berikut bukan pelanggaran buyer:

- fixed price yang bukti pembayarannya ditolak admin unit,
- lelang tanpa bid,
- bukti fixed price gagal verifikasi,
- pemasaran gagal,
- barang perlu dipasarkan ulang.

Kasus tersebut tetap dapat masuk Perlu Tindak Lanjut, tetapi bukan Pelanggaran Aktif.

### Level Pelanggaran

Level pelanggaran berdasarkan jumlah kasus gagal bayar pemenang lelang:

- Level 1
- Level 2
- Level 3

Setiap level menampilkan:

- jumlah pelanggaran,
- durasi pembatasan,
- dampak akses buyer,
- contoh konsekuensi.

### Hak Review Buyer

Semua buyer yang terkena pelanggaran dapat mengajukan review pelanggaran, tanpa melihat level pelanggaran.

Level pelanggaran memengaruhi berat pembatasan akses, bukan hak mengajukan review.

## Data Flow

Dashboard Nasional mengambil ringkasan lintas unit dari data barang, pemasaran, transaksi, unit, admin, rekening, dan pelanggaran.

Review & Pelanggaran mengambil data review buyer, rekomendasi admin unit, bukti pendukung, pelanggaran aktif, dan riwayat keputusan.

Monitoring Unit mengambil agregasi per unit untuk barang, pemasaran, transaksi tertahan, SLA, admin aktif, dan pelanggaran aktif.

Manajemen Unit mengambil data master unit, rekening, admin unit, dan riwayat aktivitas.

Kebijakan Pelanggaran membaca konfigurasi aturan yang berlaku. Pada fase awal aturan dapat berupa konfigurasi statis atau data read-only dari sistem.

## Error Handling And Empty States

- Dashboard menampilkan empty state jika belum ada prioritas.
- Review & Pelanggaran menampilkan empty state jika tidak ada antrean keputusan.
- Monitoring Unit tetap menampilkan tabel unit meskipun tidak ada transaksi tertahan.
- Manajemen Unit memblokir simpan unit jika rekening aktif utama belum lengkap.
- Kebijakan Pelanggaran menampilkan aturan default jika konfigurasi belum dapat diedit dari UI.

## Testing Notes

Rencana implementasi perlu mencakup:

- test agregasi Snapshot Nasional,
- test definisi Perlu Tindak Lanjut tidak masuk Pelanggaran Aktif,
- test fixed price ditolak tidak dihitung pelanggaran buyer,
- test hanya pemenang lelang gagal bayar 24 jam yang menjadi pelanggaran,
- test wizard tambah unit mewajibkan rekening aktif,
- test navigasi final superadmin,
- test modal review pelanggaran menampilkan konteks buyer, barang, bukti, rekomendasi admin unit, dan keputusan superadmin.

## Open Implementation Notes

- Nama komponen, query service, dan bentuk chart final mengikuti pola UI yang sudah ada.
- Chart boleh memakai custom SVG seperti dashboard admin unit atau pendekatan visual lain yang tetap ringan.
- Perubahan navigasi harus memperhatikan route lama agar tidak memutus akses yang masih dipakai test atau data.
- Audit sistem tidak dibuat sebagai menu utama, tetapi riwayat keputusan dan aktivitas tetap ditampilkan kontekstual.
