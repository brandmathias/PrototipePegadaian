# Fixed-Price Pickup Notification Design

## Goal

Setelah pembayaran Harga Tetap diverifikasi, notifikasi buyer harus meminta buyer segera mengambil barang serta menampilkan nama dan alamat unit terkait.

## Design

- `notifyPaymentVerified` menerima konteks opsional `unitName`, `unitAddress`, dan tipe transaksi.
- Pesan pengambilan hanya digunakan untuk transaksi `fixed_price`.
- Pesan Vickrey tetap tidak berubah.
- Data unit menggunakan hasil join transaksi yang sudah tersedia; tidak ada query, tabel, atau komponen UI baru.

## Verification

- Test helper notifikasi memastikan nama dan alamat unit muncul untuk Harga Tetap.
- Test service memastikan konteks transaksi dan unit diteruskan.
- Test terkait, TypeScript, dan production build harus lulus.
