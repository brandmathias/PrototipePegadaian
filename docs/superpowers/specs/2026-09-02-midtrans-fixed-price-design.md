# Midtrans Harga Tetap — Desain

## Tujuan

Mengganti bukti transfer manual untuk pembelian Harga Tetap dengan Midtrans Snap Sandbox agar pembayaran sah dipastikan otomatis tanpa menunggu verifikasi bukti oleh Admin Unit.

## Masalah yang diselesaikan

Alur lama memperbolehkan bukti transfer diunggah sebelum dana benar-benar diterima. Status `bukti_diunggah` mengunci barang sampai Admin Unit memeriksa, sehingga bukti fiktif dapat menahan katalog.

## Keputusan desain

1. Hanya Harga Tetap memakai Midtrans; Lelang Tertutup dan seluruh alurnya tidak berubah.
2. Saat checkout, backend membuat satu reservasi `menunggu_pembayaran` selama 15 menit dan meminta Snap token dari server Midtrans.
3. Reservasi berlaku per sesi pemasaran Harga Tetap. Buyer lain menerima pesan bahwa barang sedang dipesan, lalu barang kembali tersedia setelah pembayaran `expire`, `cancel`, atau `deny`.
4. Hanya notifikasi server-to-server Midtrans yang telah lolos signature SHA-512 dan pengecekan status Midtrans yang boleh menetapkan `lunas`.
5. Callback Snap di browser hanya memperbarui tampilan; ia tidak pernah menetapkan pembayaran sebagai lunas.
6. Pembayaran berhasil langsung menutup pemasaran, menjadikan barang `terjual`, menulis riwayat, serta mengirim notifikasi Buyer, Admin Unit, dan Superadmin.
7. Admin Unit hanya menangani bukti serah-terima dan penyelesaian transaksi. Tombol verifikasi/penolakan bukti tidak tersedia untuk transaksi Harga Tetap Midtrans.

## Data transaksi

Tabel `transaksi` ditambah kolom khusus gateway: `paymentProvider`, `paymentOrderId`, `paymentToken`, `paymentRedirectUrl`, `gatewayStatus`, `gatewayPaymentType`, `gatewayTransactionId`, `gatewayPayload`, dan `paidAt`.

`paymentOrderId` unik. Indeks klaim Harga Tetap memasukkan status `menunggu_pembayaran`, `lunas`, dan `selesai`, sehingga hanya satu reservasi aktif. Status `gagal`, `ditolak_bukti`, dan transaksi historis tidak mengunci barang.

## Konfigurasi

- `MIDTRANS_SERVER_KEY`: hanya server, tidak boleh masuk Git atau browser.
- `MIDTRANS_IS_PRODUCTION`: default `false`; produksi hanya aktif jika bernilai `true`.
- Pada Midtrans MAP, Notification URL diarahkan ke `https://<domain>/api/payments/midtrans/notification`.

## Antarmuka

- `POST /api/user/beli/:pemasaranId` membuat atau memakai ulang reservasi buyer aktif, lalu mengembalikan URL redirect Snap.
- `POST /api/payments/midtrans/notification` menerima notifikasi Midtrans, memverifikasi signature dan status langsung, kemudian menerapkan transisi database secara idempoten.
- Buyer berpindah ke checkout Snap melalui URL redirect, kemudian kembali ke detail transaksi untuk membaca status yang berasal dari server.

## Penanganan status Midtrans

| Midtrans | Status aplikasi | Akibat |
| --- | --- | --- |
| `pending` | `menunggu_pembayaran` | Barang direservasi hingga deadline. |
| `capture` / `settlement` | `lunas` | Barang terjual; notifikasi lintas peran dibuat. |
| `deny` / `cancel` / `expire` | `gagal` | Reservasi dilepas; barang kembali tersedia. |
| selain itu | tidak berubah | Payload dicatat untuk audit. |

## Keamanan dan ketahanan

- Nominal serta data barang berasal dari database, bukan request browser.
- Webhook memeriksa signature `SHA512(order_id + status_code + gross_amount + ServerKey)` dan memanggil status API Midtrans sebelum mutasi.
- Nominal, order ID, provider, dan status transaksi dibandingkan dengan data lokal.
- Proses sukses bersifat idempoten; notifikasi berulang tidak menggandakan riwayat atau notifikasi.
- Tanpa konfigurasi Midtrans, checkout gagal jelas dan tidak membuat reservasi.

## Batasan

Implementasi ini ditargetkan ke Midtrans Sandbox. Aktivasi produksi membutuhkan kredensial produksi dan konfigurasi Notification URL oleh pemilik akun Midtrans.
