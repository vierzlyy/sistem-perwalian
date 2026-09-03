#!/bin/sh
set -e

cd /var/www

# Buat .env dari .env.example jika belum ada
if [ ! -f .env ]; then
    echo "Membuat .env dari .env.example..."
    cp .env.example .env
fi

# Isi variabel database dari Railway PostgreSQL (pakai DB_HOST/DB_PORT atau PGHOST/PGPORT)
DBH="${DB_HOST:-$PGHOST}"
DBP="${DB_PORT:-$PGPORT}"
DBN="${DB_DATABASE:-$PGDATABASE}"
DBU="${DB_USERNAME:-$PGUSER}"
DBW="${DB_PASSWORD:-$PGPASSWORD}"

if [ -n "$DBH" ]; then
    echo "Mengatur koneksi database: $DBH:$DBP/$DBN"
    sed -i "s|DB_CONNECTION=.*|DB_CONNECTION=pgsql|" .env
    sed -i "s|DB_HOST=.*|DB_HOST=$DBH|" .env
    sed -i "s|DB_PORT=.*|DB_PORT=$DBP|" .env
    sed -i "s|DB_DATABASE=.*|DB_DATABASE=$DBN|" .env
    sed -i "s|DB_USERNAME=.*|DB_USERNAME=$DBU|" .env
    sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=$DBW|" .env
else
    echo "WARNING: Tidak ada variabel database ditemukan"
fi

# Set production settings
sed -i "s|APP_ENV=.*|APP_ENV=production|" .env
[ -n "$APP_DEBUG" ] && sed -i "s|APP_DEBUG=.*|APP_DEBUG=$APP_DEBUG|" .env
[ -n "$APP_URL" ] && sed -i "s|APP_URL=.*|APP_URL=$APP_URL|" .env
[ -n "$SANCTUM_STATEFUL_DOMAINS" ] && sed -i "/^SANCTUM_STATEFUL_DOMAINS=/d" .env && echo "SANCTUM_STATEFUL_DOMAINS=$SANCTUM_STATEFUL_DOMAINS" >> .env

# Generate APP_KEY jika belum ada
if ! grep -q "APP_KEY=base64:" .env 2>/dev/null; then
    echo "Generating APP_KEY..."
    php artisan key:generate --force
fi

# Jalankan migrasi
php artisan migrate --force

# Jalankan seeder (admin) - pakai --force agar tidak error jika sudah ada
php artisan db:seed --force

# Jalankan server
PORT="${PORT:-8000}"
echo "Menjalankan server di port $PORT"
exec php artisan serve --host=0.0.0.0 --port="$PORT"
