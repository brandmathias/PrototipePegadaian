# Baseline pemulihan — 2 September 2026

Branch ini adalah titik pemulihan aplikasi sebelum perubahan payment gateway.

- Commit aplikasi: `043e1c92be46f4974f3db8cf41352d709408af6c`
- Tag yang sama: `baseline-before-payment-gateway-2026-09-02`
- Dump database production: `C:\Users\Asus\Documents\PrototipePegadaian2-backups\baseline-2026-09-02\production-baseline-2026-09-02.dump`
- SHA-256 dump: `FC913B1C0FE154939D4F17486F3FD3A56EB22471FC18A505B1C2A1E74F426218`
- Format: PostgreSQL Custom (`pg_restore -l` tervalidasi, 167 entri).

## Pemulihan

1. Kembalikan kode ke branch ini atau tag baseline di atas.
2. Verifikasi checksum dump sebelum dipakai.
3. Restore hanya ke database pemulihan/kosong terlebih dahulu, kemudian verifikasi aplikasi.

Contoh perintah pemulihan ke database target yang sudah disetujui:

```powershell
& 'C:\Program Files\PostgreSQL\18\bin\pg_restore.exe' --clean --if-exists --no-owner -d <database_target> 'C:\Users\Asus\Documents\PrototipePegadaian2-backups\baseline-2026-09-02\production-baseline-2026-09-02.dump'
```

Jangan jalankan perintah tersebut langsung pada production tanpa konfirmasi karena `--clean` mengganti objek database target.

## Batas backup ini

Dump database tidak mencakup berkas upload. Production saat baseline memiliki 104 berkas (sekitar 104,6 MB) pada volume Docker `pegadaian-uploads` yang dimount ke `/app/uploads`. Volume tersebut belum dapat dibackup karena Dokploy belum mempunyai S3 Destination. Maka, pemulihan database dan kode sudah siap, tetapi pemulihan media upload memerlukan backup volume terpisah.

## Verifikasi baseline

`npm run build` berhasil. Tes baseline menjalankan 780 tes; 768 lulus dan 12 kegagalan lama tetap perlu ditangani terpisah sebelum seluruh fitur dapat diklaim lulus penuh.
