# Design.md — Dashboard Admin Eksekutif Pegadaian Lelang

## 1. Ringkasan Desain

Desain ini merupakan dashboard admin eksekutif untuk platform **Pegadaian Lelang**. Halaman dirancang sebagai pusat monitoring performa unit aktif, tren penjualan, transaksi yang membutuhkan tindakan, serta checklist tugas harian.

Gaya desain mengikuti referensi yang diberikan: **premium fintech dashboard**, kombinasi sidebar hijau gelap, konten utama putih bersih, kartu statistik lembut, grafik tren penjualan, dan panel operasional yang mudah dipindai.

Output coding dibuat sebagai **satu file HTML** yang sudah berisi HTML, CSS, dan JavaScript dalam satu file agar mudah langsung dibuka di browser.

---

## 2. Tujuan UX

1. Menampilkan status unit secara cepat melalui sidebar.
2. Memberikan gambaran performa utama melalui tiga kartu KPI.
3. Memudahkan admin melihat tren penjualan mingguan.
4. Menyediakan daftar tugas operasional harian yang perlu diproses.
5. Memberikan peringatan khusus untuk transaksi yang membutuhkan tindakan.
6. Menjaga tampilan tetap premium, tidak ramai, dan mudah dibaca.

---

## 3. Struktur Halaman

### A. Sidebar

Sidebar menggunakan warna hijau gelap dengan nuansa gradient.

Konten sidebar:
- Brand:
  - `PEGADAIAN LELANG`
- Unit aktif:
  - `UNIT AKTIF`
  - `UPC Ranotana`
  - Badge: `AKTIF`
- Navigasi:
  - Dashboard aktif
  - Kelola Barang dengan badge `3`
  - Pemasaran
  - Transaksi dengan badge `2`
  - Pelanggaran
- Ringkasan unit:
  - Total Barang: `18`
  - Siap Dipasarkan: `8`
  - Jatuh Tempo Dekat: `3`
  - Timestamp: `Per 29 Mei 2026, 05.18 WIB`

UX intent:
- Sidebar berfungsi sebagai konteks unit dan navigasi utama.
- Badge angka membantu admin langsung memahami jumlah item yang perlu diperhatikan.
- Ringkasan unit diletakkan di bawah agar tetap terlihat tanpa mengganggu area kerja utama.

---

### B. Header

Header berada di area konten utama.

Konten:
- Greeting:
  - `Selamat pagi,`
  - `Admin Eksekutif`
- Search bar:
  - Placeholder: `Cari data, pengguna, atau laporan...`
  - Shortcut hint: `⌘ /`
- Icon utility:
  - Notification bell dengan dot hijau
  - Theme / sun icon
  - Avatar admin dengan dropdown

UX intent:
- Search bar dibuat sebagai entry point utama untuk pencarian data.
- Utility icon dibuat ringan dan tidak mendominasi.

---

### C. KPI Cards

Tiga kartu utama:
1. **Barang Terjual**
   - Value: `8.762`
   - Trend: `+12.4%`
   - Subtext: `vs periode sebelumnya 7.793`

2. **Barang Ditebus**
   - Value: `4.315`
   - Subtext: `vs periode sebelumnya 3.928`

3. **Transaksi Perlu Tindakan**
   - Value: `128`
   - Badge: `Urgent`
   - Subtext: `Memerlukan perhatian segera`

UX intent:
- Kartu KPI memberikan ringkasan performa paling penting.
- Warna merah hanya digunakan pada kondisi urgent agar perhatian user terarah.

---

### D. Laporan Tren Penjualan

Panel utama berisi:
- Title: `Laporan Tren Penjualan`
- Subtitle: `Performa penjualan barang lelang dalam periode waktu pilihan.`
- Filter:
  - `Hari Ini`
  - `Minggu Ini` aktif
  - `Bulan Ini`
- Chart:
  - Axis Y: `0`, `300K`, `600K`, `900K`, `1.2M`
  - Axis X: `12 Mei` sampai `18 Mei`
  - Area chart hijau dengan gradient lembut.

Metric strip:
- `Total Penjualan` — `Rp 12,85 M` — `+12.4%`
- `Rata-rata Transaksi` — `Rp 1,47 Jt` — `+8.7%`
- `Jumlah Lelang` — `682` — `+9.3%`
- `Peserta Aktif` — `1.248` — `+11.2%`

UX intent:
- Grafik menjadi pusat visual dashboard.
- Metric strip membantu admin memahami insight turunan tanpa pindah halaman.

---

### E. Checklist Tugas Harian

Panel kanan berisi:
- Title: `Checklist Tugas Harian`
- Subtitle: `Pastikan semua tugas operasional harian selesai tepat waktu.`

Task:
1. Checked — `Review transaksi perlu tindakan` — `128 transaksi`
2. Checked — `Verifikasi dokumen penebusan` — `36 dokumen`
3. Unchecked — `Validasi pembayaran masuk` — `Menunggu validasi`
4. Unchecked — `Update status lelang berjalan` — `12 lelang aktif`
5. Unchecked — `Laporan harian ke pimpinan` — `Sebelum 17:00 WIB`

UX intent:
- Checklist membantu admin melakukan monitoring harian.
- Checked state menggunakan hijau solid, unchecked menggunakan outline abu-abu.

---

### F. Alert Card

Alert berwarna amber.

Konten:
- Title: `Perhatian Diperlukan`
- Text:
  - `128 transaksi menunggu tindakan Anda.`
  - `Segera tindak lanjuti untuk menjaga kelancaran operasional.`
- CTA:
  - `Lihat Transaksi`

UX intent:
- Alert memberikan prioritas aksi.
- Warna amber terasa serius namun tidak sekeras merah.

---

## 4. Design Tokens

### Colors

| Token | Hex | Fungsi |
|---|---:|---|
| Sidebar Deep Green | `#003f2d` | Background sidebar |
| Sidebar Green | `#006b4a` | Gradient sidebar |
| Primary Green | `#008a4f` | Aksen utama |
| Primary Green Dark | `#005b36` | Teks/ikon hijau |
| Green Soft | `#eaf8ef` | Background icon dan badge |
| Canvas | `#f7faf8` | Background utama |
| White | `#ffffff` | Card surface |
| Text Primary | `#0f172a` | Heading dan angka |
| Text Secondary | `#64748b` | Subtitle |
| Border Soft | `#e3e8e5` | Border halus |
| Danger | `#e11d28` | Urgent state |
| Danger Soft | `#fff0f1` | Card urgent |
| Amber | `#c97900` | Alert |
| Amber Soft | `#fff4dc` | Alert card |

### Typography

Font:
- `Inter`, `Plus Jakarta Sans`, `Segoe UI`, sans-serif.

Ukuran utama:
- Brand sidebar: 25–28px / 800
- Header user: 30px / 800
- KPI number: 46px / 850
- Card title: 18–24px / 750
- Body text: 14–16px
- Micro label: 12–13px

### Radius

| Komponen | Radius |
|---|---:|
| Sidebar | 0 28px 28px 0 |
| Sidebar card | 22px |
| Main cards | 22px |
| KPI card | 22px |
| Chart card | 22px |
| Button pill | 10px–999px |

### Shadow

- Card utama: `0 18px 48px rgba(15, 23, 42, 0.08)`
- Sidebar cards: `inset 0 1px 0 rgba(255,255,255,.08)`
- KPI cards: `0 16px 38px rgba(15, 23, 42, 0.06)`

---

## 5. Animasi dan Interaksi

### Sidebar
- Menu hover naik sedikit dan background berubah lebih terang.
- Active state Dashboard menggunakan gradient hijau.

### KPI
- Hover card naik `translateY(-3px)`.
- Border warna mengikuti kategori: hijau atau merah.

### Chart
- Area chart dibuat dengan SVG.
- Titik terakhir memiliki pulse lembut.

### Checklist
- Checkbox bisa diklik.
- Checked state berubah hijau.

### Alert
- CTA `Lihat Transaksi` memiliki hover underline dan panah bergerak.

---

## 6. Responsiveness

Desktop:
- Layout utama menggunakan grid:
  - Sidebar fixed width.
  - Main content fluid.
  - Chart kiri lebih lebar.
  - Checklist kanan lebih sempit.

Tablet:
- Grid KPI menjadi 2 kolom.
- Chart dan right panel menjadi stacked.

Mobile:
- Sidebar menjadi horizontal/top panel sederhana.
- KPI cards dan panel menjadi 1 kolom.
- Search bar memenuhi lebar.

---

## 7. Catatan Implementasi

File coding:
- Nama file: `dashboard-pegadaian-lelang.html`
- Semua HTML, CSS, dan JavaScript berada dalam satu file.
- Tidak menggunakan CDN.
- Tidak menggunakan gambar eksternal.
- Icon dibuat dengan inline SVG dan CSS.
- Avatar dibuat dengan CSS gradient agar file tetap mandiri.
- Chart dibuat dengan SVG statis yang menyerupai referensi.
