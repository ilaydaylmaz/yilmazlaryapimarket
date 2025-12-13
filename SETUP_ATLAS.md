# MongoDB Atlas Hızlı Kurulum

## 🚀 Adım Adım Kurulum

### 1️⃣ Hesap Oluşturma
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) → "Try Free" tıklayın
- Google/GitHub ile giriş yapın veya email ile kayıt olun

### 2️⃣ Cluster Oluşturma
1. "Build a Database" → **FREE (M0)** seçin
2. Cloud Provider: **AWS**
3. Region: **Frankfurt (eu-central-1)** veya size en yakın
4. Cluster Name: `yapi-market-cluster`
5. "Create" → 1-3 dakika bekleyin

### 3️⃣ Database User
1. Sol menü: **"Database Access"**
2. "Add New Database User"
3. Username: `yapi-market-user`
4. Password: **Güçlü bir şifre oluşturun** (kaydedin!)
5. Privileges: **"Read and write to any database"**
6. "Add User"

### 4️⃣ Network Access
1. Sol menü: **"Network Access"**
2. "Add IP Address"
3. **"Allow Access from Anywhere"** (0.0.0.0/0) seçin
4. "Confirm"

### 5️⃣ Connection String Alma
1. Sol menü: **"Database"** → Cluster'ınıza tıklayın
2. **"Connect"** butonu
3. **"Connect your application"** seçin
4. Driver: **Node.js**, Version: **5.5 or later**
5. Connection string'i kopyalayın:
   ```
   mongodb+srv://yapi-market-user:<password>@yapi-market-cluster.xxxxx.mongodb.net/
   ```

### 6️⃣ Connection String'i Düzenleme
Kopyaladığınız string'deki `<password>` kısmını oluşturduğunuz şifreyle değiştirin.

Örnek:
```
mongodb+srv://yapi-market-user:MySecurePassword123@yapi-market-cluster.abc123.mongodb.net/
```

### 7️⃣ .env Dosyası Oluşturma
Proje klasöründe `.env` dosyası oluşturun ve şunu ekleyin:

```env
MONGODB_URI=mongodb+srv://yapi-market-user:ŞİFRENİZ@yapi-market-cluster.xxxxx.mongodb.net/
DB_NAME=yapi_market
PORT=3000
```

**ÖNEMLİ:** `ŞİFRENİZ` kısmını gerçek şifrenizle değiştirin!

### 8️⃣ Veri Aktarımı
```bash
npm run migrate
```

### 9️⃣ Sunucuyu Başlatma
```bash
npm start
```

## ✅ Test
Tarayıcıda `http://localhost:3000` açın ve çalıştığını kontrol edin!

## 🔒 Güvenlik
- `.env` dosyası zaten `.gitignore`'da (GitHub'a gitmez)
- Connection string'i asla paylaşmayın
- Production'da güçlü şifreler kullanın

