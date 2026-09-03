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
        libicu-dev \
        libcurl4-openssl-dev \
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
        bcmath \
        intl \
        exif \
        pcntl \
    && rm -rf /var/lib/apt/lists/*

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# Copy source
COPY . .

# Install dependencies (--no-dev untuk production, --no-scripts agar tidak perlu APP_KEY saat build)
RUN composer install --optimize-autoloader --no-dev --no-scripts --no-interaction

# Persiapkan struktur storage & pastikan writable untuk Laravel
RUN mkdir -p storage/framework/{cache/data,sessions,views} \
    storage/logs \
    && chmod -R 775 storage bootstrap/cache

# Beri izin eksekusi ke entrypoint
RUN chmod +x entrypoint.sh

ENV PORT=8000
EXPOSE 8000

# Entrypoint: generate APP_KEY, migrasi, seeder, lalu serve API
CMD ["sh", "entrypoint.sh"]
