# SkillPill — Migrasi Dinamis Laravel API + MySQL + JWT

Checklist ini menjadi catatan progres implementasi backend, admin, dan frontend.

## 1. Audit dan kontrak data

- [x] Petakan entity: users, skills, lessons, practice, progress, orders, wishlist.
- [x] Samakan bentuk response API antara Laravel, admin, dan frontend.
- [x] Tetapkan environment URL API dan aturan CORS.

## 2. Database MySQL

- [x] Konfigurasi koneksi MySQL melalui `.env`.
- [x] Buat migration users dan role admin/user.
- [x] Buat migration skills dan struktur konten pembelajaran.
- [x] Buat migration lessons, practice, reflection, dan action plan (payload JSON skill).
- [x] Buat migration orders dan order items (items JSON).
- [x] Buat migration user progress, wishlist, dan relasi pendukung.
- [x] Buat 3 seeder skill sesuai struktur input admin tanpa akun user dummy.

## 3. Auth JWT

- [x] Implementasi JWT HS256 berbasis `APP_KEY` untuk Laravel.
- [x] Endpoint register, login, refresh, me, dan logout.
- [x] Middleware JWT untuk route admin dan route user.
- [x] Aturan otorisasi role admin/user.

## 4. REST API Laravel

- [x] CRUD skills untuk admin.
- [x] CRUD lessons dan konten skill melalui payload skill.
- [x] CRUD users untuk admin.
- [x] Endpoint katalog publik untuk frontend.
- [x] Endpoint purchase dan orders.
- [x] Endpoint progress pembelajaran.
- [x] Endpoint leaderboard dinamis.
- [ ] Pagination, filter katalog, dan format error perlu diperluas untuk produksi.

## 5. Integrasi admin

- [x] Ganti store dummy admin dengan API Laravel.
- [x] Login admin memakai JWT demo melalui konfigurasi environment.
- [x] CRUD katalog tersimpan ke MySQL.
- [x] Halaman user membaca data API dan menyediakan CRUD akun admin/user.
- [x] Dashboard membaca omzet, order, dan statistik API.
- [x] Leaderboard membaca data seluruh user dari API tanpa akun admin.
- [x] Pusatkan seluruh fitur admin di folder `admin` dan hapus halaman admin frontend.

## 6. Integrasi frontend

- [x] Ganti sumber data katalog/profil/purchase/progress frontend ke API Laravel.
- [x] Login/register frontend memakai JWT.
- [x] Katalog dan detail skill membaca API Laravel.
- [x] Purchase tersimpan ke database.
- [x] Progress lesson tersimpan ke database.
- [x] Wishlist, notes, reflection, dan practice dikirim melalui endpoint progress/profile.
- [x] Tangani token expired dan logout otomatis di API client.
- [ ] AI generate/import/coach masih memakai endpoint Express lama dan perlu dipindahkan ke Laravel.

## 7. Verifikasi dan dokumentasi

- [x] Test migration dan seeder pada MySQL.
- [x] Test endpoint auth dan otorisasi dasar.
- [x] Test CRUD skill melalui API (create → update → read → delete).
- [x] Test admin terhadap API Laravel yang sama.
- [x] Jalankan build frontend, admin, dan test Laravel.
- [x] Dokumentasikan setup lokal, `.env`, dan akun demo.

## 8. Konten pembelajaran dinamis

- [x] Artikel pembelajaran dapat diisi per modul melalui CRUD admin.
- [x] Audio penjelasan mendukung URL rekaman, transkrip, durasi, dan pembaca suara fallback.
- [x] Slider presentasi mendukung banyak slide, gambar, poin, dan catatan presenter.
- [x] Bento Card dapat ditambah, dihapus per modul, dan diatur variasi tampilannya.
- [x] Audio tetap diputar ketika pengguna berpindah antara Bento Card, presentasi, dan artikel.
- [x] Payload konten tersimpan melalui API Laravel dan dibaca frontend secara dinamis.

## Status

**Status:** dashboard admin tunggal berisi Dashboard, Katalog Skill, List User, dan Leaderboard. CRUD katalog memakai halaman tambah/detail/edit penuh dan tersambung ke API Laravel yang sama dengan frontend.
