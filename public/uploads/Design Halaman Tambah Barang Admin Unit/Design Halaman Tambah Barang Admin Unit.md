# ==========================================
# BAGIAN 1: SPESIFIKASI SISTEM DESAIN (design.md)
# ==========================================

# Design System Specification: Standardized Asset Appraisal Form
**Platform:** Pegadaian Lelang - Admin Unit Portal  
**Versi:** 3.0.0 (Clean Taxonomy Edition)  
**Pendekatan Visual:** Strict Structure & Minimalist Workspace

---

## 1. Penyempurnaan Taksonomi Kategori
Berdasarkan evaluasi kebingungan kognitif (*cognitive friction*) pada versi sebelumnya, kategori **Emas** dan **Perhiasan** kini telah dilebur dan ditata ulang secara murni menjadi taksonomi berbasis fungsi dan bentuk nyata:
- `Perhiasan`: Untuk segala wujud komoditas aksesoris (cincin, gelang, kalung) baik bermaterial emas, perak, maupun batu mulia.
- `Logam Mulia`: Untuk komoditas investasi lantakan/batangan murni berlisensi (Antam, UBS, Galeri 24).

---

## 2. Token Warna & Hirarki Visual (Color Tokens)
- **Canvas Canvas Background:** `#FAFAFA` (Abu-abu ultra-terang untuk fondasi lembar kerja).
- **Surface Panels:** `#FFFFFF` (Putih murni untuk memisahkan batas form dari latar belakang tanpa garis pembatas kaku).
- **Brand Primary Accent:** `#004A23` (Sidebar) dan `#006747` (Tombol Simpan Utama & Lencana Aktif).
- **Focus States:** `#006747` dengan shadow halo ring 4px berdensitas rendah (`focus:ring-emerald-600/5`).

---

## 3. Matriks Komponen & Input Constraints

| Nama Field Kontrol | Jenis Komponen | Aturan Pengisian / Constraints |
| :--- | :--- | :--- |
| **Kategori & Kondisi** | Segmented Card / Badge | Pilihan tunggal (*Radio-style array*) dengan indikator centang visual aktif. |
| **Berat Spesifikasi** | Grouped Suffix Input | Input numerik murni dengan kontainer teks satuan `gram` terkunci di kanan. |
| **Nilai Taksiran** | Grouped Prefix Input | Input finansial murni dengan penanda mata uang `Rp` terkunci di kiri. |
| **Pemicu Kalender** | Datepicker Icon Box | Kolom tanggal dengan ikon kalender kanan untuk mempercepat pemanggilan sistem tanggal. |