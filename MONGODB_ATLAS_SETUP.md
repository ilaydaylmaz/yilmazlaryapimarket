# MongoDB Atlas Bağlantı Ayarları

## Timeout Sorunları İçin Kontrol Listesi

### 1. Network Access (IP Whitelist)
MongoDB Atlas Dashboard → **Network Access** bölümünde:
- ✅ **0.0.0.0/0** (tüm IP'ler) eklenmiş olmalı VEYA
- ✅ Render.com'un IP adresleri eklenmiş olmalı
- ✅ Kendi IP adresiniz eklenmiş olmalı (geliştirme için)

**Önemli:** Render.com dinamik IP kullanır, bu yüzden `0.0.0.0/0` eklemek en kolay çözümdür.

### 2. Database User (Kullanıcı)
MongoDB Atlas Dashboard → **Database Access** bölümünde:
- ✅ Kullanıcı adı ve şifre doğru olmalı
- ✅ Kullanıcının **Read and write** yetkisi olmalı
- ✅ Kullanıcı aktif olmalı

### 3. Connection String
`.env` dosyasında `MONGODB_URI` şu formatta olmalı:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
```

**Önemli:** 
- `username` ve `password` URL encode edilmiş olmalı (@ → %40, : → %3A, vb.)
- `retryWrites=true` parametresi eklenmiş olmalı
- Cluster adı doğru olmalı

### 4. Database Name
`.env` dosyasında `DB_NAME` şu şekilde olmalı:
```
DB_NAME=yapi_market
```

### 5. Cluster Tier (Ücretsiz Plan)
- ⚠️ **M0 (Free)** tier'da connection limitleri daha düşüktür
- ⚠️ Free tier'da timeout sorunları daha sık görülebilir
- 💡 Production için en az **M2** tier önerilir

### 6. Connection Pooling
Kod içinde connection pool ayarları:
- `maxPoolSize: 10` - Maksimum bağlantı sayısı
- `minPoolSize: 2` - Minimum bağlantı sayısı
- `maxIdleTimeMS: 30000` - Boşta kalma süresi

### 7. Timeout Ayarları
Kod içinde timeout ayarları:
- `serverSelectionTimeoutMS: 30000` - Sunucu seçimi timeout
- `connectTimeoutMS: 30000` - Bağlantı timeout
- `socketTimeoutMS: 60000` - Socket timeout
- `maxTimeMS: 45000` - Sorgu timeout

## Sorun Giderme

### Timeout Hatası Alıyorsanız:

1. **MongoDB Atlas Dashboard'u kontrol edin:**
   - Cluster durumu "Running" olmalı
   - Metrics'te yüksek CPU/RAM kullanımı var mı?

2. **Network Access'i kontrol edin:**
   - IP whitelist'te `0.0.0.0/0` var mı?
   - Render.com IP'leri eklenmiş mi?

3. **Connection String'i kontrol edin:**
   - `.env` dosyasında `MONGODB_URI` doğru mu?
   - Username/password doğru mu?
   - URL encode edilmiş mi?

4. **Database User'ı kontrol edin:**
   - Kullanıcı aktif mi?
   - Yetkileri doğru mu?

5. **Cluster Tier'ı kontrol edin:**
   - Free tier kullanıyorsanız, connection limitlerine takılıyor olabilirsiniz
   - Production için en az M2 tier önerilir

## Test Etme

Bağlantıyı test etmek için:
```bash
node check-database.js
```

Veya MongoDB Compass ile bağlanmayı deneyin.

## Alternatif Çözümler

1. **Connection Retry:** Kod içinde retry mekanizması eklenmiş
2. **Connection Pooling:** Bağlantı havuzu kullanılıyor
3. **Fallback:** MongoDB bağlantısı yoksa JSON fallback kullanılıyor
