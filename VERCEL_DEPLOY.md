# Vercel Deployment Kılavuzu

## 🚀 Vercel'e Deploy Etme

### 1. Hesap Oluşturma
1. [Vercel.com](https://vercel.com) → "Sign Up"
2. GitHub ile giriş yapın
3. "Add New Project" seçin
4. Repository'nizi seçin: `ilaydaylmaz/yilmazlaryapimarket`

### 2. Proje Ayarları

Vercel otomatik olarak algılar:
- **Framework Preset:** Other
- **Root Directory:** `./` (kök dizin)
- **Build Command:** Otomatik (gerekmez)
- **Output Directory:** Otomatik
- **Install Command:** `npm install`

### 3. Environment Variables (Ortam Değişkenleri)

**ÖNEMLİ:** Vercel'de environment variable'ları eklemek için:

1. Proje ayarları sırasında veya sonrasında "Environment Variables" sekmesine gidin
2. Şu değişkenleri ekleyin:

```
MONGODB_URI=mongodb+srv://kullanici:sifre@cluster.mongodb.net/
MONGODB_DB_NAME=yapimarket
SESSION_SECRET=yapi-market-secret-key-rastgele-string-buraya
NODE_ENV=production
```

**Not:** 
- `MONGODB_URI` değerini Render.com veya Railway'dan kopyalayın (aynı MongoDB kullanılabilir)
- `SESSION_SECRET` için güçlü bir rastgele string kullanın
- Environment variable'ları **Production**, **Preview**, ve **Development** için ekleyin

### 4. Deploy

1. "Deploy" butonuna tıklayın
2. Vercel otomatik olarak build eder ve deploy eder
3. Her git push'ta otomatik deploy yapılır

### 5. Custom Domain (Opsiyonel)

1. Vercel dashboard → Projeniz → "Settings" → "Domains"
2. "Add Domain" ile domain ekleyin
3. DNS ayarlarını yapın (Vercel otomatik olarak gösterir)

## ⚠️ Vercel Özellikleri ve Sınırlamalar

### ✅ Avantajlar
- ✅ Ücretsiz tier (Hobby plan)
- ✅ Otomatik HTTPS
- ✅ Custom domain (ücretsiz)
- ✅ GitHub entegrasyonu
- ✅ Otomatik deploy (her push'ta)
- ✅ Global CDN
- ✅ Serverless functions (otomatik ölçeklendirme)
- ✅ Log görüntüleme
- ✅ Analytics (ücretsiz)

### ⚠️ Sınırlamalar
- ⚠️ **File Upload:** Vercel serverless functions'da dosya yükleme sınırlıdır (10MB)
- ⚠️ **Session Storage:** MemoryStore serverless'da çalışmayabilir (her request farklı instance)
- ⚠️ **Function Timeout:** 10 saniye (Hobby), 60 saniye (Pro)
- ⚠️ **Cold Start:** İlk request yavaş olabilir (serverless function başlatma)

### 🔧 Vercel'e Özel Ayarlar

#### File Upload için Alternatifler:
1. **Vercel Blob Storage** (ücretli)
2. **Cloudinary** (ücretsiz tier var)
3. **AWS S3** (ücretsiz tier var)
4. **Base64 olarak MongoDB'de saklama** (mevcut sistem - çalışıyor)

#### Session için Alternatifler:
1. **Vercel KV** (Redis - ücretli)
2. **MongoDB'de session saklama** (önerilen)
3. **JWT tokens** (stateless)

## 📊 Monitoring

Vercel dashboard'da şunları görebilirsiniz:
- Deploy geçmişi
- Function logs (real-time)
- Analytics (traffic, performance)
- Error tracking
- Function execution time

## 🔄 Render.com/Railway'dan Geçiş

1. Vercel'de yeni proje oluşturun
2. Aynı MongoDB URI'yi kullanabilirsiniz (MongoDB Atlas)
3. Environment variables'ı kopyalayın
4. Deploy edin
5. Custom domain'i Vercel'e yönlendirin (DNS ayarları)
6. Eski servisi durdurun (maliyet tasarrufu için)

## 💰 Fiyatlandırma

**Hobby (Ücretsiz):**
- Unlimited deployments
- 100GB bandwidth/ay
- Custom domain (ücretsiz)
- HTTPS (otomatik)
- Function execution: 10 saniye timeout
- 100GB-hours function execution/ay

**Pro ($20/ay):**
- Tüm Hobby özellikleri
- 1TB bandwidth/ay
- Function execution: 60 saniye timeout
- 1000GB-hours function execution/ay
- Team collaboration
- Priority support

## 🆘 Sorun Giderme

### Dosya Yükleme Hatası
- Vercel'de dosya yükleme 10MB ile sınırlıdır
- Büyük dosyalar için Cloudinary veya S3 kullanın
- Veya base64 olarak MongoDB'de saklamaya devam edin (mevcut sistem)

### Session Çalışmıyor
- MemoryStore serverless'da çalışmayabilir
- MongoDB'de session saklama veya JWT kullanın

### Cold Start Yavaş
- İlk request yavaş olabilir (serverless function başlatma)
- Bu normaldir, sonraki request'ler hızlı olacaktır
- Pro plan ile daha iyi performans

### MongoDB Bağlantı Hatası
- Environment variable'ların doğru ayarlandığından emin olun
- MongoDB Atlas'ta IP whitelist'inin `0.0.0.0/0` olduğundan emin olun
- Vercel loglarını kontrol edin

## 📝 Önemli Notlar

- Vercel serverless functions kullanır, her request ayrı bir function instance'ı olabilir
- Session'lar için MongoDB veya external storage kullanın
- Dosya yükleme için external storage (Cloudinary, S3) önerilir
- Function timeout'larına dikkat edin (uzun işlemler için background jobs kullanın)
- Cold start'lar normaldir, Pro plan ile daha iyi performans
