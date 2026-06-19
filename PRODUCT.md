# Product

## Register

product

## Users

Ruang Agunan dipakai oleh buyer, admin unit, dan superadmin untuk menjalankan alur barang agunan dari katalog sampai transaksi selesai. Buyer datang untuk membeli barang harga tetap atau mengikuti lelang tertutup, admin unit bekerja sebagai operator verifikasi dan penyerahan barang, sedangkan superadmin memantau lintas unit secara read-only.

## Product Purpose

Produk ini membantu siklus pemasaran barang agunan Pegadaian menjadi lebih jelas, tercatat, dan dapat diaudit: barang dikelola admin unit, dipasarkan ke buyer, dibayar secara transfer atau langsung, diverifikasi manual, dicetak nota, lalu ditutup setelah barang benar-benar diterima buyer.

## Brand Personality

Resmi, tenang, dan dapat dipercaya. Antarmuka harus terasa seperti workspace operasional yang rapi, bukan landing page dekoratif; informasi transaksi harus mudah dipahami oleh pengguna non-teknis dan cukup kuat untuk kebutuhan akademik maupun audit.

## Anti-references

Jangan terlihat seperti dashboard generik yang penuh kartu tanpa hierarki, jangan memakai warna neon/terlalu ramai, jangan mencampur bukti pembayaran dengan bukti penyerahan barang, dan jangan membuat aksi transaksi final terasa otomatis tanpa bukti atau persetujuan buyer.

## Design Principles

- Pisahkan bukti pembayaran, bukti penyerahan, dan nota agar status transaksi tidak rancu.
- Tampilkan data operasional secara read-only pada superadmin, sementara aksi mutasi tetap milik admin unit atau buyer.
- Prioritaskan kejelasan status: jika aksi terkunci, jelaskan apa yang masih ditunggu sistem.
- Jaga komponen tetap ringan: simpan file sebagai URL, gunakan preview lazy/fullscreen, dan hindari animasi berat.
- Dukung data lama dengan empty state yang aman, bukan perubahan status otomatis.

## Accessibility & Inclusion

Target minimal WCAG AA untuk kontras teks dan affordance tombol. Preview fullscreen harus bisa ditutup dengan tombol eksplisit dan tombol Escape, konten tetap terbaca saat animasi dikurangi, dan pesan kosong/error harus memakai teks yang jelas.
