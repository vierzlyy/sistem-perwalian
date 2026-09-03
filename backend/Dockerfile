FROM php:8.3-cli

# Install system dependencies + PHP extensions yang dibutuhkan (gd untuk phpspreadsheet/excel)
RUN apt-get update && apt-get install -y --no-install-recommends \
        libzip-dev \
        libonig-dev \
        libxml2-dev \
        libpng-dev \
        libjpeg-dev \
        libfreetype6-dev \
        libpq-dev \
        unzip \
        git \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
        pdo \
        pdo_pgsql \
        pgsql \
        mbstring \
        zip \
        gd \
    && rm -rf /var/lib/apt/lists/*

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# Copy source
COPY . .

# Install dependencies (--no-dev untuk production, --no-scripts agar tidak perlu APP_KEY saat build)
RUN composer install --optimize-autoloader --no-dev --no-scripts --no-interaction

# Bersihkan cache default
RUN php artisan config:clear 2>/dev/null || true

ENV PORT=8000
EXPOSE 8000

# Jalankan migrasi, seeder (admin), lalu serve API
CMD ["sh", "-c", "php artisan migrate --force && php artisan db:seed --force && php artisan serve --host=0.0.0.0 --port=$PORT"]
