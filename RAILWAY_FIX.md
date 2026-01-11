# Railway.app MongoDB Bağlantı Hatası Çözümü

## ❌ Hata: "secret MONGODB_URI: not found"

Bu hata, Railway.app'in build sırasında `MONGODB_URI` environment variable'ını bulamadığını gösterir.

## ✅ Çözüm Adımları

### 1. Railway Dashboard'a Gidin
1. [Railway.app](https://railway.app) → Projenizi açın
2. Servisinizi seçin (web service)

### 2. Environment Variables Ekleyin

**ÖNEMLİ:** "Variables" sekmesinde **"Service Variables"** bölümüne ekleyin!

1. Servisinizde **"Variables"** sekmesine tıklayın
2. **"New Variable"** butonuna tıklayın
3. Şu değişkenleri **TEK TEK** ekleyin:

#### Değişken 1:
- **Name:** `MONGODB_URI`
- **Value:** `mongodb+srv://kullanici:sifre@cluster.mongodb.net/`
- **Type:** Secret (otomatik seçilir)

#### Değişken 2:
- **Name:** `MONGODB_DB_NAME`
- **Value:** `yapimarket`
- **Type:** Plain Text

#### Değişken 3 (Opsiyonel ama önerilir):
- **Name:** `SESSION_SECRET`
- **Value:** `yapi-market-secret-key-rastgele-string-buraya`
- **Type:** Secret

#### Değişken 4:
- **Name:** `NODE_ENV`
- **Value:** `production`
- **Type:** Plain Text

### 3. Deploy'i Yeniden Başlatın

1. "Deployments" sekmesine gidin
2. En son deploy'in yanındaki **"..."** menüsüne tıklayın
3. **"Redeploy"** seçeneğini seçin

VEYA

1. "Settings" sekmesine gidin
2. **"Redeploy"** butonuna tıklayın

### 4. Logları Kontrol Edin

1. "Deployments" sekmesinde deploy'u seçin
2. **"View Logs"** butonuna tıklayın
3. Şu mesajları görmelisiniz:
   ```
   🔌 MongoDB bağlantısı deneniyor...
   📍 MONGODB_URI: Var
   📍 DB_NAME: yapimarket
   ✅ MongoDB bağlantısı başarılı!
   ```

## ⚠️ Yaygın Hatalar

### Hata 1: "Shared Variables" kullanmak
- ❌ Yanlış: "Shared Variables" bölümüne eklemek
- ✅ Doğru: "Service Variables" bölümüne eklemek

### Hata 2: Yanlış değişken adı
- ❌ Yanlış: `MONGO_URI`, `MONGODB_URL`, `DB_URI`
- ✅ Doğru: `MONGODB_URI` (tam olarak bu şekilde)

### Hata 3: MongoDB URI formatı yanlış
- ❌ Yanlış: `mongodb://...` (eski format)
- ✅ Doğru: `mongodb+srv://...` (Atlas için)
- ✅ Sonunda `/` olmalı

### Hata 4: DB_NAME yanlış
- ❌ Yanlış: `yapi_market` (alt çizgi ile)
- ✅ Doğru: `yapimarket` (alt çizgi olmadan)

## 🔍 Kontrol Listesi

Deploy öncesi kontrol edin:
- [ ] `MONGODB_URI` Service Variables'da var mı?
- [ ] `MONGODB_DB_NAME` Service Variables'da var mı?
- [ ] `MONGODB_URI` değeri `mongodb+srv://` ile başlıyor mu?
- [ ] `MONGODB_URI` değeri `/` ile bitiyor mu?
- [ ] `MONGODB_DB_NAME` değeri `yapimarket` mi?
- [ ] Deploy yeniden başlatıldı mı?

## 📝 MongoDB URI'yi Nereden Bulabilirim?

1. **Render.com'dan:**
   - Render dashboard → Environment Variables → `MONGODB_URI` değerini kopyalayın

2. **MongoDB Atlas'tan:**
   - MongoDB Atlas → Clusters → Connect → "Connect your application"
   - Connection string'i kopyalayın
   - Şifreyi ve database adını güncelleyin

## 🆘 Hala Çalışmıyorsa

1. Railway loglarını kontrol edin
2. `MONGODB_URI` değerinin doğru olduğundan emin olun
3. MongoDB Atlas'ta IP whitelist'inin `0.0.0.0/0` olduğundan emin olun
4. Railway support'a başvurun
