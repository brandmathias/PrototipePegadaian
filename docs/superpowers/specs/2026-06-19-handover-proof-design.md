# Handover Proof Design

## Goal

Tambahkan dokumentasi foto bukti serah-terima barang untuk transaksi harga tetap dan lelang, terpisah dari bukti pembayaran, sebagai syarat buyer dapat menekan “Pembelian Selesai”.

## Approved Flow

Transaksi tetap memakai status `LUNAS` setelah pembayaran diverifikasi. Admin unit mengunggah satu foto bukti serah-terima. Setelah foto tersedia, buyer melihat kartu bukti di detail pembayaran dan tombol “Pembelian Selesai” aktif. Setelah buyer menekan tombol, status berubah menjadi `SELESAI`.

## Data Model

Tabel `transaksi` mendapat field nullable:

- `handover_proof_url`
- `handover_proof_uploaded_at`
- `handover_proof_uploaded_by_user_id`

Field nullable menjaga transaksi lama tetap aman. Transaksi lama yang belum punya bukti menampilkan empty state “menunggu admin unit”, bukan error.

## UI Surfaces

- Buyer: kartu dokumentasi serah-terima ditaruh di bawah detail pembayaran/nota action. Foto bisa dibuka fullscreen.
- Admin unit: detail transaksi menampilkan kartu yang sama plus kontrol unggah/ganti bukti untuk transaksi `LUNAS` atau `SELESAI`.
- Superadmin: detail barang/sesi pemasaran menampilkan kartu read-only untuk audit, tanpa aksi upload.

## Backend Rules

- Upload bukti serah-terima hanya untuk admin unit pada unit pemilik transaksi.
- Upload hanya diterima setelah transaksi `LUNAS`; transaksi `SELESAI` tetap boleh diisi retroaktif untuk data lama.
- Buyer completion ditolak jika status `LUNAS` belum punya `handover_proof_url`.
- Transaksi `SELESAI` lama tanpa bukti tetap dianggap selesai dan tidak dibatalkan.

## Verification

Tidak memakai browser test. Verifikasi dilakukan lewat unit/component tests, TypeScript, dan build/manual code inspection.
