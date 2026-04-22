# Revisi Public Landing dan Auth Experience

Tanggal: 2026-04-22
Proyek: Prototipe Pegadaian Lelang
Area: Public / Guest, Login, Register

## Tujuan

Merapikan pengalaman awal pengguna agar alur `guest -> katalog -> masuk/register -> akun pembeli` terasa sebagai satu produk yang konsisten, namun tetap punya batas yang jelas antara area publik dan area autentikasi.

Perubahan ini menargetkan dua masalah utama:

- beranda publik saat ini masih terasa seperti showcase visual umum, belum cukup fokus ke nilai produk Pegadaian dan alur yang benar-benar dibutuhkan pengguna
- halaman login/register masih menumpang pada shell publik sehingga latar, header, dan fokus visual terasa rancu

## Outcome yang Diinginkan

### 1. Beranda Publik Lebih Relevan

Beranda publik harus terasa seperti pintu masuk resmi untuk calon pembeli, bukan halaman promosi generik. Kontennya perlu menekankan:

- apa yang bisa dilakukan pengguna sebelum login
- kenapa transaksi dan lelang di platform ini aman
- kategori barang yang bisa dijelajahi
- cara melanjutkan ke katalog atau masuk ke akun

Konten yang terlalu abstrak, terlalu editorial, atau tidak membantu keputusan awal pengguna akan dikurangi.

### 2. Halaman Auth Berdiri Sendiri

`/login` dan `/register` harus tampil sebagai layar autentikasi khusus:

- tidak memakai header/footer publik penuh
- tidak memperlihatkan latar halaman guest yang masih aktif
- fokus visual diarahkan ke form, kejelasan manfaat, dan perpindahan masuk <-> daftar

Pengguna harus merasa sudah masuk ke tahap baru, bukan sekadar melihat form di atas halaman publik.

## Pendekatan Desain

### Pendekatan yang Dipilih

Menggunakan pola `Separate Auth Stage`.

Artinya:

- shell publik tetap dipakai untuk halaman guest seperti `/` dan `/katalog`
- shell auth baru dibuat khusus untuk `/login` dan `/register`
- visual auth dibuat lebih tenang, lebih fokus, dan minim distraksi

### Alasan Pemilihan

- paling jelas secara mental model
- memisahkan fase eksplorasi dan fase autentikasi
- lebih profesional dibanding modal auth atau form yang tetap menumpang pada landing page

## Struktur Halaman

### Public / Guest

Halaman yang tetap memakai `PublicShell`:

- `/`
- `/katalog`
- `/katalog/[id]`

Header publik berisi:

- brand
- `Beranda`
- `Katalog`
- tombol `Masuk`

Guest tidak melihat menu akun pembeli seperti `Beranda`, `Transaksi`, atau `Profil`.

### Auth

Halaman yang akan memakai `AuthShell` baru:

- `/login`
- `/register`

Karakter `AuthShell`:

- hanya brand minimal dan tautan kembali bila perlu
- tanpa search bar publik
- tanpa footer publik penuh
- background lebih lembut dan fokus ke area form
- layout terpusat dengan copy pendamping yang membantu, bukan dekorasi berlebih

### Buyer

Area buyer tetap memakai `BuyerShell`, dan hasil revisi sebelumnya dipertahankan:

- header buyer memuat `Beranda`, `Katalog`, `Transaksi`
- akses `Profil` ada di kanan
- `Riwayat Bid` tidak lagi menjadi menu utama terpisah karena telah diserap ke area `Transaksi`

## Rincian Konten

### Revisi Beranda Publik

Beranda publik akan disusun ulang menjadi lebih ringkas dan lebih relevan terhadap PRD:

- hero menjelaskan katalog barang jaminan Pegadaian dan dua alur utama: beli langsung dan ikut lelang
- CTA utama ke `Katalog`
- CTA sekunder ke `Masuk`
- blok kepercayaan menjelaskan verifikasi unit, transparansi harga, dan bukti transaksi
- ringkasan kategori utama
- cuplikan lot aktif yang memang membantu eksplorasi awal
- penjelasan singkat alur penggunaan untuk guest

Konten yang terlalu “editorial showcase”, istilah yang tidak natural untuk produk Pegadaian, dan kartu statistik yang tidak membantu keputusan awal pengguna akan dikurangi atau diganti.

### Revisi Login

Halaman login berfokus pada:

- judul yang lugas
- manfaat setelah masuk
- form email + password
- CTA `Masuk`
- tautan jelas ke `Daftar`

Visual tambahan yang dipakai hanya yang membantu rasa percaya dan arah, bukan latar publik yang menimbulkan kebingungan.

### Revisi Register

Halaman register berfokus pada:

- pembuatan akun pembeli
- field identitas sesuai kebutuhan prototype saat ini
- CTA utama `Daftar`
- tautan kembali ke `Masuk`
- helper text singkat tentang apa yang bisa dilakukan setelah akun aktif

## Komponen yang Perlu Disentuh

- `components/layout/public-shell.tsx`
- komponen baru `components/layout/auth-shell.tsx`
- `app/(public)/layout.tsx`
- route group auth baru untuk `login/register`
- `components/pages/home-page.tsx`
- `components/pages/public-pages.tsx`

## Data Flow dan Navigasi

- guest menekan `Masuk` dari shell publik
- sistem membuka halaman `/login` dengan shell auth khusus
- dari `/login`, pengguna bisa pindah ke `/register`
- dari `/register`, pengguna bisa kembali ke `/login`
- setelah autentikasi berhasil pada prototype, flow tetap mengarah ke area buyer

## Error Handling

- jika route auth gagal dimuat, shell auth tetap harus memperlihatkan form container yang stabil tanpa mewarisi header publik
- tautan silang antara `login` dan `register` harus tetap tersedia
- tombol publik tidak boleh lagi memakai struktur HTML yang berpotensi mengganggu klik

## Verifikasi

Setelah implementasi, perlu dicek:

- `/` tampil dengan konten publik yang lebih relevan
- `/katalog` tetap memakai public shell
- `/login` dan `/register` tampil tanpa latar atau header publik yang rancu
- tombol `Masuk` dari public shell membuka `/login`
- perpindahan `/login <-> /register` berjalan normal
- area buyer tetap tidak terpengaruh

## Scope Guard

Pekerjaan ini hanya mencakup:

- perbaikan beranda publik
- pemisahan pengalaman autentikasi
- konsistensi navigasi guest dan buyer di titik masuk

Pekerjaan ini tidak mencakup:

- integrasi autentikasi backend nyata
- perubahan workflow transaksi buyer
- revisi katalog mendalam di luar kebutuhan konsistensi shell
