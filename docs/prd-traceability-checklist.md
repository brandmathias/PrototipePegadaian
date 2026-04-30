# PRD Traceability Checklist

Terakhir diperbarui: 29 April 2026

Dokumen ini dipakai sebagai sumber kebenaran untuk mengecek apakah implementasi website sudah benar-benar menutup workflow yang diwajibkan di `PRD.md`, bukan sekadar terlihat hidup karena fallback UI atau data demo.

Legenda status:

- `SUDAH` = implementasi aktif dan terverifikasi pada runtime utama
- `PARSIAL` = sebagian alur sudah ada, tetapi masih ada gap teknis atau operasional
- `BELUM` = belum ada atau masih bergantung pada placeholder

## Guest / Public

| Area | PRD | Status | Catatan |
| --- | --- | --- | --- |
| Beranda publik | Menampilkan katalog dan ringkasan publik | `SUDAH` | Beranda kini mengambil statistik dan lot unggulan dari database lewat `public-home.service.ts`. |
| Katalog publik | Filter katalog barang `DIPASARKAN` | `SUDAH` | Katalog publik sudah DB-driven dan tidak lagi fallback ke lot demo pada runtime utama. |
| Detail lot publik | Detail barang, mode, harga dasar, countdown | `SUDAH` | Detail lot membaca data backend dan countdown buyer sudah real-time di browser. |
| Alur masuk / daftar | Halaman login dan registrasi buyer terpisah dari public shell | `SUDAH` | Sudah memakai halaman autentikasi khusus dan tidak lagi overlay di atas hero public. |

## Buyer / Pembeli

| Area | PRD | Status | Catatan |
| --- | --- | --- | --- |
| Register buyer | Registrasi mandiri pembeli | `SUDAH` | Better Auth + PostgreSQL aktif untuk buyer. |
| Login buyer | Session native Better Auth | `SUDAH` | Route buyer terproteksi oleh session backend nyata. |
| Dashboard buyer | Ringkasan transaksi, bid, notifikasi | `SUDAH` | Beranda akun buyer sekarang menerima payload backend eksplisit tanpa fallback runtime ke `mock-data`. |
| Fixed price workflow | Buat transaksi, upload bukti, bayar langsung | `SUDAH` | Sudah terhubung ke database dan lolos E2E dasar. |
| Vickrey bid submit | Satu bid per user, cek blacklist, simpan hash | `SUDAH` | Guard blacklist, unique bid, dan `bid_hash` aktif. |
| Countdown pembayaran / lelang | Countdown real-time di browser | `SUDAH` | Buyer sudah live per detik untuk pembayaran dan sesi lelang relevan. |
| Riwayat bid dan transaksi | Daftar transaksi + riwayat lelang pribadi | `SUDAH` | Halaman transaksi dan riwayat bid buyer kini membaca data backend langsung tanpa fallback runtime. |
| Nota transaksi | Nota setelah status `LUNAS` | `PARSIAL` | Jalur halaman nota sudah ada, tetapi audit akhir terhadap format PRD dan PDF final masih perlu ditutup. |

## Admin Unit

| Area | PRD | Status | Catatan |
| --- | --- | --- | --- |
| Dashboard unit | Statistik barang, antrean transaksi, blacklist | `PARSIAL` | Backend dashboard aktif, tetapi komponen dashboard masih menyimpan fallback mock runtime. |
| Input barang gadai | Create barang status `GADAI` | `SUDAH` | Jalur create barang dan status history aktif. |
| Perpanjangan / tebus / konversi | Workflow status barang | `SUDAH` | Backend inti sudah ada dan terhubung ke database. |
| Pemasaran barang | Fixed price / Vickrey publish | `SUDAH` | Publish pemasaran berjalan dari data unit. |
| Detail sesi lelang | Detail pemasaran + daftar bid setelah deadline | `SUDAH` | Detail lelang kini menampilkan bid list dari database setelah deadline, tetap terkunci sebelum deadline. |
| Verifikasi transaksi | Transfer / langsung / cetak nota | `SUDAH` | Jalur verifikasi pembayaran admin sudah aktif. |
| Blacklist unit | Riwayat pelanggaran dan perpanjangan blokir | `SUDAH` | Audit log manual vs sistem sudah dipisah. |
| Countdown operasional | Countdown transaksi/lelang aktif | `SUDAH` | Countdown live sudah aktif di area admin yang relevan. |

## Superadmin

| Area | PRD | Status | Catatan |
| --- | --- | --- | --- |
| Dashboard global | Control center lintas unit | `SUDAH` | Dashboard sudah fokus monitoring strategis dan countdown penting. |
| Unit & rekening | Kelola unit dan multi rekening unit | `SUDAH` | Struktur rekening per unit mendukung lebih dari satu rekening. |
| Admin unit | CRUD akun admin unit | `SUDAH` | Sudah terhubung dengan role auth. |
| Monitoring global | Read-only lintas unit/barang/transaksi | `SUDAH` | Monitoring service sudah membaca data nyata dari DB. |
| Blacklist global | Cabut blokir dan audit | `SUDAH` | Countdown blacklist dan audit actor `system/manual` aktif. |

## Background Jobs / Cron

| Area | PRD | Status | Catatan |
| --- | --- | --- | --- |
| Endpoint cron settlement | `POST /api/cron/proses-lelang` dilindungi secret | `SUDAH` | Handler settlement + auth secret aktif. |
| Penjadwalan cron nyata | Jalan periodik tiap 5 menit | `SUDAH` | `vercel.json` sudah menjadwalkan `/api/cron/proses-lelang` tiap 5 menit dan route cron kini kompatibel dengan invokasi platform berbasis `GET`. |
| Settlement Vickrey | 0 bid gagal, 1 bid bayar harga dasar, B1/B2 | `SUDAH` | Sudah aktif di `cron.service.ts`. |
| Gagal bayar 24 jam | Transaksi gagal + pelanggaran + blacklist | `SUDAH` | Workflow otomatis aktif dan tercatat pada audit log sistem. |
| Audit actor sistem | `performed_by_type = system/manual` | `SUDAH` | Sudah diterapkan untuk log blacklist otomatis vs manual. |

## Fokus Lanjutan Setelah Batch Ini

1. Bersihkan fallback `mock-data` yang masih tersisa di halaman buyer dan admin yang sudah punya jalur backend nyata.
2. Audit akhir format nota / PDF terhadap spesifikasi PRD.
3. Tambahkan verifikasi deployment untuk memastikan cron terjadwal benar-benar berjalan pada environment produksi.
