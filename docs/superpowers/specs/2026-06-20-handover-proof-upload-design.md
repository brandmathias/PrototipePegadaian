# Desain Penyelarasan Upload Bukti Penyerahan

Tanggal: 20 Juni 2026

## Tujuan

Menyelaraskan pengalaman bukti penyerahan barang dengan upload bukti pembayaran yang sudah dipakai Buyer. Admin Unit harus memperoleh area upload yang lebar, preview yang menyatu dengan kontrol, dan pola interaksi yang identik. Superadmin memperoleh presentasi visual yang sama dalam mode audit read-only.

## Batas Lingkup

- Berlaku pada halaman transaksi dan detail pemasaran Admin Unit yang menampilkan bukti serah-terima.
- Berlaku pada kartu bukti serah-terima Superadmin.
- Tidak mengubah API upload, tabel database, validasi backend, atau kewenangan peran.
- Admin Unit tetap menjadi satu-satunya pengunggah bukti penyerahan.
- Superadmin tetap read-only tanpa tombol pilih maupun upload.
- Tampilan Buyer tidak diubah secara visual; komponen Buyer menjadi referensi perilaku dan struktur.

## Arah Desain

### Admin Unit

Area bukti penyerahan menggunakan satu kolom lebar, bukan kartu preview dan form upload yang terpisah.

Urutan elemen wajib:

1. Ringkasan dokumentasi penyerahan.
2. Area preview besar dengan rasio dan tinggi minimum yang responsif.
3. Tombol `Pilih File` tepat di bawah preview.
4. Keterangan format `JPG, PNG, atau WebP (Maks. 5MB)`.
5. Tombol lebar penuh `Unggah Bukti Serah-Terima`.
6. Feedback sukses, error, atau informasi terkunci.

Penempatan, ukuran, radius, warna, hover, active state, loading spinner, disabled state, dan easing kedua tombol mengikuti upload bukti pembayaran. Tombol upload tidak lagi berada di samping atau di luar struktur preview.

### Preview dan State

- Empty state memakai area preview besar dengan ikon upload dan instruksi singkat.
- Setelah file dipilih, preview lokal langsung menggantikan empty state sebelum upload.
- Foto yang sudah tersimpan tampil pada area preview yang sama.
- Jika admin memilih foto pengganti, preview lokal mendapat prioritas sampai upload selesai atau pilihan dibatalkan.
- Klik preview membuka fullscreen.
- Fullscreen dapat ditutup melalui tombol tutup, klik backdrop, dan tombol Escape.
- Object URL lokal harus dilepas ketika file berubah atau komponen dilepas.

State yang didukung:

- belum ada file;
- file lokal terpilih;
- bukti tersimpan;
- sedang mengunggah;
- upload berhasil;
- upload gagal;
- upload terkunci karena pembayaran belum terverifikasi.

Animasi hanya menyampaikan perubahan state:

- transisi preview dan hover 200–500 ms;
- easing mengikuti pola bukti pembayaran;
- spinner pada tombol ketika proses upload berlangsung;
- feedback menggunakan animasi `feedback-lift`;
- tidak ada animasi dekoratif berat;
- `prefers-reduced-motion` tetap dihormati melalui utilitas global yang sudah tersedia.

### Superadmin

Superadmin memakai kartu bukti penyerahan selebar area konten yang tersedia dan preview besar dengan bahasa visual yang sama. Informasi waktu, lokasi, dan pengunggah tetap terlihat sebagai metadata audit.

Superadmin tidak menampilkan:

- input file;
- tombol pilih file;
- tombol upload;
- aksi mengganti atau menghapus bukti.

Jika bukti belum tersedia, empty state menjelaskan bahwa dokumentasi masih menunggu Admin Unit. Jika tersedia, gambar dapat dibuka fullscreen dengan interaksi yang sama.

## Arsitektur Komponen

Komponen bersama akan memisahkan dua tanggung jawab:

- shell preview bukti: empty state, preview lokal/tersimpan, badge state, fullscreen, dan metadata visual;
- form Admin Unit: pemilihan file, request upload, feedback, toast, refresh, dan aturan `canUpload`.

`HandoverProofCard` tetap menjadi sumber presentasi read-only bagi Buyer dan Superadmin, tetapi struktur visualnya diselaraskan dengan shell preview baru. `HandoverProofUploadForm` menggunakan shell yang sama dan menambahkan kontrol upload di bawah preview.

Komponen upload pembayaran tidak boleh diubah perilakunya. Token kelas dan pola interaksi dapat diekstrak hanya jika ekstraksi tersebut mengurangi duplikasi tanpa mengubah hasil visual Buyer.

## Responsif dan Aksesibilitas

- Desktop: preview memenuhi lebar panel; metadata dapat disusun di atas atau sebagai baris ringkas tanpa mempersempit gambar.
- Mobile: seluruh elemen tetap satu kolom dan tombol memenuhi lebar.
- Input file tetap memiliki label aksesibel.
- Tombol fullscreen memiliki nama aksesibel.
- State loading dan disabled dapat dibaca dari atribut tombol.
- Pesan error tidak hanya disampaikan melalui warna.
- Preview tidak menyebabkan overflow horizontal.

## Performa

- Preview lokal memakai `URL.createObjectURL`, bukan pembacaan base64.
- Object URL selalu di-revoke.
- Gambar tersimpan tetap memakai mekanisme optimasi gambar yang sudah digunakan aplikasi.
- Tidak menambahkan library animasi atau dependensi baru.
- Fullscreen dirender hanya saat dibuka.

## Pengujian

Pengujian manual tanpa browser automation, ditambah tes komponen terarah:

- Admin Unit menampilkan kontrol dalam urutan preview, pilih file, keterangan format, lalu tombol upload penuh.
- Tombol upload disabled sebelum file dipilih dan ketika `canUpload` bernilai false.
- File gambar terpilih menghasilkan preview lokal.
- Loading dan feedback tetap bekerja.
- Bukti tersimpan dapat dibuka fullscreen.
- Superadmin menampilkan preview/empty state lebar tanpa kontrol upload.
- Buyer tetap menampilkan bukti penyerahan tanpa regresi.
- TypeScript dan production build harus berhasil.

## Kriteria Selesai

- Kontrol upload bukti penyerahan tidak lagi terpisah dari preview.
- Posisi dan gaya tombol Admin Unit sama dengan upload bukti pembayaran.
- Preview Admin Unit dan Superadmin konsisten, lebar, responsif, dan fullscreen.
- Hak akses tidak berubah.
- Data lama tanpa bukti tetap aman melalui empty state.
