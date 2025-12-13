# Render.com Deployment Rehberi

## ⚠️ ÖNEMLİ: MongoDB Atlas Gerekli!

Render.com'da JSON dosyaları **kalıcı değildir**. Her deploy'da sıfırlanabilir. Bu yüzden **MongoDB Atlas** kullanmanız şarttır!

## 🚀 Adım Adım Deployment

### 1️⃣ MongoDB Atlas Kurulumu (ZORUNLU)

1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) hesabı oluşturun
2. Free cluster oluşturun
3. Database user oluşturun
4. Network Access → "Allow Access from Anywhere" (0.0.0.0/0)
5. Connection string'i alın

**Detaylı rehber için:** `SETUP_ATLAS.md` dosyasına bakın

### 2️⃣ Render.com'da Environment Variables Ayarlama

1. Render Dashboard → Service'inize gidin
2. **Environment** sekmesine tıklayın
3. Şu environment variable'ları ekleyin:

```
MONGODB_URI=mongodb+srv://kullanici:sifre@cluster.mongodb.net/
DB_NAME=yapi_market
PORT=10000
```

**ÖNEMLİ:** 
- `MONGODB_URI` connection string'inizi yapıştırın
- `<password>` kısmını gerçek şifrenizle değiştirin
- Connection string'in sonunda `/` olmalı

### 3️⃣ Build & Deploy Ayarları

Render Dashboard → Service → Settings:

- **Build Command:** `npm install`
- **Start Command:** `node server.js`
- **Environment:** `Node`

### 4️⃣ İlk Deploy Sonrası

Deploy tamamlandıktan sonra:

1. Admin paneline giriş yapın
2. Mevcut ürünleri kontrol edin
3. Eğer ürünler yoksa, JSON dosyalarından migration yapın:

**Local'de migration çalıştırın:**
```bash
# .env dosyası oluşturun
MONGODB_URI=mongodb+srv://kullanici:sifre@cluster.mongodb.net/
DB_NAME=yapi_market

# Migration çalıştırın
npm run migrate
```

Veya admin panelinden manuel olarak ürünleri tekrar ekleyin.

## 🔧 Sorun Giderme

### Veriler görünmüyor
- MongoDB Atlas connection string'inin doğru olduğundan emin olun
- Network Access'te IP'nin eklendiğinden emin olun (0.0.0.0/0)
- Render logs'u kontrol edin

### Server başlamıyor
- Environment variable'ların doğru ayarlandığından emin olun
- MongoDB connection string'inde şifrenin doğru olduğundan emin olun
- Render logs'u kontrol edin

### Build hatası
- `package.json` dosyasının doğru olduğundan emin olun
- Dependencies'lerin yüklendiğinden emin olun

## 📝 Notlar

- Render'da JSON dosyaları **kalıcı değildir**
- MongoDB Atlas **ücretsiz** ve **kalıcıdır**
- Her deploy'da veriler MongoDB'den yüklenir
- Admin panelinden eklediğiniz ürünler MongoDB'ye kaydedilir

## ✅ Başarı Kontrolü

Deploy sonrası:
1. Site açılıyor mu? ✅
2. Ürünler görünüyor mu? ✅
3. Admin panelinden ürün eklenebiliyor mu? ✅
4. Yeni ürün kalıcı mı? (Sayfayı yenileyin) ✅

 Hepsi ✅ ise başarılı!

