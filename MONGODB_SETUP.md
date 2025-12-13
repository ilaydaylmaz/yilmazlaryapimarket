# MongoDB Atlas Kurulum Rehberi

## Adım 1: MongoDB Atlas Hesabı Oluşturma

1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) sitesine gidin
2. "Try Free" butonuna tıklayın
3. Google/GitHub ile giriş yapın veya email ile kayıt olun

## Adım 2: Cluster Oluşturma

1. "Build a Database" butonuna tıklayın
2. **FREE (M0)** planını seçin (ücretsiz)
3. Cloud Provider: **AWS** (veya istediğiniz)
4. Region: **Frankfurt (eu-central-1)** (Türkiye'ye yakın) veya en yakın bölge
5. Cluster adı: `yapi-market-cluster` (veya istediğiniz)
6. "Create" butonuna tıklayın (1-3 dakika sürebilir)

## Adım 3: Database User Oluşturma

1. "Database Access" (sol menü) → "Add New Database User"
2. Authentication Method: **Password**
3. Username: `yapi-market-user` (veya istediğiniz)
4. Password: Güçlü bir şifre oluşturun (kaydedin!)
5. Database User Privileges: **Read and write to any database**
6. "Add User" butonuna tıklayın

## Adım 4: Network Access Ayarlama

1. "Network Access" (sol menü) → "Add IP Address"
2. "Allow Access from Anywhere" butonuna tıklayın (0.0.0.0/0)
   - Veya sadece kendi IP'nizi ekleyin (daha güvenli)
3. "Confirm" butonuna tıklayın

## Adım 5: Connection String Alma

1. "Database" (sol menü) → Cluster'ınıza tıklayın
2. "Connect" butonuna tıklayın
3. "Connect your application" seçeneğini seçin
4. Driver: **Node.js**, Version: **5.5 or later**
5. Connection string'i kopyalayın:
   ```
   mongodb+srv://yapi-market-user:<password>@yapi-market-cluster.xxxxx.mongodb.net/
   ```
6. `<password>` kısmını oluşturduğunuz şifreyle değiştirin

## Adım 6: Environment Variable Ayarlama

### Local Test İçin:

`.env` dosyası oluşturun (veya environment variable olarak):
```
MONGODB_URI=mongodb+srv://yapi-market-user:ŞİFRENİZ@yapi-market-cluster.xxxxx.mongodb.net/
DB_NAME=yapi_market
```

### Render.com İçin:

1. Render Dashboard → Service → Environment
2. "Add Environment Variable" tıklayın
3. Key: `MONGODB_URI`
4. Value: Connection string'inizi yapıştırın
5. Key: `DB_NAME`
6. Value: `yapi_market`
7. "Save Changes" tıklayın

## Adım 7: Veri Aktarımı

Local'de test ediyorsanız:
```bash
npm run migrate
```

Render.com'da:
- İlk deploy'dan sonra otomatik olarak çalışacak
- Veya manuel olarak migration script'ini çalıştırabilirsiniz

## Güvenlik Notları

- Connection string'i asla GitHub'a commit etmeyin!
- `.env` dosyasını `.gitignore`'a ekleyin (zaten ekli)
- Production'da güçlü şifreler kullanın
- Network Access'i sadece gerekli IP'lere sınırlayın

## Sorun Giderme

**Bağlantı hatası alıyorsanız:**
1. Network Access'te IP'nizin eklendiğinden emin olun
2. Password'ün doğru olduğundan emin olun
3. Connection string'deki `<password>` kısmını değiştirdiğinizden emin olun

**Local MongoDB kullanmak istiyorsanız:**
1. MongoDB Community Server'ı yükleyin
2. MongoDB'yi başlatın: `mongod` veya `brew services start mongodb-community`
3. `MONGODB_URI=mongodb://localhost:27017` kullanın

