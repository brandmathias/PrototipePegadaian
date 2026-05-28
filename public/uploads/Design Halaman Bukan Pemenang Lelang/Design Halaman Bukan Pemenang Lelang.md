# Design.md — Halaman Hasil Lelang: Tidak Menang

## 1. Ringkasan Desain

Halaman ini digunakan ketika lelang telah selesai dan buyer tidak menjadi pemenang. Tujuan utama desain adalah menyampaikan status **“Tidak Menang”** secara jelas, tetap memberi pengalaman yang positif, lalu mendorong buyer untuk mengikuti lelang lain.

Desain dibuat dalam format **desktop 16:9** dengan gaya premium, modern, dan clean. Header mengikuti referensi `Pegadaian Lelang`: brand di kiri, navigasi segmented pill, search bar, tombol notifikasi, wishlist, serta profile chip buyer di kanan.

---

## 2. Tujuan UX

1. Memberi informasi status lelang secara langsung tanpa membuat user bingung.
2. Menjaga emosi user tetap positif melalui copywriting yang suportif.
3. Menampilkan detail transaksi dan unit secara ringkas.
4. Memberikan rekomendasi lelang lain agar user tetap lanjut menjelajah.
5. Memastikan halaman terasa hidup melalui animasi ringan, hover state, dan visual 3D-style.

---

## 3. Struktur Halaman

### A. Header / Navbar

Header menggunakan background putih dengan border bawah halus.

Elemen:
- Logo bulat hijau dengan ikon palu lelang.
- Brand text: **Pegadaian Lelang**.
- Segmented navigation:
  - Beranda aktif.
  - Katalog.
  - Transaksi.
- Search bar:
  - Placeholder: `Cari barang, unit, kategori...`
- Icon button:
  - Bell notification.
  - Heart / wishlist dengan badge angka `5`.
- Profile chip:
  - Avatar.
  - Nama: `Buyer Demo 13 B`.
  - Dropdown arrow.

UX intent:
- Header terasa seperti marketplace / auction dashboard.
- Navigation pill memberi indikasi section aktif secara jelas.

---

### B. Hero Section

Hero menggunakan background dark navy / charcoal dengan aksen ring pattern dan floating particles.

Konten kiri:
- Red eyebrow text: `Terima kasih.`
- Headline: `Anda belum beruntung kali ini.`
- Supporting copy:
  - `Terus ikuti lelang lainnya.`
  - `Kesempatan terbaik mungkin ada di lelang berikutnya!`

Konten kanan:
- Ilustrasi gavel / palu lelang.
- Papan palu.
- Badge lingkaran dengan simbol `X` merah.

UX intent:
- Warna gelap memberi kesan premium.
- Simbol X dan palu memperjelas status gagal menang.
- Copywriting menjaga tone tetap positif.

---

### C. Main Result Card

Card putih besar dengan rounded corner dan soft shadow.

Elemen:
- Gambar cincin berlian.
- Badge hijau: `LELANG VICTORY`.
- Judul barang: `Cincin Berlian Solitaire 1.00 CT`.
- Detail transaksi:
  - No. Transaksi: `TRX-250518-0007`
  - Unit: `UPC Rantona`
  - Tanggal Lelang Selesai: `18 Mei 2026, 11:20 WIB`
- Status panel:
  - Label: `Status Lelang`
  - Status utama: `Tidak Menang`
  - Deskripsi: `Terus semangat, masih banyak lelang menarik lainnya.`

UX intent:
- Status diletakkan di panel kanan agar mudah terlihat.
- Detail transaksi tetap lengkap tanpa mendominasi halaman.

---

### D. Informasi Pemenang

Card informasi ringan berisi:
- Icon party / announcement merah.
- Title: `Informasi Pemenang`.
- Body:
  - `Pemenang lelang ini telah ditentukan dan akan dihubungi oleh pihak unit.`
  - `Terima kasih telah berpartisipasi.`

UX intent:
- Menjelaskan bahwa proses sudah selesai dan buyer tidak perlu menunggu hasil lagi.
- Menghindari kebingungan terkait status pemenang.

---

### E. Rekomendasi Lelang Lainnya

Section berisi:
- Title: `Lelang Lainnya untuk Anda`.
- Link: `Lihat Semua Lelang`.
- Product cards:
  1. Jam Tangan Rolex Oyster 41
  2. Kalung Emas 24K 10 Gram
  3. Canon EOS R6 Body Only

Setiap card berisi:
- Product visual.
- Badge `LELANG VICTORY`.
- Nama barang.
- Harga mulai.
- Sisa waktu dalam warna merah.

UX intent:
- Setelah menerima hasil gagal menang, user diberi jalur aksi berikutnya.
- Countdown merah memberi rasa urgency.

---

### F. Bottom Encouragement Banner

Banner berwarna soft red/pink.

Konten:
- Heart icon.
- Text:
  - `Jangan menyerah! Kesempatan besar berikutnya bisa jadi milik Anda.`
  - `Terus ikut dan menangkan lelang impian Anda!`

UX intent:
- Memberi emotional recovery.
- Mendorong user untuk tetap aktif mengikuti lelang.

---

## 4. Design Tokens

### Colors

| Token | Hex | Fungsi |
|---|---:|---|
| Primary Green | `#006B3F` | Brand, active nav, CTA link |
| Primary Green Dark | `#004E2E` | Brand text, strong green accent |
| Hero Navy | `#06101B` | Hero background |
| Hero Navy Soft | `#101B29` | Gradient hero |
| White | `#FFFFFF` | Card dan header |
| Surface Soft | `#F8FAF9` | Page background |
| Text Primary | `#101828` | Heading dan label utama |
| Text Secondary | `#667085` | Subtitle dan meta |
| Danger Red | `#E02020` | Status gagal dan timer |
| Danger Soft | `#FFF0F0` | Banner / icon bg |
| Border | `#E7E9E7` | Border card dan input |
| Warning Badge | `#E8A400` | Badge wishlist count |

### Typography

Font family:
- `Inter`, `Segoe UI`, `Arial`, sans-serif.

Scale:
- Navbar brand: 24px / 700.
- Hero eyebrow: 24px / 800.
- Hero headline: 48px / 800.
- Section title: 20px / 800.
- Card title: 22px / 800.
- Body: 14–16px.
- Meta label: 13–14px.

### Radius

| Component | Radius |
|---|---:|
| Header chips | 999px |
| Search bar | 999px |
| Main card | 22px |
| Product card | 18px |
| Status panel | 16px |
| Banner | 18px |

### Shadow

- Header: subtle border + soft shadow.
- Main card: `0 20px 55px rgba(16, 24, 40, 0.10)`.
- Product card: `0 14px 34px rgba(16, 24, 40, 0.08)`.
- Icon button: small shadow for clickable depth.

---

## 5. Animation dan Interaksi

### Header
- Nav item hover: background hijau sangat muda.
- Icon button hover: naik 2px dan shadow lebih kuat.
- Search bar focus: border hijau dan glow ringan.

### Hero
- Floating confetti bergerak pelan.
- Gavel illustration memiliki animasi floating halus.
- Red X badge memiliki glow/pulse ringan.

### Cards
- Product card hover:
  - transform `translateY(-4px)`
  - shadow lebih kuat.
- Main card hover:
  - shadow lebih dalam.
- Countdown timer aktif melalui JavaScript.

### Carousel
- Tombol panah kanan memberi efek scroll/geser ringan pada product card.

---

## 6. Responsiveness

Untuk desktop:
- Layout memakai rasio visual 16:9.
- Content berada dalam grid horizontal.

Untuk tablet/mobile:
- Header berubah menjadi wrap.
- Hero text dan visual menjadi stacked.
- Main result card berubah dari 3 kolom menjadi 1 kolom.
- Product recommendations menjadi horizontal scroll.

---

## 7. Catatan Implementasi

File coding dibuat sebagai **satu file HTML saja**:
- HTML, CSS, dan JavaScript digabung dalam satu file.
- Tidak memakai CDN.
- Tidak memakai gambar eksternal.
- Visual produk dan ilustrasi dibuat menggunakan inline SVG + CSS.
- Cocok untuk preview cepat di browser.
- Bisa dikonversi menjadi komponen Next.js/Tailwind jika diperlukan.

Nama file:
- `lelang-tidak-menang-16x9.html`
