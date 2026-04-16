#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/ai-trainer/current}"
BRANCH="${DEPLOY_BRANCH:-main}"
DEPLOY_REF="${DEPLOY_REF:-}"
PM2_ECOSYSTEM="${PM2_ECOSYSTEM:-ecosystem.config.cjs}"
RELOAD_NGINX="${RELOAD_NGINX:-1}"

cd "$APP_DIR"

if [ -n "$DEPLOY_REF" ]; then
  echo "[deploy] Fetching and deploying exact ref ${DEPLOY_REF}"
  git fetch --all --tags
  git reset --hard "$DEPLOY_REF"
else
  echo "[deploy] Fetching latest code from ${BRANCH}"
  git fetch origin "$BRANCH"
  git reset --hard "origin/${BRANCH}"
fi

echo "[deploy] Installing dependencies"
npm install

if [ ! -f "backend/.env" ]; then
  echo "[deploy] backend/.env is missing. Creating from template."
  cp backend/.env.example backend/.env
fi

if [ ! -f ".env.production" ]; then
  echo "[deploy] .env.production is missing. Creating from template."
  cp .env.production.example .env.production
fi

echo "[deploy] Building frontend"
npm run build

echo "[deploy] Applying Prisma migrations"
npx prisma generate --schema backend/prisma/schema.prisma
npx prisma migrate deploy --schema backend/prisma/schema.prisma

echo "[deploy] Restarting API process"
pm2 startOrReload "$PM2_ECOSYSTEM" --update-env
pm2 save

if [ "$RELOAD_NGINX" = "1" ]; then
  echo "[deploy] Reloading Nginx"
  sudo systemctl reload nginx
fi

echo "[deploy] Completed"