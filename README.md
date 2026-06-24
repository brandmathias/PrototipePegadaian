<p align="center">
  <img src="public/brand/ruang-agunan-icon.png" alt="Logo Ruang Agunan" width="92" />
</p>

<h1 align="center">Ruang Agunan</h1>

<p align="center">
  <strong>Prototype Sistem Informasi Pengelolaan Aset Agunan, Harga Tetap, dan Lelang Tertutup</strong>
</p>

<p align="center">
  Project ini dikembangkan sebagai <strong>tugas akhir</strong> dan berfungsi sebagai prototype akademik, bukan platform komersial atau sistem resmi lembaga apa pun.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-149ECA?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Drizzle_ORM-Data_Layer-C5F74F?style=for-the-badge&logo=drizzle&logoColor=111827" alt="Drizzle ORM" />
</p>

---

## 📌 Deskripsi Project

Ruang Agunan adalah aplikasi web full-stack yang mensimulasikan proses pengelolaan aset agunan secara digital. Aplikasi ini menyediakan alur untuk pengunjung, buyer, Admin Unit, dan Superadmin dalam satu sistem yang saling terhubung.

Melalui Ruang Agunan, pengguna dapat melihat katalog aset, menyimpan wishlist, membeli barang Harga Tetap, mengikuti Lelang Tertutup, memantau transaksi, menerima notifikasi, mencetak nota, dan membaca pusat bantuan. Dari sisi operasional, Admin Unit dapat mengelola barang, pemasaran, transaksi, verifikasi pembayaran, dan riwayat barang. Superadmin dapat memantau performa nasional, unit, admin, blacklist, serta kebijakan pelanggaran.

Project ini menekankan alur transaksi yang jelas, privasi penawaran pada Lelang Tertutup, dashboard laporan yang mudah dibaca, dan dokumentasi yang siap dipakai untuk kebutuhan presentasi tugas akhir.

---

## 👨‍🎓 Identitas Pengembang

| Informasi | Detail |
| --- | --- |
| Nama | Brando Mathias Zusriadi |
| NIM | 220211060351 |
| Program Studi | Teknik Informatika |
| Universitas | Universitas Sam Ratulangi |
| Konteks | Project Tugas Akhir |

---

## ✨ Fitur Utama

### 🏠 Beranda dan Katalog Publik

Beranda dan katalog menjadi pintu masuk pengguna untuk melihat aset yang sedang tersedia. Pengguna dapat membuka detail barang, melihat media, membaca informasi unit, dan memahami status pemasaran.

Fitur:

- Katalog aset dengan filter dan sortir.
- Detail barang dengan galeri foto/video.
- Statistik ringkas seperti jumlah dilihat, disukai, dan peserta.
- Mode pemasaran Harga Tetap dan Lelang Tertutup.

**Screenshot**

```text
docs/readme-screenshots/01-beranda.png
docs/readme-screenshots/02-katalog.png
docs/readme-screenshots/03-detail-barang.png
```

<img src="docs/readme-screenshots/01-beranda.png" alt="Beranda Ruang Agunan" width="100%" />

---

### 🛒 Buyer Area

Buyer Area menyediakan pengalaman pengguna untuk mengikuti transaksi dari awal sampai selesai. Buyer dapat menyimpan barang, membeli barang Harga Tetap, mengikuti Lelang Tertutup, melihat transaksi, dan membaca notifikasi.

Fitur:

- Dashboard buyer.
- Wishlist barang.
- Pembelian Harga Tetap.
- Bid Lelang Tertutup.
- Riwayat transaksi.
- Riwayat bid.
- Halaman menang dan bukan pemenang.
- Nota transaksi.
- Pusat Bantuan.

**Screenshot**

```text
docs/readme-screenshots/04-dashboard-buyer.png
docs/readme-screenshots/05-wishlist.png
docs/readme-screenshots/06-transaksi-buyer.png
docs/readme-screenshots/07-pusat-bantuan.png
```

<img src="docs/readme-screenshots/04-dashboard-buyer.png" alt="Dashboard Buyer Ruang Agunan" width="100%" />

---

### 🔒 Lelang Tertutup

Lelang Tertutup dirancang agar nominal penawaran tetap privat selama periode lelang berlangsung. Peserta lain, Admin Unit, dan Superadmin tidak mengetahui nominal bid sebelum lelang berakhir.

Fitur:

- Form bid dengan validasi harga dasar.
- Persetujuan konsekuensi pembayaran sebelum bid dikirim.
- Nominal bid disimpan tertutup sampai deadline.
- Hasil menang/kalah setelah lelang selesai.
- Transaksi otomatis untuk pemenang.
- Pembatasan akun jika pemenang tidak menyelesaikan pembayaran.

**Screenshot**

```text
docs/readme-screenshots/08-form-bid.png
docs/readme-screenshots/09-hasil-pemenang.png
docs/readme-screenshots/10-bukan-pemenang.png
```

<img src="docs/readme-screenshots/08-form-bid.png" alt="Form Bid Lelang Tertutup" width="100%" />

---

### 🧾 Transaksi, Pembayaran, dan Nota

Modul transaksi membantu buyer dan Admin Unit mengikuti status pembayaran dengan jelas. Bukti pembayaran dapat diverifikasi, transaksi dapat diselesaikan, dan nota dapat dicetak setelah pembayaran valid.

Fitur:

- Upload bukti transfer.
- Verifikasi pembayaran oleh Admin Unit.
- Konfirmasi bayar langsung.
- Bukti serah terima.
- Riwayat transaksi.
- Nota transaksi print-friendly.

**Screenshot**

```text
docs/readme-screenshots/11-detail-transaksi.png
docs/readme-screenshots/12-verifikasi-pembayaran.png
docs/readme-screenshots/13-nota-transaksi.png
```

<img src="docs/readme-screenshots/11-detail-transaksi.png" alt="Detail Transaksi Ruang Agunan" width="100%" />

---

### 🧑‍💼 Admin Unit

Admin Unit memiliki workspace untuk mengelola data operasional unit. Area ini dibuat agar operator dapat membaca status barang, pemasaran, transaksi, dan pelanggaran secara cepat.

Fitur:

- Dashboard unit.
- Kelola barang.
- Tambah dan edit barang.
- Upload media barang.
- Riwayat barang.
- Pemasaran Harga Tetap.
- Pemasaran Lelang Tertutup.
- Verifikasi pembayaran.
- Blacklist unit.
- Profil Admin Unit.

**Screenshot**

```text
docs/readme-screenshots/14-dashboard-admin-unit.png
docs/readme-screenshots/15-kelola-barang.png
docs/readme-screenshots/16-pemasaran-admin-unit.png
docs/readme-screenshots/17-riwayat-barang.png
```

<img src="docs/readme-screenshots/14-dashboard-admin-unit.png" alt="Dashboard Admin Unit Ruang Agunan" width="100%" />

---

### 📊 Dashboard Laporan

Dashboard laporan membantu Admin Unit dan Superadmin membaca performa transaksi. Chart dirancang rapi, tidak menampilkan semua label tanggal, dan mendukung tooltip detail saat disorot.

Fitur:

- Tren nilai transaksi.
- Seri Harga Tetap dan Lelang Tertutup.
- Tooltip tanggal, nilai, dan volume transaksi.
- Filter periode dan rentang kustom.
- Sumbu chart yang bersih dan mudah dipindai.

**Screenshot**

```text
docs/readme-screenshots/18-chart-admin-unit.png
docs/readme-screenshots/19-chart-superadmin.png
```

<img src="docs/readme-screenshots/18-chart-admin-unit.png" alt="Chart Laporan Ruang Agunan" width="100%" />

---

### 🛡️ Superadmin

Superadmin mengelola data lintas unit dan memiliki akses monitoring nasional. Area ini berfungsi untuk melihat performa, mengelola unit, admin, akun superadmin, blacklist, dan kebijakan pelanggaran.

Fitur:

- Dashboard nasional.
- Kelola unit.
- Kelola rekening unit.
- Kelola Admin Unit.
- Kelola akun Superadmin.
- Monitoring nasional dan per unit.
- Blacklist global.
- Kebijakan pelanggaran.
- Profil Superadmin.

**Screenshot**

```text
docs/readme-screenshots/20-dashboard-superadmin.png
docs/readme-screenshots/21-manajemen-unit.png
docs/readme-screenshots/22-blacklist-global.png
docs/readme-screenshots/23-kebijakan-pelanggaran.png
```

<img src="docs/readme-screenshots/20-dashboard-superadmin.png" alt="Dashboard Superadmin Ruang Agunan" width="100%" />

---

## 🗂️ Format Screenshot README

Letakkan gambar screenshot di folder berikut:

```text
docs/readme-screenshots/
```

Gunakan format penamaan berikut agar README langsung terbaca rapi:

| No | Nama File | Isi Screenshot |
| --- | --- | --- |
| 01 | `01-beranda.png` | Halaman beranda |
| 02 | `02-katalog.png` | Katalog publik |
| 03 | `03-detail-barang.png` | Detail barang |
| 04 | `04-dashboard-buyer.png` | Dashboard buyer |
| 05 | `05-wishlist.png` | Wishlist buyer |
| 06 | `06-transaksi-buyer.png` | Transaksi buyer |
| 07 | `07-pusat-bantuan.png` | Pusat Bantuan |
| 08 | `08-form-bid.png` | Form bid Lelang Tertutup |
| 09 | `09-hasil-pemenang.png` | Halaman pemenang |
| 10 | `10-bukan-pemenang.png` | Halaman bukan pemenang |
| 11 | `11-detail-transaksi.png` | Detail transaksi |
| 12 | `12-verifikasi-pembayaran.png` | Verifikasi pembayaran |
| 13 | `13-nota-transaksi.png` | Nota transaksi |
| 14 | `14-dashboard-admin-unit.png` | Dashboard Admin Unit |
| 15 | `15-kelola-barang.png` | Kelola barang |
| 16 | `16-pemasaran-admin-unit.png` | Pemasaran Admin Unit |
| 17 | `17-riwayat-barang.png` | Riwayat barang |
| 18 | `18-chart-admin-unit.png` | Chart Admin Unit |
| 19 | `19-chart-superadmin.png` | Chart Superadmin |
| 20 | `20-dashboard-superadmin.png` | Dashboard Superadmin |
| 21 | `21-manajemen-unit.png` | Manajemen unit |
| 22 | `22-blacklist-global.png` | Blacklist global |
| 23 | `23-kebijakan-pelanggaran.png` | Kebijakan pelanggaran |

---

## 🧱 Tech Stack

| Kategori | Teknologi |
| --- | --- |
| Framework | Next.js App Router |
| UI | React, Tailwind CSS, lucide-react |
| Bahasa | TypeScript |
| Database | PostgreSQL |
| ORM | Drizzle ORM |
| Authentication | Better Auth |
| Testing | Vitest, Testing Library |
| PDF/Print | Browser print, jsPDF, html2canvas |
| Deployment | Docker, Next.js standalone output |

---

## 🚀 Cara Menjalankan Project

### 1. Install dependency

```bash
npm install
```

### 2. Siapkan environment

Gunakan `.env.example` sebagai acuan lalu isi environment lokal yang diperlukan.

```bash
cp .env.example .env.local
```

Environment penting:

```env
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
NEXT_PUBLIC_APP_URL=
CRON_SECRET=
VICKREY_ESCROW_SECRET=
```

### 3. Sinkronkan database

```bash
npm run db:push
```

### 4. Jalankan development server

```bash
npm run dev
```

Aplikasi dapat dibuka di:

```text
http://localhost:3000
```

---

## 🧪 Testing dan Build

Menjalankan test:

```bash
npm test
```

Validasi TypeScript:

```bash
npx tsc --noEmit --pretty false
```

Build production:

```bash
npm run build
```

Menjalankan production server:

```bash
npm run start
```

---

## 📁 Struktur Folder

```text
app/                         Route, page, layout, dan API handler Next.js
components/                  Komponen UI dan halaman
lib/                         Service layer, database, auth, util, kontrak data
public/                      Brand asset, upload demo, dan aset statis
scripts/                     Script migrasi dan utilitas operasional
tests/                       Test Vitest
docs/readme-screenshots/     Tempat screenshot untuk README
PRD.md                       Product Requirements Document
README.md                    Dokumentasi GitHub project
```

---

## 🔐 Catatan Keamanan

- Role buyer, Admin Unit, dan Superadmin dibatasi melalui session.
- Admin Unit hanya dapat mengakses data unitnya.
- Nominal bid Lelang Tertutup tidak ditampilkan sebelum lelang selesai.
- Admin Unit dan Superadmin tidak mengetahui nominal bid peserta sebelum deadline.
- Endpoint cron membutuhkan secret.
- File upload perlu dikendalikan melalui validasi tipe dan ukuran.

---

## ⚠️ Disclaimer

Project ini dibuat hanya untuk kebutuhan tugas akhir dan demonstrasi akademik.

Ruang Agunan bukan aplikasi produksi, bukan layanan transaksi resmi, dan tidak mewakili sistem internal lembaga apa pun. Seluruh data, aset, akun, dan transaksi yang digunakan dalam project ini bersifat simulasi.

---

<p align="center">
  <strong>Ruang Agunan</strong><br />
  Prototype Sistem Informasi Pengelolaan Aset Agunan<br />
  Program Studi Teknik Informatika - Universitas Sam Ratulangi
</p>
