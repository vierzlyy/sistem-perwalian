# Capstone Perwalian

Sistem manajemen **Perwalian Akademik** berbasis web yang memfasilitasi hubungan antara **Admin**, **Dosen Wali**, dan **Mahasiswa**. Dibangun dengan **Laravel (backend API)** dan **Vite/React (frontend)**.

## Fitur

### Peran & Portal
- **Admin** — Dashboard, manajemen data dosen & mahasiswa, import data via Excel, penugasan dosen wali, rekap perwalian, persetujuan aktivasi akun, serta export laporan.
- **Dosen Wali** — Dashboard, melihat daftar mahasiswa wali, histori & mencatat perwalian.
- **Mahasiswa** — Dashboard, melihat dosen wali, mengisi/riwayat perwalian, dan mengajukan aktivasi kembali.

### Kemampuan Utama
- Autentikasi berbasis token (**Laravel Sanctum**) dengan role (admin / dosen / mahasiswa).
- **Import & Export Excel** (via `maatwebsite/excel`) untuk data dosen & mahasiswa.
- **Rekap & laporan perwalian** yang dapat diekspor.
- Sistem **notifikasi** (termasuk hitungan belum dibaca & tandai sudah dibaca).
- Middleware berbasis role untuk proteksi endpoint.

## Struktur Proyek

```
capstone_perwalian/
├── backend/          # API Laravel (PHP 8.3, Laravel 13, Sanctum, maatwebsite/excel)
│   ├── app/          # Controller, Model, Middleware
│   ├── config/       # Konfigurasi Laravel
│   ├── database/     # Migrasi & seeder
│   ├── routes/       # api.php (semua endpoint)
│   └── ...
├── frontend/         # Frontend Vite/React
├── src/              # Aset pendukung
└── package.json      # Dependency Node (xlsx, exceljs, file-saver)
```

## Teknologi

| Layer      | Teknologi                                         |
|------------|---------------------------------------------------|
| Backend    | PHP 8.3, Laravel 13, Laravel Sanctum, maatwebsite/excel |
| Frontend   | Vite (React)                                      |
| Database   | PostgreSQL (backend `.env`)                       |

## Cara Menjalankan (Lokal)

> Pastikan sudah terinstall **PHP 8.3+**, **Composer**, dan **Node.js**.\
> Direktori kerja untuk backend adalah `backend/`.

### 1. Install dependency

```bash
# Backend
cd backend
composer install

# Frontend
cd ../frontend
npm install

# (Opsional) dependensi Node pendukung di root untuk fitur Excel
cd ..
npm install
```

### 2. Siapkan environment

```bash
cd backend
copy .env.example .env      # Windows
# atau: cp .env.example .env # Linux/Mac
php artisan key:generate
```

Isi konfigurasi database (mis. PostgreSQL) pada file `.env` tersebut.

### 3. Jalankan migrasi (opsional, jika dengan DB baru)

```bash
php artisan migrate
```

### 4. Jalankan server

```bash
# Backend API (port 8000)
php artisan serve

# Frontend (port 5173)
cd ../frontend
npm run dev
```

## Catatan Keamanan

- File `.env` (berisi kredensial & key) **tidak di-upload** ke GitHub.
- `node_modules/` dan `backend/vendor/` juga di-exclude — di-install ulang dengan perintah di atas.
- Backup database & file data test tidak disertakan dalam repository.

## Lisensi

Proyek ini dibuat untuk keperluan tugas akhir / capstone. Lisensi MIT pada kerangka Laravel.
