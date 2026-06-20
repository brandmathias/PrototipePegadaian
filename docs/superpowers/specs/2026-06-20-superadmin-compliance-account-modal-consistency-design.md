# Superadmin Compliance, Account, and Modal Consistency Design

## Goal

Menyamakan statistik pelanggaran dashboard nasional dengan ledger Pelanggaran, menormalkan identitas bank dan nomor rekening, serta menyelaraskan header popup detail unit dengan popup perpanjangan gadai.

## Scope

1. Statistik `Status Kepatuhan Ekosistem` hanya menghitung blacklist yang masih aktif menurut level efektif dan masa pembatasannya.
2. Halaman dashboard dan halaman Pelanggaran memakai satu fungsi penentu status blacklist aktif.
3. Nama bank disimpan dan ditampilkan dalam bentuk singkatan resmi yang ringkas.
4. Nomor rekening disimpan dan ditampilkan sebagai digit tanpa spasi atau tanda baca.
5. Popup `Detail Rekening Unit` dan `Detail Admin Unit` memakai ikon hijau mengambang, judul dan deskripsi terpusat, serta tombol tutup di kanan atas.

## Data Design

Status blacklist aktif ditentukan dari:

- flag `isActive`;
- level pembatasan efektif;
- `blockedUntil` untuk level 1 dan 2;
- level 3 tetap aktif sampai evaluasi manual.

Aturan tersebut dipindahkan ke helper bersama agar serializer ledger dan agregasi dashboard tidak memiliki interpretasi berbeda.

Normalisasi rekening dilakukan pada batas validasi:

- alias bank umum seperti `Bank Rakyat Indonesia (BRI)` dan `Bank BRI` menjadi `BRI`;
- `Bank Mandiri` menjadi `Mandiri`;
- `Bank Negara Indonesia (BNI)` dan `Bank BNI` menjadi `BNI`;
- nomor rekening menghapus seluruh karakter selain digit;
- data lama juga dinormalisasi pada serializer agar langsung rapi tanpa migrasi destruktif.

## UI Design

Popup detail mempertahankan isi kartu saat ini. Perubahan hanya pada header:

- ikon berada di lingkaran hijau yang menumpuk pada tepi atas modal;
- tombol tutup tetap mudah dijangkau di sudut kanan;
- judul dan deskripsi rata tengah;
- jarak atas modal diperbesar agar ikon tidak bertabrakan;
- dimensi dan grid isi tetap stabil pada desktop maupun mobile.

## Testing

- Unit test helper status blacklist memastikan pembatasan kedaluwarsa tidak dihitung aktif.
- Unit test validasi dan serializer rekening memastikan singkatan bank dan digit rekening konsisten.
- Component test memastikan popup detail memakai struktur header terpusat dan tetap menampilkan isi.
- Tes terkait monitoring, blacklist, dan halaman superadmin dijalankan kembali.

## Out of Scope

- Migrasi massal data rekening di database.
- Perubahan layout halaman Manajemen Unit di luar popup.
- Perubahan kebijakan level atau durasi blacklist.
- Pengujian melalui browser.
