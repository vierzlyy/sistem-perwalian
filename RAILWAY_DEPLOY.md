# Panduan Deploy ke Railway

Panduan ini menjelaskan cara men-deploy **backend (Laravel API + PostgreSQL)** dan **frontend (React/Vite)** ke [Railway](https://railway.app) secara gratis, sehingga website bisa diakses lewat link publik.

> Catatan: Layanan ini memerlukan interaksi di browser untuk membuat akun & menyambungkan GitHub. Berikut langkah-langkah yang harus diikuti.

---

## 1. Buat Akun Railway

1. Buka **https://railway.app** lalu klik **Login**.
2. Pilih **Login dengan GitHub** (termudah).
3. Ikuti proses otorisasi. Setelah masuk, Anda akan diberi **500 trial (gratis)** setiap bulan.
4. Buka halaman **https://railway.app/dashboard**.

---

## 2. Deploy Backend (Laravel API)

Repositori `sistem-perwalian` berisi dua subfolder: `backend/` dan `frontend/`. Railway men-deploy satu service per **Root Directory**, jadi kita buat 2 service.

### a. Buat project & service backend
1. Klik **New Project** > **Deploy from GitHub repo**.
2. Pilih repo **`sistem-perwalian`**, lalu klik **Deploy Now**.
   - Railway akan men-deploy dari root. Kita ubah ke `backend/` pada langkah berikut.
3. Setelah project terbentuk, klik service-nya.
4. Buka tab **Settings** > cari **Root Directory** > isi **`backend`** (tanpa slash depan).
   - Service akan *rebuild* otomatis.

### b. Pasang Database PostgreSQL
1. Di halaman project, klik **New** > **Database** > **PostgreSQL**.
2. Wait sampai database siap.
3. Klik database PostgreSQL tersebut > tab **Variables** > catat nilainya:
   - `PGHOST` (host), `PGPORT` (port), `PGDATABASE` (db), `PGUSER` (user), `PGPASSWORD` (password), `DATABASE_URL`.

### c. Sambungkan variabel env ke backend
1. Klik **service backend** > tab **Variables**.
2. Tambahkan variabel berikut (gunakan tombol **Variable**: **`${{ Postgres.PGHOST }}`** dst. untuk otomatis menarik dari DB):
   ```
   APP_NAME=Sistem Perwalian
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=<URL backend nanti>
   APP_KEY=(lihat langkah d)
   DB_CONNECTION=pgsql
   DB_HOST=${{ Postgres.PGHOST }}
   DB_PORT=${{ Postgres.PGPORT }}
   DB_DATABASE=${{ Postgres.PGDATABASE }}
   DB_USERNAME=${{ Postgres.PGUSER }}
   DB_PASSWORD=${{ Postgres.PGPASSWORD }}
   ```
3. **Buat APP_KEY**: tambahkan variabel `APP_KEY=base64:xxxxxxxx` 
   - Nilai `xxxx` dibuat dengan menjalankan `php artisan key:generate --show` di lokal (`backend/`), atau isi sementara lalu RUN command. Cara mudah: setelah service jalan, buka tab **Deployments** > **Run command** di Console dan jalankan:
     ```
     php artisan key:generate --force
     ```
4. Set **CORS / domain** bila perlu (bukan wajib karena API memakai token).

### d. Konfirmasi API hidup
- Setelah selesai, buka tab **Settings** di service backend, salin **Public Networking** URL (format `https://xxx.up.railway.app`).
- Buka URL + `/up` di browser (mis. `https://xxx.up.railway.app/up`). Jika menampilkan teks sehat, backend aktif.
- **Simpan URL backend ini** → akan dipakai untuk frontend.

---

## 3. Deploy Frontend (React/Vite)

1. Di project Railway yang sama, klik **New** > **Empty Service** (jangan dari GitHub langsung, karena butuh root directory).
2. Buka tab **Settings** service baru > **Root Directory** = **`frontend`**.
3. Buka tab **Source** > klik **Connect** > pilih repo **`sistem-perwalian`** > branch `master`/`main`.
4. Tab **Variables** > tambahkan:
   ```
   VITE_API_URL=https://xxx.up.railway.app/api
   ```
   Ganti `xxx` dengan URL backend dari langkah 2d.
5. Tunggu build selesai. Jika service jalan, buka tab **Settings** > **Public Networking**, aktifkan tombol **Generate Domain** → Anda akan mendapat link seperti `https://yyy.up.railway.app`.

---

## 4. Akses Website

Buka URL frontend dari langkah 3.5 (**Public Networking**).

**Akun admin bawaan:**
- Username: `admin`
- Password: `admin123`

> ⚠️ Segera ubah password admin setelah masuk untuk keamanan.

---

## Struktur File Deploy

```
backend/
├── Procfile        # Cara menjalankan server Laravel + migrasi/seeder
└── railway.json    # Konfigurasi build & start Railway (backend)
frontend/
├── railway.json    # Konfigurasi build & serve SPA (frontend)
└── ...
```

---

## Troubleshooting

- **Frontend tampil tapi login gagal / data kosong** → pastikan `VITE_API_URL` benar (diakhiri `/api`) dan backend sudah online (cek `/up`).
- **Migrasi gagal** → periksa variabel `DB_CONNECTION=pgsql` dan nilai `PG*` benar di service backend.
- **Ingin memakai Telegram/Gmail untuk notification** → set `MAIL_MAILER`, `MAIL_HOST`, dst. di service backend.
- **API diakses dari domain berbeda → CORS** → file `backend/config/cors.php` sudah mengizinkan semua origin.

Selamat, website Anda sudah bisa diakses publik! 🎉
