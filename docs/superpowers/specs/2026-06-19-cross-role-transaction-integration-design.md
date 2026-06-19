# Cross-Role Transaction Integration Design

## Goal

Menyatukan data dan perilaku transaksi antara buyer, admin unit, dan superadmin agar identitas buyer, progres pembayaran, bukti penyerahan, status barang, serta audit waktu selalu tampil konsisten.

## Source of Truth

- Email buyer selalu dibaca dari tabel `user`, termasuk pada transaksi dan lelang lama.
- Status transaksi, waktu pembuatan, waktu verifikasi, waktu unggah bukti penyerahan, dan waktu penyelesaian memakai data transaksi yang sama.
- Superadmin tetap read-only. Aksi unggah bukti penyerahan hanya tersedia pada admin unit.
- Data lama tanpa bukti penyerahan atau waktu tertentu harus menampilkan empty state atau tanda belum tercatat, bukan membuat status baru secara otomatis.

## Shared Transaction Progress

Buyer, admin unit, dan superadmin menggunakan visual progres yang sama:

1. Pembayaran
2. Verifikasi
3. Selesai

Setiap tahap menampilkan waktu kejadian bila tersedia. Tahap aktif memiliki animasi status ringan berbasis `transform` dan `opacity`; animasi dinonaktifkan melalui `prefers-reduced-motion`.

## Admin Handover Documentation

Detail transaksi admin tetap menjadi tempat utama unggah bukti serah-terima. Detail pemasaran lelang juga menampilkan panel yang sama agar admin tidak harus berpindah halaman. Panel hanya dapat mengunggah setelah pembayaran terverifikasi.

## Auction Presentation

- Nilai rupiah pada panel mekanisme lelang dan pengumuman pemenang harus tetap satu baris.
- Ukuran teks menyesuaikan panjang nominal tanpa elipsis.
- Tabel ranking menghapus Member ID dan mendistribusikan kembali lebar ke nama, waktu, nominal, serta status.
- Tombol Cetak Ringkasan dihapus. Cetak Nota tetap tersedia setelah pembayaran terverifikasi.

## Wishlist Unavailable State

Barang tidak tersedia tetap terlihat dalam bagian khusus. Kartu memakai muted overlay, status alasan, dan transisi ringan. Tombol Beli Sekarang atau Ikut Lelang diganti dengan tombol nonaktif bertuliskan `Barang Tidak Tersedia`; tombol hapus wishlist tetap tersedia.

## Navigation State

Navigasi aktif tidak hanya mengikuti prefix URL. Route detail khusus dipetakan ke induknya:

- `/superadmin/unit/[id]` dan turunannya menyorot Monitoring Unit.
- Route detail transaksi buyer tetap menyorot Transaksi.
- Route detail pemasaran admin tetap menyorot Pemasaran.

## Daily Checklist

Checklist admin direset saat tanggal kalender berubah pada zona `Asia/Makassar`, bukan 24 jam sejak pertama kali checklist disimpan. State disimpan per hari sehingga jejak hari sebelumnya tidak terbawa.

## Validation Copy

Redaksi membedakan:

- pembayaran sudah terverifikasi;
- penyelesaian menunggu bukti serah-terima;
- penyelesaian tertahan karena pembatasan akun;
- transaksi sudah selesai.

Pesan tidak boleh menyebut pembayaran belum valid jika yang tertahan sebenarnya hanya aksi penyelesaian buyer.

## Verification

Tanpa tool browser:

- pemeriksaan manual diff dan pencarian redaksi lama;
- TypeScript;
- ESLint pada file yang berubah;
- production build;
- pemeriksaan Git sebelum commit dan push.
