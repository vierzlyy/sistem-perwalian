#!/bin/sh
set -e

cd /var/www

# Buat .env dari .env.example jika belum ada
if [ ! -f .env ]; then
    echo "Membuat .env dari .env.example..."
    cp .env.example .env
fi

# Isi variabel database dari Railway PostgreSQL
if [ -n "$PGHOST" ]; then
    echo "Mengatur koneksi database dari Railway PostgreSQL..."
    sed -i "s|DB_CONNECTION=.*|DB_CONNECTION=pgsql|" .env
    sed -i "s|DB_HOST=.*|DB_HOST=$PGHOST|" .env
    sed -i "s|DB_PORT=.*|DB_PORT=$PGPORT|" .env
    sed -i "s|DB_DATABASE=.*|DB_DATABASE=$PGDATABASE|" .env
    sed -i "s|DB_USERNAME=.*|DB_USERNAME=$PGUSER|" .env
    sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=$PGPASSWORD|" .env
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
