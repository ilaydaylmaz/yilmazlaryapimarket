# MongoDB Atlas Kurulum Rehberi

Bu rehber MongoDB Atlas (ücretsiz cloud veritabanı) kurulumunu adım adım açıklar.

## 📋 Adım 1: MongoDB Atlas Hesabı Oluşturma

1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) sitesine gidin
2. "Try Free" veya "Sign Up" butonuna tıklayın
3. Google, GitHub veya e-posta ile kayıt olun
4. E-posta doğrulamasını tamamlayın

## 🗄️ Adım 2: Cluster Oluşturma

1. Giriş yaptıktan sonra "Build a Database" butonuna tıklayın
2. **Deployment Option**: "M0 FREE" seçin (ücretsiz)
3. **Cloud Provider**: AWS seçin
4. **Region**: 
   - Türkiye'ye yakın: `Frankfurt (eu-central-1)` veya `Ireland (eu-west-1)` seçin
   - Veya size en yakın bölgeyi seçin
5. **Cluster Name**: `yapi-market-cluster` (veya istediğiniz isim)
6. "Create" butonuna tıklayın
7. ⏳ Cluster oluşturulması 2-3 dakika sürebilir

## 👤 Adım 3: Database Kullanıcısı Oluşturma

1. Sol menüden "Database Access" seçin
2. "Add New Database User" butonuna tıklayın
3. **Authentication Method**: "Password" seçin
4. **Username**: Bir kullanıcı adı girin (örn: `yapi_admin`)
5. **Password**: Güçlü bir şifre oluşturun
   - ⚠️ **ÖNEMLİ**: Bu şifreyi bir yere kaydedin! Unutursanız değiştirmeniz gerekir
6. **Database User Privileges**: "Atlas admin" seçin (veya "Read and write to any database")
7. "Add User" butonuna tıklayın

## 🌐 Adım 4: Network Access (IP Erişimi) Ayarlama

1. Sol menüden "Network Access" seçin
2. "Add IP Address" butonuna tıklayın
3. **Access List Entry**:
   - Render.com için: "Allow Access from Anywhere" seçin (`0.0.0.0/0`)
   - Veya sadece kendi IP'nizi ekleyin (yerel test için)
4. "Confirm" butonuna tıklayın
5. ⚠️ **Güvenlik Notu**: Production'da sadece gerekli IP'leri ekleyin

## 🔗 Adım 5: Connection String (Bağlantı Dizesi) Alma

1. Sol menüden "Database" seçin
2. Oluşturduğunuz cluster'ın yanındaki "Connect" butonuna tıklayın
3. "Connect your application" seçeneğini seçin
4. **Driver**: `Node.js` seçin
5. **Version**: `5.5 or later` seçin
6. Connection string'i kopyalayın:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## ✏️ Adım 6: Connection String'i Düzenleme

Kopyaladığınız connection string'de:
- `<username>` yerine oluşturduğunuz kullanıcı adını yazın
- `<password>` yerine oluşturduğunuz şifreyi yazın
- `?retryWrites=true&w=majority` kısmından sonra database adını ekleyin

**Örnek:**
```
mongodb+srv://yapi_admin:MySecurePassword123@cluster0.xxxxx.mongodb.net/yapi_market?retryWrites=true&w=majority
```

## 🚀 Adım 7: Render.com'da Environment Variable Ekleme

1. [Render.com](https://render.com) Dashboard'a gidin
2. Service'inize tıklayın
3. Sol menüden "Environment" seçin
4. "Add Environment Variable" butonuna tıklayın
5. **Key**: `MONGODB_URI`
6. **Value**: Düzenlediğiniz connection string'i yapıştırın
7. "Save Changes" tıklayın
8. ⚡ Service otomatik olarak yeniden deploy edilecek

## ✅ Adım 8: Test Etme

1. Deploy tamamlandıktan sonra sitenize gidin
2. Admin paneline giriş yapın (`/login.html`)
3. Bir ürün ekleyin
4. Ürünün MongoDB'de kaydedildiğini doğrulayın

## 🔍 MongoDB Atlas'ta Verileri Görüntüleme

1. MongoDB Atlas Dashboard → "Database" → "Browse Collections"
2. `yapi_market` database'ini seçin
3. `products` ve `contacts` collection'larını görebilirsiniz
4. Eklediğiniz ürünleri buradan görebilirsiniz

## 🛠️ Sorun Giderme

### Bağlantı Hatası
- Connection string'in doğru olduğundan emin olun
- Username ve password'un doğru olduğundan emin olun
- Network Access'te IP'nizin eklendiğinden emin olun

### Authentication Hatası
- Database kullanıcısının doğru oluşturulduğundan emin olun
- Şifrede özel karakterler varsa URL encode edin

### Timeout Hatası
- Cluster'ın tamamen oluşturulduğundan emin olun
- Region'ın doğru seçildiğinden emin olun

## 📞 Yardım

Sorun yaşarsanız:
- MongoDB Atlas [Dokümantasyon](https://docs.atlas.mongodb.com/)
- MongoDB [Community Forum](https://developer.mongodb.com/community/forums/)

