#!/bin/bash
set -e

APP_DIR="${APP_DIR:-$HOME/yapi_market}"
REPO_URL="${REPO_URL:-https://github.com/ilaydaylmaz/yilmazlaryapimarket.git}"

echo "→ App directory: $APP_DIR"

if [ ! -d "$APP_DIR/.git" ]; then
  git clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"
git pull origin main

npm install --omit=dev

if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi

pm2 startOrRestart ecosystem.config.cjs
pm2 save

echo "✅ Deploy tamam. Kontrol: pm2 status"
