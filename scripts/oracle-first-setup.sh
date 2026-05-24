#!/bin/bash
# Oracle Cloud ücretsiz VM (Ubuntu) — ilk kurulum
# Kullanım: bash oracle-first-setup.sh
set -e

APP_DIR="${APP_DIR:-$HOME/yapi_market}"
REPO_URL="${REPO_URL:-https://github.com/ilaydaylmaz/yilmazlaryapimarket.git}"

echo "=== Yılmazlar Yapı Market — Oracle VM kurulumu ==="

if [ "$(id -u)" -eq 0 ]; then
  echo "Bu scripti normal kullanıcı ile çalıştırın (sudo gerektiğinde sorar)."
  echo "Örnek: bash oracle-first-setup.sh"
  exit 1
fi

echo "→ Sistem paketleri..."
sudo apt-get update -qq
sudo apt-get install -y curl git nginx

if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]; then
  echo "→ Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

echo "→ Node: $(node -v) | npm: $(npm -v)"

if ! command -v pm2 >/dev/null 2>&1; then
  echo "→ PM2..."
  sudo npm install -g pm2
fi

if [ ! -d "$APP_DIR/.git" ]; then
  echo "→ Repo klonlanıyor: $APP_DIR"
  git clone "$REPO_URL" "$APP_DIR"
else
  echo "→ Repo mevcut: $APP_DIR"
fi

cd "$APP_DIR"
git pull origin main || true

if [ ! -f "$APP_DIR/.env" ]; then
  echo ""
  echo "⚠️  .env dosyası yok!"
  echo "    Yerel bilgisayarınızdan kopyalayın:"
  echo "    scp .env ubuntu@SUNUCU_IP:$APP_DIR/.env"
  echo ""
  echo "    veya sunucuda oluşturun:"
  echo "    nano $APP_DIR/.env"
  echo ""
  echo "    İçerik (örnek):"
  echo "    MONGODB_URI=mongodb+srv://..."
  echo "    DB_NAME=yapi_market"
  echo "    NODE_ENV=production"
  echo ""
  read -r -p ".env hazır olunca Enter'a basın (Ctrl+C ile çıkabilirsiniz)..."
fi

npm install --omit=dev

pm2 startOrRestart ecosystem.config.cjs
pm2 save

if ! pm2 startup 2>&1 | grep -q "already"; then
  echo "→ PM2 sistem açılışında başlasın diye aşağıdaki sudo komutunu çalıştırın:"
  pm2 startup || true
fi

echo "→ Nginx..."
sudo cp "$APP_DIR/scripts/nginx-yapi-market.conf" /etc/nginx/sites-available/yapi-market
sudo ln -sf /etc/nginx/sites-available/yapi-market /etc/nginx/sites-enabled/yapi-market
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

PUBLIC_IP=$(curl -s -4 ifconfig.me 2>/dev/null || curl -s -4 icanhazip.com 2>/dev/null || echo "SUNUCU_IP")

echo ""
echo "============================================"
echo "✅ Kurulum tamamlandı!"
echo ""
echo "   Site:  http://$PUBLIC_IP/"
echo "   Admin: http://$PUBLIC_IP/login.html"
echo ""
echo "   MongoDB Atlas → Network Access → bu IP'yi ekleyin"
echo "   veya 0.0.0.0/0 (tüm IP'ler)"
echo ""
echo "   Loglar: pm2 logs yapi-market"
echo "   Güncelleme: cd $APP_DIR && bash scripts/deploy-vps.sh"
echo "============================================"
