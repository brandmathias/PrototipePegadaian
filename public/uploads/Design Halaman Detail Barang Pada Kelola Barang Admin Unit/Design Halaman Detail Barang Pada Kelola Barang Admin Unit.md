# Design System Specification: Executive Asset Ledger Workspace
**Platform:** Pegadaian Lelang - Admin Unit Portal
**Versi:** 9.5.0 (Production Blueprint)
**Sasis Tata Letak:** Asymmetric Master-Sidebar Grid (70:30 Partition)

---

## 1. Arsitektur Kompresi Ruang & Navigasi Kontekstual
- **Sovereign Left Sidebar:** Mempertahankan penanda jangkar identitas korporat Pegadaian Lelang dengan panel navigasi padat untuk memastikan operator dapat berpindah modul kerja dengan cepat.
- **Context Preservation Modals:** Aksi vital `Perpanjangan`, `Penebusan`, dan `Pemasaran` dipasang menggunakan sistem *modal state handler*. Saat tombol dipicu, halaman latar belakang akan terkunci di tempatnya secara pasif tanpa melakukan pemuatan ulang halaman penuh (*full-page refresh avoidance*).

---

## 2. Standardisasi Manifes Data Teknis (`image_e8b4e7.png`)
Setiap string data yang dirender dalam sasis komponen wajib selaras secara mutlak dengan basis data taksiran fisik riil:
- **Kode Unik Identifikasi:** `BRG-2505-000123` (Menggunakan token warna hijau zamrud `#047857` untuk meningkatkan keterbacaan nomor registrasi).
- **Metrik Utama Taksiran:** Kategori: `Perhiasan` | Kondisi: `Baik` | Nilai Taksiran: `Rp 7.850.000`.
- **Atribut Fisik Logam:** Berat Bersih: `3,82 gr` | Kadar Kemurnian: `16K`.
- **Manifes Penjaminan:** Tanggal Gadai: `17 Nov 2024` | Jatuh Tempo: `17 Mei 2025` | Nasabah: `Siti Nurhaliza` | Kontak: `0812-3456-7890`.

---

## 3. Komponen Kronologi Sumbu Ganda (Dual-Axis Timeline Component)
Visualisasi lini masa di sisi kanan dioptimalkan menggunakan dua kolom perataan visual:
- **Kolom Kiri Sub-Node:** Menampilkan barisan lencana melingkar dengan warna pudar (`bg-slate-50`) yang memuat lambang ikon kategori aktivitas sistem (Penerimaan, Perpanjangan, Galat/Pembatalan, Pelelangan).
- **Kolom Kanan Tracking Sumbu:** Garis vertikal sumbu riwayat riil berjalan konisten di sisi kanan teks, ditandai oleh simpul bulat kecil berwarna hijau pekat (`bg-emerald-600`) sebagai penanda bahwa tahapan audit telah berhasil dilewati dengan aman.