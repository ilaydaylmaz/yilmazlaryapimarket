# Railway.app Deployment Kılavuzu

## 🚀 Railway.app'e Deploy Etme

### 1. Hesap Oluşturma
1. [Railway.app](https://railway.app) → "Start a New Project"
2. GitHub ile giriş yapın
3. "Deploy from GitHub repo" seçin
4. Repository'nizi seçin

### 2. Environment Variables (Ortam Değişkenleri)
Railway dashboard'da "Variables" sekmesine gidin ve şunları ekleyin:

```
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=yapimarket
SESSION_SECRET=your-secret-key-here
NODE_ENV=production
PORT=3000
```

### 3. Build & Start Ayarları
Railway otomatik olarak algılar, ama manuel ayarlamak isterseniz:

**Build Command:** (boş bırakın veya `npm install`)
**Start Command:** `node server.js`

### 4. Deploy
- Railway otomatik olarak deploy eder
- Her git push'ta otomatik deploy yapılır
- Custom domain ekleyebilirsiniz (ücretsiz)

## 💰 Fiyatlandırma

**Free Tier:**
- $5 kredi/ay (yaklaşık 512MB RAM için yeterli)
- Otomatik deploy
- Custom domain

**Pro ($5/ay):**
- 1GB RAM
- Daha fazla kaynak
- Priority support

## ✅ Avantajlar

- ✅ Daha yüksek memory limit
- ✅ Kolay kurulum
- ✅ Otomatik HTTPS
- ✅ Custom domain (ücretsiz)
- ✅ GitHub entegrasyonu
- ✅ Log görüntüleme
- ✅ Metrics ve monitoring

## 🔧 Memory Optimizasyonu

Railway'de de memory optimizasyonları aktif:
- Cache'den base64 görseller kaldırıldı
- MongoDB projection kullanılıyor
- Gereksiz veriler çekilmiyor
