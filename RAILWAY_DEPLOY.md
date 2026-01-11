# Railway.app Deployment Kılavuzu

## 🚀 Railway.app'e Deploy Etme

### 1. Hesap Oluşturma
1. [Railway.app](https://railway.app) → "Start a New Project"
2. GitHub ile giriş yapın
3. "Deploy from GitHub repo" seçin
4. Repository'nizi seçin: `ilaydaylmaz/yilmazlaryapimarket`

### 2. Environment Variables (Ortam Değişkenleri)

**ÖNEMLİ:** Railway.app'te iki tür variable var:
- **Service Variables** (Önerilen) - Sadece bu servis için
- **Shared Variables** - Tüm servisler arasında paylaşılan

**Tek servis için Service Variables kullanın:**

1. Railway dashboard'da projenizi seçin
2. Servisinizi seçin (web service)
3. "Variables" sekmesine gidin
4. "New Variable" butonuna tıklayın
5. Şu değişkenleri ekleyin:

```
MONGODB_URI=mongodb+srv://kullanici:sifre@cluster.mongodb.net/
MONGODB_DB_NAME=yapimarket
SESSION_SECRET=yapi-market-secret-key-buraya-rastgele-bir-string
NODE_ENV=production
PORT=3000
```

**Not:** 
- `MONGODB_URI` değerini Render.com'dan kopyalayın (aynı MongoDB kullanılabilir)
- `SESSION_SECRET` için güçlü bir rastgele string kullanın
- `PORT` değişkeni genellikle otomatik ayarlanır, eklemek opsiyonel
- Eğer "Shared Variables" kullandıysanız, serviste `${{MONGODB_URI}}` şeklinde referans edebilirsiniz

### 3. Build & Start Ayarları
Railway otomatik olarak algılar (`railway.json` dosyası sayesinde):
- **Build:** Otomatik (NIXPACKS)
- **Start Command:** `node server.js`
- **Health Check:** `/health` endpoint'i kullanılır

### 4. Deploy
- Railway otomatik olarak deploy eder
- Her git push'ta otomatik deploy yapılır
- Deploy loglarını "Deployments" sekmesinden takip edebilirsiniz

### 5. Custom Domain (Opsiyonel)
1. Railway dashboard → "Settings" → "Domains"
2. "Generate Domain" ile ücretsiz domain alın (örn: `yapi-market.up.railway.app`)
3. Veya kendi domain'inizi ekleyin

## 💰 Fiyatlandırma

**Free Tier:**
- $5 kredi/ay (yaklaşık 512MB RAM için yeterli)
- Otomatik deploy
- Custom domain (ücretsiz)
- HTTPS (otomatik)

**Pro ($5/ay):**
- 1GB RAM
- Daha fazla kaynak
- Priority support
- Daha fazla kredi

## ✅ Avantajlar

- ✅ Daha yüksek memory limit (Pro ile 1GB)
- ✅ Kolay kurulum
- ✅ Otomatik HTTPS
- ✅ Custom domain (ücretsiz)
- ✅ GitHub entegrasyonu
- ✅ Log görüntüleme (real-time)
- ✅ Metrics ve monitoring
- ✅ Health check endpoint
- ✅ Otomatik restart

## 🔧 Memory Optimizasyonu

Railway'de de memory optimizasyonları aktif:
- ✅ Cache'den base64 görseller kaldırıldı
- ✅ MongoDB projection kullanılıyor
- ✅ Gereksiz veriler çekilmiyor
- ✅ Health check endpoint memory bilgisi gösteriyor

## 📊 Monitoring

Railway dashboard'da şunları görebilirsiniz:
- Memory kullanımı
- CPU kullanımı
- Request sayısı
- Log'lar (real-time)
- Deploy geçmişi

## 🔄 Render.com'dan Geçiş

1. Railway'de yeni proje oluşturun
2. Aynı MongoDB URI'yi kullanabilirsiniz (MongoDB Atlas)
3. Environment variables'ı kopyalayın
4. Deploy edin
5. Custom domain'i Railway'e yönlendirin (DNS ayarları)
6. Render.com'daki servisi durdurun (maliyet tasarrufu için)

## ⚠️ Önemli Notlar

- Railway free tier'da $5 kredi/ay verir
- 512MB RAM için yaklaşık $5/ay yeterli
- Daha fazla RAM için Pro plan ($5/ay) gerekir
- Memory optimizasyonları sayesinde 512MB yeterli olmalı
