# ==========================================
# BAGIAN 1: SPESIFIKASI SISTEM DESAIN (design.md)
# ==========================================

# Dokumentasi Sistem Desain & Kode Frontend: Pemasaran Barang[cite: 1]
**Platform:** Pegadaian Lelang - Executive Portal[cite: 1]  
**Versi:** 6.0.0 (Stable Production)[cite: 1]  
**Pendekatan Visual:** The Sovereign Curator (Borderless & High-End Editorial Layout)[cite: 1]

---

## 1. Filosofi & Strategi Visual
* Halaman **Pemasaran Barang** ini dirancang murni untuk kebutuhan **Operasional Taktis Admin Unit**[cite: 1].
* Kita telah mengeliminasi bias metrik keuangan makro yang terlalu abstrak dan menggantinya dengan visualisasi siklus hidup produk (*product lifecycle*)[cite: 1].
* Tata letak ini menggunakan pendekatan asimetris yang memaksimalkan ruang putih (*whitespace*) untuk menghilangkan kesan penumpukan data yang melelahkan (*anti-cognitive overload*)[cite: 1].

## 2. Panduan Token Warna (Color Tokens)
* **Primary Deep Green (#004A23):** Digunakan sebagai warna dasar jangkar pada sidebar navigasi kiri untuk menegaskan otoritas institusional BUMN yang kuat[cite: 1].
* **Active Emerald Green (#006747):** Digunakan untuk komponen aktif harian: lencana filter aktif, tombol utama (*Primary CTA*), dan aksen ikon kartu metrik berjalan[cite: 1].
* **Canvas Background (#FAFAFA):** Latar belakang abu-abu netral tipis untuk memberikan efek kontras yang sejuk bagi mata admin[cite: 1].
* **Surface Layering (#FFFFFF):** Warna putih bersih eksklusif untuk kartu tugas metrik dan baris daftar produk agar mencuat secara alami tanpa bantuan garis batas pembatas kaku 1px solid[cite: 1].

## 3. Struktur Operasional Metrik (Top Cards Grid)
Setiap kartu disusun menggunakan formula **Macro Value + Micro Breakdown** yang membumi tanpa istilah teknis rumit[cite: 1]:
1. **Sesi Sedang Berjalan:** Menampilkan total kapasitas beban kerja etalase aktif (**24 Sesi**), dipecah secara transparan menjadi `14 Beli Putus • 10 Lelang`[cite: 1].
2. **Produk Terjual:** Menampilkan validasi kesuksesan performa kerja (**18 Produk**) dalam rentang waktu terdekat (`Periode Minggu Ini`)[cite: 1].
3. **Perlu Strategi Ulang:** Berfungsi sebagai pemicu tugas darurat admin (**5 Produk**) untuk mendeteksi barang gadai yang sesi lelangnya gagal atau kedaluwarsa[cite: 1].

## 4. Aturan Kelenturan Komponen Kartu Produk (Strict UI Rules)
* **Strict Borderless Rule:** Pemisahan antar kartu produk murni menggunakan jarak spasial konstan `space-y-4` (16px) dan kontras warna tonal canvas, dilarang menyisipkan komponen garis pemisah abu-abu kaku[cite: 1].
* **Rounded Unity:** Semua sudut komponen (foto produk, boks metrik, dan tombol kendali aksi) wajib diseragamkan menggunakan kelengkungan premium **`rounded-xl` (12px)** atau **`rounded-2xl` (16px)** untuk membuang kesan kaku Material Design[cite: 1].
* **Right-Side Alignment Symmetry:** Kolom kanan kartu diatur secara vertikal untuk mengunci informasi finansial (Harga Jual / Harga Awal) tepat sejajar di atas tombol aksi utama, sehingga menciptakan pemindaian mata yang ritmis dari atas ke bawah[cite: 1].

---

## BAGIAN 2: IMPLEMENTASI KODE KOMPONEN (AdminMarketingPage.tsx)