#!/bin/sh
set -e

# Generate APP_KEY bila belum ada (agar tidak perlu manual di dashboard)
if [ -z "$APP_KEY" ]; then
    echo "APP_KEY belum di-set, membuat otomatis..."
    php artisan key:generate --force
fi

# Jalankan migrasi dan seeder (admin) untuk database baru
php artisan migrate --force
php artisan db:seed --force

# Optimasi production (opsional, aman diabaikan jika gagal)
php artisan config:cache 2>/dev/null || true
php artisan route:cache 2>/dev/null || true

# Jalankan server
PORT="${PORT:-8000}"
echo "Menjalankan server di port $PORT"
exec php artisan serve --host=0.0.0.0 --port="$PORT"
