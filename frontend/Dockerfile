# ---- Build stage ----
FROM node:22-alpine AS build

# VITE_API_URL diteruskan saat build (Railway env). Fallback ke localhost jika kosong.
ARG VITE_API_URL=http://127.0.0.1:8000/api
ENV VITE_API_URL=$VITE_API_URL

WORKDIR /app

# Copy package files & install
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source & build
COPY . .
RUN npm run build

# ---- Serve stage ----
FROM node:22-alpine

WORKDIR /app

# Install `serve` untuk melayani static + SPA fallback
RUN npm install -g serve

# Salin hasil build
COPY --from=build /app/dist ./dist

ENV PORT=3000
EXPOSE 3000

# -s = SPA (fallback ke index.html), 0.0.0.0 agar bisa diakses dari luar
CMD ["sh", "-c", "serve -s dist -l tcp://0.0.0.0:${PORT:-3000}"]
