# Yılmazlar Yapı Market

Modern ve profesyonel yapı market web sitesi.

## Özellikler

- 🏠 Modern ve responsive tasarım
- 📦 Ürün kataloğu ve detay sayfaları
- 🔍 Gelişmiş ürün arama ve filtreleme
- 📝 İletişim formu (mail bildirimi ile)
- 🔐 Admin paneli (ürün yönetimi + mesaj yönetimi)
- 💬 Mesajlara cevap verme ve mail gönderme
- 📱 Mobil uyumlu

## Kurulum

### Yerel Geliştirme

1. Projeyi klonlayın:
```bash
git clone <repository-url>
cd yapi_market
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. MongoDB'yi başlatın (local MongoDB kullanıyorsanız):
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
# MongoDB Compass veya MongoDB Community Server'ı başlatın
```

4. Environment değişkenlerini ayarlayın (opsiyonel):
```bash
# .env dosyası oluşturun (veya environment variable'ları ayarlayın)
MONGODB_URI=mongodb://localhost:27017
DB_NAME=yapi_market

# Mail ayarları (opsiyonel - mail göndermek için)
ADMIN_EMAIL=yilmazlarvize@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

5. Mevcut JSON verilerini MongoDB'ye aktarın (ilk kez):
```bash
node migrate-to-mongodb.js
```

6. Sunucuyu başlatın:
```bash
npm start
```

7. Tarayıcıda açın: `http://localhost:3000`

## Admin Girişi

- URL: `/login.html`
- Kullanıcı adı: `admin`
- Şifre: `1234`

## Deployment (Yayınlama)

### Render.com (Önerilen - Ücretsiz)

1. [Render.com](https://render.com) hesabı oluşturun
2. "New Web Service" seçin
3. GitHub repository'nizi bağlayın
4. Ayarlar:
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment**: `Node`
5. Deploy edin!

### Railway.app

1. [Railway.app](https://railway.app) hesabı oluşturun
2. "New Project" → "Deploy from GitHub repo"
3. Repository'nizi seçin
4. Otomatik deploy başlar!

### Vercel

1. [Vercel](https://vercel.com) hesabı oluşturun
2. "Import Project" → GitHub repo seçin
3. Framework: "Other"
4. Build Command: `npm install`
5. Output Directory: `.`
6. Deploy!

### Heroku

1. [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) yükleyin
2. Heroku'da yeni app oluşturun:
```bash
heroku create yapi-market
```
3. Deploy edin:
```bash
git push heroku main
```

## Ortam Değişkenleri

Production'da şu değişkenleri ayarlayın:

- `MONGODB_URI`: MongoDB connection string (zorunlu)
  - Local: `mongodb://localhost:27017`
  - MongoDB Atlas: `mongodb+srv://username:password@cluster.mongodb.net/`
- `DB_NAME`: Veritabanı adı (varsayılan: `yapi_market`)
- `PORT`: Sunucu portu (genelde otomatik ayarlanır)
- `SESSION_SECRET`: Session secret key (güvenlik için değiştirin)

### Mail Ayarları (Opsiyonel)

İletişim formu mesajlarının mail olarak gelmesi ve mesajlara cevap verme için:

- `ADMIN_EMAIL`: Yeni mesajların gönderileceği e-posta adresi (varsayılan: `yilmazlarvize@gmail.com`)
- `SMTP_HOST`: SMTP sunucu adresi (Gmail için: `smtp.gmail.com`)
- `SMTP_PORT`: SMTP portu (genelde `587` veya `465`)
- `SMTP_SECURE`: SSL/TLS kullanımı (`true` veya `false`)
- `SMTP_USER`: SMTP kullanıcı adı (e-posta adresiniz)
- `SMTP_PASS`: SMTP şifresi (Gmail için App Password kullanın)

**Gmail için App Password oluşturma:**
1. Google Hesabınız → Güvenlik → 2 Adımlı Doğrulama (açık olmalı)
2. "Uygulama şifreleri" → "Uygulama seç" → "Mail" → "Cihaz seç" → "Oluştur"
3. Oluşturulan 16 haneli şifreyi `SMTP_PASS` olarak kullanın

**Not:** Mail ayarları yoksa, formlar yine de kaydedilir ancak mail gönderilmez.

## Teknolojiler

- **Backend**: Node.js, Express.js
- **Frontend**: HTML, CSS, JavaScript
- **Veritabanı**: MongoDB
- **File Upload**: Multer

## MongoDB Kurulumu

### Local MongoDB

1. MongoDB Community Server'ı yükleyin: https://www.mongodb.com/try/download/community
2. MongoDB'yi başlatın
3. Connection string: `mongodb://localhost:27017`

### MongoDB Atlas (Cloud - Önerilen)

1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) hesabı oluşturun
2. Ücretsiz cluster oluşturun
3. Database Access'te kullanıcı oluşturun
4. Network Access'te IP adresinizi ekleyin (0.0.0.0/0 tüm IP'ler için)
5. Cluster'a tıklayın → "Connect" → "Connect your application"
6. Connection string'i kopyalayın ve `MONGODB_URI` olarak ayarlayın

## Lisans

ISC

