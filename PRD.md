# Product Requirements Document (PRD)
## Aplikasi Pengelolaan dan Layanan Informasi Barang Lelang Berbasis Web

**Versi:** 4.0  
**Status:** Draft Final  
**Konteks:** Tugas Akhir — Prototipe Sistem Informasi  
**Stack:** Next.js (Full Stack) · Tailwind CSS · shadcn/ui · PostgreSQL · Drizzle ORM

---

## 1. Gambaran Umum (Overview)

Aplikasi ini adalah sistem berbasis web untuk mengelola **siklus hidup penuh barang gadai** — mulai dari barang masuk sebagai jaminan gadai, proses perpanjangan, penebusan oleh nasabah, hingga konversi menjadi barang yang dipasarkan (dijual atau dilelang) ketika nasabah tidak menebus.

Sistem mendukung dua mekanisme pemasaran barang: **Fixed Price** (harga tetap) dan **Vickrey Auction** (simulasi lelang tertutup). Pemilihan mekanisme sepenuhnya menjadi keputusan Admin Unit setelah barang resmi menjadi milik Pegadaian.

Sistem bersifat **multi-unit** — satu instalasi melayani banyak cabang/unit Pegadaian secara terpusat.

### Tujuan Utama
- Mengelola siklus hidup barang gadai secara digital dari awal hingga akhir.
- Memberikan fleksibilitas kepada Admin Unit untuk menentukan mekanisme penjualan barang.
- Memberikan transparansi kepada publik/pembeli mengenai katalog barang yang tersedia.
- Mengimplementasikan mekanisme Vickrey Auction (sealed-bid) sebagai inovasi akademik.
- Menyediakan alur pembayaran yang jelas beserta verifikasi dan cetak nota.

### Batasan Sistem (Constraints)
- Tidak menggunakan payment gateway eksternal.
- Pembayaran via **transfer bank** (upload bukti) atau **langsung di Pegadaian** — keduanya diverifikasi manual oleh Admin Unit.
- Vickrey Auction bersifat **simulasi** — pemenang ditentukan sistem, pembayaran tetap offline.
- Admin Unit **tidak dapat** melihat nilai nominal bid sebelum deadline lelang berakhir.
- Nomor rekening bank tujuan pembayaran per unit dikelola oleh **Super Admin**.

---

## 2. Aktor & Peran (Roles)

### 2.1 Super Admin
Pengelola sistem secara global. Memiliki akses penuh ke semua data dan konfigurasi.

**Kapabilitas:**
- CRUD Unit Pegadaian (nama, alamat, kode unit).
- CRUD akun Admin Unit (create, assign ke unit, nonaktifkan).
- Mengelola **nomor rekening bank tujuan per unit** (nama bank, nomor rekening, nama pemilik).
- Monitoring global: semua barang, transaksi, dan lelang lintas unit.
- Melihat dan mengelola blacklist user secara global (termasuk mencabut blokir lebih awal).

### 2.2 Admin Unit
Operator di masing-masing unit Pegadaian. Hanya mengelola data milik unit-nya sendiri.

**Kapabilitas:**
- Input barang gadai masuk ke sistem.
- Melakukan **perpanjangan masa gadai** atas permintaan nasabah.
- Mencatat **penebusan barang** oleh nasabah.
- Mengkonversi barang yang tidak ditebus menjadi **barang jaminan resmi**.
- Memilih mode pemasaran (Fixed Price atau Vickrey Auction) dan mempublikasikan barang ke katalog.
- Verifikasi transaksi pembayaran (transfer bank maupun bayar langsung).
- Mencetak nota transaksi setelah pembayaran terverifikasi.
- Aktifkan ulang pemasaran untuk barang yang gagal terjual.
- Melihat riwayat pelanggaran user dan mengelola blacklist di unit-nya.

### 2.3 User (Pembeli / Peserta Lelang)
Pengguna publik yang telah mendaftar dan login.

**Kapabilitas:**
- Melihat katalog barang yang dipasarkan.
- Melihat detail barang (foto, video, kondisi, harga, informasi unit).
- Mengajukan pembelian barang fixed price (memilih metode bayar + upload bukti jika transfer).
- Memasukkan bid untuk barang lelang Vickrey.
- Memantau status pembelian dan hasil lelang.
- Melihat riwayat transaksi dan bidding pribadi.

**Pembatasan User Blacklist:**
- User dengan blacklist aktif **tidak dapat** mengikuti lelang Vickrey.
- User blacklist masih dapat melihat katalog dan membeli barang fixed price.

### 2.4 Guest (Tidak Login)
- Hanya dapat melihat katalog dan detail barang (read-only).
- Tidak dapat melakukan pembelian atau bidding.

---

## 3. Alur Status Barang — State Machine Lengkap

Berikut adalah state machine **lengkap** yang merepresentasikan seluruh siklus hidup barang, mulai dari masuk sebagai barang gadai hingga selesai.

```
                    ┌─────────────────────────────────────────────────┐
                    │          SIKLUS HIDUP BARANG GADAI              │
                    └─────────────────────────────────────────────────┘

[INPUT BARANG]
Admin unit menginput barang nasabah yang masuk sebagai gadai
        │
        ▼
 ┌─────────────┐
 │   G A D A I │  ← Status awal. Nasabah masih memiliki hak tebus.
 └──────┬──────┘    Tanggal jatuh tempo aktif.
        │
        │  Tiga kemungkinan yang bisa terjadi:
        │
        ├─────────────────────────────────────────────────────────────────────►
        │  (A) Nasabah meminta perpanjangan & Admin menyetujui                │
        │      SEBELUM atau SAAT tanggal jatuh tempo                         │
        │      → Tanggal jatuh tempo diperbarui                              │
        │      → Status TETAP [GADAI]                                        │
        │      → Riwayat perpanjangan dicatat                                │
        │      → Bisa diperpanjang berkali-kali                              ◄
        │
        ├──────────────────────────────────────────────────────────────────────►
        │  (B) Nasabah menebus barang & Admin mencatat penebusan             │
        │      SEBELUM atau SAAT tanggal jatuh tempo                         │
        │                                                                    │
        │                         ┌──────────┐                              │
        │      Status berubah → │ DITEBUS  │ ← Terminal state.             │
        │                         └──────────┘   Barang keluar dari sistem. │
        │                                        Tidak dapat diproses lagi.  ◄
        │
        └──────────────────────────────────────────────────────────────────────►
           (C) Nasabah TIDAK menebus & TIDAK memperpanjang
               hingga MELEWATI tanggal jatuh tempo
               → Admin mengkonfirmasi barang menjadi milik Pegadaian
               │
               ▼
        ┌───────────────┐
        │   J A M I N A N│  ← Barang resmi milik Pegadaian.
        └───────┬───────┘    Nasabah sudah tidak memiliki hak tebus.
                │             Admin unit menentukan cara pemasaran.
                │
                │  Admin Unit memilih satu dari dua mode pemasaran:
                │
                ├────────────────────────────────────────────────────────────►
                │  Mode: FIXED PRICE                                         │
                │  Admin tentukan harga jual tetap                          │
                │                                                           │
                │              ┌──────────────────┐                        │
                │  Status → │ DIPASARKAN       │                        │
                │              │ (mode:fixed_price)│                        │
                │              └────────┬─────────┘                        │
                │                       │ Tampil di katalog publik          │
                │                       │                                   │
                │               User mengajukan pembelian                   │
                │               User memilih metode bayar:                  │
                │                       │                                   │
                │           ┌───────────┴────────────┐                     │
                │           │                        │                     │
                │    [Transfer Bank]         [Bayar Langsung]              │
                │    User upload              User datang                   │
                │    bukti bayar              ke Pegadaian                  │
                │           │                        │                     │
                │    Admin verifikasi        Admin konfirmasi               │
                │    bukti transfer          pembayaran tunai               │
                │           │                        │                     │
                │           └───────────┬────────────┘                     │
                │                       │                                   │
                │                       ▼                                   │
                │              ┌──────────────┐                            │
                │              │  T E R J U A L│ ← Nota dapat dicetak.    │
                │              └──────────────┘                            ◄
                │
                └────────────────────────────────────────────────────────────►
                   Mode: VICKREY AUCTION
                   Admin tentukan harga dasar + durasi lelang

                              ┌──────────────────┐
                   Status → │ DIPASARKAN       │
                              │ (mode:vickrey)    │
                              └────────┬─────────┘
                                       │ Tampil di katalog publik
                                       │ Countdown timer aktif
                                       │
                              (Deadline tercapai)
                              Cron job memproses
                                       │
                             ┌─────────┴──────────┐
                             │                    │
                    [Ada penawar masuk]   [Tidak ada penawar]
                             │                    │
                    Sistem tentukan          ┌──────────┐
                    pemenang (B1)            │  G A G A L│
                    harga bayar (B2)         └─────┬────┘
                             │                    │
                             ▼             Admin aktifkan ulang
                  ┌─────────────────────┐         │
                  │ MENUNGGU_PEMBAYARAN  │    (pilih ulang mode
                  │ Maks. 24 jam        │     & konfigurasi)
                  └──────────┬──────────┘         │
                             │                    │
                  ┌──────────┴───────────┐        │
                  │                      │        │
           [User membayar]     [Tidak bayar       │
           dalam 24 jam         dalam 24 jam]     │
                  │                      │        │
           Admin verifikasi         ┌──────────┐  │
                  │                 │  G A G A L│  │
                  ▼                 └─────┬────┘  │
         ┌──────────────┐                │        │
         │  T E R J U A L│                │  Catat pelanggaran  │
         └──────────────┘                │  Cek & set blacklist │
         Nota dapat dicetak.             │        │
                                         └────────┴────────────►
                                              Admin aktifkan
                                              ulang pemasaran
                                              (pilih ulang mode)
                                                    │
                                                    ▼
                                           Kembali ke status
                                           [DIPASARKAN] dengan
                                           konfigurasi baru
```

---

### 3.1 Ringkasan Seluruh Status Barang

| Status | Deskripsi | Siapa yang Bisa Mengubah | Dapat Kembali ke Status Sebelumnya? |
|---|---|---|---|
| `GADAI` | Barang sedang dijaminkan. Nasabah masih memiliki hak tebus. | Admin Unit (input baru) | — (status awal) |
| `DITEBUS` | Nasabah menebus barang. Selesai. | Admin Unit | ❌ Terminal state |
| `JAMINAN` | Barang resmi milik Pegadaian. Belum dipasarkan. | Admin Unit | ❌ Tidak bisa kembali ke GADAI |
| `DIPASARKAN` | Barang aktif di katalog publik (fixed price atau vickrey). | Admin Unit | ❌ Tidak bisa kembali ke JAMINAN |
| `MENUNGGU_PEMBAYARAN` | Pemenang Vickrey ditentukan, menunggu pembayaran ≤24 jam. | Sistem (otomatis) | ❌ |
| `TERJUAL` | Transaksi selesai & terverifikasi. Nota dapat dicetak. | Admin Unit (verifikasi) | ❌ Terminal state |
| `GAGAL` | Tidak ada penawar, atau pemenang tidak membayar. Bisa dipasarkan ulang. | Sistem / Admin Unit | ✅ Bisa → DIPASARKAN (re-listing) |

---

### 3.2 Aturan Transisi Status (Tegas)

```
GADAI        → GADAI              : Perpanjangan masa gadai (tanggal jatuh tempo diperbarui)
GADAI        → DITEBUS            : Nasabah menebus, admin mencatat
GADAI        → JAMINAN            : Admin mengkonfirmasi barang tidak ditebus (jatuh tempo lewat)
JAMINAN      → DIPASARKAN         : Admin memilih mode & mempublikasikan barang
DIPASARKAN   → MENUNGGU_PEMBAYARAN: Cron job (otomatis, hanya untuk mode vickrey saat deadline)
DIPASARKAN   → TERJUAL            : Admin verifikasi pembayaran (fixed price)
DIPASARKAN   → GAGAL              : Cron job (tidak ada penawar, mode vickrey)
MENUNGGU_PEMBAYARAN → TERJUAL     : Admin verifikasi pembayaran
MENUNGGU_PEMBAYARAN → GAGAL       : Cron job (batas waktu 24 jam terlewati)
GAGAL        → DIPASARKAN         : Admin mengaktifkan ulang pemasaran (re-listing)
```

> ⚠️ **Penting untuk implementasi:** Setiap transisi yang tidak terdaftar di atas harus **ditolak oleh sistem** dengan mengembalikan error. Tidak ada transisi yang boleh di-bypass melalui manipulasi request langsung.

---

## 4. Alur Fitur Detail (Feature Workflows)

### 4.1 Registrasi & Autentikasi

**User (Pembeli) — Registrasi Mandiri:**
1. Mendaftar di `/register` dengan:
   - Nama lengkap
   - Email (unik)
   - Nomor telepon/HP
   - Password (min. 8 karakter)
   - Nomor KTP (digunakan untuk identifikasi jika terjadi pelanggaran blacklist)
2. Setelah registrasi berhasil, user dapat langsung login.
3. Login menggunakan email + password.
4. Sesi dikelola menggunakan **JWT di httpOnly cookie**.

**Admin Unit & Super Admin — Akun Dibuat oleh Super Admin:**
1. Super Admin membuat akun admin melalui `/superadmin/admin`.
2. Admin login melalui halaman `/login` yang sama — sistem membedakan berdasarkan field `role` di dalam JWT token.
3. Setelah login, sistem redirect ke dashboard sesuai role masing-masing.

---

### 4.2 Input Barang Gadai (Admin Unit)

**Konteks:** Admin Unit menginput data barang pada saat nasabah datang menggadaikan barang secara fisik. Proses gadai fisik dilakukan secara offline — sistem hanya mencatat datanya secara digital.

**Form Input Barang Gadai:**

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `nama_barang` | string | ✅ | Nama/judul deskriptif barang |
| `kategori` | enum | ✅ | `emas`, `elektronik`, `kendaraan`, `perhiasan`, `lainnya` |
| `deskripsi` | text | ✅ | Deskripsi detail spesifikasi dan kondisi barang |
| `kondisi` | enum | ✅ | `baik`, `cukup`, `rusak_ringan` |
| `nilai_taksiran` | decimal | ✅ | Nilai estimasi pasar barang (hasil taksasi petugas) |
| `nilai_gadai` | decimal | ✅ | Jumlah pinjaman yang diberikan ke nasabah |
| `nama_penggadai` | string | ✅ | Nama nasabah — **tidak ditampilkan ke publik** |
| `nomor_nasabah` | string | ✅ | ID nasabah internal — **tidak ditampilkan ke publik** |
| `tanggal_gadai` | date | ✅ | Tanggal barang masuk sebagai gadai |
| `tanggal_jatuh_tempo` | date | ✅ | Batas waktu nasabah menebus (harus > tanggal_gadai) |
| `foto` | file[] | ✅ | Min. 1, maks. 5 file. Format: `jpg`, `png`, `webp`. Maks. 5 MB/file |
| `video` | file[] | ❌ | Opsional. Maks. 2 file. Format: `mp4`, `mov`, `webm`. Maks. 50 MB/file |

**Setelah disimpan:** Status barang otomatis = `GADAI`.

**Aturan Media (Foto & Video):**
- Minimal 1 foto wajib ada saat input.
- Video bersifat opsional tetapi dianjurkan untuk barang bernilai tinggi.
- Selama status `GADAI` atau `JAMINAN`: admin dapat menambah atau menghapus media.
- Setelah status `DIPASARKAN`: media hanya dapat ditambah, tidak dapat dihapus.
- Seluruh media disimpan di server dan diakses via URL publik.

---

### 4.3 Perpanjangan Masa Gadai (Admin Unit)

**Konteks:** Nasabah datang ke Pegadaian dan meminta perpanjangan masa gadai sebelum atau saat jatuh tempo. Admin Unit mencatat perpanjangan tersebut di sistem.

**Prasyarat:** Status barang = `GADAI`.

**Workflow Lengkap:**
1. Admin Unit membuka halaman daftar barang dengan filter status `GADAI`.
2. Admin mencari barang milik nasabah (by nama nasabah atau nomor nasabah).
3. Admin membuka detail barang, memeriksa `tanggal_jatuh_tempo` saat ini.
4. Admin mengklik tombol **"Catat Perpanjangan"**.
5. Sistem menampilkan form:
   - Tanggal jatuh tempo saat ini (read-only, sebagai referensi).
   - Input durasi perpanjangan: pilihan dalam hari atau bulan, atau input tanggal jatuh tempo baru secara langsung.
   - Catatan perpanjangan (opsional — misalnya nomor kontrak perpanjangan).
6. Admin mengkonfirmasi.
7. **Sistem memvalidasi:** `tanggal_jatuh_tempo_baru` harus lebih besar dari tanggal saat ini.
8. Sistem memperbarui kolom `tanggal_jatuh_tempo` pada record barang.
9. Sistem mencatat riwayat perpanjangan di tabel `riwayat_perpanjangan`.
10. Status barang **tetap `GADAI`** — tidak ada perubahan status.

**Catatan Penting:**
- Satu barang dapat diperpanjang **berkali-kali** (tidak ada batas maksimum — sesuaikan dengan kebijakan bisnis).
- Riwayat perpanjangan (tanggal lama, tanggal baru, siapa yang memproses) disimpan permanen untuk keperluan audit.
- Admin dapat melihat riwayat perpanjangan di halaman detail barang.

---

### 4.4 Penebusan Barang oleh Nasabah (Admin Unit)

**Konteks:** Nasabah datang ke Pegadaian, membayar pokok pinjaman beserta bunga, dan mengambil kembali barangnya. Admin Unit mencatat penebusan tersebut di sistem.

**Prasyarat:** Status barang = `GADAI`.

**Workflow Lengkap:**
1. Admin Unit membuka detail barang yang akan ditebus.
2. Admin mengklik tombol **"Catat Penebusan"**.
3. Sistem menampilkan konfirmasi:
   - Nama barang.
   - Nama penggadai.
   - Tanggal jatuh tempo.
   - Peringatan: *"Tindakan ini tidak dapat dibatalkan. Barang akan keluar dari sistem."*
4. Admin mengisi:
   - Tanggal penebusan (default: hari ini).
   - Nomor referensi penebusan (nomor kuitansi/transaksi offline).
   - Catatan (opsional).
5. Admin mengkonfirmasi.
6. Sistem mengubah status barang menjadi `DITEBUS`.
7. Sistem mencatat event penebusan di `riwayat_status_barang`.

**Catatan Penting:**
- Status `DITEBUS` adalah **terminal state** — barang tidak dapat diproses lebih lanjut dalam sistem.
- Barang berstatus `DITEBUS` **tidak muncul** di katalog publik maupun di antrian lelang.
- Penebusan masih dapat dilakukan **setelah** tanggal jatuh tempo selama admin belum mengkonversi barang ke status `JAMINAN`.

---

### 4.5 Konversi Barang Gadai → Jaminan (Admin Unit)

**Konteks:** Nasabah tidak menebus dan tidak memperpanjang hingga melewati tanggal jatuh tempo. Barang secara hukum menjadi milik Pegadaian. Admin Unit mengkonfirmasi perubahan status ini di sistem.

**Prasyarat:** Status barang = `GADAI`.

**Kapan dilakukan:** Setelah `tanggal_jatuh_tempo` terlewati DAN nasabah tidak hadir untuk menebus atau memperpanjang.

**Workflow Lengkap:**
1. Admin Unit membuka daftar barang.
2. Sistem secara visual menandai barang yang `tanggal_jatuh_tempo`-nya sudah lewat dengan label/badge **"Jatuh Tempo"**.
3. Admin memilih barang dan mengklik **"Konfirmasi Jadi Jaminan"**.
4. Sistem menampilkan konfirmasi:
   - Nama barang, nama penggadai.
   - Tanggal jatuh tempo yang sudah lewat.
   - Peringatan: *"Pastikan nasabah benar-benar tidak menebus. Setelah dikonfirmasi, barang tidak bisa dikembalikan ke nasabah melalui sistem ini."*
5. Admin mengkonfirmasi.
6. Sistem mengubah status barang dari `GADAI` → `JAMINAN`.
7. Sistem mencatat perubahan status di `riwayat_status_barang`.

**Catatan Penting:**
- Tombol **"Catat Penebusan"** tetap muncul di halaman detail barang selama status masih `GADAI`, bahkan jika sudah melewati jatuh tempo. Admin harus memilih secara eksplisit antara "Konfirmasi Jadi Jaminan" atau "Catat Penebusan".
- Setelah status menjadi `JAMINAN`, nasabah **tidak dapat lagi** menebus barang melalui sistem.

---

### 4.6 Pemasaran Barang Jaminan — Pilih Mode (Admin Unit)

**Prasyarat:** Status barang = `JAMINAN`.

**Konteks:** Admin Unit memilih apakah barang ini akan dijual dengan harga tetap (fixed price) atau dilelang (Vickrey Auction).

**Workflow Lengkap:**
1. Admin Unit membuka halaman daftar barang jaminan (`/admin/barang?status=jaminan`).
2. Admin memilih barang dan membuka halaman detail.
3. Admin mengklik tombol **"Pasarkan Barang"**.
4. Sistem menampilkan form konfigurasi pemasaran:

**Jika memilih Fixed Price:**
- Input `harga_jual` (decimal, wajib > 0).
- Sistem langsung menampilkan barang di katalog setelah dikonfirmasi.

**Jika memilih Vickrey Auction:**
- Input `harga_dasar` (decimal, wajib > 0) — sebagai harga minimum bid.
- Input `durasi_lelang` (integer, 1–30 hari).
- Sistem menghitung dan menampilkan `tanggal_selesai_lelang` = `NOW() + durasi_hari`.

5. Admin mengkonfirmasi.
6. Sistem mengubah status barang dari `JAMINAN` → `DIPASARKAN`.
7. Sistem membuat record baru di tabel `pemasaran` dengan mode yang dipilih.
8. Barang langsung muncul di katalog publik.

---

### 4.7 Fixed Price — Alur Pembelian Lengkap

**Prasyarat:** Barang berstatus `DIPASARKAN` dengan `mode = fixed_price`.

#### A. Dari Sisi User

**Langkah 1 — Ajukan Pembelian:**
1. User membuka detail barang di katalog, terlihat label **"Beli Langsung"** dan harga jual.
2. User mengklik **"Beli Sekarang"**.
3. Sistem memeriksa apakah sudah ada pengajuan aktif dari user lain:
   - Jika ada → tombol dinonaktifkan, tampil pesan "Barang sedang dalam proses pembelian oleh user lain."
4. Sistem memeriksa apakah user sudah memiliki transaksi aktif yang belum selesai:
   - Jika ada → tampil pesan dan redirect ke halaman transaksi aktif tersebut.
5. Sistem menampilkan halaman konfirmasi pembelian berisi:
   - Ringkasan barang (nama, foto utama, kondisi, harga jual).
   - Informasi rekening bank unit: nama bank, nomor rekening, nama pemilik rekening.
   - Pilihan metode pembayaran: **Transfer Bank** atau **Bayar Langsung di Pegadaian**.
6. User memilih metode dan mengklik **"Konfirmasi Pembelian"**.
7. Sistem membuat record di tabel `transaksi` dengan status `MENUNGGU_PEMBAYARAN`.

**Langkah 2a — Transfer Bank:**
1. User diarahkan ke halaman detail transaksi (`/transaksi/[id]`).
2. Halaman menampilkan:
   - Jumlah yang harus ditransfer.
   - Nama bank, nomor rekening, nama pemilik rekening tujuan.
   - Batas waktu upload bukti (24 jam).
3. User melakukan transfer melalui aplikasi bank/ATM masing-masing.
4. User mengupload **bukti transfer** di halaman tersebut (jpg/png/pdf, maks. 5 MB).
5. Status transaksi berubah ke `BUKTI_DIUNGGAH`.
6. Admin mendapat notifikasi (badge di dashboard).

**Langkah 2b — Bayar Langsung:**
1. Halaman konfirmasi menampilkan:
   - **Nomor Pengajuan** (ID transaksi yang harus ditunjukkan ke petugas).
   - Nama barang dan total harga yang harus dibayar.
   - Alamat lengkap unit Pegadaian tujuan.
   - Instruksi: *"Kunjungi unit Pegadaian dan tunjukkan Nomor Pengajuan ini kepada petugas."*
2. Status transaksi = `MENUNGGU_KONFIRMASI_LANGSUNG`.

#### B. Dari Sisi Admin Unit

**Verifikasi Bukti Transfer:**
1. Admin membuka `/admin/transaksi` → filter status `BUKTI_DIUNGGAH`.
2. Admin membuka detail transaksi → lihat bukti pembayaran yang diunggah user.
3. Admin mencocokkan dengan mutasi rekening bank secara manual (offline).
4. **Jika valid:** Admin klik **"Verifikasi Pembayaran"** → isi nomor referensi internal → konfirmasi.
5. **Jika tidak valid:** Admin klik **"Tolak Bukti"** → isi alasan penolakan.
   - User mendapat notifikasi bahwa bukti ditolak dan diminta upload ulang.
   - Status transaksi kembali ke `MENUNGGU_PEMBAYARAN`.

**Konfirmasi Bayar Langsung:**
1. Nasabah/user datang ke kasir Pegadaian dan menyebutkan Nomor Pengajuan.
2. Admin membuka transaksi → cari berdasarkan Nomor Pengajuan.
3. Admin klik **"Konfirmasi Pembayaran Langsung"** → isi nomor kuitansi kasir → konfirmasi.

**Setelah Verifikasi (Berlaku untuk Kedua Metode):**
1. Status transaksi berubah ke `LUNAS`.
2. Status barang berubah ke `TERJUAL`.
3. Tombol **"Cetak Nota"** aktif — dapat diakses oleh admin dan user yang bertransaksi.

---

### 4.8 Cetak Nota Transaksi

**Kapan tersedia:** Status transaksi = `LUNAS` (berlaku untuk fixed price dan Vickrey).

**Implementasi:** Halaman khusus `/transaksi/[id]/nota` yang dioptimalkan untuk print (`@media print`). Semua elemen navigasi UI disembunyikan saat print. Dapat juga diunduh sebagai PDF.

**Konten Nota:**

```
═══════════════════════════════════════════════
            NOTA TRANSAKSI RESMI
       [Nama Unit Pegadaian]
       [Alamat Lengkap Unit]  |  [Kota]
═══════════════════════════════════════════════
No. Transaksi   : TRX-XXXXXXXXXXXXXXXX
Tanggal Cetak   : DD/MM/YYYY  HH:MM WIB
───────────────────────────────────────────────
DETAIL BARANG
  Nama Barang   : [Nama Barang]
  Kategori      : [Kategori]
  Kondisi       : [Kondisi]
───────────────────────────────────────────────
DATA PEMBELI
  Nama          : [Nama Lengkap User]
  No. Telepon   : [Nomor Telepon]
───────────────────────────────────────────────
INFORMASI PEMBAYARAN
  Jenis Transaksi : [Pembelian Langsung / Hasil Lelang]
  Metode Bayar  : [Transfer Bank / Bayar Langsung]
  Jumlah Bayar  : Rp [Nominal]
  No. Referensi : [Nomor Referensi]
  Status        : ✓ LUNAS
───────────────────────────────────────────────
  Diverifikasi  : [Nama Admin Unit]
  Tanggal       : DD/MM/YYYY  HH:MM WIB
═══════════════════════════════════════════════
  Dokumen ini merupakan bukti transaksi sah.
  Simpan nota ini sebagai bukti kepemilikan.
═══════════════════════════════════════════════
```

---

### 4.9 Vickrey Auction — Alur Bidding Lengkap

**Konsep Vickrey Auction:**
- Semua bid bersifat **tertutup** — tidak ada yang tahu nilai bid orang lain.
- **Pemenang** = penawar dengan bid tertinggi (B1).
- **Harga yang dibayar** = nilai bid tertinggi kedua (B2), bukan nilai bid pemenang.
- Jika hanya ada 1 penawar: pemenang membayar sebesar `harga_dasar`.

#### A. Dari Sisi User — Submit Bid

1. User membuka detail barang lelang Vickrey.
2. Halaman menampilkan:
   - Harga dasar lelang.
   - Countdown timer menuju deadline.
   - Status bid user: *"Anda belum memasukkan penawaran"* atau *"Anda sudah memasukkan penawaran"*.
3. **Cek Blacklist:** Jika user memiliki blacklist aktif, tombol bid dinonaktifkan dan tampil pesan:
   > *"Anda sedang dalam masa pemblokiran lelang hingga [tanggal]. Total pelanggaran: [X] kali."*
4. User mengklik **"Masukkan Penawaran"**.
5. Sistem menampilkan form input nominal bid.
   - Validasi: nominal ≥ harga dasar.
6. Sistem menampilkan dialog konfirmasi:
   > *"Anda akan memasukkan penawaran sebesar Rp [X]. Penawaran tidak dapat diubah atau dibatalkan setelah dikonfirmasi."*
7. User mengkonfirmasi.
8. **Sistem menyimpan bid:**
   - `nominal` — nilai asli, tersimpan di database, hanya dibaca sistem saat deadline.
   - `salt` — random string unik per bid.
   - `bid_hash` = SHA-256(`user_id` + `nominal` + `salt`) — untuk verifikasi integritas.
9. User melihat konfirmasi: *"Penawaran Anda berhasil dicatat."* (nilai tidak ditampilkan ulang).
10. Tombol bid berubah menjadi **non-aktif** dengan label *"Anda sudah memasukkan penawaran"*.

#### B. Proses Otomatis saat Deadline (Cron Job)

Cron job berjalan setiap 5 menit untuk memeriksa lelang yang sudah melewati `tanggal_selesai`.

1. Ambil semua record `pemasaran` dengan `mode = vickrey`, `status = aktif`, dan `tanggal_selesai <= NOW()`.
2. Untuk setiap lelang yang ditemukan:

**Jika tidak ada bid sama sekali:**
- Status `pemasaran` berubah ke `selesai`.
- Status barang berubah ke `GAGAL`.
- Tidak ada transaksi dibuat.

**Jika ada 1 bid:**
- Pemenang = user pemilik bid tersebut.
- `harga_final` = `harga_dasar` (bukan nilai bid pemenang).
- Lanjut ke langkah pembuatan transaksi.

**Jika ada ≥ 2 bid:**
- Urutkan bid dari tertinggi ke terendah.
- `B1` = bid tertinggi → pemenang.
- `B2` = bid tertinggi kedua → `harga_final` yang harus dibayar.
- Lanjut ke langkah pembuatan transaksi.

**Pembuatan Transaksi (setelah pemenang ditentukan):**
- Update record `pemasaran`: set `pemenang_id`, `harga_final`, `status = selesai`.
- Buat record baru di tabel `transaksi` dengan:
  - `status = MENUNGGU_PEMBAYARAN`
  - `batas_waktu_bayar = NOW() + 24 jam`
- Status barang berubah ke `MENUNGGU_PEMBAYARAN`.
- Notifikasi pemenang (tampil di dashboard/halaman transaksi).

#### C. Pembayaran oleh Pemenang Vickrey

Identik dengan alur pembayaran Fixed Price (bagian 4.7), dengan perbedaan:
- Jumlah yang harus dibayar adalah `harga_final` (B2), bukan nilai bid pemenang.
- Batas waktu pembayaran adalah **24 jam** sejak transaksi dibuat.
- Halaman detail transaksi menampilkan **countdown timer** sisa waktu pembayaran.

**Jika Tidak Membayar dalam 24 Jam:**
1. Cron job mendeteksi `batas_waktu_bayar <= NOW()` dengan status `MENUNGGU_PEMBAYARAN`.
2. Status transaksi → `GAGAL`.
3. Status barang → `GAGAL`.
4. Sistem mencatat **pelanggaran** (lihat bagian 4.10).

---

### 4.10 Sistem Blacklist — Pemenang Gagal Bayar

#### Aturan Pelanggaran & Durasi Blokir

Pelanggaran dihitung secara **akumulatif permanen** (tidak pernah direset, bahkan setelah masa blokir selesai).

| Akumulasi Pelanggaran | Durasi Blokir Ikut Lelang Vickrey |
|---|---|
| 1 kali | 7 hari |
| 2 kali | 30 hari |
| 3 kali | 90 hari |
| 4 kali atau lebih | 365 hari (1 tahun) |

> **Catatan:** Blokir **hanya** berlaku untuk berpartisipasi dalam **lelang Vickrey**. User yang terblokir tetap dapat: login, melihat katalog, dan membeli barang fixed price.

#### Workflow Pencatatan Otomatis (Cron Job)

Saat cron job mendeteksi pemenang tidak membayar dalam 24 jam:

1. Tambahkan 1 record baru ke tabel `pelanggaran_user` (berisi referensi ke lelang dan transaksi terkait).
2. Hitung total akumulasi pelanggaran user tersebut.
3. Tentukan durasi blokir berdasarkan tabel di atas.
4. **Jika belum ada record blacklist untuk user ini:**
   - Buat record baru di tabel `blacklist`.
5. **Jika sudah ada record blacklist (dari pelanggaran sebelumnya):**
   - Update kolom `total_pelanggaran` dan `tanggal_blokir_selesai`.
   - Jika blacklist sebelumnya sudah tidak aktif (`is_aktif = false`), aktifkan kembali.
6. Catat tindakan di `log_blacklist_action`.

#### Pengelolaan Blacklist oleh Admin Unit

Halaman `/admin/blacklist` — menampilkan user yang memiliki riwayat pelanggaran **di unit ini**.

Informasi yang ditampilkan per user:
- Nama user dan email.
- Total pelanggaran akumulatif.
- Status blacklist saat ini: **Aktif** (dengan tanggal selesai) atau **Tidak Aktif**.
- Tombol **"Lihat Riwayat Pelanggaran"** → detail setiap pelanggaran (nama barang, tanggal lelang, tanggal pelanggaran).

Tindakan yang **bisa** dilakukan Admin Unit:
- Memperpanjang masa blokir secara manual (dengan mengisi alasan yang wajib dicatat).

Tindakan yang **tidak bisa** dilakukan Admin Unit:
- ❌ Menghapus riwayat pelanggaran (data permanen untuk audit).
- ❌ Mencabut/mempersingkat masa blokir (hanya Super Admin).

#### Pengelolaan Blacklist oleh Super Admin

Halaman `/superadmin/blacklist` — menampilkan blacklist lintas semua unit.

Tindakan tambahan yang bisa dilakukan Super Admin:
- **Mencabut blacklist lebih awal** (early unblock) — wajib mengisi alasan.
- Semua tindakan Super Admin pada blacklist dicatat di `log_blacklist_action`.

---

### 4.11 Re-Listing Barang Gagal (Admin Unit)

**Prasyarat:** Status barang = `GAGAL`.

**Workflow:**
1. Admin membuka detail barang berstatus `GAGAL`.
2. Admin mengklik **"Pasarkan Ulang"**.
3. Sistem menampilkan form konfigurasi ulang (sama seperti form 4.6):
   - Mode pemasaran (bisa diubah — misalnya dari Vickrey ke Fixed Price).
   - Harga jual / harga dasar baru (disarankan lebih rendah dari sebelumnya).
   - Durasi baru (jika Vickrey).
4. Sistem mengarsipkan record `pemasaran` sebelumnya (tidak dihapus).
5. Sistem membuat record `pemasaran` baru.
6. Status barang berubah dari `GAGAL` → `DIPASARKAN`.
7. Barang muncul kembali di katalog publik.

---

### 4.12 Manajemen Rekening Bank per Unit (Super Admin)

**Konteks:** Setiap unit Pegadaian memiliki rekening bank sendiri sebagai tujuan transfer pembayaran dari user.

**Workflow:**
1. Super Admin membuka `/superadmin/unit/[id]/rekening`.
2. Halaman menampilkan daftar rekening bank yang terdaftar untuk unit tersebut.
3. Super Admin dapat:
   - **Menambahkan** rekening bank baru.
   - **Mengedit** data rekening yang ada.
   - **Menetapkan** satu rekening sebagai **rekening aktif/utama** (rekening lain otomatis non-aktif).
   - **Menonaktifkan** rekening yang sudah tidak digunakan.

**Field per Rekening:**

| Field | Tipe | Keterangan |
|---|---|---|
| `nama_bank` | string | Contoh: BRI, BCA, Mandiri, BNI, BSI |
| `nomor_rekening` | string | Nomor rekening tujuan |
| `nama_pemilik_rekening` | string | Nama pemilik rekening |
| `is_aktif` | boolean | Hanya satu rekening yang `TRUE` per unit |

**Aturan Bisnis:**
- Hanya **satu rekening** yang boleh `is_aktif = TRUE` per unit pada satu waktu.
- Saat Super Admin mengaktifkan rekening baru, rekening aktif sebelumnya otomatis di-set `is_aktif = FALSE`.
- Jika tidak ada rekening aktif untuk sebuah unit, opsi pembayaran **Transfer Bank** tidak ditampilkan ke user untuk barang dari unit tersebut.

---

## 5. Spesifikasi Halaman & Sitemap

### 5.1 Halaman Publik (Guest & User)

| Path | Deskripsi |
|---|---|
| `/` | Landing page: hero section, statistik (jumlah barang aktif, unit terdaftar), preview barang terbaru. |
| `/katalog` | Daftar semua barang berstatus `DIPASARKAN`. Filter: kategori, unit, mode (fixed/vickrey), rentang harga. Sorting: terbaru, harga. Paginasi 20 item/halaman. |
| `/katalog/[id]` | Detail barang: galeri foto & video, deskripsi, kondisi, harga/harga dasar, mode (badge Fixed Price / Lelang), countdown timer jika Vickrey, informasi unit. |
| `/login` | Form login untuk semua role. |
| `/register` | Form registrasi user baru. |

### 5.2 Halaman User (Login Required)

| Path | Deskripsi |
|---|---|
| `/dashboard` | Ringkasan: transaksi aktif, lelang yang diikuti, notifikasi (hasil bid, status pembayaran). |
| `/katalog/[id]/beli` | Halaman konfirmasi pembelian + pilih metode bayar (fixed price). |
| `/katalog/[id]/bid` | Form submit bid Vickrey (jika user belum bid & tidak blacklist). |
| `/transaksi` | Daftar semua transaksi user (semua status). |
| `/transaksi/[id]` | Detail transaksi: instruksi bayar, form upload bukti (jika transfer), countdown timer (jika Vickrey), tombol cetak nota (jika lunas). |
| `/transaksi/[id]/nota` | Halaman nota transaksi yang dioptimalkan untuk print/PDF. |
| `/riwayat-bid` | Riwayat partisipasi lelang Vickrey (menang/kalah, harga). |
| `/profil` | Edit data diri dan ganti password. |

### 5.3 Halaman Admin Unit (Role: `admin_unit`)

| Path | Deskripsi |
|---|---|
| `/admin` | Dashboard: statistik unit (barang per status, transaksi pending verifikasi, lelang aktif). |
| `/admin/barang` | Daftar semua barang unit. Filter by status. Highlight barang jatuh tempo. |
| `/admin/barang/tambah` | Form input barang gadai baru (termasuk upload foto & video). |
| `/admin/barang/[id]` | Detail barang lengkap + tombol aksi sesuai status saat ini (lihat tabel transisi). |
| `/admin/barang/[id]/edit` | Edit data barang (hanya saat status `GADAI` atau `JAMINAN`). |
| `/admin/barang/[id]/perpanjang` | Form catat perpanjangan masa gadai. |
| `/admin/barang/[id]/riwayat-perpanjangan` | Riwayat semua perpanjangan untuk barang ini. |
| `/admin/lelang` | Daftar semua sesi pemasaran unit (aktif & historis). |
| `/admin/lelang/[id]` | Detail sesi pemasaran: daftar bid (setelah deadline untuk Vickrey), info pemenang, status. |
| `/admin/transaksi` | Daftar transaksi yang membutuhkan tindakan admin. Filter: `BUKTI_DIUNGGAH`, `MENUNGGU_KONFIRMASI_LANGSUNG`. |
| `/admin/transaksi/[id]` | Detail transaksi: lihat bukti bayar user, tombol verifikasi/tolak/konfirmasi langsung, tombol cetak nota. |
| `/admin/blacklist` | Daftar user dengan riwayat pelanggaran di unit ini. Riwayat detail per user. Tombol perpanjang blokir. |
| `/admin/profil` | Edit profil admin unit. |

### 5.4 Halaman Super Admin (Role: `super_admin`)

| Path | Deskripsi |
|---|---|
| `/superadmin` | Dashboard global: statistik seluruh unit, grafik. |
| `/superadmin/unit` | Daftar semua unit Pegadaian. CRUD unit. |
| `/superadmin/unit/[id]` | Detail unit: informasi umum. |
| `/superadmin/unit/[id]/rekening` | Kelola rekening bank tujuan pembayaran untuk unit ini. |
| `/superadmin/admin` | Daftar & CRUD akun Admin Unit. |
| `/superadmin/monitoring` | Monitoring global: semua barang dan transaksi lintas unit (read-only). |
| `/superadmin/blacklist` | Blacklist global lintas semua unit. Tombol cabut blacklist. |

---

## 6. Tech Stack

### Arsitektur: Full Stack Next.js (Monorepo)

| Layer | Teknologi | Keterangan |
|---|---|---|
| **Framework** | Next.js 14+ (App Router) | Frontend + Backend dalam satu project |
| **Bahasa** | TypeScript | Strict mode |
| **UI Components** | shadcn/ui | Berbasis Radix UI |
| **Styling** | Tailwind CSS | Utility-first |
| **Database** | PostgreSQL | Relational database |
| **ORM** | Drizzle ORM | Type-safe, schema-as-code |
| **Autentikasi** | Jose (JWT manual) + httpOnly cookie | Atau NextAuth.js v5 |
| **Validasi** | Zod | Schema validation di server & client |
| **Upload File** | Next.js Route Handler + `formidable` | Simpan di `/public/uploads` atau cloud storage |
| **Penjadwalan** | `node-cron` via custom server ATAU Vercel Cron | Untuk proses lelang otomatis |
| **Cetak/PDF** | CSS `@media print` + `window.print()` | Untuk nota transaksi |
| **Hashing** | Node.js `crypto` (SHA-256) | Untuk bid hash Vickrey |
| **Password** | `bcrypt` | Salt rounds ≥ 12 |

### Struktur Direktori Proyek

```
/
├── app/
│   ├── (public)/                     # Halaman yang dapat diakses tanpa login
│   │   ├── page.tsx                  # Landing page
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── katalog/
│   │       ├── page.tsx
│   │       └── [id]/
│   │           ├── page.tsx
│   │           ├── beli/page.tsx
│   │           └── bid/page.tsx
│   │
│   ├── (user)/                       # Halaman untuk user yang sudah login
│   │   ├── dashboard/page.tsx
│   │   ├── transaksi/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── nota/page.tsx     # Halaman cetak nota
│   │   ├── riwayat-bid/page.tsx
│   │   └── profil/page.tsx
│   │
│   ├── admin/                        # Halaman Admin Unit
│   │   ├── page.tsx
│   │   ├── barang/
│   │   │   ├── page.tsx
│   │   │   ├── tambah/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       ├── edit/page.tsx
│   │   │       ├── perpanjang/page.tsx
│   │   │       └── riwayat-perpanjangan/page.tsx
│   │   ├── lelang/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── transaksi/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── blacklist/page.tsx
│   │
│   ├── superadmin/                   # Halaman Super Admin
│   │   ├── page.tsx
│   │   ├── unit/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── rekening/page.tsx
│   │   ├── admin/page.tsx
│   │   ├── monitoring/page.tsx
│   │   └── blacklist/page.tsx
│   │
│   └── api/                          # Route Handlers (Backend API)
│       ├── auth/
│       │   ├── login/route.ts
│       │   ├── logout/route.ts
│       │   ├── register/route.ts
│       │   └── me/route.ts
│       ├── barang/
│       │   ├── route.ts              # GET (publik, hanya status DIPASARKAN)
│       │   └── [id]/route.ts         # GET (publik)
│       ├── admin/
│       │   ├── barang/
│       │   │   ├── route.ts          # GET semua, POST tambah
│       │   │   └── [id]/
│       │   │       ├── route.ts      # GET detail, PUT edit
│       │   │       ├── media/route.ts
│       │   │       ├── media/[mediaId]/route.ts
│       │   │       ├── perpanjang/route.ts
│       │   │       ├── tebus/route.ts
│       │   │       ├── jadikan-jaminan/route.ts
│       │   │       ├── pasarkan/route.ts
│       │   │       └── pasarkan-ulang/route.ts
│       │   ├── lelang/
│       │   │   ├── route.ts
│       │   │   └── [id]/route.ts
│       │   ├── transaksi/
│       │   │   ├── route.ts
│       │   │   └── [id]/
│       │   │       ├── route.ts
│       │   │       ├── verifikasi/route.ts
│       │   │       ├── tolak-bukti/route.ts
│       │   │       └── konfirmasi-langsung/route.ts
│       │   └── blacklist/
│       │       ├── route.ts
│       │       └── [userId]/
│       │           ├── route.ts
│       │           └── perpanjang/route.ts
│       ├── user/
│       │   ├── beli/[pemasaranId]/route.ts
│       │   ├── bid/[pemasaranId]/route.ts
│       │   ├── transaksi/
│       │   │   ├── route.ts
│       │   │   └── [id]/
│       │   │       ├── route.ts
│       │   │       └── upload-bukti/route.ts
│       │   └── riwayat-bid/route.ts
│       ├── superadmin/
│       │   ├── unit/
│       │   │   ├── route.ts
│       │   │   └── [id]/
│       │   │       ├── route.ts
│       │   │       └── rekening/
│       │   │           ├── route.ts
│       │   │           └── [rekeningId]/route.ts
│       │   ├── admin/
│       │   │   ├── route.ts
│       │   │   └── [id]/route.ts
│       │   ├── monitoring/route.ts
│       │   └── blacklist/
│       │       ├── route.ts
│       │       └── [userId]/cabut/route.ts
│       └── cron/
│           └── proses-lelang/route.ts
│
├── lib/
│   ├── db/
│   │   ├── index.ts                  # Koneksi Drizzle + PostgreSQL
│   │   └── schema.ts                 # Semua definisi tabel
│   ├── auth.ts                       # Helper JWT: sign, verify, getSession
│   ├── validations/                  # Zod schemas per domain
│   │   ├── barang.ts
│   │   ├── pemasaran.ts
│   │   ├── transaksi.ts
│   │   └── auth.ts
│   └── services/                     # Business logic (dipanggil dari Route Handlers)
│       ├── barang.service.ts
│       ├── pemasaran.service.ts
│       ├── transaksi.service.ts
│       ├── blacklist.service.ts
│       └── cron.service.ts           # Logic proses lelang expired
│
├── components/
│   ├── ui/                           # shadcn/ui base components
│   ├── barang/
│   ├── katalog/
│   ├── transaksi/
│   ├── admin/
│   └── shared/
│
├── middleware.ts                     # Route protection berdasarkan role dari JWT
├── drizzle.config.ts
└── next.config.ts
```

---

## 7. Database Schema (Drizzle ORM — PostgreSQL)

### Tabel: `units`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
nama_unit       VARCHAR(255) NOT NULL
kode_unit       VARCHAR(50)  UNIQUE NOT NULL
alamat          TEXT
kota            VARCHAR(100)
is_aktif        BOOLEAN NOT NULL DEFAULT TRUE
created_at      TIMESTAMP NOT NULL DEFAULT NOW()
updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
```

### Tabel: `rekening_unit`
```sql
id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
unit_id               UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE
nama_bank             VARCHAR(100) NOT NULL
nomor_rekening        VARCHAR(50)  NOT NULL
nama_pemilik_rekening VARCHAR(255) NOT NULL
is_aktif              BOOLEAN NOT NULL DEFAULT FALSE
-- Constraint: hanya satu rekening is_aktif=TRUE per unit (enforced via unique partial index)
created_at            TIMESTAMP NOT NULL DEFAULT NOW()
updated_at            TIMESTAMP NOT NULL DEFAULT NOW()
```

### Tabel: `users`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
nama_lengkap    VARCHAR(255) NOT NULL
email           VARCHAR(255) UNIQUE NOT NULL
password_hash   VARCHAR(255) NOT NULL
no_telepon      VARCHAR(20)
no_ktp          VARCHAR(20)
-- Tidak ditampilkan publik, digunakan untuk identifikasi pelanggaran
role            VARCHAR(20)  NOT NULL DEFAULT 'user'
-- CHECK: role IN ('super_admin', 'admin_unit', 'user')
unit_id         UUID REFERENCES units(id)
-- NULL jika role = super_admin atau user
is_aktif        BOOLEAN NOT NULL DEFAULT TRUE
created_at      TIMESTAMP NOT NULL DEFAULT NOW()
updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
```

### Tabel: `barang`
```sql
id               UUID PRIMARY KEY DEFAULT gen_random_uuid()
unit_id          UUID NOT NULL REFERENCES units(id)
nama_barang      VARCHAR(255) NOT NULL
kategori         VARCHAR(50)  NOT NULL
-- CHECK: kategori IN ('emas', 'elektronik', 'kendaraan', 'perhiasan', 'lainnya')
deskripsi        TEXT
kondisi          VARCHAR(20)  NOT NULL
-- CHECK: kondisi IN ('baik', 'cukup', 'rusak_ringan')
nilai_taksiran   DECIMAL(15,2) NOT NULL
nilai_gadai      DECIMAL(15,2) NOT NULL

-- Data nasabah — TIDAK PERNAH dikembalikan di endpoint publik
nama_penggadai   VARCHAR(255) NOT NULL
nomor_nasabah    VARCHAR(100)

tanggal_gadai         DATE NOT NULL
tanggal_jatuh_tempo   DATE NOT NULL

status           VARCHAR(30)  NOT NULL DEFAULT 'gadai'
-- CHECK: status IN ('gadai', 'ditebus', 'jaminan', 'dipasarkan',
--                   'menunggu_pembayaran', 'terjual', 'gagal')

tanggal_ditebus       DATE        -- diisi saat status = ditebus
nomor_ref_penebusan   VARCHAR(100) -- nomor referensi transaksi penebusan offline

created_by       UUID NOT NULL REFERENCES users(id)
created_at       TIMESTAMP NOT NULL DEFAULT NOW()
updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
```

### Tabel: `media_barang`
```sql
id           UUID PRIMARY KEY DEFAULT gen_random_uuid()
barang_id    UUID NOT NULL REFERENCES barang(id) ON DELETE CASCADE
tipe         VARCHAR(10) NOT NULL
-- CHECK: tipe IN ('foto', 'video')
url          VARCHAR(500) NOT NULL
nama_file    VARCHAR(255)
ukuran_byte  BIGINT
urutan       INTEGER NOT NULL DEFAULT 0
-- Urutan tampil; urutan=0 & tipe='foto' = foto thumbnail utama
created_at   TIMESTAMP NOT NULL DEFAULT NOW()
```

### Tabel: `riwayat_perpanjangan`
```sql
id                       UUID PRIMARY KEY DEFAULT gen_random_uuid()
barang_id                UUID NOT NULL REFERENCES barang(id)
tanggal_jatuh_tempo_lama DATE NOT NULL
tanggal_jatuh_tempo_baru DATE NOT NULL
catatan                  TEXT
diperpanjang_oleh        UUID NOT NULL REFERENCES users(id)
created_at               TIMESTAMP NOT NULL DEFAULT NOW()
```

### Tabel: `pemasaran`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
barang_id       UUID NOT NULL REFERENCES barang(id)
mode            VARCHAR(20)  NOT NULL
-- CHECK: mode IN ('fixed_price', 'vickrey')

-- Untuk fixed_price
harga_jual      DECIMAL(15,2)
-- Diisi jika mode = fixed_price

-- Untuk vickrey
harga_dasar     DECIMAL(15,2)
-- Diisi jika mode = vickrey (juga digunakan sebagai harga bayar jika hanya 1 penawar)
durasi_hari     INTEGER
-- Diisi jika mode = vickrey; range 1–30
tanggal_mulai   TIMESTAMP
tanggal_selesai TIMESTAMP
-- tanggal_selesai = tanggal_mulai + durasi_hari

-- Hasil (diisi otomatis oleh cron job setelah deadline)
pemenang_id     UUID REFERENCES users(id)
harga_final     DECIMAL(15,2)
-- B2 untuk vickrey; harga_jual untuk fixed_price

iterasi         INTEGER NOT NULL DEFAULT 1
-- Bertambah 1 setiap re-listing
status          VARCHAR(20)  NOT NULL DEFAULT 'aktif'
-- CHECK: status IN ('aktif', 'selesai', 'gagal')

created_by      UUID NOT NULL REFERENCES users(id)
created_at      TIMESTAMP NOT NULL DEFAULT NOW()
updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
```

### Tabel: `bids`
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
pemasaran_id UUID NOT NULL REFERENCES pemasaran(id)
user_id     UUID NOT NULL REFERENCES users(id)
bid_hash    VARCHAR(64) NOT NULL
-- SHA-256(user_id || nominal || salt) — untuk verifikasi integritas
nominal     DECIMAL(15,2) NOT NULL
-- Nilai asli bid; hanya dibaca sistem saat deadline, TIDAK dikembalikan ke API sebelum deadline
salt        VARCHAR(64) NOT NULL
-- Random string unik per bid
created_at  TIMESTAMP NOT NULL DEFAULT NOW()

UNIQUE (pemasaran_id, user_id)
-- Satu user hanya bisa memasukkan satu bid per sesi lelang
```

### Tabel: `transaksi`
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
pemasaran_id        UUID NOT NULL REFERENCES pemasaran(id)
user_id             UUID NOT NULL REFERENCES users(id)
tipe                VARCHAR(20)  NOT NULL
-- CHECK: tipe IN ('fixed_price', 'vickrey')
harga_bayar         DECIMAL(15,2) NOT NULL
metode_bayar        VARCHAR(20)
-- CHECK: metode_bayar IN ('transfer', 'langsung')
-- NULL selama user belum memilih metode

status              VARCHAR(40)  NOT NULL DEFAULT 'menunggu_pembayaran'
-- CHECK: status IN (
--   'menunggu_pembayaran',       -- user belum memilih metode / belum upload
--   'bukti_diunggah',            -- user upload bukti transfer, menunggu verifikasi admin
--   'menunggu_konfirmasi_langsung', -- user memilih bayar langsung, menunggu datang
--   'lunas',                     -- admin verifikasi, pembayaran diterima
--   'ditolak_bukti',             -- admin menolak bukti, user perlu upload ulang
--   'gagal'                      -- waktu habis / tidak bayar
-- )

bukti_bayar_url     VARCHAR(500)
-- URL file yang diupload user (jika metode = transfer)
alasan_penolakan    TEXT
-- Diisi admin jika status = ditolak_bukti
nomor_referensi     VARCHAR(100)
-- Diisi admin saat verifikasi (nomor kuitansi/referensi offline)
batas_waktu_bayar   TIMESTAMP
-- Untuk vickrey: created_at + 24 jam; untuk fixed_price: created_at + 24 jam (opsional)

verified_by         UUID REFERENCES users(id)
verified_at         TIMESTAMP

created_at          TIMESTAMP NOT NULL DEFAULT NOW()
updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
```

### Tabel: `pelanggaran_user`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID NOT NULL REFERENCES users(id)
pemasaran_id    UUID NOT NULL REFERENCES pemasaran(id)
transaksi_id    UUID NOT NULL REFERENCES transaksi(id)
unit_id         UUID NOT NULL REFERENCES units(id)
keterangan      TEXT NOT NULL DEFAULT
  'Pemenang lelang tidak melakukan pembayaran dalam batas waktu 24 jam.'
created_at      TIMESTAMP NOT NULL DEFAULT NOW()
```

### Tabel: `blacklist`
```sql
id                      UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id                 UUID NOT NULL UNIQUE REFERENCES users(id)
-- Satu record per user; diupdate setiap ada pelanggaran baru
total_pelanggaran       INTEGER NOT NULL DEFAULT 0
is_aktif                BOOLEAN NOT NULL DEFAULT TRUE
tanggal_blokir_mulai    TIMESTAMP NOT NULL DEFAULT NOW()
tanggal_blokir_selesai  TIMESTAMP NOT NULL
dicabut_oleh            UUID REFERENCES users(id)
-- Diisi jika Super Admin mencabut blacklist lebih awal
alasan_pencabutan       TEXT
updated_at              TIMESTAMP NOT NULL DEFAULT NOW()
```

### Tabel: `log_blacklist_action`
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
blacklist_id  UUID NOT NULL REFERENCES blacklist(id)
target_user_id UUID NOT NULL REFERENCES users(id)
aksi          VARCHAR(50) NOT NULL
-- CHECK: aksi IN ('blokir_otomatis', 'perpanjang_manual', 'cabut_manual')
dilakukan_oleh UUID REFERENCES users(id)
-- NULL jika aksi = blokir_otomatis (oleh sistem/cron)
keterangan    TEXT
created_at    TIMESTAMP NOT NULL DEFAULT NOW()
```

### Tabel: `riwayat_status_barang`
```sql
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
barang_id     UUID NOT NULL REFERENCES barang(id)
status_lama   VARCHAR(30)
status_baru   VARCHAR(30) NOT NULL
diubah_oleh   UUID REFERENCES users(id)
-- NULL jika diubah oleh sistem (cron job)
keterangan    TEXT
created_at    TIMESTAMP NOT NULL DEFAULT NOW()
```

---

## 8. API Route Reference (Next.js Route Handlers)

### Auth
| Method | Route | Deskripsi | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Registrasi user baru | Public |
| POST | `/api/auth/login` | Login semua role | Public |
| POST | `/api/auth/logout` | Hapus session cookie | All |
| GET | `/api/auth/me` | Data user aktif dari JWT | All |

### Barang (Publik)
| Method | Route | Deskripsi | Auth |
|---|---|---|---|
| GET | `/api/barang` | Daftar barang berstatus `dipasarkan` | Public |
| GET | `/api/barang/[id]` | Detail barang (tanpa field data nasabah) | Public |

### Admin Unit — Manajemen Barang
| Method | Route | Deskripsi | Auth |
|---|---|---|---|
| GET | `/api/admin/barang` | Daftar semua barang unit (semua status) | Admin |
| POST | `/api/admin/barang` | Input barang gadai baru | Admin |
| GET | `/api/admin/barang/[id]` | Detail barang (termasuk data nasabah) | Admin |
| PUT | `/api/admin/barang/[id]` | Edit barang (hanya jika status = gadai/jaminan) | Admin |
| POST | `/api/admin/barang/[id]/media` | Upload foto/video ke barang | Admin |
| DELETE | `/api/admin/barang/[id]/media/[mediaId]` | Hapus media (hanya status gadai/jaminan) | Admin |
| POST | `/api/admin/barang/[id]/perpanjang` | Catat perpanjangan masa gadai | Admin |
| POST | `/api/admin/barang/[id]/tebus` | Catat penebusan oleh nasabah | Admin |
| POST | `/api/admin/barang/[id]/jadikan-jaminan` | Konfirmasi barang → jaminan | Admin |
| POST | `/api/admin/barang/[id]/pasarkan` | Publikasi ke katalog (pilih mode + konfigurasi) | Admin |
| POST | `/api/admin/barang/[id]/pasarkan-ulang` | Re-listing barang yang gagal | Admin |

### Admin Unit — Lelang & Transaksi
| Method | Route | Deskripsi | Auth |
|---|---|---|---|
| GET | `/api/admin/lelang` | Daftar semua sesi pemasaran unit | Admin |
| GET | `/api/admin/lelang/[id]` | Detail pemasaran + daftar bid (setelah deadline) | Admin |
| GET | `/api/admin/transaksi` | Daftar transaksi yang perlu tindakan | Admin |
| GET | `/api/admin/transaksi/[id]` | Detail transaksi + bukti bayar (jika ada) | Admin |
| POST | `/api/admin/transaksi/[id]/verifikasi` | Verifikasi bukti transfer → `LUNAS` | Admin |
| POST | `/api/admin/transaksi/[id]/tolak-bukti` | Tolak bukti transfer (isi alasan) | Admin |
| POST | `/api/admin/transaksi/[id]/konfirmasi-langsung` | Konfirmasi bayar tunai → `LUNAS` | Admin |

### Admin Unit — Blacklist
| Method | Route | Deskripsi | Auth |
|---|---|---|---|
| GET | `/api/admin/blacklist` | Daftar user dengan riwayat pelanggaran di unit ini | Admin |
| GET | `/api/admin/blacklist/[userId]` | Detail riwayat pelanggaran per user | Admin |
| POST | `/api/admin/blacklist/[userId]/perpanjang` | Perpanjang masa blokir (wajib isi alasan) | Admin |

### User — Transaksi & Bidding
| Method | Route | Deskripsi | Auth |
|---|---|---|---|
| POST | `/api/user/beli/[pemasaranId]` | Ajukan pembelian fixed price | User |
| POST | `/api/user/bid/[pemasaranId]` | Submit bid Vickrey | User |
| GET | `/api/user/transaksi` | Daftar transaksi milik user | User |
| GET | `/api/user/transaksi/[id]` | Detail transaksi + instruksi bayar | User |
| POST | `/api/user/transaksi/[id]/upload-bukti` | Upload bukti pembayaran transfer | User |
| GET | `/api/user/riwayat-bid` | Riwayat bidding Vickrey | User |

### Super Admin
| Method | Route | Deskripsi | Auth |
|---|---|---|---|
| GET/POST | `/api/superadmin/unit` | List & tambah unit | SuperAdmin |
| GET/PUT/DELETE | `/api/superadmin/unit/[id]` | Detail, edit, hapus unit | SuperAdmin |
| GET/POST | `/api/superadmin/unit/[id]/rekening` | Kelola rekening bank unit | SuperAdmin |
| PUT | `/api/superadmin/unit/[id]/rekening/[rid]` | Edit rekening / set sebagai aktif | SuperAdmin |
| GET/POST | `/api/superadmin/admin` | List & tambah admin unit | SuperAdmin |
| GET/PUT/DELETE | `/api/superadmin/admin/[id]` | Detail, edit, nonaktifkan admin unit | SuperAdmin |
| GET | `/api/superadmin/monitoring` | Monitoring global (read-only) | SuperAdmin |
| GET | `/api/superadmin/blacklist` | Blacklist global lintas unit | SuperAdmin |
| POST | `/api/superadmin/blacklist/[userId]/cabut` | Cabut blacklist lebih awal | SuperAdmin |

### Cron (Internal, dilindungi secret key)
| Method | Route | Deskripsi | Auth |
|---|---|---|---|
| POST | `/api/cron/proses-lelang` | Proses semua lelang expired: tentukan pemenang, catat gagal, set blacklist | `CRON_SECRET` header |

---

## 9. Business Rules & Validasi

### Transisi Status Barang
- Setiap perubahan status **harus** melalui endpoint yang sesuai — tidak boleh ada perubahan status langsung melalui `PUT /barang/[id]`.
- Sistem **menolak** semua transisi status yang tidak terdaftar di bagian 3.2.
- Setiap perubahan status selalu dicatat di tabel `riwayat_status_barang`.

### Barang Gadai
- `tanggal_jatuh_tempo` harus setelah `tanggal_gadai`.
- `nilai_gadai` harus ≤ `nilai_taksiran`.
- Perpanjangan hanya dapat dilakukan jika status = `GADAI`.
- `tanggal_jatuh_tempo_baru` harus lebih besar dari `tanggal_jatuh_tempo` saat ini.
- Admin hanya dapat mengelola barang milik `unit_id`-nya (diverifikasi dari JWT token, bukan dari request body).
- `nama_penggadai` dan `nomor_nasabah` tidak boleh hadir dalam response endpoint publik.

### Pemasaran & Lelang
- `harga_jual` / `harga_dasar` harus > 0.
- Durasi Vickrey: 1 hari ≤ durasi ≤ 30 hari.
- Satu barang hanya boleh memiliki **satu** record `pemasaran` dengan status `aktif`.
- Setelah status barang = `DIPASARKAN`, tidak bisa kembali ke `JAMINAN` atau `GADAI`.

### Bidding Vickrey
- Satu user hanya dapat memasukkan satu bid per sesi pemasaran (enforced via `UNIQUE` constraint di tabel `bids`).
- Nominal bid harus ≥ `harga_dasar`.
- Bid tidak dapat diubah atau dibatalkan setelah disubmit.
- Endpoint admin **tidak boleh** mengembalikan kolom `nominal` dari tabel `bids` sebelum `tanggal_selesai` terlewati.
- User dengan blacklist aktif (`is_aktif = true` dan `tanggal_blokir_selesai > NOW()`) tidak dapat submit bid.

### Pembayaran
- Batas waktu pembayaran pemenang Vickrey: **24 jam** sejak transaksi dibuat.
- Upload bukti: format `jpg`, `png`, `pdf` — maks. 5 MB.
- Nomor referensi wajib diisi admin saat verifikasi.
- Setelah status transaksi = `LUNAS`, **tidak dapat** diubah lagi.

### Rekening Bank
- Hanya satu rekening `is_aktif = TRUE` per unit — enforced via unique partial index:
  ```sql
  CREATE UNIQUE INDEX ON rekening_unit (unit_id) WHERE is_aktif = TRUE;
  ```
- Jika tidak ada rekening aktif, opsi transfer bank tidak ditampilkan ke user.

### Blacklist
- Pelanggaran dihitung akumulatif permanen (tidak pernah direset).
- Blokir hanya untuk lelang Vickrey. Fixed price tetap dapat diakses.
- Admin unit hanya bisa memperpanjang blokir, tidak bisa mengurangi atau menghapus riwayat.
- Hanya Super Admin yang dapat mencabut blokir lebih awal.

---

## 10. Security Considerations

| Aspek | Implementasi |
|---|---|
| **Autentikasi** | JWT di `httpOnly` + `secure` + `sameSite=strict` cookie. Expiry: 8 jam. |
| **Otorisasi** | `middleware.ts` memvalidasi JWT dan memeriksa `role` sebelum request mencapai Route Handler. |
| **Isolasi Data Unit** | Setiap query Admin Unit **selalu** difilter dengan `unit_id` yang diambil dari JWT payload — tidak dapat di-override dari URL params atau request body. |
| **Bid Privacy** | Kolom `nominal` di tabel `bids` tidak pernah disertakan dalam response API sebelum `tanggal_selesai` lelang terlewati. Di-select secara eksplisit hanya di service cron. |
| **Transisi Status** | Validasi transisi status di layer service — request yang mencoba transisi tidak valid dikembalikan `400 Bad Request`. |
| **Password** | Di-hash dengan `bcrypt` (salt rounds = 12). |
| **Validasi Input** | Semua request body divalidasi dengan Zod di setiap Route Handler sebelum diproses. |
| **Upload File** | Validasi MIME type dan ukuran di server-side. Simpan file dengan nama acak (bukan nama asli dari user). |
| **Cron Endpoint** | `POST /api/cron/proses-lelang` memerlukan header `Authorization: Bearer ${CRON_SECRET}`. CRON_SECRET disimpan di environment variable. |
| **Data Nasabah** | `nama_penggadai` dan `nomor_nasabah` tidak pernah di-include dalam Drizzle `select` untuk query endpoint publik. |

---

## 11. Non-Functional Requirements

| Aspek | Target |
|---|---|
| **Responsivitas** | Tampilan optimal di desktop (≥1024px) dan mobile (≥375px). |
| **Performa** | Halaman katalog: TTI < 2 detik dengan SSR + paginasi 20 item/halaman. |
| **Skalabilitas** | Penambahan unit baru tidak memerlukan perubahan kode. |
| **Maintainability** | Setiap domain memiliki service terpisah di `lib/services/`. Route Handler hanya memanggil service, tidak berisi business logic langsung. |
| **Audit Trail** | Setiap perubahan status barang → `riwayat_status_barang`. Setiap perpanjangan → `riwayat_perpanjangan`. Setiap tindakan blacklist → `log_blacklist_action`. |
| **Cetak Nota** | Halaman nota dioptimalkan dengan `@media print`. Semua elemen navigasi, sidebar, dan tombol disembunyikan saat print. |
| **Konsistensi Data** | Cron job menggunakan database transaction untuk memastikan semua update (status barang, pemasaran, transaksi, blacklist) berhasil secara atomik. |

---

## 12. Out of Scope

- Notifikasi real-time (WebSocket) — gunakan polling atau badge counter di dashboard.
- Payment gateway eksternal.
- Mobile native app (Android/iOS).
- Integrasi dengan sistem internal Pegadaian.
- SMS/WhatsApp/email notification otomatis.
- Laporan keuangan / ekspor Excel.
- Fitur chat antara user dan admin.
- Manajemen stok atau inventaris lanjutan.

---

## 13. Glosarium

| Istilah | Definisi |
|---|---|
| **Barang Gadai** | Barang yang diserahkan nasabah kepada Pegadaian sebagai jaminan pinjaman. Status awal di sistem adalah `GADAI`. |
| **Penebusan** | Proses nasabah membayar pokok + bunga pinjaman dan mengambil kembali barangnya. Status barang menjadi `DITEBUS`. |
| **Perpanjangan** | Proses nasabah memperpanjang masa gadai sebelum jatuh tempo. Status barang tetap `GADAI` dengan tanggal jatuh tempo baru. |
| **Barang Jaminan** | Barang gadai yang tidak ditebus setelah jatuh tempo, sehingga resmi menjadi milik Pegadaian. Status `JAMINAN`. |
| **Pemasaran** | Proses Admin Unit mempublikasikan barang jaminan ke katalog publik dengan mode Fixed Price atau Vickrey Auction. Status `DIPASARKAN`. |
| **Fixed Price** | Mode penjualan di mana harga ditetapkan tetap oleh Admin Unit. |
| **Vickrey Auction** | Mekanisme lelang tertutup di mana pemenang adalah penawar tertinggi (B1) namun hanya membayar sebesar penawaran tertinggi kedua (B2). |
| **Sealed-bid** | Sistem bidding di mana nilai bid setiap penawar tidak diketahui oleh penawar lain selama lelang berlangsung. |
| **B1** | Bid tertinggi dalam Vickrey Auction — menentukan pemenang. |
| **B2** | Bid tertinggi kedua dalam Vickrey Auction — menentukan harga yang harus dibayar pemenang. |
| **Re-listing** | Proses Admin Unit mempublikasikan ulang barang yang gagal terjual ke katalog publik. |
| **Blacklist** | Status pemblokiran untuk user yang memenangkan lelang Vickrey namun tidak membayar dalam 24 jam. Mencegah user tersebut mengikuti lelang Vickrey selama periode blokir. |
| **Pelanggaran** | Satu kejadian di mana user menjadi pemenang lelang Vickrey tetapi tidak melakukan pembayaran dalam batas waktu 24 jam. |
| **Cron Job** | Proses terjadwal di server yang secara otomatis menangani pengecekan dan pemrosesan lelang yang sudah melewati deadline. |
| **Nota Transaksi** | Dokumen cetak resmi sebagai bukti transaksi jual beli yang dihasilkan sistem setelah pembayaran diverifikasi. |
| **Multi-unit** | Kemampuan sistem untuk mendukung dan mengelola lebih dari satu cabang/unit Pegadaian dalam satu instalasi aplikasi. |
