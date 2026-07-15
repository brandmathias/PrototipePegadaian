# Shared Bidder Ranking and Violation Media Design

## Goal

Menyamakan tampilan bidders ranking pada admin unit dan superadmin, sekaligus memastikan tiga barang pelanggaran lintas unit memiliki foto produk yang relevan tanpa menampilkan label dummy atau demo.

## Ranking contract

- Admin unit dan superadmin memakai satu komponen presentasi bersama.
- Urutan, nominal, waktu, status, dan foto peserta tetap berasal dari data masing-masing halaman.
- Peringkat 1-3 memakai aset medali yang diberikan pengguna, dioptimalkan ke WebP transparan.
- Ukuran desktop: medali sekitar 76 px, avatar 48 px, nama 16 px, nominal 18-20 px, dan tinggi baris utama sekitar 92 px.
- Peringkat 4 dan seterusnya memakai penanda angka sederhana serta tinggi baris yang lebih ringkas.
- Di layar sempit, setiap baris berubah menjadi kartu dua kolom tanpa horizontal scroll. Medali menjadi sekitar 58-64 px dan avatar 44 px.
- Tidak ada animasi daftar yang berulang. Interaksi hanya memakai transisi hover singkat dan menghormati `prefers-reduced-motion`.
- Foto peserta memakai `next/image`, ukuran eksplisit, dan fallback inisial jika tidak tersedia.

## Visual hierarchy

- Judul memakai ikon mahkota dan tipografi Manrope/Plus Jakarta Sans yang sudah tersedia.
- Header desktop berwarna hijau gelap dengan label kolom kontras.
- Tiga baris teratas memakai aksen emas, perak, dan perunggu yang berbeda, tetapi tetap mengikuti warna merek aplikasi.
- Status ditampilkan sebagai pill ringkas dengan ikon semantik.
- Nilai penawaran menjadi informasi paling menonjol setelah nama peserta.

## Violation media contract

- Foto dari `media_barang` database selalu menjadi sumber utama.
- Jika data lama tidak memiliki media, resolver bersama memilih fallback berdasarkan nama barang yang persis:
  - Kalung Emas Rantai Singapura 22K
  - Cincin Emas Solitaire 22K
  - Gelang Emas Bangle Polos 22K
- Fallback dipakai konsisten oleh layanan buyer, admin unit, dan superadmin.
- Gambar sumber Pexels dipotong persegi, diperkecil, dan disimpan sebagai WebP agar ringan.
- Jika nama barang tidak cocok dan database tidak memiliki foto, UI tetap memakai empty state yang sekarang.

## Image sources

- Kalung: The Glorious Studio, Pexels — https://www.pexels.com/photo/close-up-photo-of-gold-necklace-14111399/
- Cincin: Melike B, Pexels — https://www.pexels.com/photo/golden-ring-with-diamond-12168877/
- Gelang: Melike B, Pexels — https://www.pexels.com/photo/gold-bracelet-in-close-up-photography-12194239/
- Lisensi: https://www.pexels.com/legal-pages/license/

## Acceptance criteria

1. Ranking admin unit dan superadmin dirender oleh satu komponen bersama.
2. Peringkat 1-3 menampilkan medali WebP dan avatar berukuran proporsional.
3. Tabel tetap rapi pada desktop dan berubah menjadi kartu responsif tanpa overflow pada mobile.
4. Tiga barang pelanggaran menampilkan foto produk ketika `media_barang` kosong.
5. Foto database tetap mengalahkan fallback.
6. Unit tests, type-check, build, dan inspeksi visual lulus.
