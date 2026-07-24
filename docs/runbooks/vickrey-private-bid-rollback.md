# Rollback perubahan bid privat

Branch `archive/vickrey-encrypted` hanya mengembalikan kode escrow. Ia tidak mengembalikan kolom ataupun data PostgreSQL yang sudah dihapus.

Jika perlu kembali ke konsep escrow, hentikan aplikasi, checkout branch arsip, lalu pulihkan database dari backup sebelum migrasi:

```sh
pg_restore -U postgres -d prototipepegadaian_lelang --clean --if-exists /path/to/vickrey-escrow-pre-removal.dump
```

Jalankan perintah ini dari terminal container PostgreSQL. Pastikan nama file backup dan checksum-nya sudah diverifikasi. Restore akan menimpa perubahan database setelah backup dibuat, sehingga jangan dipakai tanpa persetujuan operator berwenang.

Untuk kembali ke kode bid privat tanpa restore, checkout `master` lalu deploy ulang. Jangan menjalankan migration penghapusan bila masih ada sesi Vickrey aktif atau bid escrow yang belum diproses.
