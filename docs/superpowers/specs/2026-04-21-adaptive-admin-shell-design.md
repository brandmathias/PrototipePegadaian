# Adaptive Admin Shell Design

## Goal

Merapikan area `Admin Unit` agar tampil profesional, stabil, dan interaktif di desktop, tablet, dan mobile tanpa mengubah alur fitur yang sudah mengacu ke `PRD.md`.

Fokus utama:
- menghilangkan tabrakan antara sidebar, title, subtitle, dan search bar
- menstabilkan proporsi layout agar tidak tampak "membesar" atau sempit secara acak
- menjaga dashboard dan page admin lain tetap konsisten secara visual
- memastikan navigasi mobile tetap usable lewat drawer yang ringan

## Problems Found

Berdasarkan screenshot dan audit file saat ini, masalah utamanya adalah:

- Sidebar terlalu dominan di desktop menengah sehingga header terlihat terdorong.
- Topbar tidak punya pembagian area yang jelas antara judul, subtitle, search, dan action.
- Hero dashboard memakai skala tipografi terlalu besar untuk lebar konten saat ini.
- Kartu metrik dan konten utama belum mengikuti sistem lebar kontainer yang konsisten.
- Tabel dan panel samping sudah lebih baik, tetapi masih perlu ritme spacing yang seragam dengan shell baru.

## Chosen Approach

Pendekatan yang dipilih adalah `Adaptive Admin Shell`.

Prinsipnya:
- desktop besar memakai sidebar tetap yang ramping dan stabil
- laptop/desktop menengah memakai content wrapper dengan `max-width` agar header dan hero tidak melebar liar
- tablet/mobile memakai drawer navigasi dan topbar yang ditumpuk secara logis
- semua page admin memakai ritme spacing, radius, elevasi, dan ukuran font yang sama

## Layout Architecture

### 1. Shell

`components/layout/dashboard-shell.tsx` akan menjadi sumber utama struktur admin:

- Sidebar desktop dengan lebar lebih terukur, logo yang tidak terlalu agresif, dan daftar menu dengan area scroll internal yang rapi.
- Topbar dibagi menjadi dua blok:
  - blok identitas halaman: judul unit + subtitle konteks
  - blok utilitas: search + notifikasi + avatar
- Content wrapper memakai `max-width` yang konsisten agar hero, cards, dan tabel tidak tampak "ngambang" atau terlalu melebar.

### 2. Dashboard

`components/pages/admin-dashboard-page.tsx` akan mengikuti komposisi yang lebih sehat:

- Hero card dengan heading besar tetapi tetap terkendali, subtitle satu baris atau dua baris maksimum.
- Tombol aksi utama dan sekunder tetap terlihat jelas, tetapi tidak terlalu besar.
- Kartu metrik dalam grid yang responsif:
  - mobile: 1 kolom
  - tablet: 2 kolom
  - desktop: 4 kolom
- Area bawah dibagi menjadi:
  - tabel utama
  - panel aksi dan status

### 3. Secondary Admin Pages

`components/pages/admin-pages.tsx` akan diselaraskan dengan shell baru:

- intro section memakai ukuran heading dan paragraph yang konsisten dengan dashboard
- form, detail card, action card, dan data table memakai padding dan text scale seragam
- tombol aksi utama/sekunder/destructive tetap jelas secara hierarki

## Visual Direction

Gaya visual tetap mempertahankan identitas hijau Pegadaian, tetapi diarahkan ke:

- enterprise dashboard yang lebih refined
- tipografi kuat di heading, namun body text lebih tenang
- radius besar namun tidak berlebihan
- shadow tipis dan bersih, tidak terlalu "mengambang"
- putih hangat dan abu-abu lembut untuk membingkai area kerja

## Responsiveness Rules

- Tidak boleh ada horizontal overflow di viewport umum.
- Judul panjang harus bisa `truncate` atau `wrap` secara terkendali.
- Search bar boleh menyusut di tablet, tetapi tetap penuh di mobile.
- Sidebar mobile harus bisa dibuka/tutup dengan aman dan tidak mengganggu konten.
- Semua tombol sentuh minimal nyaman untuk pointer dan touch.

## Interaction Rules

- Drawer mobile memakai overlay dan close interaction yang jelas.
- Tombol dan kartu interaktif punya hover/focus state yang terlihat.
- Fokus keyboard tidak boleh hilang.
- Elemen utilitas topbar tetap dapat dijangkau saat lebar mengecil.

## Verification Plan

- Buka `/admin?role=admin_unit` di dev server.
- Cek tampilan di lebar kira-kira mobile, tablet, laptop, dan desktop.
- Pastikan shell tidak overlap dengan konten.
- Pastikan dashboard tetap rapi saat data status badge memanjang.
- Jalankan validasi TypeScript untuk memastikan tidak ada error baru dari file admin.

## Out of Scope

- Mengubah arsitektur data admin.
- Menambah fitur bisnis baru di luar PRD.
- Mendesain ulang area `superadmin` pada iterasi ini.
